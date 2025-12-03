/**
 * Email Template Types
 * TypeScript interfaces for all React Email template props
 */

// ============================================================================
// Platform and Market Types
// ============================================================================

export type Platform = "ConvertKit" | "ActiveCampaign";
export type Market = "USA" | "UK" | "Mexico";

/**
 * Personalization token configuration per platform
 */
export interface PersonalizationTokens {
  firstName: string; // {{ subscriber.first_name }} or %FIRSTNAME%
  email?: string;
  customFields?: Record<string, string>;
}

/**
 * Get personalization tokens for a specific platform
 */
export function getPersonalizationTokens(
  platform: Platform
): PersonalizationTokens {
  switch (platform) {
    case "ConvertKit":
      return {
        firstName: "{{ subscriber.first_name }}",
        email: "{{ subscriber.email_address }}",
      };
    case "ActiveCampaign":
      return {
        firstName: "%FIRSTNAME%",
        email: "%EMAIL%",
      };
  }
}

// ============================================================================
// Base Template Props
// ============================================================================

/**
 * Common props shared across all email templates
 */
export interface BaseEmailProps {
  /** Target platform for personalization tokens */
  platform: Platform;
  /** Target market for language and cultural adaptation */
  market: Market;
  /** Preview text / preheader */
  previewText?: string;
  /** Main email body content (can include HTML or markdown) */
  bodyContent: string;
  /** Primary CTA button text */
  ctaText: string;
  /** Primary CTA button URL */
  ctaUrl: string;
  /** Optional secondary CTA */
  secondaryCta?: {
    text: string;
    url: string;
  };
  /** Sender department or team name for signature */
  senderName?: string;
  /** Footer content override */
  footerContent?: string;
  /** Whether to show unsubscribe link */
  showUnsubscribe?: boolean;
  /** Custom CSS styles to inject */
  customStyles?: string;
}

// ============================================================================
// Promotional Template Props
// ============================================================================

/**
 * Props for promotional/marketing email templates
 * Used for: product launches, special offers, credit card promotions
 */
export interface PromotionalTemplateProps extends BaseEmailProps {
  templateType: "promotional";
  /** Headline / main title */
  headline: string;
  /** Optional subheadline */
  subheadline?: string;
  /** Hero image URL */
  heroImageUrl?: string;
  /** Hero image alt text */
  heroImageAlt?: string;
  /** Product or offer highlights (bullet points) */
  highlights?: string[];
  /** Urgency text (e.g., "Limited time offer") */
  urgencyText?: string;
  /** Offer expiration date */
  expirationDate?: string;
  /** Badge text (e.g., "NEW", "EXCLUSIVE") */
  badge?: string;
  /** Social proof text */
  socialProof?: string;
}

// ============================================================================
// Newsletter Template Props
// ============================================================================

/**
 * Individual content section for newsletters
 */
export interface NewsletterSection {
  title: string;
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  linkText?: string;
  linkUrl?: string;
}

/**
 * Props for newsletter email templates
 * Used for: weekly updates, content digests, educational content
 */
export interface NewsletterTemplateProps extends BaseEmailProps {
  templateType: "newsletter";
  /** Newsletter title */
  title: string;
  /** Edition or issue number */
  edition?: string;
  /** Publication date */
  date?: string;
  /** Introduction paragraph */
  introduction?: string;
  /** Content sections */
  sections: NewsletterSection[];
  /** Featured article highlight */
  featuredArticle?: {
    title: string;
    excerpt: string;
    imageUrl?: string;
    linkUrl: string;
  };
  /** Quick links for navigation */
  quickLinks?: Array<{
    text: string;
    url: string;
  }>;
}

// ============================================================================
// Transactional Template Props
// ============================================================================

/**
 * Action item for transactional emails
 */
export interface ActionItem {
  icon?: string; // Emoji or icon code
  label: string;
  value?: string;
  isUrgent?: boolean;
}

/**
 * Props for transactional email templates
 * Used for: security alerts, shipping updates, account notifications
 */
export interface TransactionalTemplateProps extends BaseEmailProps {
  templateType: "transactional";
  /** Alert type for styling */
  alertType: "info" | "warning" | "success" | "urgent";
  /** Main notification headline */
  headline: string;
  /** Status or reference number */
  referenceNumber?: string;
  /** Timestamp of the event */
  eventTimestamp?: string;
  /** Action items or status details */
  actionItems?: ActionItem[];
  /** Steps to complete (numbered list) */
  steps?: string[];
  /** Important notice or disclaimer */
  importantNotice?: string;
  /** Support contact information */
  supportContact?: {
    email?: string;
    phone?: string;
    hours?: string;
  };
  /** Show security verification badge */
  showSecurityBadge?: boolean;
}

// ============================================================================
// Union Types and Type Guards
// ============================================================================

/**
 * Union type for all email template props
 */
export type EmailTemplateProps =
  | PromotionalTemplateProps
  | NewsletterTemplateProps
  | TransactionalTemplateProps;

/**
 * Template type identifier
 */
export type TemplateType = EmailTemplateProps["templateType"];

/**
 * Type guard for promotional templates
 */
export function isPromotionalTemplate(
  props: EmailTemplateProps
): props is PromotionalTemplateProps {
  return props.templateType === "promotional";
}

/**
 * Type guard for newsletter templates
 */
export function isNewsletterTemplate(
  props: EmailTemplateProps
): props is NewsletterTemplateProps {
  return props.templateType === "newsletter";
}

/**
 * Type guard for transactional templates
 */
export function isTransactionalTemplate(
  props: EmailTemplateProps
): props is TransactionalTemplateProps {
  return props.templateType === "transactional";
}

// ============================================================================
// Email Type to Template Mapping
// ============================================================================

/**
 * Maps UI email types to template types
 */
export const EMAIL_TYPE_TO_TEMPLATE: Record<string, TemplateType> = {
  // Transactional types
  "security-alert": "transactional",
  "shipping-update": "transactional",
  "account-status": "transactional",
  "urgent-communication": "transactional",
  "status-update": "transactional",
  // Promotional types
  product: "promotional",
  "bank-employee": "promotional",
  personal: "promotional",
  brand: "promotional",
};

/**
 * Get template type from email type
 */
export function getTemplateType(emailType: string): TemplateType {
  return EMAIL_TYPE_TO_TEMPLATE[emailType] || "promotional";
}

// ============================================================================
// Render Output Types
// ============================================================================

/**
 * Output from email rendering
 */
export interface EmailRenderOutput {
  /** Rendered HTML string */
  html: string;
  /** Plain text version */
  plainText: string;
  /** Template type used */
  templateType: TemplateType;
  /** Platform used */
  platform: Platform;
  /** Market used */
  market: Market;
  /** Render timestamp */
  renderedAt: string;
}

/**
 * Preview panel configuration
 */
export interface PreviewConfig {
  /** Viewport mode */
  viewport: "desktop" | "mobile";
  /** Content view mode */
  viewMode: "html" | "text" | "source";
  /** Show grid overlay */
  showGrid?: boolean;
  /** Dark mode preview */
  darkMode?: boolean;
}

/**
 * Default preview configuration
 */
export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  viewport: "desktop",
  viewMode: "html",
  showGrid: false,
  darkMode: false,
};
