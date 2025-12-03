/**
 * Promotional Email Template
 * For product launches, special offers, credit card promotions
 */

import * as React from "react";
import { Section, Text, Img } from "@react-email/components";
import { BaseLayout } from "./components/BaseLayout";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Button } from "./components/Button";
import { Divider, Spacer } from "./components/Divider";
import type { PromotionalTemplateProps } from "./types";
import { getPersonalizationTokens } from "./types";

/**
 * Promotional email template with hero image and highlights
 */
export const PromotionalTemplate: React.FC<PromotionalTemplateProps> = ({
  platform,
  market,
  previewText,
  headline,
  subheadline,
  bodyContent,
  heroImageUrl,
  heroImageAlt,
  highlights,
  urgencyText,
  badge,
  ctaText,
  ctaUrl,
  secondaryCta,
  senderName,
  footerContent,
  showUnsubscribe = true,
  customStyles,
}) => {
  const tokens = getPersonalizationTokens(platform);

  // Replace placeholder tokens in body content
  const processedBody = bodyContent.replace(
    /%FIRSTNAME%|{{ subscriber\.first_name }}/g,
    tokens.firstName
  );

  return (
    <BaseLayout
      previewText={previewText}
      market={market}
      customStyles={customStyles}
    >
      {/* Header */}
      <Header market={market} backgroundColor="#1e3a5f" />

      {/* Hero Image */}
      {heroImageUrl && (
        <Section style={{ padding: 0 }}>
          <Img
            src={heroImageUrl}
            alt={heroImageAlt || headline}
            width="600"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />
        </Section>
      )}

      {/* Badge */}
      {badge && (
        <Section style={{ padding: "16px 24px 0 24px", textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              backgroundColor: "#fef3c7",
              color: "#92400e",
              fontSize: "12px",
              fontWeight: "bold",
              padding: "4px 12px",
              borderRadius: "999px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {badge}
          </span>
        </Section>
      )}

      {/* Main Content */}
      <Section style={{ padding: "24px" }}>
        {/* Headline */}
        <Text
          style={{
            color: "#1f2937",
            fontSize: "28px",
            fontWeight: "bold",
            lineHeight: "1.2",
            margin: "0 0 8px 0",
            textAlign: "center",
          }}
        >
          {headline}
        </Text>

        {/* Subheadline */}
        {subheadline && (
          <Text
            style={{
              color: "#6b7280",
              fontSize: "16px",
              lineHeight: "1.4",
              margin: "0 0 24px 0",
              textAlign: "center",
            }}
          >
            {subheadline}
          </Text>
        )}

        {/* Urgency text */}
        {urgencyText && (
          <Text
            style={{
              color: "#dc2626",
              fontSize: "14px",
              fontWeight: "bold",
              margin: "0 0 16px 0",
              textAlign: "center",
            }}
          >
            ⏰ {urgencyText}
          </Text>
        )}

        <Divider variant="gradient" margin={16} />

        {/* Body Content - Using div instead of Text to allow HTML content */}
        <div
          style={{
            color: "#374151",
            fontSize: "15px",
            lineHeight: "1.6",
            margin: "16px 0",
          }}
          dangerouslySetInnerHTML={{ __html: processedBody }}
        />

        {/* Highlights */}
        {highlights && highlights.length > 0 && (
          <Section
            style={{
              backgroundColor: "#f0f9ff",
              borderRadius: "8px",
              padding: "16px 20px",
              margin: "16px 0",
            }}
          >
            {highlights.map((highlight, index) => (
              <Text
                key={index}
                style={{
                  color: "#1e40af",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  margin: index === 0 ? "0" : "8px 0 0 0",
                }}
              >
                ✅ {highlight}
              </Text>
            ))}
          </Section>
        )}

        <Spacer height={16} />

        {/* Primary CTA */}
        <Button href={ctaUrl} variant="primary" size="lg" align="center">
          {ctaText}
        </Button>

        {/* Secondary CTA */}
        {secondaryCta && (
          <>
            <Spacer height={12} />
            <Button
              href={secondaryCta.url}
              variant="outline"
              size="md"
              align="center"
            >
              {secondaryCta.text}
            </Button>
          </>
        )}
      </Section>

      {/* Footer */}
      <Footer
        market={market}
        platform={platform}
        senderName={senderName}
        customContent={footerContent}
        showUnsubscribe={showUnsubscribe}
      />
    </BaseLayout>
  );
};

export default PromotionalTemplate;
