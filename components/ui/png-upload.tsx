import { useState, useRef } from "react";
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
  ExternalLink,
  GitCommit,
  FileImage,
} from "lucide-react";

interface PngUploadProps {
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
}

interface UploadResult {
  ok: boolean;
  path: string;
  branch: string;
  commitUrl: string;
  fileUrl?: string;
}

export function PngUpload({ onUploadSuccess, onUploadError }: PngUploadProps) {
  const [filename, setFilename] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add .png extension if not present
  const ensurePngExtension = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return "";
    return trimmed.toLowerCase().endsWith(".png") ? trimmed : `${trimmed}.png`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/png")) {
      setError(
        "Solo se permiten capturas en formato PNG para el entrenamiento de IA"
      );
      return;
    }

    // Validate file size (1MB limit)
    if (file.size > 1024 * 1024) {
      setError("La captura es muy grande para procesar. Límite: 1MB");
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Auto-populate filename if empty
    if (!filename) {
      const name = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setFilename(name);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
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
      // Convert file to base64
      const base64Content = await convertToBase64(selectedFile);
      const finalFilename = ensurePngExtension(filename);

      const payload = {
        filename: finalFilename,
        content: base64Content,
        commitMessage: `feat: agregar ejemplo visual ${finalFilename} para entrenamiento de IA`,
      };

      const response = await fetch("/api/upload-png-image", {
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

      // Reset form
      setFilename("");
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

  const resetUpload = () => {
    setFilename("");
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
            Agregar Ejemplos Visuales de Emails Exitosos
          </span>
        </CardTitle>
        <CardDescription>
          Comparte capturas de emails con alto rendimiento para entrenar al
          agente de IA en diseño y estructura visual efectiva.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="file-input">
            Seleccionar Captura de Email Exitoso *
          </Label>
          <Input
            id="file-input"
            ref={fileInputRef}
            type="file"
            accept=".png,image/png"
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
            📸 Solo archivos PNG. Ideal para capturas de pantalla de emails de
            ActiveCampaign
          </p>
        </div>

        {/* Filename Input */}
        <div className="space-y-2">
          <Label htmlFor="filename">Nombre Descriptivo del Ejemplo *</Label>
          <Input
            id="filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="ej: email-promocional-alto-ctr-agosto-2025"
            disabled={isUploading}
            className="border-lime-200 focus:border-lime-400 focus:ring-lime-400"
          />
          <p className="text-xs text-gray-500">
            💡 Describe el tipo de email y su efectividad (ej:
            &quot;notificacion-envio-exitosa&quot;)
          </p>
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
              ¡Ejemplo Visual Agregado al Entrenamiento!
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4 text-gray-600" />
                <span>
                  Ejemplo visual:{" "}
                  <code className="bg-white px-1 rounded border border-lime-100">
                    {result.path}
                  </code>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-gray-600" />
                <a
                  href={result.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-cyan-600 hover:underline flex items-center gap-1 transition-colors"
                >
                  Ver Registro de Entrenamiento{" "}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {result.fileUrl && (
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-gray-600" />
                  <a
                    href={result.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-cyan-600 hover:underline flex items-center gap-1 transition-colors"
                  >
                    Ver Ejemplo Visual <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
            <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
              🤖 El agente de IA ahora puede analizar este diseño para futuras
              recomendaciones
            </p>
          </div>
        )}

        <CardDescription>
          💡 <strong>Mejores ejemplos:</strong> Emails con alta tasa de
          apertura, clics elevados, o diseños que generaron buenas conversiones.
          Nombra descriptivamente como{" "}
          <code className="bg-gradient-to-r from-lime-100 to-cyan-50 px-1 rounded">
            notificacion-seguridad-exitosa-2025
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
                Entrenando IA...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Agregar al Entrenamiento Visual
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
              Reiniciar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
