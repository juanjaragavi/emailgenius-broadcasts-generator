import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  Check,
  AlertCircle,
  FileImage,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface PngUploadProps {
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
}

interface UploadResult {
  ok: boolean;
  filename: string;
  path: string;
  message?: string;
}

interface VisualExample {
  filename: string;
  path: string;
  size: number;
  uploadedAt: string;
  description?: string | null;
}

export function PngUpload({ onUploadSuccess, onUploadError }: PngUploadProps) {
  const [filename, setFilename] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingExamples, setExistingExamples] = useState<VisualExample[]>([]);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing examples on mount
  useEffect(() => {
    loadExistingExamples();
  }, []);

  const loadExistingExamples = async () => {
    setIsLoadingExamples(true);
    try {
      const response = await fetch("/api/visual-examples");
      const data = await response.json();
      if (data.images) {
        setExistingExamples(data.images);
      }
    } catch (err) {
      console.error("Error loading examples:", err);
    } finally {
      setIsLoadingExamples(false);
    }
  };

  // Add extension if not present
  const ensureImageExtension = (name: string, file: File | null) => {
    const trimmed = name.trim();
    if (!trimmed) return "";
    const ext = file?.name.split(".").pop()?.toLowerCase() || "png";
    const validExt = ["png", "webp", "jpg", "jpeg"].includes(ext) ? ext : "png";
    if (trimmed.toLowerCase().endsWith(`.${validExt}`)) return trimmed;
    return `${trimmed}.${validExt}`;
  };

  const handleFilenameChange = (value: string) => {
    // Remove extension if user types it
    const cleanValue = value.replace(/\.(png|webp|jpg|jpeg)$/i, "");
    setFilename(cleanValue);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/webp", "image/jpeg"];
    if (!validTypes.includes(file.type)) {
      setError("Solo se permiten imágenes en formato PNG, WebP, o JPG");
      return;
    }

    // Validate file size (1MB limit)
    if (file.size > 1024 * 1024) {
      setError("La imagen es muy grande. Límite: 1MB");
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Auto-populate filename if empty
    if (!filename) {
      const name = file.name.replace(/\.[^/.]+$/, "");
      handleFilenameChange(name);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !filename.trim()) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const base64Content = await convertToBase64(selectedFile);
      const finalFilename = ensureImageExtension(filename, selectedFile);

      const payload = {
        filename: finalFilename,
        content: base64Content,
        description: description.trim() || undefined,
      };

      // Use local API instead of GitHub
      const response = await fetch("/api/visual-examples", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en la subida");
      }

      setResult(data);
      onUploadSuccess?.(data);

      // Reload examples list
      await loadExistingExamples();

      // Reset form
      setFilename("");
      setDescription("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error en la subida";
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteExample = async (exampleFilename: string) => {
    if (!confirm(`¿Eliminar ${exampleFilename}?`)) return;

    try {
      const response = await fetch(
        `/api/visual-examples?filename=${encodeURIComponent(exampleFilename)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        await loadExistingExamples();
      }
    } catch (err) {
      console.error("Error deleting example:", err);
    }
  };

  const resetUpload = () => {
    setFilename("");
    setDescription("");
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-lime-600" />
          <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-lime-600 bg-clip-text text-transparent">
            Ejemplos Visuales para Entrenamiento (Estilo Utua)
          </span>
        </CardTitle>
        <CardDescription>
          Sube capturas de emails con diseño visual-first y bajo contenido de
          texto para entrenar al agente de IA en el lenguaje de diseño Utua.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Examples */}
        {existingExamples.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ejemplos Existentes ({existingExamples.length})</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadExistingExamples}
                disabled={isLoadingExamples}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoadingExamples ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-md">
              {existingExamples.map((example) => (
                <div
                  key={example.filename}
                  className="flex items-center justify-between gap-2 p-2 bg-white rounded border text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileImage className="h-4 w-4 text-lime-600 flex-shrink-0" />
                    <span className="truncate">{example.filename}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteExample(example.filename)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="file-input">
            Seleccionar Captura de Email Exitoso *
          </Label>
          <Input
            id="file-input"
            ref={fileInputRef}
            type="file"
            accept=".png,.webp,.jpg,.jpeg,image/png,image/webp,image/jpeg"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="border-lime-200 focus:border-lime-400 focus:ring-lime-400"
          />
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
              <FileImage className="h-4 w-4" />
              <span>
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500">
            📸 Formatos: PNG, WebP, JPG. Máximo 1MB.
          </p>
        </div>

        {/* Filename Input */}
        <div className="space-y-2">
          <Label htmlFor="filename">Nombre Descriptivo del Ejemplo *</Label>
          <Input
            id="filename"
            value={filename}
            onChange={(e) => handleFilenameChange(e.target.value)}
            placeholder="ej: utua-loan-notification-dark-theme"
            disabled={isUploading}
            className="border-lime-200 focus:border-lime-400 focus:ring-lime-400"
          />
        </div>

        {/* Optional Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ej: Email con alta tasa de apertura, tema oscuro, CTA verde"
            disabled={isUploading}
            className="border-lime-200 focus:border-lime-400 focus:ring-lime-400"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Display */}
        {result && (
          <div className="space-y-3 p-4 bg-gradient-to-r from-lime-50 to-cyan-50 border border-lime-200 rounded-md">
            <div className="flex items-center gap-2 text-lime-700 font-medium">
              <Check className="h-4 w-4" />
              ¡Ejemplo Visual Guardado Localmente!
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4 text-gray-600" />
                <span>
                  Guardado en:{" "}
                  <code className="bg-white px-1 rounded border border-lime-100">
                    public{result.path}
                  </code>
                </span>
              </div>
            </div>
            <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
              🤖 El agente de IA usará este ejemplo como referencia de diseño
              Utua
            </p>
          </div>
        )}

        <CardDescription>
          💡 <strong>Estilo Utua requerido:</strong> Emails con poco texto
          (&lt;80 palabras), CTAs prominentes, y jerarquía visual clara. Nombra
          como{" "}
          <code className="bg-gradient-to-r from-lime-100 to-cyan-50 px-1 rounded">
            utua-card-notification-2025
          </code>
        </CardDescription>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile || !filename.trim()}
            className="flex-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-lime-600 text-white hover:opacity-90 transition-opacity"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Guardar Ejemplo Visual
              </>
            )}
          </Button>

          {(selectedFile || result) && (
            <Button
              onClick={resetUpload}
              variant="outline"
              disabled={isUploading}
              className="border-lime-200 text-gray-700 hover:bg-gradient-to-r hover:from-lime-50 hover:to-cyan-50"
            >
              Limpiar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
