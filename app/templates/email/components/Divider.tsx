/**
 * Email Divider Component
 * Various divider styles for email templates
 */

import * as React from "react";
import { Hr, Section } from "@react-email/components";

export interface DividerProps {
  /** Divider style variant */
  variant?: "solid" | "dashed" | "dotted" | "gradient" | "spacer";
  /** Divider color */
  color?: string;
  /** Margin top and bottom */
  margin?: number;
  /** Divider thickness */
  thickness?: number;
  /** Width percentage */
  width?: number;
}

/**
 * Standard horizontal divider
 */
export const Divider: React.FC<DividerProps> = ({
  variant = "solid",
  color = "#e5e7eb",
  margin = 24,
  thickness = 1,
  width = 100,
}) => {
  // Spacer variant - just empty space
  if (variant === "spacer") {
    return (
      <Section
        style={{
          height: `${margin}px`,
        }}
      />
    );
  }

  // Gradient variant
  if (variant === "gradient") {
    return (
      <Section
        style={{
          margin: `${margin}px auto`,
          width: `${width}%`,
        }}
      >
        <div
          style={{
            height: `${thickness}px`,
            background: "linear-gradient(to right, #2563eb, #0891b2, #84cc16)",
            borderRadius: "999px",
          }}
        />
      </Section>
    );
  }

  // Standard divider with border style
  const borderStyle =
    variant === "dashed" ? "dashed" : variant === "dotted" ? "dotted" : "solid";

  return (
    <Hr
      style={{
        borderTop: `${thickness}px ${borderStyle} ${color}`,
        borderBottom: "none",
        borderLeft: "none",
        borderRight: "none",
        margin: `${margin}px auto`,
        width: `${width}%`,
      }}
    />
  );
};

/**
 * Decorative divider with icon/emoji
 */
export const IconDivider: React.FC<{
  icon?: string;
  color?: string;
  margin?: number;
}> = ({ icon = "•••", color = "#9ca3af", margin = 24 }) => {
  return (
    <Section
      style={{
        textAlign: "center",
        margin: `${margin}px 0`,
      }}
    >
      <span
        style={{
          color,
          fontSize: "14px",
          letterSpacing: "8px",
        }}
      >
        {icon}
      </span>
    </Section>
  );
};

/**
 * Spacer component for vertical spacing
 */
export const Spacer: React.FC<{ height?: number }> = ({ height = 24 }) => {
  return (
    <Section
      style={{
        height: `${height}px`,
        lineHeight: `${height}px`,
        fontSize: "1px",
      }}
    >
      &nbsp;
    </Section>
  );
};

export default Divider;
