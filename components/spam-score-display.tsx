"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  SpamCheckApiResponse,
  SpamRule,
  SPAM_SCORE_THRESHOLDS,
} from "@/types/spam-check";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpamScoreDisplayProps {
  result: SpamCheckApiResponse | null;
  isLoading?: boolean;
  className?: string;
}

/**
 * Get score color based on status
 */
function getScoreColor(status: SpamCheckApiResponse["status"]): string {
  switch (status) {
    case "pass":
      return "text-green-600";
    case "warning":
      return "text-yellow-600";
    case "fail":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Get background color based on status
 */
function getStatusBg(status: SpamCheckApiResponse["status"]): string {
  switch (status) {
    case "pass":
      return "bg-green-50 border-green-200";
    case "warning":
      return "bg-yellow-50 border-yellow-200";
    case "fail":
      return "bg-red-50 border-red-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
}

/**
 * Get status icon based on result
 */
function StatusIcon({ status }: { status: SpamCheckApiResponse["status"] }) {
  const iconClass = "h-6 w-6";

  switch (status) {
    case "pass":
      return <ShieldCheck className={cn(iconClass, "text-green-600")} />;
    case "warning":
      return <ShieldAlert className={cn(iconClass, "text-yellow-600")} />;
    case "fail":
      return <ShieldX className={cn(iconClass, "text-red-600")} />;
    default:
      return <Shield className={cn(iconClass, "text-gray-600")} />;
  }
}

/**
 * Score gauge visualization
 */
function ScoreGauge({ score }: { score: number }) {
  // Clamp score between -5 and 10 for visualization
  const clampedScore = Math.max(-5, Math.min(10, score));
  // Convert to percentage (0% = -5, 100% = 10)
  const percentage = ((clampedScore + 5) / 15) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Excellent</span>
        <span>Pass</span>
        <span>Warning</span>
        <span>Spam</span>
      </div>
      <div className="relative h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full overflow-hidden">
        {/* Threshold markers */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/50"
          style={{ left: `${((0 + 5) / 15) * 100}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/50"
          style={{ left: `${((SPAM_SCORE_THRESHOLDS.PASS + 5) / 15) * 100}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/50"
          style={{ left: `${((SPAM_SCORE_THRESHOLDS.FAIL + 5) / 15) * 100}%` }}
        />
        {/* Score indicator */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-gray-900 rounded-full shadow-md transform -translate-x-1/2 transition-all duration-500"
          style={{ left: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>-5</span>
        <span>0</span>
        <span>3</span>
        <span>5</span>
        <span>10+</span>
      </div>
    </div>
  );
}

/**
 * Individual rule display
 */
function RuleItem({ rule }: { rule: SpamRule }) {
  const score = parseFloat(rule.score);
  const isPositive = score > 0;
  const isNegative = score < 0;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border text-sm",
        isPositive && "bg-red-50/50 border-red-100",
        isNegative && "bg-green-50/50 border-green-100",
        score === 0 && "bg-gray-50/50 border-gray-100"
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isPositive && <XCircle className="h-4 w-4 text-red-500" />}
        {isNegative && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        {score === 0 && <AlertTriangle className="h-4 w-4 text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            {rule.rule}
          </code>
          <span
            className={cn(
              "text-xs font-semibold",
              isPositive && "text-red-600",
              isNegative && "text-green-600",
              score === 0 && "text-gray-500"
            )}
          >
            {isPositive ? "+" : ""}
            {rule.score}
          </span>
        </div>
        <p className="text-gray-600 mt-1 break-words">{rule.description}</p>
      </div>
    </div>
  );
}

/**
 * Main SpamScoreDisplay component
 */
export function SpamScoreDisplay({
  result,
  isLoading = false,
  className,
}: SpamScoreDisplayProps) {
  const [showRules, setShowRules] = React.useState(false);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-3 p-6 rounded-xl border bg-gray-50",
          className
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span className="text-gray-600">Analyzing spam score...</span>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  if (result.error) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50",
          className
        )}
      >
        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-red-800">Analysis Failed</p>
          <p className="text-sm text-red-600">{result.error}</p>
        </div>
      </div>
    );
  }

  const positiveRules = result.rules.filter((r) => parseFloat(r.score) > 0);
  const negativeRules = result.rules.filter((r) => parseFloat(r.score) < 0);

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden",
        getStatusBg(result.status),
        className
      )}
    >
      {/* Header with score */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <StatusIcon status={result.status} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900">
                Spam Analysis
              </h3>
              <span
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  getScoreColor(result.status)
                )}
              >
                {result.score.toFixed(1)}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide",
                  result.status === "pass" && "bg-green-100 text-green-700",
                  result.status === "warning" &&
                    "bg-yellow-100 text-yellow-700",
                  result.status === "fail" && "bg-red-100 text-red-700"
                )}
              >
                {result.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{result.summary}</p>
          </div>
        </div>

        {/* Score gauge */}
        <div className="mt-4">
          <ScoreGauge score={result.score} />
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 mt-4 text-sm">
          {positiveRules.length > 0 && (
            <div className="flex items-center gap-1.5 text-red-600">
              <XCircle className="h-4 w-4" />
              <span>
                {positiveRules.length} issue
                {positiveRules.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {negativeRules.length > 0 && (
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {negativeRules.length} positive signal
                {negativeRules.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable rules section */}
      {result.rules.length > 0 && (
        <div className="border-t border-inherit">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-none hover:bg-white/50"
            onClick={() => setShowRules(!showRules)}
          >
            {showRules ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {result.rules.length} Rule
                {result.rules.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>

          {showRules && (
            <div className="p-4 sm:p-6 pt-0 space-y-4">
              {/* Issues first */}
              {positiveRules.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Issues to Address
                  </h4>
                  <div className="space-y-2">
                    {positiveRules.map((rule, i) => (
                      <RuleItem key={`pos-${i}`} rule={rule} />
                    ))}
                  </div>
                </div>
              )}

              {/* Positive signals */}
              {negativeRules.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-800 mb-2">
                    Positive Signals
                  </h4>
                  <div className="space-y-2">
                    {negativeRules.map((rule, i) => (
                      <RuleItem key={`neg-${i}`} rule={rule} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SpamScoreDisplay;
