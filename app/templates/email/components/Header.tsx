/**
 * Email Header Component
 * Displays logo and optional navigation for email templates
 */

import * as React from "react";
import { Section, Img, Text, Link, Row, Column } from "@react-email/components";
import type { Market } from "../types";

export interface HeaderProps {
  /** Logo image URL */
  logoUrl?: string;
  /** Logo alt text */
  logoAlt?: string;
  /** Logo width */
  logoWidth?: number;
  /** Target market */
  market: Market;
  /** Show navigation links */
  showNav?: boolean;
  /** Navigation links */
  navLinks?: Array<{
    text: string;
    url: string;
  }>;
  /** Background color */
  backgroundColor?: string;
}

/**
 * Default logo URL
 */
const DEFAULT_LOGO_URL =
  "https://storage.googleapis.com/media-topfinanzas-com/favicon.png";

/**
 * Get market-specific site URL
 */
function getSiteUrl(market: Market): string {
  switch (market) {
    case "USA":
      return "https://us.topfinanzas.com";
    case "UK":
      return "https://uk.topfinanzas.com";
    case "Mexico":
      return "https://topfinanzas.com/mx";
    default:
      return "https://topfinanzas.com";
  }
}

/**
 * Email header with logo and optional navigation
 */
export const Header: React.FC<HeaderProps> = ({
  logoUrl = DEFAULT_LOGO_URL,
  logoAlt = "TopFinanzas",
  logoWidth = 50,
  market,
  showNav = false,
  navLinks,
  backgroundColor = "#1e3a5f",
}) => {
  const siteUrl = getSiteUrl(market);

  return (
    <Section
      style={{
        backgroundColor,
        padding: "20px 24px",
      }}
    >
      <Row>
        <Column style={{ width: "50%" }}>
          <Link href={siteUrl} target="_blank">
            <Img
              src={logoUrl}
              alt={logoAlt}
              width={logoWidth}
              height={logoWidth}
              style={{
                display: "block",
              }}
            />
          </Link>
        </Column>
        {showNav && navLinks && navLinks.length > 0 && (
          <Column style={{ width: "50%", textAlign: "right" }}>
            {navLinks.map((link, index) => (
              <Link
                key={index}
                href={link.url}
                style={{
                  color: "#ffffff",
                  fontSize: "12px",
                  textDecoration: "none",
                  marginLeft: index > 0 ? "16px" : "0",
                }}
              >
                {link.text}
              </Link>
            ))}
          </Column>
        )}
      </Row>
    </Section>
  );
};

/**
 * Simple header variant with centered logo
 */
export const SimpleHeader: React.FC<{
  logoUrl?: string;
  logoAlt?: string;
  logoWidth?: number;
  market: Market;
  backgroundColor?: string;
}> = ({
  logoUrl = DEFAULT_LOGO_URL,
  logoAlt = "TopFinanzas",
  logoWidth = 60,
  market,
  backgroundColor = "#ffffff",
}) => {
  const siteUrl = getSiteUrl(market);

  return (
    <Section
      style={{
        backgroundColor,
        padding: "24px",
        textAlign: "center",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <Link href={siteUrl} target="_blank">
        <Img
          src={logoUrl}
          alt={logoAlt}
          width={logoWidth}
          height={logoWidth}
          style={{
            display: "inline-block",
          }}
        />
      </Link>
    </Section>
  );
};

/**
 * Alert-style header for transactional emails
 */
export const AlertHeader: React.FC<{
  type: "info" | "warning" | "success" | "urgent";
  title: string;
  icon?: string;
}> = ({ type, title, icon }) => {
  const colors = {
    info: { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" },
    warning: { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" },
    success: { bg: "#f0fdf4", border: "#22c55e", text: "#166534" },
    urgent: { bg: "#fef2f2", border: "#ef4444", text: "#991b1b" },
  };

  const style = colors[type];
  const defaultIcons = {
    info: "ℹ️",
    warning: "⚠️",
    success: "✅",
    urgent: "🚨",
  };

  return (
    <Section
      style={{
        backgroundColor: style.bg,
        borderLeft: `4px solid ${style.border}`,
        padding: "16px 24px",
      }}
    >
      <Text
        style={{
          color: style.text,
          fontSize: "18px",
          fontWeight: "bold",
          margin: 0,
        }}
      >
        {icon || defaultIcons[type]} {title}
      </Text>
    </Section>
  );
};

export default Header;
