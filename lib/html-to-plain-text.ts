/**
 * HTML to Plain Text Converter
 * Converts HTML email body to ActiveCampaign-compatible plain text format
 * Preserves content structure while removing markup
 */

/**
 * Convert HTML to plain text suitable for ActiveCampaign rich text editor
 * Preserves structure: paragraphs, lists, line breaks, and special characters
 */
export function htmlToPlainText(html: string): string {
  if (!html || html.trim() === "") {
    return "";
  }

  let text = html;

  // Replace block-level elements with proper spacing

  // Handle paragraphs - add double line breaks
  text = text.replace(/<\/p>\s*<p[^>]*>/gi, "\n\n");
  text = text.replace(/<p[^>]*>/gi, "");
  text = text.replace(/<\/p>/gi, "\n\n");

  // Handle divs with proper spacing
  text = text.replace(/<\/div>\s*<div[^>]*>/gi, "\n\n");
  text = text.replace(/<div[^>]*>/gi, "");
  text = text.replace(/<\/div>/gi, "\n");

  // Handle line breaks
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Handle headings - add extra spacing
  text = text.replace(/<h[1-6][^>]*>/gi, "\n\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");

  // Handle unordered lists
  text = text.replace(/<ul[^>]*>/gi, "\n");
  text = text.replace(/<\/ul>/gi, "\n");

  // Handle ordered lists
  text = text.replace(/<ol[^>]*>/gi, "\n");
  text = text.replace(/<\/ol>/gi, "\n");

  // Handle list items - convert to plain text bullets
  text = text.replace(/<li[^>]*>/gi, "• ");
  text = text.replace(/<\/li>/gi, "\n");

  // Handle bold/strong - just remove the tags, keep text
  text = text.replace(/<strong[^>]*>/gi, "");
  text = text.replace(/<\/strong>/gi, "");
  text = text.replace(/<b[^>]*>/gi, "");
  text = text.replace(/<\/b>/gi, "");

  // Handle italic/em
  text = text.replace(/<em[^>]*>/gi, "");
  text = text.replace(/<\/em>/gi, "");
  text = text.replace(/<i[^>]*>/gi, "");
  text = text.replace(/<\/i>/gi, "");

  // Handle underline
  text = text.replace(/<u[^>]*>/gi, "");
  text = text.replace(/<\/u>/gi, "");

  // Handle strikethrough
  text = text.replace(/<s[^>]*>/gi, "");
  text = text.replace(/<\/s>/gi, "");
  text = text.replace(/<strike[^>]*>/gi, "");
  text = text.replace(/<\/strike>/gi, "");

  // Handle links - keep the text, optionally append URL
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "$2");

  // Handle spans and other inline elements
  text = text.replace(/<span[^>]*>/gi, "");
  text = text.replace(/<\/span>/gi, "");

  // Remove style and script blocks entirely
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  // Remove any remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  text = text.replace(/&nbsp;/gi, " ");
  text = text.replace(/&amp;/gi, "&");
  text = text.replace(/&lt;/gi, "<");
  text = text.replace(/&gt;/gi, ">");
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/&apos;/gi, "'");
  text = text.replace(/&mdash;/gi, "—");
  text = text.replace(/&ndash;/gi, "–");
  text = text.replace(/&bull;/gi, "•");
  text = text.replace(/&hellip;/gi, "…");
  text = text.replace(/&copy;/gi, "©");
  text = text.replace(/&reg;/gi, "®");
  text = text.replace(/&trade;/gi, "™");

  // Decode numeric HTML entities (like &#8226; for bullet)
  text = text.replace(/&#(\d+);/gi, (match, code) => {
    return String.fromCharCode(parseInt(code, 10));
  });

  // Clean up whitespace
  // Replace multiple spaces with single space
  text = text.replace(/[ \t]+/g, " ");

  // Replace more than 2 consecutive newlines with 2
  text = text.replace(/\n{3,}/g, "\n\n");

  // Remove leading/trailing whitespace from each line
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Trim the entire result
  text = text.trim();

  return text;
}

/**
 * Check if content contains HTML tags
 */
export function containsHtmlTags(content: string): boolean {
  return /<[^>]+>/g.test(content);
}

/**
 * Convert email body for ActiveCampaign compatibility
 * If HTML, converts to plain text. If already plain text, returns as-is.
 */
export function formatEmailBodyForActiveCampaign(emailBody: string): string {
  if (!emailBody) return "";

  // If content contains HTML tags, convert to plain text
  if (containsHtmlTags(emailBody)) {
    return htmlToPlainText(emailBody);
  }

  // Already plain text, return as-is
  return emailBody;
}
