/**
 * Generation Memory Service
 *
 * A robust memory system for tracking the 10 most recent email broadcast generations.
 * Provides historical context to the LLM to prevent repetitive content patterns
 * and improve output diversity.
 *
 * Storage Strategy:
 * - Primary: In-memory cache for fast access
 * - Fallback: JSON file-based persistence for reliability
 * - Graceful degradation if file system is unavailable
 *
 * This implementation ensures the LLM has access to recent generation history
 * regardless of database availability.
 */

import * as fs from "fs";
import * as path from "path";

/** Maximum number of generations to keep in memory */
const MAX_MEMORY_SIZE = 10;

/** Path to the JSON file for persistence */
const MEMORY_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "generation-memory.json"
);

/**
 * Represents a single email generation record stored in memory
 */
export interface GenerationRecord {
  /** Unique identifier for this generation */
  id: string;
  /** Timestamp of when the email was generated */
  timestamp: string;
  /** Target market (USA, UK, Mexico) */
  market: string;
  /** Email platform (ActiveCampaign, ConvertKit) */
  platform: string;
  /** Type of email (security-alert, shipping-update, etc.) */
  emailType: string;
  /** Primary subject line */
  subjectLine: string;
  /** Secondary subject line for A/B testing (ConvertKit) */
  subjectLine2?: string;
  /** Preview/preheader text */
  previewText: string;
  /** CTA button text */
  ctaButtonText: string;
  /** Snippet of the email body (first 500 chars) */
  bodySnippet: string;
  /** Image prompt used for generation */
  imagePrompt?: string;
  /** Sender name (ActiveCampaign) */
  fromName?: string;
}

/**
 * Memory storage structure
 */
interface MemoryStore {
  /** Array of generation records, newest first */
  generations: GenerationRecord[];
  /** Last updated timestamp */
  lastUpdated: string;
  /** Schema version for future migrations */
  version: number;
}

/**
 * In-memory cache for fast access
 */
let memoryCache: MemoryStore | null = null;

/**
 * Ensure the data directory exists
 */
function ensureDataDirectory(): void {
  const dataDir = path.dirname(MEMORY_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`📁 Generation Memory: Created data directory at ${dataDir}`);
    } catch (error) {
      console.warn(
        "⚠️ Generation Memory: Could not create data directory:",
        error
      );
    }
  }
}

/**
 * Load memory from file storage
 */
function loadFromFile(): MemoryStore {
  try {
    if (fs.existsSync(MEMORY_FILE_PATH)) {
      const data = fs.readFileSync(MEMORY_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data) as MemoryStore;

      // Validate structure
      if (Array.isArray(parsed.generations)) {
        console.log(
          `📖 Generation Memory: Loaded ${parsed.generations.length} records from file`
        );
        return parsed;
      }
    }
  } catch (error) {
    console.warn("⚠️ Generation Memory: Could not load from file:", error);
  }

  // Return empty store if file doesn't exist or is invalid
  return {
    generations: [],
    lastUpdated: new Date().toISOString(),
    version: 1,
  };
}

/**
 * Save memory to file storage
 */
function saveToFile(store: MemoryStore): void {
  try {
    ensureDataDirectory();
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
    console.log(
      `💾 Generation Memory: Saved ${store.generations.length} records to file`
    );
  } catch (error) {
    console.warn("⚠️ Generation Memory: Could not save to file:", error);
  }
}

/**
 * Get the current memory store (from cache or file)
 */
function getMemoryStore(): MemoryStore {
  if (!memoryCache) {
    memoryCache = loadFromFile();
  }
  return memoryCache;
}

/**
 * Generation Memory Service
 *
 * Provides methods to store and retrieve recent email generation history
 * for use as context in LLM prompts.
 */
export class GenerationMemoryService {
  /**
   * Store a new generation record in memory
   *
   * @param record - The generation record to store
   */
  static storeGeneration(
    record: Omit<GenerationRecord, "id" | "timestamp">
  ): GenerationRecord {
    const store = getMemoryStore();

    // Create complete record with ID and timestamp
    const completeRecord: GenerationRecord = {
      ...record,
      id: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    // Add to beginning of array (newest first)
    store.generations.unshift(completeRecord);

    // Trim to max size
    if (store.generations.length > MAX_MEMORY_SIZE) {
      store.generations = store.generations.slice(0, MAX_MEMORY_SIZE);
    }

    // Update metadata
    store.lastUpdated = new Date().toISOString();

    // Update cache and persist
    memoryCache = store;
    saveToFile(store);

    console.log(
      `✅ Generation Memory: Stored new record (${store.generations.length}/${MAX_MEMORY_SIZE})`
    );

    return completeRecord;
  }

  /**
   * Get recent generations with optional filtering
   *
   * @param options - Filter options
   * @returns Array of generation records, newest first
   */
  static getRecentGenerations(options?: {
    limit?: number;
    market?: string;
    platform?: string;
    emailType?: string;
  }): GenerationRecord[] {
    const store = getMemoryStore();
    let results = [...store.generations];

    // Apply filters
    if (options?.market) {
      results = results.filter((r) => r.market === options.market);
    }
    if (options?.platform) {
      results = results.filter((r) => r.platform === options.platform);
    }
    if (options?.emailType) {
      results = results.filter((r) => r.emailType === options.emailType);
    }

    // Apply limit
    const limit = options?.limit || MAX_MEMORY_SIZE;
    results = results.slice(0, limit);

    console.log(
      `📚 Generation Memory: Retrieved ${results.length} records${
        options?.market || options?.platform
          ? ` (filtered by ${[options.market, options.platform].filter(Boolean).join(", ")})`
          : ""
      }`
    );

    return results;
  }

  /**
   * Get all subject lines from recent generations
   * Useful for deduplication checks
   */
  static getRecentSubjectLines(options?: {
    limit?: number;
    market?: string;
    platform?: string;
  }): string[] {
    const records = this.getRecentGenerations(options);
    const subjects: string[] = [];

    for (const record of records) {
      if (record.subjectLine) {
        subjects.push(record.subjectLine);
      }
      if (record.subjectLine2) {
        subjects.push(record.subjectLine2);
      }
    }

    return subjects;
  }

  /**
   * Get all CTA button texts from recent generations
   */
  static getRecentCTAs(options?: {
    limit?: number;
    market?: string;
    platform?: string;
  }): string[] {
    const records = this.getRecentGenerations(options);
    return records.map((r) => r.ctaButtonText).filter(Boolean);
  }

  /**
   * Format memory records as context for the LLM
   *
   * Creates a structured prompt section that informs the LLM about
   * recently generated content to avoid repetition.
   */
  static formatAsLLMContext(options?: {
    limit?: number;
    market?: string;
    platform?: string;
  }): string {
    const records = this.getRecentGenerations({
      limit: options?.limit || 10,
      market: options?.market,
      platform: options?.platform,
    });

    if (records.length === 0) {
      return "";
    }

    // Get unique values for summary
    const uniqueSubjects = new Set(
      records.map((r) => r.subjectLine).filter(Boolean)
    );
    const uniqueCTAs = new Set(
      records.map((r) => r.ctaButtonText).filter(Boolean)
    );
    const uniqueFromNames = new Set(
      records.map((r) => r.fromName).filter(Boolean)
    );

    const context = `
## 🧠 GENERATION MEMORY CONTEXT (CRITICAL FOR DIVERSITY)

You have access to the ${records.length} most recent email generations. You MUST use this context to create DISTINCT and UNIQUE content that differs from previous outputs.

### ALREADY USED - DO NOT REPEAT:

**Subject Lines Already Generated (${uniqueSubjects.size} unique):**
${Array.from(uniqueSubjects)
  .map((s) => `• "${s}"`)
  .join("\n")}

**CTA Buttons Already Used (${uniqueCTAs.size} unique):**
${Array.from(uniqueCTAs)
  .map((c) => `• "${c}"`)
  .join("\n")}

${
  uniqueFromNames.size > 0
    ? `**Sender Names Already Used:**
${Array.from(uniqueFromNames)
  .map((n) => `• "${n}"`)
  .join("\n")}`
    : ""
}

### DETAILED RECENT GENERATIONS:

${records
  .map(
    (r, i) => `
--- Generation ${i + 1} (${r.timestamp}) ---
Market: ${r.market} | Platform: ${r.platform} | Type: ${r.emailType}
Subject: "${r.subjectLine}"${r.subjectLine2 ? `\nSubject 2: "${r.subjectLine2}"` : ""}
Preview: "${r.previewText}"
CTA: "${r.ctaButtonText}"
${r.fromName ? `From Name: "${r.fromName}"` : ""}
Body Snippet: "${r.bodySnippet.substring(0, 200)}..."
`
  )
  .join("\n")}

### DIVERSITY REQUIREMENTS:

Based on the memory context above, you MUST:

1. **SUBJECT LINE**: Create a completely new angle/approach not seen in the ${uniqueSubjects.size} subjects above
2. **CTA BUTTON**: Use a different action verb than the ${uniqueCTAs.size} CTAs listed
3. **TONE VARIATION**: Vary the emotional appeal (urgency, excitement, curiosity, trust)
4. **OPENER VARIATION**: Use a different greeting style than recent emails
5. **BENEFIT FRAMING**: Highlight different benefits/angles than recent content
${
  uniqueFromNames.size > 0
    ? `6. 🚨 **SENDER NAME (CRITICAL)**: You MUST use a COMPLETELY DIFFERENT first name than these ${uniqueFromNames.size} already-used names: **${Array.from(uniqueFromNames).join(", ")}**
   - Choose a name from a different gender, ethnicity, or cultural background
   - ABSOLUTELY FORBIDDEN to repeat: ${Array.from(uniqueFromNames).join(", ")}
   - Suggested alternatives: Sarah, Michael, Jessica, David, Rachel, Andrew, Lisa, James, Maria, Christopher`
    : "6. **SENDER NAME**: Choose a diverse, culturally appropriate first name (varies by market)"
}

🔴 **FAILURE TO CREATE DISTINCT CONTENT (ESPECIALLY SENDER NAME) WILL RESULT IN REJECTION.**
`;

    return context;
  }

  /**
   * Clear all stored generations (for testing/reset)
   */
  static clearMemory(): void {
    const emptyStore: MemoryStore = {
      generations: [],
      lastUpdated: new Date().toISOString(),
      version: 1,
    };

    memoryCache = emptyStore;
    saveToFile(emptyStore);

    console.log("🗑️ Generation Memory: Cleared all records");
  }

  /**
   * Get memory statistics
   */
  static getStats(): {
    totalGenerations: number;
    oldestTimestamp: string | null;
    newestTimestamp: string | null;
    marketBreakdown: Record<string, number>;
    platformBreakdown: Record<string, number>;
  } {
    const store = getMemoryStore();
    const generations = store.generations;

    const marketBreakdown: Record<string, number> = {};
    const platformBreakdown: Record<string, number> = {};

    for (const gen of generations) {
      marketBreakdown[gen.market] = (marketBreakdown[gen.market] || 0) + 1;
      platformBreakdown[gen.platform] =
        (platformBreakdown[gen.platform] || 0) + 1;
    }

    return {
      totalGenerations: generations.length,
      oldestTimestamp:
        generations.length > 0
          ? generations[generations.length - 1].timestamp
          : null,
      newestTimestamp: generations.length > 0 ? generations[0].timestamp : null,
      marketBreakdown,
      platformBreakdown,
    };
  }
}

export default GenerationMemoryService;
