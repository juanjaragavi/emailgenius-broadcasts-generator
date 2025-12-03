/**
 * Spam Check API Route
 * Exposes Postmark SpamCheck functionality to frontend and LLM agents
 *
 * POST /api/spam-check
 * Body: { content: string, subjectLine?: string, previewText?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { checkSpamScore, validateEmailVariants } from "@/lib/spam-check";
import { SpamCheckRequest, SpamCheckApiResponse } from "@/types/spam-check";

export const runtime = "nodejs";

/**
 * POST handler for spam checking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a batch request (multiple variants)
    if (Array.isArray(body.variants)) {
      // Batch validation for A/B testing
      const variants = body.variants as Array<{
        id: string;
        content: string;
        subjectLine: string;
        previewText?: string;
      }>;

      if (variants.length === 0) {
        return NextResponse.json(
          { error: "At least one variant is required" },
          { status: 400 }
        );
      }

      if (variants.length > 5) {
        return NextResponse.json(
          { error: "Maximum 5 variants allowed per request" },
          { status: 400 }
        );
      }

      const results = await validateEmailVariants(variants);

      return NextResponse.json({
        success: true,
        results,
        bestVariantId: results[0]?.id,
      });
    }

    // Single email check
    const { content, subjectLine, previewText } = body as SpamCheckRequest;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Email content is required" },
        { status: 400 }
      );
    }

    if (content.length < 10) {
      return NextResponse.json(
        { error: "Email content is too short for meaningful analysis" },
        { status: 400 }
      );
    }

    if (content.length > 500000) {
      return NextResponse.json(
        { error: "Email content exceeds maximum size (500KB)" },
        { status: 400 }
      );
    }

    console.log("[SpamCheck API] Analyzing email content...");
    console.log(`[SpamCheck API] Content length: ${content.length} characters`);
    if (subjectLine) {
      console.log(
        `[SpamCheck API] Subject: ${subjectLine.substring(0, 50)}...`
      );
    }

    const result: SpamCheckApiResponse = await checkSpamScore(
      content,
      subjectLine,
      previewText
    );

    console.log(
      `[SpamCheck API] Analysis complete. Score: ${result.score}, Status: ${result.status}`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[SpamCheck API] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        score: -1,
        status: "fail",
        summary: "Error analyzing spam score",
        rules: [],
        error: errorMessage,
      } as SpamCheckApiResponse,
      { status: 500 }
    );
  }
}

/**
 * GET handler for API documentation/health check
 */
export async function GET() {
  return NextResponse.json({
    service: "EmailGenius Spam Check API",
    version: "1.0.0",
    description: "Validates email content against SpamAssassin filters",
    endpoints: {
      POST: {
        description: "Analyze email content for spam triggers",
        body: {
          content: "string (required) - Email body HTML or text",
          subjectLine: "string (optional) - Email subject line",
          previewText: "string (optional) - Preview/preheader text",
        },
        response: {
          success: "boolean",
          score: "number - SpamAssassin score (lower is better)",
          status: "'pass' | 'warning' | 'fail'",
          summary: "string - Human-readable analysis",
          rules: "array - Triggered SpamAssassin rules",
        },
      },
      "POST (batch)": {
        description: "Analyze multiple email variants for A/B testing",
        body: {
          variants: [
            {
              id: "string - Unique identifier",
              content: "string - Email body",
              subjectLine: "string - Subject line",
              previewText: "string (optional)",
            },
          ],
        },
        response: {
          success: "boolean",
          results: "array - Sorted by score (best first)",
          bestVariantId: "string - ID of the best performing variant",
        },
      },
    },
    thresholds: {
      pass: "Score < 3.0",
      warning: "Score 3.0 - 4.9",
      fail: "Score >= 5.0",
    },
    poweredBy: "Postmark SpamCheck (SpamAssassin)",
  });
}
