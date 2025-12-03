/**
 * Spam Check Library
 * Integration with Postmark SpamCheck API (powered by SpamAssassin)
 *
 * @see http://spamcheck.postmarkapp.com/
 */

import {
  SpamCheckResponse,
  SpamCheckApiResponse,
  SpamRule,
  getSpamStatus,
  getSpamSummary,
} from "@/types/spam-check";

const POSTMARK_SPAMCHECK_URL = "https://spamcheck.postmarkapp.com/filter";

/**
 * Header-related SpamAssassin rules that are false positives for content-only analysis.
 * These rules flag missing headers that will be added by the ESP (ConvertKit/ActiveCampaign).
 */
const HEADER_FALSE_POSITIVE_RULES = new Set([
  "MISSING_HEADERS",
  "MISSING_MID",
  "MISSING_FROM",
  "MISSING_TO",
  "MISSING_DATE",
  "MISSING_SUBJECT",
  "CTE_8BIT_MISMATCH",
  "DOS_BODY_HIGH_NO_MID",
  "__HAS_NO_MSGID",
  "MISSING_MIMEOLE",
]);

/**
 * Build a raw email format from components for SpamAssassin analysis.
 * Includes mock RFC-compliant headers to prevent false positives.
 */
function buildRawEmail(
  body: string,
  subjectLine?: string,
  previewText?: string,
  fromEmail?: string
): string {
  const headers: string[] = [];
  const now = new Date();

  // Generate a mock Message-ID
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@emailgenius.topfinanzas.com>`;

  // Required headers to prevent MISSING_* rules
  headers.push(`From: ${fromEmail || "broadcast@topfinanzas.com"}`);
  headers.push("To: recipient@example.com");
  headers.push(`Date: ${now.toUTCString()}`);
  headers.push(`Message-ID: ${messageId}`);

  // Add subject header if provided
  if (subjectLine) {
    headers.push(`Subject: ${subjectLine}`);
  } else {
    headers.push("Subject: Email Broadcast");
  }

  // Add content type header for HTML detection
  const isHtml = body.includes("<") && body.includes(">");
  if (isHtml) {
    headers.push("Content-Type: text/html; charset=utf-8");
    headers.push("Content-Transfer-Encoding: quoted-printable");
  } else {
    headers.push("Content-Type: text/plain; charset=utf-8");
    headers.push("Content-Transfer-Encoding: 7bit");
  }

  // Add MIME version
  headers.push("MIME-Version: 1.0");

  // Build the email with optional preheader
  let emailBody = body;
  if (previewText && isHtml) {
    // Insert preheader as hidden span at beginning of HTML body
    emailBody = `<span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</span>${body}`;
  }

  return `${headers.join("\r\n")}\r\n\r\n${emailBody}`;
}

/**
 * Parse SpamAssassin rules from the report text
 */
function parseRulesFromReport(report: string): SpamRule[] {
  const rules: SpamRule[] = [];
  const lines = report.split("\n");

  // SpamAssassin report format:
  // pts rule name              description
  //  0.5 HTML_MESSAGE           BODY: HTML included in message
  const ruleRegex = /^\s*(-?\d+\.?\d*)\s+(\S+)\s+(.*)$/;

  for (const line of lines) {
    const match = line.match(ruleRegex);
    if (match) {
      const [, score, rule, description] = match;
      // Skip header lines and separator lines
      if (rule && !rule.includes("---") && rule !== "pts") {
        rules.push({
          score: score.trim(),
          rule: rule.trim(),
          description: description.trim(),
        });
      }
    }
  }

  return rules;
}

/**
 * Check email content for spam triggers using Postmark SpamCheck API
 *
 * @param content - Email body content (HTML or plain text)
 * @param subjectLine - Optional subject line to include in analysis
 * @param previewText - Optional preview/preheader text
 * @returns Processed spam check results
 */
export async function checkSpamScore(
  content: string,
  subjectLine?: string,
  previewText?: string
): Promise<SpamCheckApiResponse> {
  try {
    // Build the raw email format
    const rawEmail = buildRawEmail(content, subjectLine, previewText);

    // Call Postmark SpamCheck API
    const response = await fetch(POSTMARK_SPAMCHECK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: rawEmail,
        options: "long", // Get detailed report
      }),
    });

    if (!response.ok) {
      throw new Error(
        `SpamCheck API returned status ${response.status}: ${response.statusText}`
      );
    }

    const data: SpamCheckResponse = await response.json();

    // Parse the score (it comes as a string)
    let numericScore = parseFloat(data.score) || 0;

    // Parse rules from the report
    let rules = parseRulesFromReport(data.report || "");

    // Filter out header-related false positives and adjust score
    const filteredRules: SpamRule[] = [];
    let headerPenalty = 0;

    for (const rule of rules) {
      if (HEADER_FALSE_POSITIVE_RULES.has(rule.rule)) {
        // Track the penalty from header rules so we can subtract it
        headerPenalty += parseFloat(rule.score) || 0;
      } else {
        filteredRules.push(rule);
      }
    }

    // Adjust score by removing header-related penalties
    numericScore = numericScore - headerPenalty;
    rules = filteredRules;

    return {
      success: data.success !== false,
      score: numericScore,
      status: getSpamStatus(numericScore),
      summary: getSpamSummary(numericScore),
      rules,
      rawReport: data.report,
    };
  } catch (error) {
    console.error("[SpamCheck] Error checking spam score:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      score: -1,
      status: "fail",
      summary: "Failed to analyze spam score. Please try again.",
      rules: [],
      error: errorMessage,
    };
  }
}

/**
 * Quick spam check - returns just pass/fail without detailed rules
 */
export async function quickSpamCheck(
  content: string,
  subjectLine?: string
): Promise<{ pass: boolean; score: number; message: string }> {
  const result = await checkSpamScore(content, subjectLine);

  return {
    pass: result.status === "pass",
    score: result.score,
    message: result.summary,
  };
}

/**
 * Validate multiple email variants and return the best one
 * Useful for A/B testing subject lines
 */
export async function validateEmailVariants(
  variants: Array<{
    id: string;
    content: string;
    subjectLine: string;
    previewText?: string;
  }>
): Promise<
  Array<{
    id: string;
    result: SpamCheckApiResponse;
  }>
> {
  const results = await Promise.all(
    variants.map(async (variant) => ({
      id: variant.id,
      result: await checkSpamScore(
        variant.content,
        variant.subjectLine,
        variant.previewText
      ),
    }))
  );

  // Sort by score (lowest/best first)
  return results.sort((a, b) => a.result.score - b.result.score);
}
