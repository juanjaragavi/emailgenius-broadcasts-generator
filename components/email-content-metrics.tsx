"use client";

/**
 * Email Content Metrics Component
 * Displays real-time metrics similar to ActiveCampaign's Email Content Metrics
 * Analyzes HTML size, text/HTML ratio, word count, and reading time
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

export interface EmailContentMetricsProps {
  /** Full HTML content to analyze */
  htmlContent: string;
  /** Optional className for styling */
  className?: string;
}

interface MetricStatus {
  value: string;
  status: "success" | "warning" | "error" | "info";
  label: string;
  tooltip?: string;
}

/**
 * Strip HTML tags and extract plain text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate byte size of string (UTF-8)
 */
function getByteSize(str: string): number {
  return new TextEncoder().encode(str).length;
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  const cleaned = text.replace(/[^\w\s]/g, " ").trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Calculate reading time based on average reading speed
 */
function calculateReadingTime(wordCount: number): string {
  // Average reading speed: 200-250 words per minute
  // Use 225 as middle ground
  const minutes = Math.floor(wordCount / 225);
  const seconds = Math.round(((wordCount % 225) / 225) * 60);

  if (minutes === 0) {
    return `0m ${seconds}s`;
  } else if (seconds === 0) {
    return `${minutes}m`;
  } else {
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Format bytes to KB with precision
 */
function formatKB(bytes: number): string {
  const kb = bytes / 1024;
  return kb.toFixed(2) + " KB";
}

/**
 * Analyze HTML content and return metrics
 */
function analyzeContent(htmlContent: string): {
  htmlSize: MetricStatus;
  textHtmlRatio: MetricStatus;
  wordCount: MetricStatus;
  readingTime: MetricStatus;
} {
  if (!htmlContent || htmlContent.trim() === "") {
    return {
      htmlSize: { value: "0 KB", status: "info", label: "HTML Size" },
      textHtmlRatio: { value: "0%", status: "info", label: "Text/HTML Ratio" },
      wordCount: { value: "0 words", status: "info", label: "Word Count" },
      readingTime: { value: "0m 0s", status: "info", label: "Reading Time" },
    };
  }

  // Calculate HTML size
  const htmlBytes = getByteSize(htmlContent);
  const htmlSizeKB = htmlBytes / 1024;

  let htmlSizeStatus: "success" | "warning" | "error" = "success";
  if (htmlSizeKB > 30) {
    htmlSizeStatus = "error";
  } else if (htmlSizeKB > 15) {
    htmlSizeStatus = "warning";
  }

  // Extract plain text
  const plainText = stripHtml(htmlContent);
  const textBytes = getByteSize(plainText);

  // Calculate text/HTML ratio
  const ratio = htmlBytes > 0 ? (textBytes / htmlBytes) * 100 : 0;

  let ratioStatus: "success" | "warning" | "error" = "success";
  if (ratio < 10) {
    ratioStatus = "error";
  } else if (ratio < 20) {
    ratioStatus = "warning";
  }

  // Count words
  const wordCount = countWords(plainText);

  let wordCountStatus: "success" | "warning" | "info" = "success";
  if (wordCount < 50) {
    wordCountStatus = "warning";
  } else if (wordCount > 500) {
    wordCountStatus = "warning";
  }

  // Calculate reading time
  const readingTime = calculateReadingTime(wordCount);

  return {
    htmlSize: {
      value: formatKB(htmlBytes),
      status: htmlSizeStatus,
      label: "HTML Size",
      tooltip:
        htmlSizeStatus === "error"
          ? "Email size exceeds 30KB. Consider reducing HTML complexity."
          : htmlSizeStatus === "warning"
            ? "Email size between 15-30KB. Monitor for email client clipping."
            : "Email size is optimal for delivery.",
    },
    textHtmlRatio: {
      value: ratio.toFixed(2) + "%",
      status: ratioStatus,
      label: "Text/HTML Ratio",
      tooltip:
        ratioStatus === "error"
          ? "Text/HTML ratio below 10%. Too much HTML markup compared to content."
          : ratioStatus === "warning"
            ? "Text/HTML ratio between 10-20%. Consider reducing HTML markup."
            : "Text/HTML ratio is healthy.",
    },
    wordCount: {
      value: `${wordCount} words`,
      status: wordCountStatus,
      label: "Word Count",
      tooltip:
        wordCount < 50
          ? "Email content is very short. Consider adding more value."
          : wordCount > 500
            ? "Email content is lengthy. Consider breaking into multiple messages."
            : "Word count is appropriate for email marketing.",
    },
    readingTime: {
      value: readingTime,
      status: "info",
      label: "Reading Time",
      tooltip: "Estimated time to read email content at 225 words/minute.",
    },
  };
}

/**
 * Metric status icon component
 */
function StatusIcon({ status }: { status: MetricStatus["status"] }) {
  switch (status) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Info className="h-4 w-4 text-blue-600" />;
  }
}

export function EmailContentMetrics({
  htmlContent,
  className,
}: EmailContentMetricsProps) {
  const metrics = useMemo(() => analyzeContent(htmlContent), [htmlContent]);

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-4",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
        <Info className="h-4 w-4 mr-2 text-gray-600" />
        Email Content Metrics
      </h3>

      <div className="space-y-3">
        {/* HTML Size */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              {metrics.htmlSize.label}
            </span>
            {metrics.htmlSize.tooltip && (
              <div className="group relative">
                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 bg-gray-900 text-white text-xs rounded py-1 px-2 z-10">
                  {metrics.htmlSize.tooltip}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <StatusIcon status={metrics.htmlSize.status} />
            <span
              className={cn(
                "text-sm font-semibold",
                metrics.htmlSize.status === "success" && "text-green-600",
                metrics.htmlSize.status === "warning" && "text-yellow-600",
                metrics.htmlSize.status === "error" && "text-red-600"
              )}
            >
              {metrics.htmlSize.value}
            </span>
          </div>
        </div>

        {/* Text/HTML Ratio */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              {metrics.textHtmlRatio.label}
            </span>
            {metrics.textHtmlRatio.tooltip && (
              <div className="group relative">
                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 bg-gray-900 text-white text-xs rounded py-1 px-2 z-10">
                  {metrics.textHtmlRatio.tooltip}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <StatusIcon status={metrics.textHtmlRatio.status} />
            <span
              className={cn(
                "text-sm font-semibold",
                metrics.textHtmlRatio.status === "success" && "text-green-600",
                metrics.textHtmlRatio.status === "warning" && "text-yellow-600",
                metrics.textHtmlRatio.status === "error" && "text-red-600"
              )}
            >
              {metrics.textHtmlRatio.value}
            </span>
          </div>
        </div>

        {/* Word Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              {metrics.wordCount.label}
            </span>
            {metrics.wordCount.tooltip && (
              <div className="group relative">
                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 bg-gray-900 text-white text-xs rounded py-1 px-2 z-10">
                  {metrics.wordCount.tooltip}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <StatusIcon status={metrics.wordCount.status} />
            <span
              className={cn(
                "text-sm font-semibold",
                metrics.wordCount.status === "warning" && "text-yellow-600",
                metrics.wordCount.status === "success" && "text-gray-900"
              )}
            >
              {metrics.wordCount.value}
            </span>
          </div>
        </div>

        {/* Reading Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              {metrics.readingTime.label}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-900">
              {metrics.readingTime.value}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
