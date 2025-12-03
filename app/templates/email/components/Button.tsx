/**
 * Email Button Component
 * Responsive, accessible CTA buttons for email templates
 */

import * as React from "react";
import { Button as ReactEmailButton, Section } from "@react-email/components";

export interface ButtonProps {
  /** Button text */
  children: React.ReactNode;
  /** Link URL */
  href: string;
  /** Button variant */
  variant?: "primary" | "secondary" | "outline" | "urgent" | "success";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Full width button */
  fullWidth?: boolean;
  /** Alignment */
  align?: "left" | "center" | "right";
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/**
 * Get variant-specific styles
 */
function getVariantStyles(
  variant: ButtonProps["variant"]
): React.CSSProperties {
  switch (variant) {
    case "secondary":
      return {
        backgroundColor: "#0891b2",
        color: "#ffffff",
      };
    case "outline":
      return {
        backgroundColor: "transparent",
        color: "#2563eb",
        border: "2px solid #2563eb",
      };
    case "urgent":
      return {
        backgroundColor: "#dc2626",
        color: "#ffffff",
      };
    case "success":
      return {
        backgroundColor: "#16a34a",
        color: "#ffffff",
      };
    case "primary":
    default:
      return {
        backgroundColor: "#2563eb",
        color: "#ffffff",
      };
  }
}

/**
 * Get size-specific styles
 */
function getSizeStyles(size: ButtonProps["size"]): React.CSSProperties {
  switch (size) {
    case "sm":
      return {
        padding: "8px 16px",
        fontSize: "13px",
      };
    case "lg":
      return {
        padding: "16px 32px",
        fontSize: "16px",
      };
    case "md":
    default:
      return {
        padding: "12px 24px",
        fontSize: "14px",
      };
  }
}

/**
 * Email-safe CTA button
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  align = "center",
  style = {},
}) => {
  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);

  const buttonStyles: React.CSSProperties = {
    ...variantStyles,
    ...sizeStyles,
    display: "inline-block",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center",
    borderRadius: "6px",
    boxSizing: "border-box",
    ...(fullWidth && { display: "block", width: "100%" }),
    ...style,
  };

  // Wrap in section for alignment
  return (
    <Section style={{ textAlign: align }}>
      <ReactEmailButton href={href} style={buttonStyles}>
        {children}
      </ReactEmailButton>
    </Section>
  );
};

/**
 * Button group for multiple CTAs
 */
export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  gap?: number;
}> = ({ children, align = "center", gap = 12 }) => {
  return (
    <Section
      style={{
        textAlign: align,
      }}
    >
      {React.Children.map(children, (child, index) => (
        <span
          style={{
            display: "inline-block",
            marginLeft: index > 0 ? `${gap}px` : "0",
          }}
        >
          {child}
        </span>
      ))}
    </Section>
  );
};

/**
 * Text link styled as inline CTA
 */
export const InlineLink: React.FC<{
  href: string;
  children: React.ReactNode;
  bold?: boolean;
  color?: string;
}> = ({ href, children, bold = true, color = "#2563eb" }) => {
  return (
    <a
      href={href}
      style={{
        color,
        fontWeight: bold ? "bold" : "normal",
        textDecoration: "underline",
      }}
    >
      {children}
    </a>
  );
};

export default Button;
