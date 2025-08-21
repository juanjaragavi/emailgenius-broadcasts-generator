"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Mail,
  Sparkles,
  Copy,
  Check,
  ImageIcon,
  Download,
} from "lucide-react";
import { marked } from "marked";
import Image from "next/image";

interface FormData {
  platform: "ActiveCampaign" | "ConvertKit";
  emailType: string;
  market: "USA" | "UK" | "Mexico";
  imageType: string;
  url?: string;
  additionalInstructions?: string;
}

interface EmailBroadcast {
  subjectLine1?: string;
  subjectLine2?: string;
  previewText?: string;
  fromName?: string;
  fromEmail?: string;
  emailBody: string;
  ctaButtonText: string;
  imagePrompt: string;
  destinationUrl?: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmailBroadcast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Image generation state
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      platform: "ConvertKit",
      market: "USA",
      emailType: "security-alert",
      imageType: "product-image",
    },
  });

  const platform = watch("platform");

  // Helper function to detect if content contains HTML tags
  const containsHTMLTags = (content: string): boolean => {
    return /<[^>]*>/g.test(content);
  };

  // Helper function to convert markdown to HTML
  const markdownToHTML = (markdown: string): string => {
    // Configure marked options for email-safe HTML
    marked.setOptions({
      breaks: true, // Convert line breaks to <br>
      gfm: true, // GitHub Flavored Markdown
    });
    return marked.parse(markdown) as string;
  };

  const handleCopyField = async (fieldName: string, content: string) => {
    try {
      // Check if the browser supports rich text copying
      if (navigator.clipboard && window.ClipboardItem) {
        let htmlContent: string;

        // If content contains HTML tags (ActiveCampaign), use it directly
        if (containsHTMLTags(content)) {
          htmlContent = content;
        } else {
          // If content is markdown (ConvertKit), convert to HTML for rich text copying
          htmlContent = markdownToHTML(content);
        }

        // Create blob for HTML content
        const htmlBlob = new Blob([htmlContent], { type: "text/html" });
        // Create blob for plain text fallback
        const textBlob = new Blob([content], { type: "text/plain" });

        // Copy both HTML and plain text to clipboard
        const clipboardItem = new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        });

        await navigator.clipboard.write([clipboardItem]);
      } else {
        // Fallback to plain text copying for older browsers
        await navigator.clipboard.writeText(content);
      }

      setCopiedField(fieldName);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy text: ", error);
      // Fallback to plain text if rich text copying fails
      try {
        await navigator.clipboard.writeText(content);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      } catch (fallbackError) {
        console.error("Fallback copy also failed: ", fallbackError);
      }
    }
  };

  // Function to render content with proper URL wrapping
  const renderContentWithUrls = (content: string, fieldName: string) => {
    if (fieldName === "emailBody") {
      // Split content by URLs and render each part appropriately
      const urlRegex = /(https?:\/\/[^\s\)]+)/g;
      const parts = content.split(urlRegex);

      return (
        <div className="whitespace-pre-wrap">
          {parts.map((part, index) => {
            if (part.match(urlRegex)) {
              return (
                <span
                  key={index}
                  className="url-wrap break-all text-xs font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded"
                >
                  {part}
                </span>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </div>
      );
    }

    return (
      <div
        className={`${fieldName === "emailBody" ? "whitespace-pre-wrap" : ""} ${
          fieldName === "destinationUrl"
            ? "url-wrap break-words text-sm font-mono"
            : ""
        }`}
      >
        {content}
      </div>
    );
  };

  // Reusable component for field with copy button
  const FieldWithCopy = ({
    label,
    content,
    fieldName,
    className = "text-sm",
  }: {
    label: string;
    content: string;
    fieldName: string;
    className?: string;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <Button
          onClick={() => handleCopyField(fieldName, content)}
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs border-lime-200 text-lime-700 hover:bg-lime-50 hover:border-lime-300 transition-colors"
        >
          {copiedField === fieldName ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copiar
            </>
          )}
        </Button>
      </div>
      <div
        className={`p-3 bg-gradient-to-br from-white to-lime-50/30 border border-lime-100 rounded-md min-w-0 ${
          fieldName === "destinationUrl" || fieldName === "emailBody"
            ? "url-container"
            : ""
        }`}
      >
        <div className={className}>
          {renderContentWithUrls(content, fieldName)}
        </div>
      </div>
    </div>
  );

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setImageUrl("");
    setImageError(null);

    try {
      const response = await fetch("/api/generate-broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al generar el broadcast");
      }

      const emailBroadcast = await response.json();
      setResult(emailBroadcast);

      // Automatically generate image if imagePrompt is available
      if (emailBroadcast.imagePrompt) {
        await generateImage(emailBroadcast.imagePrompt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate image
  const generateImage = async (imagePrompt: string) => {
    setImageLoading(true);
    setImageError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imagePrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }

      const data = await response.json();
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
      }
    } catch (err) {
      console.error("Error generating image:", err);
      setImageError(
        err instanceof Error ? err.message : "Error generating image"
      );
    } finally {
      setImageLoading(false);
    }
  };

  // Function to reset all form data and results
  const handleReset = () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "¿Estás seguro de que quieres borrar todos los campos y el ƒcontenido generado?"
    );

    // Only proceed if user confirmed
    if (!confirmed) {
      return;
    }

    // Reset form to default values
    reset({
      platform: "ConvertKit",
      market: "USA",
      emailType: "security-alert",
      imageType: "product-image",
      url: "",
      additionalInstructions: "",
    });

    // Clear all state
    setResult(null);
    setError(null);
    setCopiedField(null);
    setImageUrl("");
    setImageError(null);
    setImageLoading(false);

    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Function to download image
  const downloadImage = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `email-header-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mail className="h-8 w-8 text-lime-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-lime-600 bg-clip-text text-transparent">
              EmailGenius
            </h1>
            <Sparkles className="h-8 w-8 text-cyan-500" />
          </div>
          <p className="text-lg text-gray-700 font-medium">
            Generador de Broadcasts de Email Optimizados
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Crea broadcasts altamente efectivos para ConvertKit y ActiveCampaign
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Broadcast</CardTitle>
              <CardDescription>
                Completa los campos para generar tu broadcast personalizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Platform */}
                <div className="space-y-2">
                  <Label htmlFor="platform">Plataforma *</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("platform", value as FormData["platform"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ConvertKit">ConvertKit</SelectItem>
                      <SelectItem value="ActiveCampaign">
                        ActiveCampaign
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Email Type */}
                <div className="space-y-2">
                  <Label htmlFor="emailType">Tipo de Email *</Label>
                  <Select
                    onValueChange={(value) => setValue("emailType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de email" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security-alert">
                        Alerta de Seguridad
                      </SelectItem>
                      <SelectItem value="shipping-update">
                        Actualización de Envío
                      </SelectItem>
                      <SelectItem value="account-status">
                        Estado de Cuenta
                      </SelectItem>
                      <SelectItem value="product">
                        Producto Financiero
                      </SelectItem>
                      <SelectItem value="urgent-communication">
                        Comunicación Urgente
                      </SelectItem>
                      <SelectItem value="status-update">
                        Actualización de Estado
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Market */}
                <div className="space-y-2">
                  <Label htmlFor="market">Mercado *</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("market", value as FormData["market"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el mercado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USA">
                        Estados Unidos (Inglés)
                      </SelectItem>
                      <SelectItem value="UK">Reino Unido (Inglés)</SelectItem>
                      <SelectItem value="Mexico">México (Español)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Image Type */}
                <div className="space-y-2">
                  <Label htmlFor="imageType">Tipo de Imagen *</Label>
                  <Select
                    onValueChange={(value) => setValue("imageType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de imagen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product-image">
                        Imagen del Producto
                      </SelectItem>
                      <SelectItem value="lifestyle-photo">
                        Foto de Estilo de Vida
                      </SelectItem>
                      <SelectItem value="infographic">Infografía</SelectItem>
                      <SelectItem value="icon">Icono</SelectItem>
                      <SelectItem value="animated-gif">GIF Animado</SelectItem>
                      <SelectItem value="shipment-tracking">
                        Seguimiento de Envío
                      </SelectItem>
                      <SelectItem value="graphic">Gráfico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <Label htmlFor="url">URL de Referencia (Opcional)</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://ejemplo.com"
                    {...register("url")}
                  />
                </div>

                {/* Additional Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="additionalInstructions">
                    Instrucciones Adicionales (Opcional)
                  </Label>
                  <Textarea
                    id="additionalInstructions"
                    placeholder="Proporciona cualquier instrucción específica para el broadcast..."
                    rows={3}
                    {...register("additionalInstructions")}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando Broadcast...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generar Broadcast
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Resultado del Broadcast</CardTitle>
              <CardDescription>
                Tu broadcast generado aparecerá aquí
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">
                    Generando tu broadcast...
                  </span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  {platform === "ConvertKit" ? (
                    <>
                      {result.subjectLine1 && (
                        <FieldWithCopy
                          label="Línea de Asunto A/B Test 1:"
                          content={result.subjectLine1}
                          fieldName="subjectLine1"
                        />
                      )}

                      {result.subjectLine2 && (
                        <FieldWithCopy
                          label="Línea de Asunto A/B Test 2:"
                          content={result.subjectLine2}
                          fieldName="subjectLine2"
                        />
                      )}

                      {result.previewText && (
                        <FieldWithCopy
                          label="Texto de Vista Previa:"
                          content={result.previewText}
                          fieldName="previewText"
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {result.subjectLine1 && (
                        <FieldWithCopy
                          label="Línea de Asunto:"
                          content={result.subjectLine1}
                          fieldName="subjectLine1"
                        />
                      )}

                      {result.previewText && (
                        <FieldWithCopy
                          label="Preheader:"
                          content={result.previewText}
                          fieldName="previewText"
                        />
                      )}

                      {result.fromName && (
                        <FieldWithCopy
                          label="Nombre del Remitente:"
                          content={result.fromName}
                          fieldName="fromName"
                        />
                      )}

                      {result.fromEmail && (
                        <FieldWithCopy
                          label="Email del Remitente:"
                          content={result.fromEmail}
                          fieldName="fromEmail"
                        />
                      )}
                    </>
                  )}

                  <FieldWithCopy
                    label="Cuerpo del Email:"
                    content={result.emailBody}
                    fieldName="emailBody"
                  />

                  <FieldWithCopy
                    label="Texto del Botón CTA:"
                    content={result.ctaButtonText}
                    fieldName="ctaButtonText"
                    className="text-sm font-medium text-blue-600"
                  />

                  {result.destinationUrl && (
                    <FieldWithCopy
                      label="URL de Destino con Parámetros UTM:"
                      content={result.destinationUrl}
                      fieldName="destinationUrl"
                      className="text-xs font-mono text-blue-600"
                    />
                  )}

                  <FieldWithCopy
                    label="Prompt para Generación de Imagen:"
                    content={result.imagePrompt}
                    fieldName="imagePrompt"
                  />

                  {/* Image Generation Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">
                        Imagen Generada por IA
                      </Label>
                      {imageUrl && (
                        <Button
                          onClick={downloadImage}
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Descargar
                        </Button>
                      )}
                    </div>

                    <div className="relative min-h-[200px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                      {imageLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                          <span className="text-sm text-gray-600">
                            Generando imagen...
                          </span>
                        </div>
                      )}

                      {imageError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <ImageIcon className="h-8 w-8 text-red-400 mb-2" />
                          <p className="text-sm text-red-600 text-center">
                            {imageError}
                          </p>
                          <Button
                            onClick={() =>
                              result?.imagePrompt &&
                              generateImage(result.imagePrompt)
                            }
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            Reintentar
                          </Button>
                        </div>
                      )}

                      {imageUrl && !imageLoading && (
                        <div className="relative w-full h-full">
                          {/* Use Next.js Image for optimized loading */}
                          <Image
                            src={imageUrl}
                            alt="Generated email header image"
                            width={800}
                            height={300}
                            className="w-full h-auto object-cover rounded-lg"
                            style={{ objectFit: "cover" }}
                            priority
                            unoptimized={imageUrl.startsWith("data:")}
                          />
                        </div>
                      )}

                      {!imageUrl && !imageLoading && !imageError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            La imagen aparecerá aquí
                          </p>
                        </div>
                      )}
                    </div>

                    {!imageUrl && !imageLoading && result?.imagePrompt && (
                      <Button
                        onClick={() => generateImage(result.imagePrompt)}
                        variant="outline"
                        className="w-full"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Generar Imagen
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      const textToCopy = Object.entries(result)
                        .filter(([, value]) => value)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join("\n\n");
                      navigator.clipboard.writeText(textToCopy);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Copiar Todo al Portapapeles
                  </Button>

                  {/* Reset Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generar Broadcast Nuevo
                    </Button>

                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Borrar Todo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
