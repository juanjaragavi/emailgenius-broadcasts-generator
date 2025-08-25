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

    try {
      console.log(`🔍 Searching Supermemory for: "${query}"`);

      const response = await fetch(`${this.baseUrl}/memories/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: query,
          limit: 5,
        }),
      });

      if (!response.ok) {
        console.log(
          `⚠️ Supermemory search failed with status: ${response.status}`
        );
        return [];
      }

      const data = await response.json();
      const results = this.parseSearchResults(data);
      console.log(`✅ Found ${results.length} memories for "${query}"`);
      return results;
    } catch (error) {
      console.error("❌ Supermemory search error:", error);
      return [];
    }
  }

  private parseSearchResults(data: unknown): MemorySearchResult[] {
    const results: MemorySearchResult[] = [];

    if (typeof data === "object" && data !== null) {
      const dataObj = data as Record<string, unknown>;

      // Handle different possible response formats
      if (dataObj.memories && Array.isArray(dataObj.memories)) {
        dataObj.memories.forEach((memory: unknown) => {
          const memoryObj = memory as Record<string, unknown>;
          results.push({
            content: String(memoryObj.content || ""),
            timestamp: String(memoryObj.timestamp || new Date().toISOString()),
            relevanceScore: Number(memoryObj.score || 0),
            metadata: (memoryObj.metadata as Record<string, unknown>) || {},
          });
        });
      } else if (dataObj.results && Array.isArray(dataObj.results)) {
        dataObj.results.forEach((result: unknown) => {
          const resultObj = result as Record<string, unknown>;
          results.push({
            content: String(resultObj.content || resultObj.text || ""),
            timestamp: String(resultObj.timestamp || new Date().toISOString()),
            relevanceScore: Number(resultObj.score || resultObj.relevance || 0),
            metadata: (resultObj.metadata as Record<string, unknown>) || {},
          });
        });
      } else if (Array.isArray(data)) {
        data.forEach((item: unknown) => {
          const itemObj = item as Record<string, unknown>;
          results.push({
            content: String(itemObj.content || itemObj.text || ""),
            timestamp: String(itemObj.timestamp || new Date().toISOString()),
            relevanceScore: Number(itemObj.score || 0),
            metadata: (itemObj.metadata as Record<string, unknown>) || {},
          });
        });
      }
    }

    return results;
  }

  async getRecentBroadcasts(
    platform?: string,
    emailType?: string
  ): Promise<MemorySearchResult[]> {
    const query = `email broadcast ${platform || ""} ${emailType || ""}`.trim();
    return this.searchMemories(query);
  }

  async getContextForGeneration(
    platform: string,
    emailType: string,
    market: string
  ): Promise<string> {
    try {
      console.log(
        `🧠 Generating context for ${platform}-${emailType}-${market}`
      );

      // Search for similar broadcasts
      const recentSimilar = await this.searchMemories(
        `email broadcast ${platform} ${emailType} ${market}`
      );

      const allRecent = await this.searchMemories("email broadcast");

      let contextText = "";

      if (recentSimilar.length > 0) {
        contextText += `\n### RECENT SIMILAR BROADCASTS (${platform} - ${emailType} - ${market}):\n`;
        recentSimilar.forEach((memory, index) => {
          contextText += `\n--- Similar Broadcast ${
            index + 1
          } ---\n${memory.content.substring(0, 800)}...\n`;
        });
      }

      if (allRecent.length > 0) {
        contextText += `\n### RECENT EMAIL PATTERNS TO AVOID REPEATING:\n`;
        allRecent.forEach((memory, index) => {
          contextText += `\n--- Recent Pattern ${
            index + 1
          } ---\n${memory.content.substring(0, 500)}...\n`;
        });
      }

      if (contextText) {
        contextText = `\n=== SUPERMEMORY CONTEXT FOR UNIQUENESS ===\nUse this context to ensure the new email is unique and avoids repetitive patterns.\n${contextText}\n=== END SUPERMEMORY CONTEXT ===\n`;
      }

      return contextText;
    } catch (error) {
      console.error("❌ Failed to get context from Supermemory:", error);
      return "";
    }
  }
}

// Export a singleton instance
export const supermemoryClient = new SupermemoryClient();
