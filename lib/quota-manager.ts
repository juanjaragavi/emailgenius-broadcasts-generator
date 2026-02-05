/**
 * API Quota Management Service
 *
 * Tracks API usage for Google Cloud Vertex AI services (Gemini and Imagen)
 * to prevent quota exhaustion and provide usage visibility to users.
 *
 * Storage: File-based persistence with in-memory caching
 * Reset: Daily at midnight UTC (matches GCP billing cycle)
 */

import * as fs from "fs";
import * as path from "path";

/** Quota limits (configurable via environment variables) */
const QUOTA_LIMITS = {
  GEMINI_DAILY_REQUESTS: parseInt(process.env.GEMINI_DAILY_QUOTA || "1000", 10),
  IMAGEN_DAILY_REQUESTS: parseInt(process.env.IMAGEN_DAILY_QUOTA || "100", 10),
  IMAGEN_MONTHLY_REQUESTS: parseInt(
    process.env.IMAGEN_MONTHLY_QUOTA || "1000",
    10
  ),
};

/** Path to quota tracking file */
const QUOTA_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "api-quota-usage.json"
);

/**
 * Quota usage data structure
 */
interface QuotaUsage {
  gemini: {
    daily: number;
    resetAt: string; // ISO timestamp of next daily reset
  };
  imagen: {
    daily: number;
    monthly: number;
    dailyResetAt: string;
    monthlyResetAt: string;
  };
  lastUpdated: string;
}

/** In-memory cache */
let quotaCache: QuotaUsage | null = null;

/**
 * Get the next midnight UTC timestamp
 */
function getNextDailyReset(): string {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );
  return tomorrow.toISOString();
}

/**
 * Get the first day of next month at midnight UTC
 */
function getNextMonthlyReset(): string {
  const now = new Date();
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)
  );
  return nextMonth.toISOString();
}

/**
 * Ensure data directory exists
 */
function ensureDataDirectory(): void {
  const dataDir = path.dirname(QUOTA_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (error) {
      console.warn("⚠️ Quota Manager: Could not create data directory:", error);
    }
  }
}

/**
 * Load quota data from file
 */
function loadQuotaData(): QuotaUsage {
  try {
    if (fs.existsSync(QUOTA_FILE_PATH)) {
      const data = fs.readFileSync(QUOTA_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data) as QuotaUsage;

      // Check if daily reset time has passed
      const now = new Date();
      if (new Date(parsed.gemini.resetAt) <= now) {
        parsed.gemini.daily = 0;
        parsed.gemini.resetAt = getNextDailyReset();
      }
      if (new Date(parsed.imagen.dailyResetAt) <= now) {
        parsed.imagen.daily = 0;
        parsed.imagen.dailyResetAt = getNextDailyReset();
      }
      if (new Date(parsed.imagen.monthlyResetAt) <= now) {
        parsed.imagen.monthly = 0;
        parsed.imagen.monthlyResetAt = getNextMonthlyReset();
      }

      return parsed;
    }
  } catch (error) {
    console.warn("⚠️ Quota Manager: Could not load quota data:", error);
  }

  // Return fresh quota data if file doesn't exist or is invalid
  return {
    gemini: {
      daily: 0,
      resetAt: getNextDailyReset(),
    },
    imagen: {
      daily: 0,
      monthly: 0,
      dailyResetAt: getNextDailyReset(),
      monthlyResetAt: getNextMonthlyReset(),
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save quota data to file
 */
function saveQuotaData(data: QuotaUsage): void {
  try {
    ensureDataDirectory();
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(QUOTA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.warn("⚠️ Quota Manager: Could not save quota data:", error);
  }
}

/**
 * Get current quota usage data
 */
function getQuotaUsage(): QuotaUsage {
  if (!quotaCache) {
    quotaCache = loadQuotaData();
  }
  return quotaCache;
}

/**
 * Quota Manager Service
 */
export class QuotaManager {
  /**
   * Check if a Gemini API request can be made
   */
  static canMakeGeminiRequest(): {
    allowed: boolean;
    usage: number;
    limit: number;
    remaining: number;
    resetAt: string;
    reason?: string;
  } {
    const usage = getQuotaUsage();
    const limit = QUOTA_LIMITS.GEMINI_DAILY_REQUESTS;
    const current = usage.gemini.daily;
    const remaining = Math.max(0, limit - current);

    return {
      allowed: current < limit,
      usage: current,
      limit,
      remaining,
      resetAt: usage.gemini.resetAt,
      reason:
        current >= limit
          ? `Daily Gemini quota exceeded (${current}/${limit}). Resets at ${new Date(usage.gemini.resetAt).toLocaleString()}`
          : undefined,
    };
  }

  /**
   * Check if an Imagen API request can be made
   */
  static canMakeImagenRequest(): {
    allowed: boolean;
    dailyUsage: number;
    dailyLimit: number;
    dailyRemaining: number;
    monthlyUsage: number;
    monthlyLimit: number;
    monthlyRemaining: number;
    dailyResetAt: string;
    monthlyResetAt: string;
    reason?: string;
  } {
    const usage = getQuotaUsage();
    const dailyLimit = QUOTA_LIMITS.IMAGEN_DAILY_REQUESTS;
    const monthlyLimit = QUOTA_LIMITS.IMAGEN_MONTHLY_REQUESTS;
    const dailyCurrent = usage.imagen.daily;
    const monthlyCurrent = usage.imagen.monthly;

    let reason: string | undefined;
    if (dailyCurrent >= dailyLimit) {
      reason = `Daily Imagen quota exceeded (${dailyCurrent}/${dailyLimit}). Resets at ${new Date(usage.imagen.dailyResetAt).toLocaleString()}`;
    } else if (monthlyCurrent >= monthlyLimit) {
      reason = `Monthly Imagen quota exceeded (${monthlyCurrent}/${monthlyLimit}). Resets at ${new Date(usage.imagen.monthlyResetAt).toLocaleString()}`;
    }

    return {
      allowed: dailyCurrent < dailyLimit && monthlyCurrent < monthlyLimit,
      dailyUsage: dailyCurrent,
      dailyLimit,
      dailyRemaining: Math.max(0, dailyLimit - dailyCurrent),
      monthlyUsage: monthlyCurrent,
      monthlyLimit,
      monthlyRemaining: Math.max(0, monthlyLimit - monthlyCurrent),
      dailyResetAt: usage.imagen.dailyResetAt,
      monthlyResetAt: usage.imagen.monthlyResetAt,
      reason,
    };
  }

  /**
   * Record a Gemini API request
   */
  static recordGeminiRequest(): void {
    const usage = getQuotaUsage();
    usage.gemini.daily += 1;
    quotaCache = usage;
    saveQuotaData(usage);

    console.log(
      `📊 Quota: Gemini request recorded (${usage.gemini.daily}/${QUOTA_LIMITS.GEMINI_DAILY_REQUESTS})`
    );
  }

  /**
   * Record an Imagen API request
   */
  static recordImagenRequest(): void {
    const usage = getQuotaUsage();
    usage.imagen.daily += 1;
    usage.imagen.monthly += 1;
    quotaCache = usage;
    saveQuotaData(usage);

    console.log(
      `📊 Quota: Imagen request recorded (Daily: ${usage.imagen.daily}/${QUOTA_LIMITS.IMAGEN_DAILY_REQUESTS}, Monthly: ${usage.imagen.monthly}/${QUOTA_LIMITS.IMAGEN_MONTHLY_REQUESTS})`
    );
  }

  /**
   * Get comprehensive quota status
   */
  static getQuotaStatus(): {
    gemini: ReturnType<typeof QuotaManager.canMakeGeminiRequest>;
    imagen: ReturnType<typeof QuotaManager.canMakeImagenRequest>;
    lastUpdated: string;
  } {
    const usage = getQuotaUsage();
    return {
      gemini: this.canMakeGeminiRequest(),
      imagen: this.canMakeImagenRequest(),
      lastUpdated: usage.lastUpdated,
    };
  }

  /**
   * Reset quota counters (for testing/admin)
   */
  static resetQuota(): void {
    quotaCache = {
      gemini: {
        daily: 0,
        resetAt: getNextDailyReset(),
      },
      imagen: {
        daily: 0,
        monthly: 0,
        dailyResetAt: getNextDailyReset(),
        monthlyResetAt: getNextMonthlyReset(),
      },
      lastUpdated: new Date().toISOString(),
    };
    saveQuotaData(quotaCache);
    console.log("🔄 Quota Manager: All quotas reset");
  }
}

export default QuotaManager;
