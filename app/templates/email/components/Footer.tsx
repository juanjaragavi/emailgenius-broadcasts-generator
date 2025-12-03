/**
 * Email Footer Component
 * Displays footer content, social links, and unsubscribe options
 */

import * as React from "react";
import { Section, Text, Link, Hr, Row, Column } from "@react-email/components";
import type { Market, Platform } from "../types";

export interface FooterProps {
  /** Target market */
  market: Market;
  /** Target platform */
  platform: Platform;
  /** Sender/department name */
  senderName?: string;
  /** Custom footer content */
  customContent?: string;
  /** Show unsubscribe link */
  showUnsubscribe?: boolean;
  /** Show social links */
  showSocial?: boolean;
  /** Company address */
  address?: string;
  /** Support email */
  supportEmail?: string;
}

/**
 * Get market-specific unsubscribe URL
 */
function getUnsubscribeUrl(market: Market, platform: Platform): string {
  // Platform-specific unsubscribe tokens
  if (platform === "ConvertKit") {
    return "{{ unsubscribe_url }}";
  }
  return "%UNSUBSCRIBELINK%";
}

/**
 * Get market-specific copyright text
 */
function getCopyrightText(market: Market): string {
  const year = new Date().getFullYear();
  if (market === "Mexico") {
    return `© ${year} TopFinanzas. Todos los derechos reservados.`;
  }
  return `© ${year} TopFinanzas. All rights reserved.`;
}

/**
 * Get market-specific unsubscribe text
 */
function getUnsubscribeText(market: Market): string {
  if (market === "Mexico") {
    return "Cancelar suscripción";
  }
  return "Unsubscribe";
}

/**
 * Get market-specific privacy text
 */
function getPrivacyText(market: Market): string {
  if (market === "Mexico") {
    return "Política de Privacidad";
  }
  return "Privacy Policy";
}

/**
 * Get site URL by market
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
 * Standard email footer
 */
export const Footer: React.FC<FooterProps> = ({
  market,
  platform,
  senderName,
  customContent,
  showUnsubscribe = true,
  address,
  supportEmail,
}) => {
  const siteUrl = getSiteUrl(market);
  const unsubscribeUrl = getUnsubscribeUrl(market, platform);

  return (
    <Section
      style={{
        backgroundColor: "#f9fafb",
        padding: "24px",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      {/* Sender signature */}
      {senderName && (
        <Text
          style={{
            color: "#374151",
            fontSize: "14px",
            fontWeight: "600",
            margin: "0 0 16px 0",
            textAlign: "center",
          }}
        >
          {senderName}
        </Text>
      )}

      {/* Custom content */}
      {customContent && (
        <Text
          style={{
            color: "#6b7280",
            fontSize: "12px",
            lineHeight: "1.5",
            margin: "0 0 16px 0",
            textAlign: "center",
          }}
        >
          {customContent}
        </Text>
      )}

      <Hr style={{ borderColor: "#e5e7eb", margin: "16px 0" }} />

      {/* Links row */}
      <Row>
        <Column style={{ textAlign: "center" }}>
          <Link
            href={siteUrl}
            style={{
              color: "#6b7280",
              fontSize: "12px",
              textDecoration: "underline",
              marginRight: "16px",
            }}
          >
            {market === "Mexico" ? "Sitio Web" : "Website"}
          </Link>
          <Link
            href={`${siteUrl}/privacy`}
            style={{
              color: "#6b7280",
              fontSize: "12px",
              textDecoration: "underline",
              marginRight: "16px",
            }}
          >
            {getPrivacyText(market)}
          </Link>
          {showUnsubscribe && (
            <Link
              href={unsubscribeUrl}
              style={{
                color: "#6b7280",
                fontSize: "12px",
                textDecoration: "underline",
              }}
            >
              {getUnsubscribeText(market)}
            </Link>
          )}
        </Column>
      </Row>

      {/* Address */}
      {address && (
        <Text
          style={{
            color: "#9ca3af",
            fontSize: "11px",
            lineHeight: "1.4",
            margin: "16px 0 0 0",
            textAlign: "center",
          }}
        >
          {address}
        </Text>
      )}

      {/* Support email */}
      {supportEmail && (
        <Text
          style={{
            color: "#9ca3af",
            fontSize: "11px",
            margin: "8px 0 0 0",
            textAlign: "center",
          }}
        >
          {market === "Mexico" ? "Soporte: " : "Support: "}
          <Link
            href={`mailto:${supportEmail}`}
            style={{ color: "#6b7280", textDecoration: "underline" }}
          >
            {supportEmail}
          </Link>
        </Text>
      )}

      {/* Copyright */}
      <Text
        style={{
          color: "#9ca3af",
          fontSize: "11px",
          margin: "16px 0 0 0",
          textAlign: "center",
        }}
      >
        {getCopyrightText(market)}
      </Text>
    </Section>
  );
};

/**
 * Minimal footer for transactional emails
 */
export const MinimalFooter: React.FC<{
  market: Market;
  platform: Platform;
  senderName?: string;
}> = ({ market, platform, senderName }) => {
  const unsubscribeUrl = getUnsubscribeUrl(market, platform);

  return (
    <Section
      style={{
        padding: "24px",
        textAlign: "center",
      }}
    >
      {senderName && (
        <Text
          style={{
            color: "#374151",
            fontSize: "14px",
            fontWeight: "600",
            margin: "0 0 12px 0",
          }}
        >
          {senderName}
        </Text>
      )}
      <Text
        style={{
          color: "#9ca3af",
          fontSize: "11px",
          margin: "0",
        }}
      >
        {getCopyrightText(market)}
        {" | "}
        <Link
          href={unsubscribeUrl}
          style={{ color: "#6b7280", textDecoration: "underline" }}
        >
          {getUnsubscribeText(market)}
        </Link>
      </Text>
    </Section>
  );
};

/**
 * Corporate signature footer
 */
export const CorporateFooter: React.FC<{
  market: Market;
  platform: Platform;
  departmentName: string;
  division?: string;
  showSecurityBadge?: boolean;
}> = ({
  market,
  platform,
  departmentName,
  division,
  showSecurityBadge = false,
}) => {
  const unsubscribeUrl = getUnsubscribeUrl(market, platform);

  return (
    <Section
      style={{
        backgroundColor: "#1e3a5f",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <Text
        style={{
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: "bold",
          margin: "0 0 4px 0",
        }}
      >
        {departmentName}
      </Text>
      {division && (
        <Text
          style={{
            color: "#94a3b8",
            fontSize: "12px",
            margin: "0 0 16px 0",
          }}
        >
          {division}
        </Text>
      )}
      {showSecurityBadge && (
        <Text
          style={{
            color: "#22c55e",
            fontSize: "11px",
            margin: "0 0 16px 0",
          }}
        >
          🔒{" "}
          {market === "Mexico"
            ? "Comunicación segura y verificada"
            : "Secure & Verified Communication"}
        </Text>
      )}
      <Hr style={{ borderColor: "#334155", margin: "16px 0" }} />
      <Text
        style={{
          color: "#94a3b8",
          fontSize: "11px",
          margin: "0",
        }}
      >
        {getCopyrightText(market)}
        {" | "}
        <Link
          href={unsubscribeUrl}
          style={{ color: "#94a3b8", textDecoration: "underline" }}
        >
          {getUnsubscribeText(market)}
        </Link>
      </Text>
    </Section>
  );
};

export default Footer;
