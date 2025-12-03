/**
 * Render Email API Route
 * Renders React Email templates to HTML with optional spam check
 *
 * POST /api/render-email
 * Body: { templateType, props, config?, runSpamCheck? }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  renderEmailTemplate,
  generatePreview,
  convertBroadcastToTemplateProps,
  validateTemplateProps,
} from "@/lib/email-renderer";
import { checkSpamScore } from "@/lib/spam-check";
import type {
  EmailTemplateProps,
  PreviewConfig,
  Platform,
  Market,
} from "@/app/templates/email/types";

export const runtime = "nodejs";

/**
 * Request body for rendering email templates
 */
interface RenderEmailRequest {
  // Option 1: Direct template props
  templateProps?: EmailTemplateProps;

  // Option 2: Convert from broadcast output
  broadcast?: {
    subjectLine1?: string;
    subjectLine2?: string;
    previewText?: string;
    emailBody: string;
    ctaButtonText: string;
    destinationUrl?: string;
    fromName?: string;
    imagePrompt?: string;
  };
  emailType?: string;
  platform?: Platform;
  market?: Market;

  // Preview configuration
  previewConfig?: PreviewConfig;

  // Whether to run spam check on rendered HTML
  runSpamCheck?: boolean;
}

/**
 * Response from the render email API
 */
interface RenderEmailResponse {
  success: boolean;
  html?: string;
  plainText?: string;
  preview?: {
    content: string;
    contentType: "html" | "text" | "source";
    viewport: "desktop" | "mobile";
  };
  templateType?: string;
  platform?: string;
  market?: string;
  renderedAt?: string;
  spamCheck?: {
    score: number;
    status: "pass" | "warning" | "fail";
    summary: string;
  };
  error?: string;
  validationErrors?: string[];
}

/**
 * POST handler for email rendering
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<RenderEmailResponse>> {
  try {
    const body: RenderEmailRequest = await request.json();

    let templateProps: EmailTemplateProps;

    // Determine how to build template props
    if (body.templateProps) {
      // Direct template props provided
      templateProps = body.templateProps;
    } else if (
      body.broadcast &&
      body.emailType &&
      body.platform &&
      body.market
    ) {
      // Convert from broadcast output
      templateProps = convertBroadcastToTemplateProps(
        body.broadcast,
        body.emailType,
        body.platform,
        body.market
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            "Either templateProps or (broadcast + emailType + platform + market) must be provided",
        },
        { status: 400 }
      );
    }

    // Validate template props
    const validation = validateTemplateProps(templateProps);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Template validation failed",
          validationErrors: validation.errors,
        },
        { status: 400 }
      );
    }

    console.log(
      `[RenderEmail API] Rendering ${templateProps.templateType} template for ${templateProps.platform}/${templateProps.market}`
    );

    // Render the template
    const renderOutput = await renderEmailTemplate(templateProps);

    // Generate preview if config provided
    let preview: RenderEmailResponse["preview"];
    if (body.previewConfig) {
      preview = await generatePreview(templateProps, body.previewConfig);
    }

    // Run spam check if requested
    let spamCheck: RenderEmailResponse["spamCheck"];
    if (body.runSpamCheck) {
      console.log("[RenderEmail API] Running spam check...");
      const spamResult = await checkSpamScore(
        renderOutput.html,
        templateProps.previewText
      );
      spamCheck = {
        score: spamResult.score,
        status: spamResult.status,
        summary: spamResult.summary,
      };
      console.log(
        `[RenderEmail API] Spam check complete. Score: ${spamResult.score}`
      );
    }

    console.log(
      `[RenderEmail API] Render complete. HTML size: ${renderOutput.html.length} bytes`
    );

    return NextResponse.json({
      success: true,
      html: renderOutput.html,
      plainText: renderOutput.plainText,
      preview,
      templateType: renderOutput.templateType,
      platform: renderOutput.platform,
      market: renderOutput.market,
      renderedAt: renderOutput.renderedAt,
      spamCheck,
    });
  } catch (error) {
    console.error("[RenderEmail API] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for API documentation
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    service: "EmailGenius Email Renderer API",
    version: "1.0.0",
    description: "Renders React Email templates to HTML with spam checking",
    endpoints: {
      POST: {
        description: "Render an email template to HTML",
        body: {
          templateProps: {
            description: "Direct template props (Option 1)",
            type: "EmailTemplateProps",
            required: false,
          },
          broadcast: {
            description: "Broadcast output to convert (Option 2)",
            type: "BroadcastOutput",
            required: false,
          },
          emailType: {
            description: "Email type for template selection (with broadcast)",
            type: "string",
            required: false,
          },
          platform: {
            description: "Target platform (ConvertKit | ActiveCampaign)",
            type: "string",
            required: false,
          },
          market: {
            description: "Target market (USA | UK | Mexico)",
            type: "string",
            required: false,
          },
          previewConfig: {
            description: "Preview configuration",
            type: "PreviewConfig",
            required: false,
          },
          runSpamCheck: {
            description: "Whether to run spam check on rendered HTML",
            type: "boolean",
            default: false,
          },
        },
        response: {
          success: "boolean",
          html: "string - Rendered HTML",
          plainText: "string - Plain text version",
          preview: "object - Preview-ready content",
          templateType: "string - Template type used",
          spamCheck: "object - Spam check results (if requested)",
        },
      },
    },
    templateTypes: ["promotional", "newsletter", "transactional"],
    emailTypeMapping: {
      promotional: ["product", "bank-employee", "personal", "brand"],
      transactional: [
        "security-alert",
        "shipping-update",
        "account-status",
        "urgent-communication",
        "status-update",
      ],
    },
    previewConfig: {
      viewport: "'desktop' | 'mobile'",
      viewMode: "'html' | 'text' | 'source'",
      showGrid: "boolean",
      darkMode: "boolean",
    },
  });
}
