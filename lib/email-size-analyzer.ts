/**
 * Email Size Analyzer
 * Analyzes HTML email content for Gmail clipping prevention
 *
 * Gmail enforces a strict clipping threshold of approximately 102KB (104,448 bytes).
 * This module provides comprehensive analysis and optimization suggestions.
 *
 * @see https://www.litmus.com/blog/do-gmail-image-and-file-size-limits-affect-your-email
 */

import {
  EmailSizeAnalysis,
  DOMComplexityMetrics,
  ContentSourceAnalysis,
  OptimizationSuggestion,
  GMAIL_SIZE_LIMITS,
  getEmailSizeStatus,
  getEmailSizeSummary,
  calculateLimitPercentage,
} from "@/types/email-size";

/**
 * Microsoft Office metadata patterns that inflate email size
 */
const MS_OFFICE_PATTERNS = [
  /mso-/gi, // Microsoft Office styles
  /<!--\[if\s+mso\]/gi, // MSO conditional comments
  /<o:p>/gi, // Office paragraph tags
  /<w:WordDocument>/gi, // Word document tags
  /class="?Mso/gi, // MSO classes
  /style="[^"]*mso-[^"]*"/gi, // MSO inline styles
  /<xml>/gi, // XML declarations from Office
  /xmlns:o="urn:schemas-microsoft-com/gi, // Office namespaces
];

/**
 * Google Docs metadata patterns
 */
const GOOGLE_DOCS_PATTERNS = [
  /id="docs-internal-guid/gi,
  /class="c\d+"/gi, // Google Docs class patterns
  /data-smartmail=/gi,
  /dir="ltr"/gi, // Direction attributes from Docs
];

/**
 * Rich text editor artifact patterns
 */
const RICH_TEXT_PATTERNS = [
  /<font\s+[^>]*>/gi, // Legacy font tags
  /style="[^"]*font-family:\s*[^;]*;[^"]*"/gi, // Complex font stacks
  /<span[^>]*style="[^"]*"[^>]*>\s*<\/span>/gi, // Empty styled spans
  /<!--[\s\S]*?-->/g, // HTML comments
  /<div[^>]*>\s*<br\s*\/?>\s*<\/div>/gi, // Empty divs with breaks
  /&nbsp;/gi, // Non-breaking spaces
];

/**
 * Calculate byte size of a string (UTF-8)
 */
function getByteSize(str: string): number {
  return new TextEncoder().encode(str).length;
}

/**
 * Strip HTML tags and get plain text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  const cleaned = text.replace(/[^\w\s]/g, " ").trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Analyze DOM complexity from HTML string
 */
function analyzeDOMComplexity(html: string): DOMComplexityMetrics {
  const metrics: DOMComplexityMetrics = {
    totalNodes: 0,
    tableCount: 0,
    divCount: 0,
    spanCount: 0,
    maxNestingDepth: 0,
    inlineStyleCount: 0,
    inlineStyleBytes: 0,
  };

  // Count specific element types
  metrics.tableCount = (html.match(/<table[\s>]/gi) || []).length;
  metrics.divCount = (html.match(/<div[\s>]/gi) || []).length;
  metrics.spanCount = (html.match(/<span[\s>]/gi) || []).length;

  // Count all HTML tags as nodes
  const allTags = html.match(/<[a-z][^>]*>/gi) || [];
  metrics.totalNodes = allTags.length;

  // Count and measure inline styles
  const inlineStyles = html.match(/style="[^"]*"/gi) || [];
  metrics.inlineStyleCount = inlineStyles.length;
  metrics.inlineStyleBytes = inlineStyles.reduce(
    (sum, style) => sum + getByteSize(style),
    0
  );

  // Calculate max nesting depth (simplified approach)
  let currentDepth = 0;
  let maxDepth = 0;
  const tagPattern = /<\/?([a-z][a-z0-9]*)[^>]*>/gi;
  let match;

  while ((match = tagPattern.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    // Skip self-closing tags
    if (
      fullTag.endsWith("/>") ||
      ["br", "hr", "img", "input", "meta", "link"].includes(tagName)
    ) {
      continue;
    }

    if (fullTag.startsWith("</")) {
      currentDepth = Math.max(0, currentDepth - 1);
    } else {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
  }

  metrics.maxNestingDepth = maxDepth;

  return metrics;
}

/**
 * Analyze content for problematic paste sources
 */
function analyzeContentSource(html: string): ContentSourceAnalysis {
  const analysis: ContentSourceAnalysis = {
    hasMicrosoftMetadata: false,
    hasGoogleDocsMetadata: false,
    hasRichTextArtifacts: false,
    problematicPatterns: [],
    estimatedBloatBytes: 0,
  };

  // Check for Microsoft Office patterns
  for (const pattern of MS_OFFICE_PATTERNS) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      analysis.hasMicrosoftMetadata = true;
      analysis.problematicPatterns.push(
        `Microsoft Office metadata (${matches.length} occurrences)`
      );
      analysis.estimatedBloatBytes += matches.reduce(
        (sum, m) => sum + getByteSize(m),
        0
      );
    }
  }

  // Check for Google Docs patterns
  for (const pattern of GOOGLE_DOCS_PATTERNS) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      analysis.hasGoogleDocsMetadata = true;
      analysis.problematicPatterns.push(
        `Google Docs metadata (${matches.length} occurrences)`
      );
      analysis.estimatedBloatBytes += matches.reduce(
        (sum, m) => sum + getByteSize(m),
        0
      );
    }
  }

  // Check for rich text editor artifacts
  for (const pattern of RICH_TEXT_PATTERNS) {
    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      analysis.hasRichTextArtifacts = true;
      analysis.problematicPatterns.push(
        `Rich text artifacts (${matches.length} occurrences)`
      );
      analysis.estimatedBloatBytes += matches.reduce(
        (sum, m) => sum + getByteSize(m),
        0
      );
    }
  }

  return analysis;
}

/**
 * Generate optimization suggestions based on analysis
 */
function generateOptimizationSuggestions(
  html: string,
  domMetrics: DOMComplexityMetrics,
  contentSource: ContentSourceAnalysis
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Check for Microsoft Office metadata
  if (contentSource.hasMicrosoftMetadata) {
    suggestions.push({
      id: "strip-ms-metadata",
      category: "metadata",
      priority: 1,
      description:
        "Microsoft Office metadata detected. This significantly inflates email size.",
      estimatedSavings: contentSource.estimatedBloatBytes,
      action:
        "Use 'Paste as Plain Text' (Ctrl+Shift+V / Cmd+Shift+V) or click the 'Remove Formatting' button before pasting content from Word.",
    });
  }

  // Check for Google Docs metadata
  if (contentSource.hasGoogleDocsMetadata) {
    suggestions.push({
      id: "strip-gdocs-metadata",
      category: "metadata",
      priority: 1,
      description:
        "Google Docs metadata detected. This adds unnecessary formatting tags.",
      estimatedSavings: Math.round(contentSource.estimatedBloatBytes * 0.8),
      action:
        "Use 'Paste as Plain Text' (Ctrl+Shift+V / Cmd+Shift+V) when copying from Google Docs.",
    });
  }

  // Check for excessive tables
  if (domMetrics.tableCount > 10) {
    const tableSavings = (domMetrics.tableCount - 5) * 200; // Estimate 200 bytes per unnecessary table
    suggestions.push({
      id: "reduce-tables",
      category: "structure",
      priority: 1,
      description: `Excessive table nesting detected (${domMetrics.tableCount} tables). Email builders often create nested tables for each content block.`,
      estimatedSavings: tableSavings,
      action:
        "Consolidate multiple content blocks into single containers. Avoid using separate blocks for each paragraph.",
    });
  }

  // Check for high inline style count
  if (domMetrics.inlineStyleCount > 50) {
    suggestions.push({
      id: "reduce-inline-styles",
      category: "styling",
      priority: 2,
      description: `High number of inline styles detected (${domMetrics.inlineStyleCount}). This adds significant overhead.`,
      estimatedSavings: Math.round(domMetrics.inlineStyleBytes * 0.3),
      action:
        "Use a CSS inliner tool that consolidates repeated styles. Remove redundant styling from nested elements.",
    });
  }

  // Check for deep nesting
  if (domMetrics.maxNestingDepth > 15) {
    suggestions.push({
      id: "reduce-nesting",
      category: "structure",
      priority: 2,
      description: `Deep DOM nesting detected (${domMetrics.maxNestingDepth} levels). This indicates overly complex structure.`,
      estimatedSavings: domMetrics.maxNestingDepth * 50,
      action:
        "Simplify email layout. Minimize nested columns and varying background colors per section.",
    });
  }

  // Check for empty spans
  const emptySpans = (html.match(/<span[^>]*>\s*<\/span>/gi) || []).length;
  if (emptySpans > 5) {
    suggestions.push({
      id: "remove-empty-spans",
      category: "content",
      priority: 3,
      description: `Empty span elements detected (${emptySpans}). These are often artifacts from copy-paste.`,
      estimatedSavings: emptySpans * 30,
      action:
        "Use the 'Remove Formatting' tool (Tx/Eraser icon) in your email editor to strip extraneous tags.",
    });
  }

  // Check for HTML comments
  const comments = (html.match(/<!--[\s\S]*?-->/g) || []).length;
  if (comments > 2) {
    const commentBytes = (html.match(/<!--[\s\S]*?-->/g) || []).reduce(
      (sum, c) => sum + getByteSize(c),
      0
    );
    suggestions.push({
      id: "remove-comments",
      category: "content",
      priority: 3,
      description: `HTML comments detected (${comments}). These add unnecessary bytes to the payload.`,
      estimatedSavings: commentBytes,
      action:
        "Remove HTML comments before sending. They are not visible to recipients but count toward the size limit.",
    });
  }

  // Check for excessive non-breaking spaces
  const nbspCount = (html.match(/&nbsp;/gi) || []).length;
  if (nbspCount > 20) {
    suggestions.push({
      id: "reduce-nbsp",
      category: "content",
      priority: 3,
      description: `Excessive non-breaking spaces detected (${nbspCount}). Often a sign of copy-paste from formatted sources.`,
      estimatedSavings: nbspCount * 5,
      action:
        "Replace &nbsp; with regular spaces where possible. Use CSS for spacing instead.",
    });
  }

  // Check for high word count
  const plainText = stripHtml(html);
  const wordCount = countWords(plainText);
  if (wordCount > 800) {
    suggestions.push({
      id: "reduce-word-count",
      category: "content",
      priority: 2,
      description: `High word count (${wordCount} words). Long-form content contributes significantly to size.`,
      estimatedSavings: (wordCount - 500) * 5,
      action:
        "Consider splitting into multiple emails or creating a 'read more' link to web content.",
    });
  }

  // Sort by priority
  return suggestions.sort((a, b) => a.priority - b.priority);
}

/**
 * Estimate MIME envelope overhead
 * Headers, boundaries, and encoding add ~2-5KB to the final size
 */
function estimateMimeOverhead(
  subjectLine?: string,
  preheader?: string
): number {
  let overhead = 2048; // Base MIME headers

  if (subjectLine) {
    overhead += getByteSize(subjectLine) * 1.3; // Subject with encoding
  }

  if (preheader) {
    overhead += getByteSize(preheader) * 1.2;
  }

  // Add typical email client tracking pixels and footer links
  overhead += 500;

  return Math.round(overhead);
}

/**
 * Analyze email HTML content for Gmail clipping risk
 *
 * @param htmlContent - The HTML email content to analyze
 * @param options - Optional analysis configuration
 * @returns Comprehensive size analysis with optimization suggestions
 */
export function analyzeEmailSize(
  htmlContent: string,
  options?: {
    subjectLine?: string;
    preheader?: string;
    includeMimeOverhead?: boolean;
  }
): EmailSizeAnalysis {
  try {
    const {
      subjectLine,
      preheader,
      includeMimeOverhead = true,
    } = options || {};

    // Calculate base size
    let totalBytes = getByteSize(htmlContent);

    // Add MIME overhead if requested
    if (includeMimeOverhead) {
      totalBytes += estimateMimeOverhead(subjectLine, preheader);
    }

    // Analyze DOM complexity
    const domComplexity = analyzeDOMComplexity(htmlContent);

    // Analyze content source for problematic patterns
    const contentSource = analyzeContentSource(htmlContent);

    // Get plain text metrics
    const plainText = stripHtml(htmlContent);
    const wordCount = countWords(plainText);
    const characterCount = plainText.length;

    // Generate optimization suggestions
    const suggestions = generateOptimizationSuggestions(
      htmlContent,
      domComplexity,
      contentSource
    );

    // Calculate status and remaining bytes
    const status = getEmailSizeStatus(totalBytes);
    const bytesRemaining = Math.max(
      0,
      GMAIL_SIZE_LIMITS.HARD_LIMIT - totalBytes
    );
    const percentOfLimit = calculateLimitPercentage(totalBytes);

    return {
      success: true,
      totalBytes,
      sizeKB: parseFloat((totalBytes / 1024).toFixed(2)),
      status,
      summary: getEmailSizeSummary(totalBytes),
      percentOfLimit,
      bytesRemaining,
      domComplexity,
      contentSource,
      suggestions,
      wordCount,
      characterCount,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      totalBytes: 0,
      sizeKB: 0,
      status: "warning",
      summary: "Analysis failed",
      percentOfLimit: 0,
      bytesRemaining: GMAIL_SIZE_LIMITS.HARD_LIMIT,
      domComplexity: {
        totalNodes: 0,
        tableCount: 0,
        divCount: 0,
        spanCount: 0,
        maxNestingDepth: 0,
        inlineStyleCount: 0,
        inlineStyleBytes: 0,
      },
      contentSource: {
        hasMicrosoftMetadata: false,
        hasGoogleDocsMetadata: false,
        hasRichTextArtifacts: false,
        problematicPatterns: [],
        estimatedBloatBytes: 0,
      },
      suggestions: [],
      wordCount: 0,
      characterCount: 0,
      analyzedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sanitize HTML content by removing problematic metadata
 *
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML with reduced size
 */
export function sanitizeEmailHtml(html: string): {
  sanitized: string;
  bytesRemoved: number;
} {
  const originalBytes = getByteSize(html);
  let sanitized = html;

  // Remove Microsoft Office metadata
  for (const pattern of MS_OFFICE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Remove Google Docs metadata
  for (const pattern of GOOGLE_DOCS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Remove empty spans
  sanitized = sanitized.replace(/<span[^>]*>\s*<\/span>/gi, "");

  // Remove HTML comments (except conditional comments for Outlook)
  sanitized = sanitized.replace(/<!--(?!\[if)[\s\S]*?-->/g, "");

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ");

  // Clean up multiple consecutive spaces
  sanitized = sanitized.replace(/  +/g, " ");

  const sanitizedBytes = getByteSize(sanitized);

  return {
    sanitized,
    bytesRemoved: originalBytes - sanitizedBytes,
  };
}

/**
 * Quick check if email is at risk of Gmail clipping
 *
 * @param htmlContent - The HTML content to check
 * @returns Object with risk status and size info
 */
export function quickClipCheck(htmlContent: string): {
  isAtRisk: boolean;
  sizeKB: number;
  message: string;
} {
  const bytes = getByteSize(htmlContent);
  const sizeKB = parseFloat((bytes / 1024).toFixed(2));
  const isAtRisk = bytes >= GMAIL_SIZE_LIMITS.WARNING_LIMIT;

  let message: string;
  if (bytes >= GMAIL_SIZE_LIMITS.HARD_LIMIT) {
    message = `⛔ WILL BE CLIPPED: ${sizeKB}KB exceeds Gmail's 102KB limit`;
  } else if (bytes >= GMAIL_SIZE_LIMITS.TARGET_LIMIT) {
    message = `🔴 HIGH RISK: ${sizeKB}KB is very close to Gmail's limit`;
  } else if (bytes >= GMAIL_SIZE_LIMITS.WARNING_LIMIT) {
    message = `🟡 WARNING: ${sizeKB}KB approaching Gmail's limit`;
  } else if (bytes >= GMAIL_SIZE_LIMITS.OPTIMAL_LIMIT) {
    message = `🟢 OK: ${sizeKB}KB within safe limits`;
  } else {
    message = `✅ OPTIMAL: ${sizeKB}KB is well under Gmail's limit`;
  }

  return { isAtRisk, sizeKB, message };
}

/**
 * Validate email content before deployment
 * Returns validation result with pass/fail status
 */
export function validateEmailForDeployment(
  htmlContent: string,
  options?: {
    subjectLine?: string;
    preheader?: string;
    strictMode?: boolean;
  }
): {
  valid: boolean;
  analysis: EmailSizeAnalysis;
  recommendations: string[];
} {
  const { strictMode = false } = options || {};
  const analysis = analyzeEmailSize(htmlContent, options);

  const threshold = strictMode
    ? GMAIL_SIZE_LIMITS.OPTIMAL_LIMIT
    : GMAIL_SIZE_LIMITS.TARGET_LIMIT;

  const valid = analysis.totalBytes < threshold;

  const recommendations: string[] = [];

  if (!valid) {
    recommendations.push(
      `Email size (${analysis.sizeKB}KB) exceeds the ${strictMode ? "optimal" : "recommended"} limit of ${(threshold / 1024).toFixed(0)}KB.`
    );
  }

  if (analysis.contentSource.hasMicrosoftMetadata) {
    recommendations.push(
      "Strip Microsoft Office formatting before pasting content."
    );
  }

  if (analysis.contentSource.hasGoogleDocsMetadata) {
    recommendations.push(
      "Use 'Paste as Plain Text' when copying from Google Docs."
    );
  }

  if (analysis.domComplexity.tableCount > 15) {
    recommendations.push(
      "Reduce table nesting by consolidating content blocks."
    );
  }

  if (analysis.wordCount > 1000) {
    recommendations.push(
      "Consider splitting long-form content into multiple emails."
    );
  }

  return { valid, analysis, recommendations };
}
