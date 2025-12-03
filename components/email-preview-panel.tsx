"use client";

/**
 * Email Preview Panel Component
 * Displays a rich, interactive preview of generated email broadcasts
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  X,
  Monitor,
  Smartphone,
  Code,
  FileText,
  Eye,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type ViewMode = "html" | "text" | "source";
type Viewport = "desktop" | "mobile";

export interface EmailPreviewPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** The broadcast data to preview */
  broadcast: {
    subjectLine1?: string;
    subjectLine2?: string;
    previewText?: string;
    emailBody: string;
    ctaButtonText: string;
    destinationUrl?: string;
    fromName?: string;
    signatureName?: string;
    signatureTitle?: string;
  } | null;
  /** Email type for template selection */
  emailType: string;
  /** Target platform */
  platform: "ConvertKit" | "ActiveCampaign";
  /** Target market */
  market: "USA" | "UK" | "Mexico";
  /** Spam check result */
  spamCheckResult?: {
    score: number;
    status: "pass" | "warning" | "fail";
    summary: string;
  } | null;
  /** Generated header image URL */
  imageUrl?: string;
  /** Generated handwritten signature image URL */
  signatureImageUrl?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Convert basic markdown formatting to HTML
 * Only handles inline elements to avoid breaking template structure
 * Does NOT wrap content in block-level elements like <p> tags
 */
function convertMarkdownToHtml(text: string): string {
  if (!text) return text;

  let html = text;

  // Convert bold: **text** or __text__ → <strong>text</strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // Convert italic: *text* or _text_ → <em>text</em>
  // Be careful not to match ** or __
  html = html.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  html = html.replace(/(?<!_)_(?!_)([^_]+)(?<!_)_(?!_)/g, "<em>$1</em>");

  // Convert inline code: `code` → <code>code</code>
  html = html.replace(
    /`([^`]+)`/g,
    '<code style="background-color:#f3f4f6;padding:2px 4px;border-radius:3px;font-family:monospace;font-size:13px;">$1</code>'
  );

  // Convert links: [text](url) → <a href="url">text</a>
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color:#2563eb;text-decoration:underline;">$1</a>'
  );

  // Convert line breaks: double newline → <br><br>
  html = html.replace(/\n\n/g, "<br><br>");

  // Convert single line breaks to <br>
  html = html.replace(/\n/g, "<br>");

  return html;
}

/**
 * Filter out TopFinanzas logo from rendered HTML
 * Removes the default logo image to clean up the preview
 */
function filterTopLogo(html: string): string {
  if (!html) return html;

  // Pattern to match Top logo images from various sources
  const logoPatterns = [
    // Match img tags with TopFinanzas favicon
    /<img[^>]*src="[^"]*favicon\.png"[^>]*>/gi,
    // Match img tags with TopFinanzas logo
    /<img[^>]*src="[^"]*topfinanzas[^"]*logo[^"]*"[^>]*>/gi,
    // Match the specific storage URL used for the logo
    /<img[^>]*src="https:\/\/storage\.googleapis\.com\/media-topfinanzas-com\/favicon\.png"[^>]*>/gi,
    // Match any Link wrapper around the logo
    /<a[^>]*href="[^"]*topfinanzas[^"]*"[^>]*>\s*<img[^>]*src="[^"]*favicon\.png"[^>]*>\s*<\/a>/gi,
  ];

  let filteredHtml = html;
  for (const pattern of logoPatterns) {
    filteredHtml = filteredHtml.replace(pattern, "");
  }

  return filteredHtml;
}

/**
 * Inject hero/header image into the HTML content
 * Uses table-based structure to match React Email's output format
 */
function injectHeroImage(html: string, imageUrl: string): string {
  if (!html || !imageUrl) return html;

  // Create hero image HTML using table structure (compatible with email clients)
  const heroImageHtml = `
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0; padding: 0;">
      <tbody>
        <tr>
          <td align="center" style="padding: 0 0 16px 0;">
            <img 
              src="${imageUrl}" 
              alt="Email Header Image" 
              width="600"
              style="max-width: 100%; width: 600px; height: auto; display: block; margin: 0 auto; border-radius: 8px; border: 0;"
            />
          </td>
        </tr>
      </tbody>
    </table>
  `;

  // Strategy: Find the email-container div and inject right after it opens
  // This places the image at the very top of the email content
  
  // First try: inject right after email-container div
  if (/<div class="email-container">/.test(html)) {
    return html.replace(
      /(<div class="email-container">)/,
      `$1\n${heroImageHtml}`
    );
  }

  // Second try: inject right after <body> tag in the preview wrapper
  if (/<body[^>]*>/.test(html)) {
    return html.replace(
      /(<body[^>]*>)/i,
      `$1\n<div style="text-align: center; padding: 20px 20px 0 20px;">${heroImageHtml}</div>`
    );
  }

  // Fallback: prepend to HTML
  return heroImageHtml + html;
}

/**
 * Inject handwritten signature image into the HTML content
 * Places the signature above the CTA button, after the sign-off
 */
function injectSignatureImage(html: string, signatureUrl: string, signatureName?: string): string {
  if (!html || !signatureUrl) return html;

  // Create signature image HTML
  const signatureHtml = `
    <table align="left" width="200" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 16px 0;">
      <tbody>
        <tr>
          <td align="left" style="padding: 0;">
            <img 
              src="${signatureUrl}" 
              alt="${signatureName || 'Signature'}" 
              width="200"
              style="max-width: 200px; width: 200px; height: auto; display: block; border: 0;"
            />
          </td>
        </tr>
      </tbody>
    </table>
  `;

  // Strategy: Find common sign-off patterns and inject signature after them
  // Look for patterns like "Best regards," or "Sincerely," followed by a name
  
  // Pattern 1: Look for "Best regards" or similar, then inject before the next paragraph/div
  const signOffPatterns = [
    /(Best regards,?<br\s*\/?>)/i,
    /(Sincerely,?<br\s*\/?>)/i,
    /(Kind regards,?<br\s*\/?>)/i,
    /(Warm regards,?<br\s*\/?>)/i,
    /(Saludos,?<br\s*\/?>)/i,
    /(Atentamente,?<br\s*\/?>)/i,
    /(Cordialmente,?<br\s*\/?>)/i,
  ];

  for (const pattern of signOffPatterns) {
    if (pattern.test(html)) {
      return html.replace(pattern, `$1\n${signatureHtml}`);
    }
  }

  // Pattern 2: Look for the CTA button and inject before it
  const ctaButtonPattern = /(<table[^>]*align="center"[^>]*>[\s\S]*?<a[^>]*style="[^"]*background-color)/i;
  if (ctaButtonPattern.test(html)) {
    return html.replace(ctaButtonPattern, `${signatureHtml}\n$1`);
  }

  // Pattern 3: Look for department signatures like "Shipping & Fulfillment Dept."
  const deptPattern = /(<strong>[^<]*(?:Dept\.|Department|Team|Division)[^<]*<\/strong>)/i;
  if (deptPattern.test(html)) {
    return html.replace(deptPattern, `${signatureHtml}\n$1`);
  }

  // Fallback: inject before the footer section
  const footerPattern = /(<section[^>]*style="[^"]*background-color:\s*#1e3a5f)/i;
  if (footerPattern.test(html)) {
    return html.replace(footerPattern, `${signatureHtml}\n$1`);
  }

  return html;
}

export function EmailPreviewPanel({
  isOpen,
  onClose,
  broadcast,
  emailType,
  platform,
  market,
  spamCheckResult,
  imageUrl,
  signatureImageUrl,
}: EmailPreviewPanelProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>("html");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [plainTextContent, setPlainTextContent] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isRunningSpamCheck, setIsRunningSpamCheck] = useState(false);
  const [localSpamResult, setLocalSpamResult] = useState(spamCheckResult);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Update local spam result when prop changes
  useEffect(() => {
    setLocalSpamResult(spamCheckResult);
  }, [spamCheckResult]);

  // Process broadcast with markdown conversion (memoized)
  const processedBroadcast = useMemo(() => {
    if (!broadcast) return null;

    // Convert markdown in emailBody to HTML
    const htmlBody = convertMarkdownToHtml(broadcast.emailBody);

    return {
      ...broadcast,
      emailBody: htmlBody,
    };
  }, [broadcast]);

  // Fetch rendered email when broadcast changes
  const fetchRenderedEmail = useCallback(async () => {
    if (!processedBroadcast) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/render-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          broadcast: processedBroadcast,
          emailType,
          platform,
          market,
          previewConfig: {
            viewport,
            viewMode: "html",
            showGrid: false,
            darkMode: false,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to render email");
      }

      const data = await response.json();
      let renderedHtml = data.preview?.content || data.html;

      // Apply post-processing filters
      renderedHtml = filterTopLogo(renderedHtml);

      // Inject hero image if available
      if (imageUrl) {
        renderedHtml = injectHeroImage(renderedHtml, imageUrl);
      }

      // Inject handwritten signature if available
      if (signatureImageUrl) {
        renderedHtml = injectSignatureImage(
          renderedHtml, 
          signatureImageUrl, 
          broadcast?.signatureName
        );
      }

      setHtmlContent(renderedHtml);
      setPlainTextContent(data.plainText);
    } catch (err) {
      console.error("Error rendering email:", err);
      setError(err instanceof Error ? err.message : "Failed to render email");
    } finally {
      setIsLoading(false);
    }
  }, [processedBroadcast, emailType, platform, market, viewport, imageUrl, signatureImageUrl, broadcast?.signatureName]);

  // Fetch on open and when broadcast changes
  useEffect(() => {
    if (isOpen && broadcast) {
      fetchRenderedEmail();
    }
  }, [isOpen, broadcast, fetchRenderedEmail]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, isFullscreen, onClose]);

  // Run spam check
  const runSpamCheck = async () => {
    if (!htmlContent) return;

    setIsRunningSpamCheck(true);

    try {
      const response = await fetch("/api/spam-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: htmlContent,
          subjectLine: broadcast?.subjectLine1,
          previewText: broadcast?.previewText,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLocalSpamResult({
          score: result.score,
          status: result.status,
          summary: result.summary,
        });
      }
    } catch (err) {
      console.error("Error running spam check:", err);
    } finally {
      setIsRunningSpamCheck(false);
    }
  };

  // Copy content to clipboard
  const copyContent = async () => {
    const content = viewMode === "text" ? plainTextContent : htmlContent;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Get spam score badge color
  const getSpamBadgeColor = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-green-100 text-green-700 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "fail":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/50 backdrop-blur-sm"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "bg-white rounded-xl shadow-2xl flex flex-col",
          "transition-all duration-300 ease-in-out",
          isFullscreen
            ? "w-full h-full rounded-none"
            : "w-[95vw] max-w-5xl h-[90vh] max-h-[800px]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Vista Previa del Email
              </h2>
              <p className="text-xs text-gray-500">
                {platform} • {market} • {emailType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Spam Score Badge */}
            {localSpamResult && (
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium",
                  getSpamBadgeColor(localSpamResult.status)
                )}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Spam: {localSpamResult.score.toFixed(1)}</span>
              </div>
            )}

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
            <button
              onClick={() => setViewMode("html")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                viewMode === "html"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              HTML
            </button>
            <button
              onClick={() => setViewMode("text")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                viewMode === "text"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Texto
            </button>
            <button
              onClick={() => setViewMode("source")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                viewMode === "source"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Code className="h-3.5 w-3.5" />
              Código
            </button>
          </div>

          {/* Viewport Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
              <button
                onClick={() => setViewport("desktop")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  viewport === "desktop"
                    ? "bg-cyan-100 text-cyan-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
                Desktop
              </button>
              <button
                onClick={() => setViewport("mobile")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  viewport === "mobile"
                    ? "bg-cyan-100 text-cyan-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile
              </button>
            </div>

            {/* Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRenderedEmail}
              disabled={isLoading}
              className="h-8"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5 mr-1", isLoading && "animate-spin")}
              />
              Actualizar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={copyContent}
              className="h-8"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copiar
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={runSpamCheck}
              disabled={isRunningSpamCheck || !htmlContent}
              className="h-8 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              {isRunningSpamCheck ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Spam Check
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-gray-100 p-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600">Renderizando email...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <p className="text-red-600 font-medium mb-2">
                  Error al renderizar
                </p>
                <p className="text-gray-600 text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRenderedEmail}
                  className="mt-4"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "h-full mx-auto bg-white rounded-lg shadow-lg overflow-auto transition-all duration-300",
                viewport === "mobile" ? "max-w-[375px]" : "max-w-[680px]"
              )}
            >
              {viewMode === "html" && (
                <iframe
                  ref={iframeRef}
                  srcDoc={htmlContent}
                  className="w-full border-0"
                  style={{ minHeight: "100%", height: "auto" }}
                  title="Email Preview"
                  sandbox="allow-same-origin"
                  onLoad={(e) => {
                    // Auto-adjust iframe height to content
                    const iframe = e.target as HTMLIFrameElement;
                    if (iframe.contentDocument?.body) {
                      const height = iframe.contentDocument.body.scrollHeight;
                      iframe.style.height = `${Math.max(height + 40, 500)}px`;
                    }
                  }}
                />
              )}

              {viewMode === "text" && (
                <div className="h-full overflow-auto p-4">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                    {plainTextContent || "No plain text content available"}
                  </pre>
                </div>
              )}

              {viewMode === "source" && (
                <div className="h-full overflow-auto p-4 bg-gray-900">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-green-400">
                    {htmlContent || "No HTML source available"}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {htmlContent && (
              <span>
                HTML: {(htmlContent.length / 1024).toFixed(1)} KB
                {plainTextContent &&
                  ` • Texto: ${(plainTextContent.length / 1024).toFixed(1)} KB`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {localSpamResult && (
              <p className="text-xs text-gray-600">{localSpamResult.summary}</p>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailPreviewPanel;
