"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  GitCommit,
} from "lucide-react";

interface FileUploadProps {
  targetRepository?: string;
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
}

interface UploadResult {
  ok: boolean;
  path: string;
  branch: string;
  commitUrl: string;
  prUrl?: string;
}

interface UploadPayload {
  filename: string;
  content: string;
  branchBase: string;
  skipPr: boolean;
  commitMessage?: string;
}

export function FileUpload({
  onUploadSuccess,
  onUploadError,
}: FileUploadProps) {
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate filename with .md extension if user doesn't include it
  const ensureMarkdownExtension = (name: string): string => {
    if (!name) return "";
    return name.endsWith(".md") ? name : `${name}.md`;
  };

  // Handle filename input without automatic extension display
  const handleFilenameChange = (value: string) => {
    // Remove .md extension if user types it, we'll add it automatically on upload
    const cleanValue = value.replace(/\.md$/i, "");
    setFilename(cleanValue);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setError(null);

    try {
      if (!filename.trim() || !content.trim()) {
        throw new Error(
          "Por favor completa el nombre del archivo y agrega ejemplos de asuntos exitosos"
        );
      }

      const finalFilename = ensureMarkdownExtension(filename.trim());

      const payload: UploadPayload = {
        filename: finalFilename,
        content,
        branchBase: "main", // Always use main branch
        skipPr: true, // Always commit directly to main
        commitMessage: `feat: agregar ejemplos de entrenamiento ${finalFilename} para agente de IA`,
      };

      const response = await fetch("/api/upload-winner-subject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: UploadResult = await response.json();
      setResult(result);
      onUploadSuccess?.(result);

      // Reset form
      setFilename("");
      setContent("");
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
    setContent("");
    setResult(null);
    setError(null);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-lime-600" />
          <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-lime-600 bg-clip-text text-transparent">
            Agregar Ejemplos de Asuntos Exitosos
          </span>
        </CardTitle>
        <CardDescription>
          Crea una colección de asuntos que han demostrado alta efectividad.
          Estos ejemplos entrenarán al agente de IA para generar mejores asuntos
          en el futuro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filename Input */}
        <div className="space-y-2">
          <Label htmlFor="filename">
            Nombre del Archivo de Entrenamiento *
          </Label>
          <div className="relative">
            <Input
              id="filename"
              value={filename}
              onChange={(e) => handleFilenameChange(e.target.value)}
              placeholder="ej: ejemplos-asuntos-exitosos-agosto-2025"
              disabled={isUploading}
              className="border-lime-200 focus:border-lime-400 focus:ring-lime-400 pr-12"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
              .md
            </div>
          </div>
          <p className="text-xs text-gray-500">
            💾 La extensión .md se añadirá automáticamente al archivo
          </p>
        </div>

        {/* Content Input */}
        <div className="space-y-2">
          <Label htmlFor="content">
            Ejemplos de Asuntos con Alto Rendimiento *
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Lista los asuntos de email que han tenido las mejores tasas de apertura y clics. Cada línea puede ser un ejemplo diferente.&#10;&#10;Ejemplo:&#10;🚨 Tu cuenta será suspendida en 24 horas&#10;✅ Confirmación de envío - Acción requerida&#10;⚠️ Verificación urgente de tu perfil"
            rows={8}
            disabled={isUploading}
            className="border-lime-200 focus:border-lime-400 focus:ring-lime-400 bg-gradient-to-br from-white to-lime-50/30"
          />
          <p className="text-xs text-gray-500">
            💡 Incluye asuntos que hayan generado altas tasas de apertura y
            engagement
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
              ¡Ejemplos Agregados al Entrenamiento de IA!
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span>
                  Archivo de entrenamiento:{" "}
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
            </div>
            <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
              🤖 El agente de IA ahora puede usar estos ejemplos para mejorar
              futuras generaciones
            </p>
          </div>
        )}

        <CardDescription>
          💡 <strong>Consejo:</strong> Nombra el archivo de manera descriptiva
          como{" "}
          <code className="bg-gradient-to-r from-lime-100 to-cyan-50 px-1 rounded">
            ejemplos-asuntos-financieros-2025
          </code>{" "}
          para facilitar la organización de ejemplos de entrenamiento.
        </CardDescription>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading || !filename.trim() || !content.trim()}
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
                Agregar al Entrenamiento de IA
              </>
            )}
          </Button>

          {(content || result) && (
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
