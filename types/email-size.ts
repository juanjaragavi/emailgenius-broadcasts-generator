/**
 * Email Size Types
 * Interfaces for Gmail clipping prevention and HTML payload analysis
 */

/**
 * Gmail enforces a strict clipping threshold
 * - Hard limit: 102KB (104,448 bytes)
 * - Target: < 90KB for safety margin
 */
export const GMAIL_SIZE_LIMITS = {
  /** Gmail's hard clipping threshold in bytes */
  HARD_LIMIT: 104448,
  /** Recommended maximum for safety margin (90KB) */
  TARGET_LIMIT: 92160,
  /** Warning threshold (85KB) */
  WARNING_LIMIT: 87040,
  /** Optimal size for best deliverability (70KB) */
  OPTIMAL_LIMIT: 71680,
} as const;

/**
 * DOM complexity metrics for email optimization
 */
export interface DOMComplexityMetrics {
  /** Total number of HTML nodes */
  totalNodes: number;
  /** Number of table elements (often inflated by email builders) */
  tableCount: number;
  /** Number of div elements */
  divCount: number;
  /** Number of span elements */
  spanCount: number;
  /** Maximum nesting depth of the DOM tree */
  maxNestingDepth: number;
  /** Number of inline styles detected */
  inlineStyleCount: number;
  /** Estimated bytes from inline styles */
  inlineStyleBytes: number;
}

/**
 * Content source analysis - detecting problematic paste sources
 */
export interface ContentSourceAnalysis {
  /** Whether Microsoft Office metadata was detected */
  hasMicrosoftMetadata: boolean;
  /** Whether Google Docs metadata was detected */
  hasGoogleDocsMetadata: boolean;
  /** Whether rich text editor artifacts were detected */
  hasRichTextArtifacts: boolean;
  /** Specific problematic patterns found */
  problematicPatterns: string[];
  /** Estimated bloat bytes from detected sources */
  estimatedBloatBytes: number;
}

/**
 * Optimization suggestion with priority and impact
 */
export interface OptimizationSuggestion {
  /** Unique identifier for the suggestion */
  id: string;
  /** Category of the optimization */
  category: "structure" | "content" | "styling" | "images" | "metadata";
  /** Priority level (1 = highest) */
  priority: 1 | 2 | 3;
  /** Human-readable description */
  description: string;
  /** Estimated bytes that could be saved */
  estimatedSavings: number;
  /** Actionable fix instruction */
  action: string;
}

/**
 * Email size analysis result
 */
export interface EmailSizeAnalysis {
  /** Whether the analysis was successful */
  success: boolean;
  /** Total size in bytes */
  totalBytes: number;
  /** Size in kilobytes (for display) */
  sizeKB: number;
  /** Status based on Gmail limits */
  status: "optimal" | "good" | "warning" | "danger" | "clipped";
  /** Human-readable summary */
  summary: string;
  /** Percentage of Gmail limit used */
  percentOfLimit: number;
  /** Bytes remaining until clipping */
  bytesRemaining: number;
  /** DOM complexity metrics */
  domComplexity: DOMComplexityMetrics;
  /** Content source analysis */
  contentSource: ContentSourceAnalysis;
  /** Optimization suggestions sorted by priority */
  suggestions: OptimizationSuggestion[];
  /** Word count of visible text content */
  wordCount: number;
  /** Character count of visible text */
  characterCount: number;
  /** Timestamp of analysis */
  analyzedAt: string;
  /** Error message if analysis failed */
  error?: string;
}

/**
 * Request payload for email size check API
 */
export interface EmailSizeCheckRequest {
  /** HTML content to analyze */
  htmlContent: string;
  /** Optional subject line (adds to MIME overhead) */
  subjectLine?: string;
  /** Optional preheader text */
  preheader?: string;
  /** Include full MIME envelope estimation */
  includeMimeOverhead?: boolean;
}

/**
 * Batch analysis request for multiple variants
 */
export interface EmailSizeBatchRequest {
  variants: Array<{
    id: string;
    htmlContent: string;
    subjectLine?: string;
  }>;
}

/**
 * Get status based on email size in bytes
 */
export function getEmailSizeStatus(bytes: number): EmailSizeAnalysis["status"] {
  if (bytes <= GMAIL_SIZE_LIMITS.OPTIMAL_LIMIT) {
    return "optimal";
  } else if (bytes <= GMAIL_SIZE_LIMITS.WARNING_LIMIT) {
    return "good";
  } else if (bytes <= GMAIL_SIZE_LIMITS.TARGET_LIMIT) {
    return "warning";
  } else if (bytes < GMAIL_SIZE_LIMITS.HARD_LIMIT) {
    return "danger";
  }
  return "clipped";
}

/**
 * Get human-readable summary based on email size
 */
export function getEmailSizeSummary(bytes: number): string {
  const kb = (bytes / 1024).toFixed(1);
  const status = getEmailSizeStatus(bytes);

  switch (status) {
    case "optimal":
      return `Excellent! Email size (${kb}KB) is optimal for all email clients including Gmail.`;
    case "good":
      return `Good! Email size (${kb}KB) is within safe limits. No clipping expected.`;
    case "warning":
      return `Warning: Email size (${kb}KB) is approaching Gmail's limit. Consider optimizations.`;
    case "danger":
      return `Danger: Email size (${kb}KB) is very close to Gmail's 102KB limit. High risk of clipping.`;
    case "clipped":
      return `Critical: Email size (${kb}KB) exceeds Gmail's 102KB limit. Message WILL be clipped.`;
  }
}

/**
 * Calculate percentage of Gmail limit used
 */
export function calculateLimitPercentage(bytes: number): number {
  return Math.round((bytes / GMAIL_SIZE_LIMITS.HARD_LIMIT) * 100);
}
