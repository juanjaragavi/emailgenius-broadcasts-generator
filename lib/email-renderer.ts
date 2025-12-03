/**
 * Email Renderer Service
 * Provides functions for LLM agents to render React Email templates to HTML
 */

import { render } from "@react-email/render";
import React from "react";

import {
  PromotionalTemplate,
  NewsletterTemplate,
  TransactionalTemplate,
} from "@/app/templates/email";

import type {
  EmailTemplateProps,
  PromotionalTemplateProps,
  NewsletterTemplateProps,
  TransactionalTemplateProps,
  TemplateType,
  Platform,
  Market,
  EmailRenderOutput,
  PreviewConfig,
} from "@/app/templates/email/types";

import { getTemplateType } from "@/app/templates/email/types";

// ============================================================================
// Template Selection
// ============================================================================

/**
 * Select the appropriate template type based on email type
 * Used by LLM agents to determine which base template to use
 *
 * @param emailType - The email type from the form (e.g., "security-alert", "product")
 * @returns The template type to use
 */
export function selectTemplate(emailType: string): TemplateType {
  return getTemplateType(emailType);
}

/**
 * Get template component by type
 */
function getTemplateComponent(
  templateType: TemplateType
): React.ComponentType<EmailTemplateProps> {
  switch (templateType) {
    case "promotional":
      return PromotionalTemplate as React.ComponentType<EmailTemplateProps>;
    case "newsletter":
      return NewsletterTemplate as React.ComponentType<EmailTemplateProps>;
    case "transactional":
      return TransactionalTemplate as React.ComponentType<EmailTemplateProps>;
    default:
      return PromotionalTemplate as React.ComponentType<EmailTemplateProps>;
  }
}

// ============================================================================
// Email Rendering
// ============================================================================

/**
 * Render an email template to HTML and plain text
 * Primary function for LLM agents to generate email content
 *
 * @param props - Template props including content and configuration
 * @returns Rendered HTML, plain text, and metadata
 */
export async function renderEmailTemplate(
  props: EmailTemplateProps
): Promise<EmailRenderOutput> {
  const TemplateComponent = getTemplateComponent(props.templateType);

  // Create the React element
  const element = React.createElement(TemplateComponent, props);

  // Render to HTML
  const html = await render(element, {
    pretty: true,
  });

  // Render to plain text
  const plainText = await render(element, {
    plainText: true,
  });

  return {
    html,
    plainText,
    templateType: props.templateType,
    platform: props.platform,
    market: props.market,
    renderedAt: new Date().toISOString(),
  };
}

/**
 * Render promotional template specifically
 */
export async function renderPromotionalEmail(
  props: Omit<PromotionalTemplateProps, "templateType">
): Promise<EmailRenderOutput> {
  return renderEmailTemplate({
    ...props,
    templateType: "promotional",
  });
}

/**
 * Render newsletter template specifically
 */
export async function renderNewsletterEmail(
  props: Omit<NewsletterTemplateProps, "templateType">
): Promise<EmailRenderOutput> {
  return renderEmailTemplate({
    ...props,
    templateType: "newsletter",
  });
}

/**
 * Render transactional template specifically
 */
export async function renderTransactionalEmail(
  props: Omit<TransactionalTemplateProps, "templateType">
): Promise<EmailRenderOutput> {
  return renderEmailTemplate({
    ...props,
    templateType: "transactional",
  });
}

// ============================================================================
// Preview Generation
// ============================================================================

/**
 * Generate a preview of the email for the UI preview panel
 * Returns HTML optimized for iframe display
 *
 * @param props - Template props
 * @param config - Preview configuration
 * @returns Preview-ready HTML with optional viewport styling
 */
export async function generatePreview(
  props: EmailTemplateProps,
  config: PreviewConfig = {
    viewport: "desktop",
    viewMode: "html",
    showGrid: false,
    darkMode: false,
  }
): Promise<{
  content: string;
  contentType: "html" | "text" | "source";
  viewport: "desktop" | "mobile";
}> {
  const output = await renderEmailTemplate(props);

  // Return based on view mode
  if (config.viewMode === "text") {
    return {
      content: output.plainText,
      contentType: "text",
      viewport: config.viewport,
    };
  }

  if (config.viewMode === "source") {
    // Return formatted HTML source
    return {
      content: output.html,
      contentType: "source",
      viewport: config.viewport,
    };
  }

  // Apply viewport-specific wrapper for HTML preview
  const viewportWidth = config.viewport === "mobile" ? "375px" : "600px";

  const previewHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: ${config.darkMode ? "#1f2937" : "#f4f4f5"};
      display: flex;
      justify-content: center;
      padding: 20px;
    }
    .email-container {
      max-width: ${viewportWidth};
      width: 100%;
      background-color: #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    ${
      config.showGrid
        ? `
    .email-container {
      background-image: 
        linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    `
        : ""
    }
  </style>
</head>
<body>
  <div class="email-container">
    ${output.html}
  </div>
</body>
</html>
  `.trim();

  return {
    content: previewHtml,
    contentType: "html",
    viewport: config.viewport,
  };
}

// ============================================================================
// Conversion Utilities
// ============================================================================

/**
 * Convert generated broadcast content to template props
 * Bridges the gap between LLM output and React Email templates
 *
 * @param broadcast - The generated email broadcast from the LLM
 * @param emailType - The selected email type
 * @param platform - Target platform
 * @param market - Target market
 * @returns Template props ready for rendering
 */
export function convertBroadcastToTemplateProps(
  broadcast: {
    subjectLine1?: string;
    subjectLine2?: string;
    previewText?: string;
    emailBody: string;
    ctaButtonText: string;
    destinationUrl?: string;
    fromName?: string;
    imagePrompt?: string;
  },
  emailType: string,
  platform: Platform,
  market: Market
): EmailTemplateProps {
  const templateType = selectTemplate(emailType);

  // Base props common to all templates
  const baseProps = {
    platform,
    market,
    previewText: broadcast.previewText,
    bodyContent: broadcast.emailBody,
    ctaText: broadcast.ctaButtonText,
    ctaUrl: broadcast.destinationUrl || "#",
    senderName: broadcast.fromName,
  };

  switch (templateType) {
    case "transactional":
      return {
        ...baseProps,
        templateType: "transactional",
        alertType: getAlertType(emailType),
        headline: broadcast.subjectLine1 || "Important Update",
        showSecurityBadge: emailType === "security-alert",
      } as TransactionalTemplateProps;

    case "newsletter":
      return {
        ...baseProps,
        templateType: "newsletter",
        title: broadcast.subjectLine1 || "Newsletter",
        sections: [
          {
            title: "Main Content",
            content: broadcast.emailBody,
          },
        ],
      } as NewsletterTemplateProps;

    case "promotional":
    default:
      return {
        ...baseProps,
        templateType: "promotional",
        headline: broadcast.subjectLine1 || "Special Offer",
        subheadline: broadcast.subjectLine2,
      } as PromotionalTemplateProps;
  }
}

/**
 * Get alert type from email type for transactional templates
 */
function getAlertType(
  emailType: string
): "info" | "warning" | "success" | "urgent" {
  switch (emailType) {
    case "security-alert":
      return "urgent";
    case "urgent-communication":
      return "urgent";
    case "shipping-update":
      return "info";
    case "account-status":
      return "success";
    case "status-update":
      return "info";
    default:
      return "info";
  }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate template props before rendering
 */
export function validateTemplateProps(props: Partial<EmailTemplateProps>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!props.platform) {
    errors.push("Platform is required");
  }

  if (!props.market) {
    errors.push("Market is required");
  }

  if (!props.bodyContent) {
    errors.push("Body content is required");
  }

  if (!props.ctaText) {
    errors.push("CTA text is required");
  }

  if (!props.ctaUrl) {
    errors.push("CTA URL is required");
  }

  if (!props.templateType) {
    errors.push("Template type is required");
  }

  // Template-specific validation
  if (props.templateType === "promotional") {
    const promoProps = props as Partial<PromotionalTemplateProps>;
    if (!promoProps.headline) {
      errors.push("Headline is required for promotional templates");
    }
  }

  if (props.templateType === "newsletter") {
    const newsProps = props as Partial<NewsletterTemplateProps>;
    if (!newsProps.title) {
      errors.push("Title is required for newsletter templates");
    }
    if (!newsProps.sections || newsProps.sections.length === 0) {
      errors.push("At least one section is required for newsletter templates");
    }
  }

  if (props.templateType === "transactional") {
    const transProps = props as Partial<TransactionalTemplateProps>;
    if (!transProps.headline) {
      errors.push("Headline is required for transactional templates");
    }
    if (!transProps.alertType) {
      errors.push("Alert type is required for transactional templates");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Export for LLM Agent Usage
// ============================================================================

/**
 * Main entry point for LLM agents
 * Provides all necessary functions for email generation workflow
 */
export const EmailRenderer = {
  // Template selection
  selectTemplate,

  // Rendering
  renderEmailTemplate,
  renderPromotionalEmail,
  renderNewsletterEmail,
  renderTransactionalEmail,

  // Preview
  generatePreview,

  // Conversion
  convertBroadcastToTemplateProps,

  // Validation
  validateTemplateProps,
};

export default EmailRenderer;
