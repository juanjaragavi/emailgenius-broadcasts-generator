/**
 * Gmail Clipping Check API Route
 * Analyzes email HTML content for Gmail clipping risk
 *
 * Gmail enforces a strict clipping threshold of approximately 102KB (104,448 bytes).
 * When HTML content exceeds this limit, the message is truncated, potentially hiding
 * the unsubscribe link and preventing tracking pixels from firing.
 *
 * POST /api/gmail-clip-check
 * Body: { htmlContent: string, subjectLine?: string, preheader?: string, includeMimeOverhead?: boolean }
 *
 * POST /api/gmail-clip-check (batch)
 * Body: { variants: [{ id: string, htmlContent: string, subjectLine?: string }] }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  analyzeEmailSize,
  sanitizeEmailHtml,
  validateEmailForDeployment,
  quickClipCheck,
} from "@/lib/email-size-analyzer";
import {
  EmailSizeCheckRequest,
  EmailSizeBatchRequest,
  EmailSizeAnalysis,
  GMAIL_SIZE_LIMITS,
} from "@/types/email-size";

export const runtime = "nodejs";

/**
 * POST handler for Gmail clipping check
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a batch request (multiple variants)
    if (Array.isArray(body.variants)) {
      return handleBatchRequest(body as EmailSizeBatchRequest);
    }

    // Single email check
    return handleSingleRequest(body as EmailSizeCheckRequest);
  } catch (error) {
    console.error("[Gmail Clip Check API] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze email content",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle single email analysis request
 */
async function handleSingleRequest(body: EmailSizeCheckRequest) {
  const {
    htmlContent,
    subjectLine,
    preheader,
    includeMimeOverhead = true,
  } = body;

  // Validate request
  if (!htmlContent || typeof htmlContent !== "string") {
    return NextResponse.json(
      { success: false, error: "HTML content is required" },
      { status: 400 }
    );
  }

  if (htmlContent.length < 10) {
    return NextResponse.json(
      {
        success: false,
        error: "HTML content is too short for meaningful analysis",
      },
      { status: 400 }
    );
  }

  // Perform analysis
  console.log("[Gmail Clip Check API] Analyzing email content...");
  console.log(
    `[Gmail Clip Check API] Content length: ${htmlContent.length} characters`
  );

  const analysis = analyzeEmailSize(htmlContent, {
    subjectLine,
    preheader,
    includeMimeOverhead,
  });

  console.log(
    `[Gmail Clip Check API] Analysis complete. Size: ${analysis.sizeKB}KB, Status: ${analysis.status}`
  );

  // Add quick validation result
  const validation = validateEmailForDeployment(htmlContent, {
    subjectLine,
    preheader,
    strictMode: false,
  });

  return NextResponse.json({
    ...analysis,
    validation: {
      deploymentReady: validation.valid,
      recommendations: validation.recommendations,
    },
    limits: {
      hardLimit: GMAIL_SIZE_LIMITS.HARD_LIMIT,
      targetLimit: GMAIL_SIZE_LIMITS.TARGET_LIMIT,
      warningLimit: GMAIL_SIZE_LIMITS.WARNING_LIMIT,
      optimalLimit: GMAIL_SIZE_LIMITS.OPTIMAL_LIMIT,
    },
  });
}

/**
 * Handle batch request for multiple email variants
 */
async function handleBatchRequest(body: EmailSizeBatchRequest) {
  const { variants } = body;

  if (!variants || variants.length === 0) {
    return NextResponse.json(
      { success: false, error: "At least one variant is required" },
      { status: 400 }
    );
  }

  if (variants.length > 10) {
    return NextResponse.json(
      { success: false, error: "Maximum 10 variants allowed per request" },
      { status: 400 }
    );
  }

  console.log(
    `[Gmail Clip Check API] Analyzing ${variants.length} variants...`
  );

  const results: Array<{
    id: string;
    analysis: EmailSizeAnalysis;
    quickCheck: ReturnType<typeof quickClipCheck>;
  }> = [];

  for (const variant of variants) {
    const analysis = analyzeEmailSize(variant.htmlContent, {
      subjectLine: variant.subjectLine,
      includeMimeOverhead: true,
    });

    const quickCheck = quickClipCheck(variant.htmlContent);

    results.push({
      id: variant.id,
      analysis,
      quickCheck,
    });
  }

  // Sort by size (smallest first = safest)
  results.sort((a, b) => a.analysis.totalBytes - b.analysis.totalBytes);

  // Find the best variant (smallest that passes validation)
  const bestVariant = results.find(
    (r) => r.analysis.totalBytes < GMAIL_SIZE_LIMITS.TARGET_LIMIT
  );

  return NextResponse.json({
    success: true,
    results,
    bestVariantId: bestVariant?.id || results[0]?.id,
    summary: {
      totalVariants: variants.length,
      passingVariants: results.filter(
        (r) => r.analysis.totalBytes < GMAIL_SIZE_LIMITS.TARGET_LIMIT
      ).length,
      smallestSize: results[0]?.analysis.sizeKB,
      largestSize: results[results.length - 1]?.analysis.sizeKB,
    },
  });
}

/**
 * GET handler for quick status check
 * Returns current Gmail clipping limits and quick documentation
 */
export async function GET() {
  return NextResponse.json({
    service: "Gmail Clipping Prevention Check",
    version: "1.0.0",
    limits: {
      hardLimit: {
        bytes: GMAIL_SIZE_LIMITS.HARD_LIMIT,
        kb: (GMAIL_SIZE_LIMITS.HARD_LIMIT / 1024).toFixed(1),
        description: "Gmail's absolute clipping threshold",
      },
      targetLimit: {
        bytes: GMAIL_SIZE_LIMITS.TARGET_LIMIT,
        kb: (GMAIL_SIZE_LIMITS.TARGET_LIMIT / 1024).toFixed(1),
        description: "Recommended maximum for safety margin",
      },
      warningLimit: {
        bytes: GMAIL_SIZE_LIMITS.WARNING_LIMIT,
        kb: (GMAIL_SIZE_LIMITS.WARNING_LIMIT / 1024).toFixed(1),
        description: "Warning threshold - optimize content",
      },
      optimalLimit: {
        bytes: GMAIL_SIZE_LIMITS.OPTIMAL_LIMIT,
        kb: (GMAIL_SIZE_LIMITS.OPTIMAL_LIMIT / 1024).toFixed(1),
        description: "Optimal size for best deliverability",
      },
    },
    preventionTips: [
      "Use 'Paste as Plain Text' (Ctrl+Shift+V / Cmd+Shift+V) to strip formatting",
      "Consolidate multiple text blocks into single containers",
      "Minimize nested columns and varying background colors",
      "Use the 'Remove Formatting' tool to strip extraneous tags",
      "Keep word count under 800 words for newsletters",
      "Test with Gmail by sending and checking 'Show Original'",
    ],
    endpoints: {
      POST: {
        single:
          "{ htmlContent: string, subjectLine?: string, preheader?: string }",
        batch: "{ variants: [{ id: string, htmlContent: string }] }",
      },
      GET: "Returns this documentation",
    },
  });
}

/**
 * POST handler for sanitizing email content
 * Strips problematic metadata and returns cleaned HTML
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { htmlContent } = body;

    if (!htmlContent || typeof htmlContent !== "string") {
      return NextResponse.json(
        { success: false, error: "HTML content is required" },
        { status: 400 }
      );
    }

    console.log("[Gmail Clip Check API] Sanitizing email content...");

    // Analyze before sanitization
    const beforeAnalysis = analyzeEmailSize(htmlContent);

    // Sanitize the content
    const { sanitized, bytesRemoved } = sanitizeEmailHtml(htmlContent);

    // Analyze after sanitization
    const afterAnalysis = analyzeEmailSize(sanitized);

    console.log(
      `[Gmail Clip Check API] Sanitization complete. Removed ${bytesRemoved} bytes (${((bytesRemoved / beforeAnalysis.totalBytes) * 100).toFixed(1)}%)`
    );

    return NextResponse.json({
      success: true,
      sanitizedContent: sanitized,
      bytesRemoved,
      percentReduction: parseFloat(
        ((bytesRemoved / beforeAnalysis.totalBytes) * 100).toFixed(2)
      ),
      before: {
        sizeKB: beforeAnalysis.sizeKB,
        status: beforeAnalysis.status,
      },
      after: {
        sizeKB: afterAnalysis.sizeKB,
        status: afterAnalysis.status,
      },
    });
  } catch (error) {
    console.error("[Gmail Clip Check API] Sanitization error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to sanitize email content",
      },
      { status: 500 }
    );
  }
}
