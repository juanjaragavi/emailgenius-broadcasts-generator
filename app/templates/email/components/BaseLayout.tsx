/**
 * Base Layout Component
 * Provides the foundational structure for all email templates
 * Uses React Email components for email-client compatibility
 */

import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Font,
  Tailwind,
} from "@react-email/components";
import type { Market } from "../types";

export interface BaseLayoutProps {
  /** Preview text shown in email clients */
  previewText?: string;
  /** Target market for language settings */
  market: Market;
  /** Custom CSS to inject */
  customStyles?: string;
  /** Children content */
  children: React.ReactNode;
}

/**
 * Get language code from market
 */
function getLanguageCode(market: Market): string {
  switch (market) {
    case "Mexico":
      return "es";
    case "UK":
    case "USA":
    default:
      return "en";
  }
}

/**
 * Base email layout with responsive design and email-safe styling
 */
export const BaseLayout: React.FC<BaseLayoutProps> = ({
  previewText,
  market,
  customStyles,
  children,
}) => {
  const lang = getLanguageCode(market);

  return (
    <Html lang={lang}>
      <Head>
        <Font
          fontFamily="Arial"
          fallbackFontFamily="Helvetica"
          fontWeight={400}
          fontStyle="normal"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        {customStyles && <style>{customStyles}</style>}
      </Head>
      {previewText && <Preview>{previewText}</Preview>}
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: {
                  primary: "#2563eb", // Blue-600
                  secondary: "#0891b2", // Cyan-600
                  accent: "#84cc16", // Lime-500
                  dark: "#1e3a5f", // Dark blue
                  light: "#f0f9ff", // Light blue
                },
                text: {
                  primary: "#1f2937", // Gray-800
                  secondary: "#4b5563", // Gray-600
                  muted: "#9ca3af", // Gray-400
                },
                status: {
                  success: "#22c55e", // Green-500
                  warning: "#f59e0b", // Amber-500
                  error: "#ef4444", // Red-500
                  info: "#3b82f6", // Blue-500
                },
              },
            },
          },
        }}
      >
        <Body
          style={{
            backgroundColor: "#f4f4f5",
            fontFamily: "Arial, Helvetica, sans-serif",
            margin: 0,
            padding: 0,
          }}
        >
          <Container
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              backgroundColor: "#ffffff",
            }}
          >
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BaseLayout;
