/**
 * Spam Check Types
 * Interfaces for Postmark SpamCheck API integration
 */

/**
 * Individual spam rule triggered by the content analysis
 */
export interface SpamRule {
  /** SpamAssassin rule name (e.g., "HTML_FONT_LOW_CONTRAST") */
  rule: string;
  /** Human-readable description of the rule */
  description: string;
  /** Score contribution (positive = spammy, negative = ham) */
  score: string;
}

/**
 * Response from the Postmark SpamCheck API
 */
export interface SpamCheckResponse {
  /** Whether the analysis was successful */
  success: boolean;
  /** Overall SpamAssassin score (lower is better, typically <5 is acceptable) */
  score: string;
  /** Detailed SpamAssassin report */
  report: string;
  /** Array of individual rules triggered */
  rules?: SpamRule[];
}

/**
 * Request payload for the spam check API
 */
export interface SpamCheckRequest {
  /** Raw email content (can be HTML or plain text) */
  content: string;
  /** Subject line to include in analysis */
  subjectLine?: string;
  /** Preview/preheader text */
  previewText?: string;
}

/**
 * Internal API response from our spam-check endpoint
 */
export interface SpamCheckApiResponse {
  /** Whether the check was successful */
  success: boolean;
  /** Numeric spam score */
  score: number;
  /** Pass/Fail status based on threshold */
  status: "pass" | "warning" | "fail";
  /** Human-readable summary */
  summary: string;
  /** Detailed rules that were triggered */
  rules: SpamRule[];
  /** Raw report from SpamAssassin */
  rawReport?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Score thresholds for spam analysis
 */
export const SPAM_SCORE_THRESHOLDS = {
  /** Score below this is considered excellent */
  EXCELLENT: 0,
  /** Score below this is considered passing */
  PASS: 3,
  /** Score below this is a warning */
  WARNING: 5,
  /** Score at or above this is considered spam */
  FAIL: 5,
} as const;

/**
 * Get status based on spam score
 */
export function getSpamStatus(score: number): SpamCheckApiResponse["status"] {
  if (score < SPAM_SCORE_THRESHOLDS.PASS) {
    return "pass";
  } else if (score < SPAM_SCORE_THRESHOLDS.FAIL) {
    return "warning";
  }
  return "fail";
}

/**
 * Get human-readable summary based on score
 */
export function getSpamSummary(score: number): string {
  if (score < 0) {
    return "Excellent! Your email has a negative spam score, indicating very high deliverability.";
  } else if (score < SPAM_SCORE_THRESHOLDS.PASS) {
    return "Good! Your email passes spam filters and should have high deliverability.";
  } else if (score < SPAM_SCORE_THRESHOLDS.FAIL) {
    return "Warning: Your email has a moderate spam score. Consider addressing the triggered rules.";
  }
  return "High Risk: Your email is likely to be flagged as spam. Please review and fix the triggered rules.";
}
