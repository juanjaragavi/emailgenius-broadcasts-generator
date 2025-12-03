/**
 * Newsletter Email Template
 * For weekly updates, content digests, educational content
 */

import * as React from "react";
import { Section, Text, Img, Link, Row, Column } from "@react-email/components";
import { BaseLayout } from "./components/BaseLayout";
import { SimpleHeader } from "./components/Header";
import { Footer } from "./components/Footer";
import { Button } from "./components/Button";
import { Divider, Spacer, IconDivider } from "./components/Divider";
import type { NewsletterTemplateProps, NewsletterSection } from "./types";
import { getPersonalizationTokens } from "./types";

/**
 * Newsletter section component
 */
const ContentSection: React.FC<{
  section: NewsletterSection;
}> = ({ section }) => {
  return (
    <Section
      style={{
        padding: "0 24px",
        marginBottom: "24px",
      }}
    >
      {/* Section image */}
      {section.imageUrl && (
        <Img
          src={section.imageUrl}
          alt={section.imageAlt || section.title}
          width="552"
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "8px",
            marginBottom: "12px",
          }}
        />
      )}

      {/* Section title */}
      <Text
        style={{
          color: "#1f2937",
          fontSize: "18px",
          fontWeight: "bold",
          lineHeight: "1.3",
          margin: "0 0 8px 0",
        }}
      >
        {section.title}
      </Text>

      {/* Section content */}
      <Text
        style={{
          color: "#4b5563",
          fontSize: "14px",
          lineHeight: "1.6",
          margin: "0 0 12px 0",
        }}
      >
        {section.content}
      </Text>

      {/* Section link */}
      {section.linkUrl && section.linkText && (
        <Link
          href={section.linkUrl}
          style={{
            color: "#2563eb",
            fontSize: "14px",
            fontWeight: "600",
            textDecoration: "none",
          }}
        >
          {section.linkText} →
        </Link>
      )}
    </Section>
  );
};

/**
 * Featured article component
 */
const FeaturedArticle: React.FC<{
  title: string;
  excerpt: string;
  imageUrl?: string;
  linkUrl: string;
  market: string;
}> = ({ title, excerpt, imageUrl, linkUrl, market }) => {
  const readMoreText = market === "Mexico" ? "Leer más" : "Read more";

  return (
    <Section
      style={{
        backgroundColor: "#f0f9ff",
        borderRadius: "12px",
        padding: "20px",
        margin: "0 24px 24px 24px",
      }}
    >
      <Row>
        {imageUrl && (
          <Column style={{ width: "40%", paddingRight: "16px" }}>
            <Img
              src={imageUrl}
              alt={title}
              width="200"
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "8px",
              }}
            />
          </Column>
        )}
        <Column style={{ width: imageUrl ? "60%" : "100%" }}>
          <Text
            style={{
              color: "#0369a1",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              margin: "0 0 8px 0",
            }}
          >
            ⭐ {market === "Mexico" ? "DESTACADO" : "FEATURED"}
          </Text>
          <Text
            style={{
              color: "#1f2937",
              fontSize: "16px",
              fontWeight: "bold",
              lineHeight: "1.3",
              margin: "0 0 8px 0",
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: "#4b5563",
              fontSize: "13px",
              lineHeight: "1.5",
              margin: "0 0 12px 0",
            }}
          >
            {excerpt}
          </Text>
          <Link
            href={linkUrl}
            style={{
              color: "#2563eb",
              fontSize: "13px",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            {readMoreText} →
          </Link>
        </Column>
      </Row>
    </Section>
  );
};

/**
 * Newsletter email template with sections and featured content
 */
export const NewsletterTemplate: React.FC<NewsletterTemplateProps> = ({
  platform,
  market,
  previewText,
  title,
  edition,
  date,
  introduction,
  bodyContent,
  sections,
  featuredArticle,
  quickLinks,
  ctaText,
  ctaUrl,
  senderName,
  footerContent,
  showUnsubscribe = true,
  customStyles,
}) => {
  const tokens = getPersonalizationTokens(platform);

  // Process introduction with tokens
  const processedIntro = introduction?.replace(
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
      <SimpleHeader market={market} />

      {/* Newsletter Header */}
      <Section
        style={{
          padding: "24px",
          textAlign: "center",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {/* Edition & Date */}
        {(edition || date) && (
          <Text
            style={{
              color: "#6b7280",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              margin: "0 0 8px 0",
            }}
          >
            {edition && <span>{edition}</span>}
            {edition && date && <span> • </span>}
            {date && <span>{date}</span>}
          </Text>
        )}

        {/* Title */}
        <Text
          style={{
            color: "#1f2937",
            fontSize: "28px",
            fontWeight: "bold",
            lineHeight: "1.2",
            margin: "0",
          }}
        >
          {title}
        </Text>
      </Section>

      {/* Quick Links */}
      {quickLinks && quickLinks.length > 0 && (
        <Section
          style={{
            backgroundColor: "#f9fafb",
            padding: "12px 24px",
            textAlign: "center",
          }}
        >
          {quickLinks.map((link, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span style={{ color: "#d1d5db", margin: "0 12px" }}>|</span>
              )}
              <Link
                href={link.url}
                style={{
                  color: "#4b5563",
                  fontSize: "12px",
                  textDecoration: "none",
                }}
              >
                {link.text}
              </Link>
            </React.Fragment>
          ))}
        </Section>
      )}

      {/* Introduction */}
      {processedIntro && (
        <Section style={{ padding: "24px 24px 0 24px" }}>
          <Text
            style={{
              color: "#374151",
              fontSize: "15px",
              lineHeight: "1.6",
              margin: "0",
            }}
          >
            {processedIntro}
          </Text>
        </Section>
      )}

      {/* Featured Article */}
      {featuredArticle && (
        <>
          <Spacer height={24} />
          <FeaturedArticle
            title={featuredArticle.title}
            excerpt={featuredArticle.excerpt}
            imageUrl={featuredArticle.imageUrl}
            linkUrl={featuredArticle.linkUrl}
            market={market}
          />
        </>
      )}

      <IconDivider icon="•  •  •" margin={16} />

      {/* Content Sections */}
      {sections.map((section, index) => (
        <React.Fragment key={index}>
          <ContentSection section={section} />
          {index < sections.length - 1 && <Divider margin={16} />}
        </React.Fragment>
      ))}

      {/* Body Content (additional) */}
      {bodyContent && (
        <Section style={{ padding: "0 24px" }}>
          {/* Using div instead of Text to allow HTML content */}
          <div
            style={{
              color: "#374151",
              fontSize: "14px",
              lineHeight: "1.6",
              margin: "16px 0",
            }}
            dangerouslySetInnerHTML={{ __html: bodyContent }}
          />
        </Section>
      )}

      <Spacer height={16} />

      {/* CTA */}
      <Section style={{ padding: "0 24px 24px 24px" }}>
        <Button href={ctaUrl} variant="primary" size="md" align="center">
          {ctaText}
        </Button>
      </Section>

      {/* Footer */}
      <Footer
        market={market}
        platform={platform}
        senderName={senderName}
        customContent={footerContent}
        showUnsubscribe={showUnsubscribe}
        showSocial={true}
      />
    </BaseLayout>
  );
};

export default NewsletterTemplate;
