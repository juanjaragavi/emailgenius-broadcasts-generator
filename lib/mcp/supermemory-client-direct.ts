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

    try {
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

      const response = await fetch(`${this.baseUrl}/memories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          content: memoryContent,
          metadata: {
            type: "email_broadcast",
            platform: entry.metadata?.platform,
            emailType: entry.metadata?.emailType,
            market: entry.metadata?.market,
            timestamp: entry.timestamp,
          },
        }),
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

  async searchMemories(
    query: string,
    limit: number = 5
  ): Promise<MemorySearchResult[]> {
    if (!this.apiKey) {
      console.error("❌ Supermemory API key not configured");
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/memories/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: query,
          limit: limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const results: MemorySearchResult[] = [];

      if (data.memories && Array.isArray(data.memories)) {
        data.memories.forEach(
          (memory: {
            content: string;
            metadata?: Record<string, unknown>;
            score?: number;
          }) => {
            results.push({
              content: memory.content,
              timestamp: new Date().toISOString(),
              relevanceScore: memory.score || 0,
              metadata: memory.metadata || {},
            });
          }
        );
      }

      console.log(
        `🔍 Found ${results.length} relevant memories for query: "${query}"`
      );
      return results;
    } catch (error) {
      console.error("❌ Failed to search memories in Supermemory:", error);
      return [];
    }
  }

  async getRecentBroadcasts(
    platform?: string,
    emailType?: string,
    limit: number = 3
  ): Promise<MemorySearchResult[]> {
    const query = `email broadcast ${platform ? `platform:${platform}` : ""} ${
      emailType ? `type:${emailType}` : ""
    }`.trim();
    return this.searchMemories(query, limit);
  }

  async getContextForGeneration(
    platform: string,
    emailType: string,
    market: string
  ): Promise<string> {
    try {
      // Search for similar email broadcasts to provide context
      const recentSimilar = await this.searchMemories(
        `email broadcast platform:${platform} type:${emailType} market:${market}`,
        3
      );

      const allRecent = await this.searchMemories("email broadcast", 5);

      let contextText = "";

      if (recentSimilar.length > 0) {
        contextText += `\n### RECENT SIMILAR BROADCASTS (${platform} - ${emailType} - ${market}):\n`;
        recentSimilar.forEach((memory, index) => {
          contextText += `\n--- Memory ${index + 1} ---\n${memory.content}\n`;
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
        contextText = `\n=== SUPERMEMORY CONTEXT FOR UNIQUENESS ===\n${contextText}\n=== END SUPERMEMORY CONTEXT ===\n`;
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
