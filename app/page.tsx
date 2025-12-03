"use client";

import { useState, useEffect } from "react";
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
  History,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { marked } from "marked";
import Image from "next/image";
import { FileUpload } from "@/components/ui/file-upload";
import { PngUpload } from "@/components/ui/png-upload";
import { Header } from "@/components/ui/header";
import { SpamScoreDisplay } from "@/components/spam-score-display";
import { SpamCheckApiResponse } from "@/types/spam-check";

interface FormData {
  platform: "ActiveCampaign" | "ConvertKit" | "";
  emailType: string;
  market: "USA" | "UK" | "Mexico" | "";
  imageType: string;
  url?: string;
  additionalInstructions?: string;
  includeHandwrittenSignature?: boolean;
  session_id?: string;
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
  signatureName?: string;
  signatureTitle?: string;
  signatureImagePrompt?: string;
  _meta?: {
    session_id: string;
    broadcast_id: number;
  };
}

interface BroadcastHistoryItem {
  id: number;
  title: string;
  created_at: string;
  status: string;
  generated_content: EmailBroadcast;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmailBroadcast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Image generation state
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Signature image generation state
  const [signatureImageUrl, setSignatureImageUrl] = useState<string>("");
  const [signatureImageLoading, setSignatureImageLoading] = useState(false);
  const [signatureImageError, setSignatureImageError] = useState<string | null>(
    null
  );

  // Spam check state
  const [spamCheckResult, setSpamCheckResult] =
    useState<SpamCheckApiResponse | null>(null);
  const [spamCheckLoading, setSpamCheckLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      platform: "",
      market: "",
      emailType: "",
      imageType: "",
      includeHandwrittenSignature: false,
    },
  });

  useEffect(() => {
    // Initialize session
    let sid = sessionStorage.getItem("emailgenius_session_id");
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("emailgenius_session_id", sid);
    }
    setSessionId(sid);
    fetchHistory(sid);
  }, []);

  const fetchHistory = async (sid: string) => {
    try {
      const res = await fetch(`/api/broadcasts?session_id=${sid}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const loadFromHistory = (item: BroadcastHistoryItem) => {
    setResult(item.generated_content);
    // You might want to populate the form as well if configuration is stored
    // setValue("platform", item.configuration.platform); // etc.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const platform = watch("platform");
  const emailType = watch("emailType");
  const market = watch("market");
  const imageType = watch("imageType");

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
    // Validate required fields
    if (!data.platform || !data.emailType || !data.market || !data.imageType) {
      setError(
        "Por favor completa todos los campos obligatorios marcados con *"
      );
      return;
    }

    setIsLoading(true);

    // Smooth scroll to top with ease-in-out animation
    // Add a small delay to ensure the loading state renders first
    setTimeout(() => {
      try {
        // Try smooth scrolling first
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch {
        // Fallback for browsers that don't support smooth scrolling
        window.scrollTo(0, 0);
      }
    }, 100);
    setError(null);
    setResult(null);
    setImageUrl("");
    setImageError(null);
    setSignatureImageUrl("");
    setSignatureImageError(null);
    setSpamCheckResult(null);

    try {
      const response = await fetch("/api/generate-broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error("Error al generar el broadcast");
      }

      const emailBroadcast = await response.json();
      setResult(emailBroadcast);
      fetchHistory(sessionId); // Refresh history

      // Automatically generate image if imagePrompt is available
      if (emailBroadcast.imagePrompt) {
        await generateImage(emailBroadcast.imagePrompt);
      }

      // Generate signature image if handwritten signature is included and signatureName is available
      if (data.includeHandwrittenSignature && emailBroadcast.signatureName) {
        await generateSignatureImage(emailBroadcast.signatureName);
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

  // Function to generate signature image
  const generateSignatureImage = async (signatureName: string) => {
    setSignatureImageLoading(true);
    setSignatureImageError(null);

    try {
      const signaturePrompt = `Generate a realistic, handwritten signature of ${signatureName}. The signature should be written in elegant, flowing black fountain pen ink. The background should be a clean, stark white. Generate the image with a 16:9 aspect ratio.`;

      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imagePrompt: signaturePrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate signature image"
        );
      }

      const data = await response.json();
      if (data.imageUrl) {
        setSignatureImageUrl(data.imageUrl);
      }
    } catch (err) {
      console.error("Error generating signature image:", err);
      setSignatureImageError(
        err instanceof Error ? err.message : "Error generating signature image"
      );
    } finally {
      setSignatureImageLoading(false);
    }
  };

  // Function to reset all form data and results
  const handleReset = () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "¿Estás seguro de que quieres borrar todos los campos y el contenido generado?"
    );

    // Only proceed if user confirmed
    if (!confirmed) {
      return;
    }

    // Reset form to default values
    reset({
      platform: "",
      market: "",
      emailType: "",
      imageType: "",
      url: "",
      additionalInstructions: "",
      includeHandwrittenSignature: false,
    });

    // Clear all state
    setResult(null);
    setError(null);
    setCopiedField(null);
    setImageUrl("");
    setImageError(null);
    setImageLoading(false);
    setSignatureImageUrl("");
    setSignatureImageError(null);
    setSignatureImageLoading(false);
    setSpamCheckResult(null);
    setSpamCheckLoading(false);

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

  // Function to check spam score
  const checkSpamScore = async () => {
    if (!result?.emailBody) return;

    setSpamCheckLoading(true);
    setSpamCheckResult(null);

    try {
      const response = await fetch("/api/spam-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: result.emailBody,
          subjectLine: result.subjectLine1,
          previewText: result.previewText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check spam score");
      }

      const data: SpamCheckApiResponse = await response.json();
      setSpamCheckResult(data);
    } catch (err) {
      console.error("Error checking spam score:", err);
      setSpamCheckResult({
        success: false,
        score: -1,
        status: "fail",
        summary: "Error al analizar el puntaje de spam",
        rules: [],
        error: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setSpamCheckLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4">
        <div className="my-6 flex justify-center">
          <div id="square01" data-topads data-topads-size="square" />
        </div>
      </div>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Main Email Generator Section */}
          <section id="generador" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Configuración del Broadcast</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <History className="h-4 w-4 mr-1" />
                      Historial
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Completa los campos para generar tu broadcast personalizado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {showHistory && history.length > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Broadcasts Recientes
                      </h4>
                      <div className="space-y-2">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className="text-xs p-2 bg-white rounded border hover:border-blue-300 cursor-pointer transition-colors"
                            onClick={() => {
                              loadFromHistory(item);
                              setShowHistory(false);
                            }}
                          >
                            <div className="font-medium truncate">
                              {item.title || "Sin título"}
                            </div>
                            <div className="text-gray-500 flex justify-between mt-1">
                              <span>
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                              <span className="capitalize">{item.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Platform */}
                    <div className="space-y-2">
                      <Label htmlFor="platform">Plataforma *</Label>
                      <Select
                        value={platform || ""}
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
                        value={emailType || ""}
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
                          {/* New dynamic formats */}
                          <div className="py-1 border-t" />
                          <SelectItem value="bank-employee">
                            Empleado Bancario
                          </SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="brand">Marca (Brand)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Market */}
                    <div className="space-y-2">
                      <Label htmlFor="market">Mercado *</Label>
                      <Select
                        value={market || ""}
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
                          <SelectItem value="UK">
                            Reino Unido (Inglés)
                          </SelectItem>
                          <SelectItem value="Mexico">
                            México (Español)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Image Type */}
                    <div className="space-y-2">
                      <Label htmlFor="imageType">Tipo de Imagen *</Label>
                      <Select
                        value={imageType || ""}
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
                          <SelectItem value="infographic">
                            Infografía
                          </SelectItem>
                          <SelectItem value="icon">Icono</SelectItem>
                          <SelectItem value="animated-gif">
                            GIF Animado
                          </SelectItem>
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

                    {/* Handwritten Signature Checkbox */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeHandwrittenSignature"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        {...register("includeHandwrittenSignature")}
                      />
                      <Label
                        htmlFor="includeHandwrittenSignature"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Incluir textos de cierre personalizados y firma
                        manuscrita personalizada
                      </Label>
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
                  <div className="mb-6 flex justify-center">
                    <div id="square02" data-topads data-topads-size="square" />
                  </div>
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

                  {/* Watermark - only visible on desktop when no result and not loading */}
                  {!result && !isLoading && !error && (
                    <div className="hidden lg:flex items-center justify-center py-24 relative">
                      <div className="relative">
                        <Image
                          src="https://storage.googleapis.com/media-topfinanzas-com/favicon.png"
                          alt="TopNetworks Watermark"
                          width={200}
                          height={200}
                          className="opacity-20 grayscale select-none pointer-events-none"
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white/40 rounded-full"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-400 text-lg font-medium opacity-60 select-none">
                          Tu broadcast aparecerá aquí
                        </p>
                      </div>
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

                      {/* Signature Section - Only show if signature fields are present */}
                      {(result.signatureName ||
                        result.signatureTitle ||
                        result.signatureImagePrompt) && (
                        <div className="space-y-4 border-t pt-6">
                          <Label className="text-sm font-medium text-gray-700">
                            Firma Manuscrita Personalizada
                          </Label>

                          {result.signatureName && (
                            <FieldWithCopy
                              label="Nombre para la Firma:"
                              content={result.signatureName}
                              fieldName="signatureName"
                            />
                          )}

                          {result.signatureTitle && (
                            <FieldWithCopy
                              label="Título del Firmante:"
                              content={result.signatureTitle}
                              fieldName="signatureTitle"
                            />
                          )}

                          {result.signatureImagePrompt && (
                            <FieldWithCopy
                              label="Prompt para Generación de Firma:"
                              content={result.signatureImagePrompt}
                              fieldName="signatureImagePrompt"
                            />
                          )}

                          {/* Signature Image Generation Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium text-gray-700">
                                Imagen de Firma Manuscrita
                              </Label>
                              {signatureImageUrl && (
                                <Button
                                  onClick={async () => {
                                    if (!signatureImageUrl) return;
                                    try {
                                      const response =
                                        await fetch(signatureImageUrl);
                                      const blob = await response.blob();
                                      const url =
                                        window.URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = `handwritten-signature-${Date.now()}.png`;
                                      document.body.appendChild(a);
                                      a.click();
                                      window.URL.revokeObjectURL(url);
                                      document.body.removeChild(a);
                                    } catch (error) {
                                      console.error(
                                        "Error downloading signature image:",
                                        error
                                      );
                                    }
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Descargar
                                </Button>
                              )}
                            </div>

                            <div className="relative min-h-[150px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                              {signatureImageLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                                  <span className="text-sm text-gray-600">
                                    Generando firma manuscrita...
                                  </span>
                                </div>
                              )}

                              {signatureImageError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                  <ImageIcon className="h-8 w-8 text-red-400 mb-2" />
                                  <p className="text-sm text-red-600 text-center">
                                    {signatureImageError}
                                  </p>
                                  <Button
                                    onClick={() =>
                                      result?.signatureName &&
                                      generateSignatureImage(
                                        result.signatureName
                                      )
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                  >
                                    Reintentar
                                  </Button>
                                </div>
                              )}

                              {signatureImageUrl && !signatureImageLoading && (
                                <div className="relative w-full h-full">
                                  <Image
                                    src={signatureImageUrl}
                                    alt="Generated handwritten signature"
                                    width={800}
                                    height={200}
                                    className="w-full h-auto object-cover rounded-lg"
                                    style={{ objectFit: "cover" }}
                                    priority
                                    unoptimized={signatureImageUrl.startsWith(
                                      "data:"
                                    )}
                                  />
                                </div>
                              )}

                              {!signatureImageUrl &&
                                !signatureImageLoading &&
                                !signatureImageError && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">
                                      La firma manuscrita aparecerá aquí
                                    </p>
                                  </div>
                                )}
                            </div>

                            {!signatureImageUrl &&
                              !signatureImageLoading &&
                              result?.signatureName && (
                                <Button
                                  onClick={() =>
                                    generateSignatureImage(
                                      result.signatureName!
                                    )
                                  }
                                  variant="outline"
                                  className="w-full"
                                >
                                  <ImageIcon className="h-4 w-4 mr-2" />
                                  Generar Firma Manuscrita
                                </Button>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Spam Score Analysis Section */}
                      <div className="space-y-4 border-t pt-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700">
                            Análisis de Spam
                          </Label>
                        </div>

                        {/* Spam Check Button - show when no result yet */}
                        {!spamCheckResult && !spamCheckLoading && (
                          <Button
                            onClick={checkSpamScore}
                            variant="outline"
                            className="w-full bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 border-green-200"
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Analizar Puntaje de Spam
                          </Button>
                        )}

                        {/* Spam Score Display */}
                        <SpamScoreDisplay
                          result={spamCheckResult}
                          isLoading={spamCheckLoading}
                        />

                        {/* Re-check button after initial check */}
                        {spamCheckResult && !spamCheckLoading && (
                          <Button
                            onClick={checkSpamScore}
                            variant="outline"
                            size="sm"
                            className="w-full text-gray-600"
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Volver a Analizar
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
          </section>

          {/* File Upload Section */}
          <section id="entrenar-asuntos" className="scroll-mt-24 mt-16">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-lime-600 bg-clip-text text-transparent mb-2">
                Entrenar IA con Asuntos Exitosos
              </h3>
              <p className="text-gray-600">
                Enseña a nuestro agente de IA con ejemplos de asuntos que han
                generado altas tasas de apertura y clics
              </p>
            </div>
            <div className="flex justify-center">
              <FileUpload
                onUploadSuccess={(result) => {
                  console.log("Upload successful:", result);
                  // You can add additional success handling here
                }}
                onUploadError={(error) => {
                  console.error("Upload error:", error);
                  // You can add additional error handling here
                }}
              />
            </div>
          </section>

          {/* PNG Image Upload Section */}
          <section id="entrenar-imagenes" className="scroll-mt-24 mt-16">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-lime-600 bg-clip-text text-transparent mb-2">
                Entrenar IA con Ejemplos Visuales
              </h3>
              <p className="text-gray-600">
                Alimenta al agente de IA con capturas de emails exitosos para
                mejorar sus recomendaciones de diseño
              </p>
            </div>
            <div className="flex justify-center">
              <PngUpload
                onUploadSuccess={(result) => {
                  console.log("PNG Upload successful:", result);
                  // You can add additional success handling here
                }}
                onUploadError={(error) => {
                  console.error("PNG Upload error:", error);
                  // You can add additional error handling here
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
