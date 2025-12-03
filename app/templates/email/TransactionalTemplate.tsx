/**
 * Transactional Email Template
 * For security alerts, shipping updates, account notifications
 */

import * as React from "react";
import { Section, Text, Link, Row, Column } from "@react-email/components";
import { BaseLayout } from "./components/BaseLayout";
import { Header, AlertHeader } from "./components/Header";
import { CorporateFooter } from "./components/Footer";
import { Button } from "./components/Button";
import { Spacer } from "./components/Divider";
import type { TransactionalTemplateProps, ActionItem } from "./types";
import { getPersonalizationTokens } from "./types";

/**
 * Action item row component
 */
const ActionItemRow: React.FC<{
  item: ActionItem;
}> = ({ item }) => {
  return (
    <Row
      style={{
        borderBottom: "1px solid #e5e7eb",
        padding: "12px 0",
      }}
    >
      <Column style={{ width: "10%", verticalAlign: "top" }}>
        <Text
          style={{
            fontSize: "16px",
            margin: "0",
          }}
        >
          {item.icon || "•"}
        </Text>
      </Column>
      <Column style={{ width: "90%" }}>
        <Text
          style={{
            color: item.isUrgent ? "#dc2626" : "#374151",
            fontSize: "14px",
            fontWeight: item.isUrgent ? "bold" : "normal",
            margin: "0",
          }}
        >
          {item.label}
          {item.value && (
            <span style={{ color: "#6b7280", fontWeight: "normal" }}>
              {" "}
              — {item.value}
            </span>
          )}
        </Text>
      </Column>
    </Row>
  );
};

/**
 * Steps list component
 */
const StepsList: React.FC<{
  steps: string[];
  market: string;
}> = ({ steps, market }) => {
  return (
    <Section
      style={{
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        padding: "16px 20px",
        margin: "16px 0",
      }}
    >
      <Text
        style={{
          color: "#1f2937",
          fontSize: "14px",
          fontWeight: "bold",
          margin: "0 0 12px 0",
        }}
      >
        {market === "Mexico" ? "Próximos pasos:" : "Next steps:"}
      </Text>
      {steps.map((step, index) => (
        <Text
          key={index}
          style={{
            color: "#4b5563",
            fontSize: "14px",
            lineHeight: "1.5",
            margin: index === 0 ? "0" : "8px 0 0 0",
            paddingLeft: "20px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "20px",
              marginLeft: "-20px",
              fontWeight: "bold",
              color: "#2563eb",
            }}
          >
            {index + 1}.
          </span>
          {step}
        </Text>
      ))}
    </Section>
  );
};

/**
 * Support contact box component
 */
const SupportBox: React.FC<{
  email?: string;
  phone?: string;
  hours?: string;
  market: string;
}> = ({ email, phone, hours, market }) => {
  const title = market === "Mexico" ? "¿Necesitas ayuda?" : "Need help?";

  return (
    <Section
      style={{
        backgroundColor: "#eff6ff",
        borderRadius: "8px",
        padding: "16px 20px",
        margin: "16px 0",
        textAlign: "center",
      }}
    >
      <Text
        style={{
          color: "#1e40af",
          fontSize: "14px",
          fontWeight: "bold",
          margin: "0 0 8px 0",
        }}
      >
        {title}
      </Text>
      {email && (
        <Text
          style={{
            color: "#3b82f6",
            fontSize: "13px",
            margin: "0 0 4px 0",
          }}
        >
          📧{" "}
          <Link href={`mailto:${email}`} style={{ color: "#3b82f6" }}>
            {email}
          </Link>
        </Text>
      )}
      {phone && (
        <Text
          style={{
            color: "#3b82f6",
            fontSize: "13px",
            margin: "0 0 4px 0",
          }}
        >
          📞 {phone}
        </Text>
      )}
      {hours && (
        <Text
          style={{
            color: "#6b7280",
            fontSize: "12px",
            margin: "4px 0 0 0",
          }}
        >
          {hours}
        </Text>
      )}
    </Section>
  );
};

/**
 * Transactional email template with alert styling and action items
 */
export const TransactionalTemplate: React.FC<TransactionalTemplateProps> = ({
  platform,
  market,
  previewText,
  alertType,
  headline,
  referenceNumber,
  eventTimestamp,
  bodyContent,
  actionItems,
  steps,
  ctaText,
  ctaUrl,
  importantNotice,
  supportContact,
  senderName,
  showSecurityBadge = true,
  customStyles,
}) => {
  const tokens = getPersonalizationTokens(platform);

  // Process body content with tokens
  const processedBody = bodyContent.replace(
    /%FIRSTNAME%|{{ subscriber\.first_name }}/g,
    tokens.firstName
  );

  // Get CTA button variant based on alert type
  const ctaVariant =
    alertType === "urgent"
      ? "urgent"
      : alertType === "success"
        ? "success"
        : "primary";

  // Get department name based on alert type
  const departmentName =
    senderName ||
    (alertType === "urgent"
      ? market === "Mexico"
        ? "Equipo de Seguridad"
        : "Security Team"
      : alertType === "success"
        ? market === "Mexico"
          ? "Equipo de Cumplimiento"
          : "Fulfillment Team"
        : market === "Mexico"
          ? "Servicio al Cliente"
          : "Customer Service");

  return (
    <BaseLayout
      previewText={previewText}
      market={market}
      customStyles={customStyles}
    >
      {/* Header */}
      <Header market={market} backgroundColor="#1e3a5f" />

      {/* Alert Header */}
      <AlertHeader type={alertType} title={headline} />

      {/* Reference & Timestamp */}
      {(referenceNumber || eventTimestamp) && (
        <Section
          style={{
            backgroundColor: "#f9fafb",
            padding: "12px 24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Row>
            {referenceNumber && (
              <Column>
                <Text
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    margin: "0",
                  }}
                >
                  {market === "Mexico" ? "Referencia: " : "Reference: "}
                  <span style={{ color: "#1f2937", fontWeight: "600" }}>
                    {referenceNumber}
                  </span>
                </Text>
              </Column>
            )}
            {eventTimestamp && (
              <Column style={{ textAlign: "right" }}>
                <Text
                  style={{
                    color: "#6b7280",
                    fontSize: "12px",
                    margin: "0",
                  }}
                >
                  {eventTimestamp}
                </Text>
              </Column>
            )}
          </Row>
        </Section>
      )}

      {/* Main Content */}
      <Section style={{ padding: "24px" }}>
        {/* Body Content - Using div instead of Text to allow HTML content */}
        <div
          style={{
            color: "#374151",
            fontSize: "15px",
            lineHeight: "1.6",
            margin: "0 0 16px 0",
          }}
          dangerouslySetInnerHTML={{ __html: processedBody }}
        />

        {/* Action Items */}
        {actionItems && actionItems.length > 0 && (
          <Section
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "4px 16px",
              margin: "16px 0",
            }}
          >
            {actionItems.map((item, index) => (
              <ActionItemRow key={index} item={item} />
            ))}
          </Section>
        )}

        {/* Steps */}
        {steps && steps.length > 0 && (
          <StepsList steps={steps} market={market} />
        )}

        <Spacer height={16} />

        {/* Primary CTA */}
        <Button href={ctaUrl} variant={ctaVariant} size="lg" align="center">
          {ctaText}
        </Button>

        {/* Important Notice */}
        {importantNotice && (
          <>
            <Spacer height={16} />
            <Section
              style={{
                backgroundColor: "#fef3c7",
                borderLeft: "4px solid #f59e0b",
                padding: "12px 16px",
                borderRadius: "0 8px 8px 0",
              }}
            >
              <Text
                style={{
                  color: "#92400e",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  margin: "0",
                }}
              >
                ⚠️ {importantNotice}
              </Text>
            </Section>
          </>
        )}

        {/* Support Contact */}
        {supportContact && (
          <SupportBox
            email={supportContact.email}
            phone={supportContact.phone}
            hours={supportContact.hours}
            market={market}
          />
        )}
      </Section>

      {/* Corporate Footer */}
      <CorporateFooter
        market={market}
        platform={platform}
        departmentName={departmentName}
        division={
          market === "Mexico"
            ? "División de Servicios Financieros"
            : "Financial Services Division"
        }
        showSecurityBadge={showSecurityBadge}
      />
    </BaseLayout>
  );
};

export default TransactionalTemplate;
