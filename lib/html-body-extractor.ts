/**
 * HTML Body Extractor Utility
 * Extracts only the content within <body> tags from a full HTML document
 * Preserves inline styles and content structure while removing document-level markup
 */

/**
 * Extract content from within <body> tags
 * Strips DOCTYPE, <html>, <head> and their contents
 * Preserves all inline styles and body-internal elements
 */
export function extractBodyContent(fullHtml: string): string {
  if (!fullHtml || fullHtml.trim() === "") {
    return "";
  }

  // Remove DOCTYPE declaration
  let bodyContent = fullHtml.replace(/<!DOCTYPE[^>]*>/gi, "");

  // Try to find and extract <body> content
  const bodyMatch = bodyContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  if (bodyMatch && bodyMatch[1]) {
    // Extract content between <body> tags
    bodyContent = bodyMatch[1].trim();
  } else {
    // Fallback: Remove <html>, <head> tags and their contents
    // Remove <html> opening tag
    bodyContent = bodyContent.replace(/<html[^>]*>/gi, "");

    // Remove entire <head> section
    bodyContent = bodyContent.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "");

    // Remove <body> opening and closing tags (keep content)
    bodyContent = bodyContent.replace(/<\/?body[^>]*>/gi, "");

    // Remove </html> closing tag
    bodyContent = bodyContent.replace(/<\/html>/gi, "");

    // Clean up excessive whitespace
    bodyContent = bodyContent.trim();
  }

  return bodyContent;
}

/**
 * Generate user instructions for ActiveCampaign integration
 */
export function getActiveeCampaignInstructions(): string {
  return `Copia este fragmento HTML en el Editor de Código de ActiveCampaign:

1. Abre tu campaña en ActiveCampaign
2. Haz clic en el botón "Código" en la barra de herramientas del editor
3. Localiza la sección <body> en el código existente
4. Pega este contenido DENTRO de las etiquetas <body>, reemplazando el contenido actual
5. NO copies las etiquetas <body> o <head> - solo el contenido interno
6. Haz clic en "HTML" para volver al editor visual y verifica el resultado`;
}

/**
 * Check if HTML content is a full document or body-only snippet
 */
export function isFullHtmlDocument(html: string): boolean {
  if (!html) return false;

  const hasDoctype = /<!DOCTYPE/i.test(html);
  const hasHtmlTag = /<html[^>]*>/i.test(html);
  const hasHeadTag = /<head[^>]*>/i.test(html);

  return hasDoctype || hasHtmlTag || hasHeadTag;
}

/**
 * Extract email-specific content elements from body HTML
 * Returns structured data for easier manipulation
 */
export interface ExtractedEmailElements {
  headerImage?: string;
  preheaderText?: string;
  mainContent: string;
  ctaButton?: string;
  footer?: string;
  signatureImage?: string;
}

/**
 * Parse body HTML and extract semantic elements
 */
export function parseEmailElements(bodyHtml: string): ExtractedEmailElements {
  const elements: ExtractedEmailElements = {
    mainContent: bodyHtml,
  };

  // Extract header image (first <img> tag in a table structure)
  const headerImageMatch = bodyHtml.match(
    /<table[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*alt="Email Header Image"[^>]*>[\s\S]*?<\/table>/i
  );
  if (headerImageMatch) {
    elements.headerImage = headerImageMatch[0];
  }

  // Extract preheader text (usually in a hidden div or span)
  const preheaderMatch = bodyHtml.match(
    /<div[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>([^<]+)<\/div>/i
  );
  if (preheaderMatch) {
    elements.preheaderText = preheaderMatch[1].trim();
  }

  // Extract CTA button (anchor tag with button styling)
  const ctaMatch = bodyHtml.match(
    /<a[^>]*href="[^"]*"[^>]*style="[^"]*background-color[^"]*"[^>]*>[\s\S]*?<\/a>/i
  );
  if (ctaMatch) {
    elements.ctaButton = ctaMatch[0];
  }

  // Extract signature image
  const signatureMatch = bodyHtml.match(
    /<img[^>]*alt="[^"]*Signature[^"]*"[^>]*>/i
  );
  if (signatureMatch) {
    elements.signatureImage = signatureMatch[0];
  }

  return elements;
}

/**
 * Clean up excessive whitespace and formatting in HTML
 */
export function cleanHtmlWhitespace(html: string): string {
  return html
    .replace(/\n\s*\n\s*\n/g, "\n\n") // Reduce multiple blank lines to double
    .replace(/^\s+/gm, "") // Remove leading whitespace from lines
    .trim();
}

/**
 * Prepare body content for ActiveCampaign with optimizations
 */
export function prepareForActiveCampaign(fullHtml: string): {
  bodyContent: string;
  instructions: string;
  originalSize: number;
  optimizedSize: number;
} {
  const bodyContent = extractBodyContent(fullHtml);
  const cleanedContent = cleanHtmlWhitespace(bodyContent);

  const originalSize = new TextEncoder().encode(fullHtml).length;
  const optimizedSize = new TextEncoder().encode(cleanedContent).length;

  return {
    bodyContent: cleanedContent,
    instructions: getActiveeCampaignInstructions(),
    originalSize,
    optimizedSize,
  };
}
