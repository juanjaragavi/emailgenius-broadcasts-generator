export interface MemoryEntry {
  content: string;
  timestamp: string;
  metadata?: {
    platform?: string;
    emailType?: string;
    market?: string;
    subject?: string;
    preheader?: string;
  };
}

export interface MemorySearchResult {
  content: string;
  relevanceScore?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export class SupermemoryClient {
  private apiKey: string;
  private baseUrl: string = "https://api.supermemory.ai/v3";

  constructor() {
    this.apiKey = process.env.SUPERMEMORY_API_KEY || "";
    if (!this.apiKey) {
      console.warn("⚠️ SUPERMEMORY_API_KEY not found in environment variables");
    }
  }

  async addToMemory(entry: MemoryEntry): Promise<boolean> {
    if (!this.apiKey) {
      console.error("❌ Supermemory API key not configured");
      return false;
    }

    const memoryContent = `
EMAIL BROADCAST GENERATED AT ${entry.timestamp}:

Platform: ${entry.metadata?.platform || "Unknown"}
Email Type: ${entry.metadata?.emailType || "Unknown"}
Market: ${entry.metadata?.market || "Unknown"}
Subject: ${entry.metadata?.subject || "N/A"}
Preheader: ${entry.metadata?.preheader || "N/A"}

CONTENT:
${entry.content}

---
This is an email broadcast layout that was previously generated to avoid repetitive patterns in future email generations.
    `.trim();

    const payload = {
      content: memoryContent,
      metadata: {
        type: "email_broadcast",
        platform: entry.metadata?.platform,
        emailType: entry.metadata?.emailType,
        market: entry.metadata?.market,
        timestamp: entry.timestamp,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/memories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("💾 Successfully stored email broadcast in Supermemory");
      return true;
    } catch (error) {
      console.error("❌ Failed to store memory in Supermemory:", error);
      return false;
    }
  }

  async searchMemories(query: string): Promise<MemorySearchResult[]> {
    if (!this.apiKey) {
      console.error("❌ Supermemory API key not configured");
      return [];
    }

    // Based on testing, search endpoints are not currently working
    // Return empty results gracefully to avoid blocking email generation
    console.log(
      `ℹ️ Supermemory search for "${query}" currently unavailable, returning empty results`
    );
    return [];
  }

  async getRecentBroadcasts(
    platform?: string,
    emailType?: string
  ): Promise<MemorySearchResult[]> {
    // Search functionality is currently unavailable
    console.log(
      `ℹ️ Recent broadcasts search for ${platform}-${emailType} unavailable`
    );
    return [];
  }

  async getContextForGeneration(
    platform: string,
    emailType: string,
    market: string
  ): Promise<string> {
    // Since search is unavailable, return empty context
    console.log(
      `ℹ️ Context generation for ${platform}-${emailType}-${market} unavailable`
    );
    return "";
  }
}

// Export a singleton instance
export const supermemoryClient = new SupermemoryClient();
