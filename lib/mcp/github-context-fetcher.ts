import { Octokit } from "@octokit/rest";

/**
 * GitHub Context Fetcher
 *
 * This utility provides a simplified interface for fetching context from
 * specific GitHub repositories without requiring a full MCP server setup.
 * It's designed to be used directly within the email generation API.
 */

interface GitHubFile {
  name: string;
  path: string;
  content: string;
  type: "file" | "dir";
  sha: string;
}

interface RepositoryContext {
  repository: string;
  files: GitHubFile[];
  htmlTemplates: GitHubFile[];
  markdownFiles: GitHubFile[];
  subjectLines: string[];
  lastFetched: string;
}

export class GitHubContextFetcher {
  private octokit: Octokit;
  private cache: Map<string, RepositoryContext> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly TARGET_REPOSITORIES = [
    "juanjaragavi/topfinanzas-ac-image-email-templates",
    "juanjaragavi/emailgenius-winner-broadcasts-subjects",
  ];

  constructor() {
    // Initialize Octokit with authentication if available
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN, // Optional: for higher rate limits
    });
  }

  /**
   * Fetch comprehensive context from all target repositories
   */
  async fetchEmailContext(): Promise<string> {
    try {
      const contexts: RepositoryContext[] = [];

      for (const repository of this.TARGET_REPOSITORIES) {
        const context = await this.fetchRepositoryContext(repository);
        contexts.push(context);
      }

      return this.formatContextForLLM(contexts);
    } catch (error) {
      console.error("Error fetching email context:", error);
      // Return a fallback message instead of throwing
      return this.getFallbackContext();
    }
  }

  /**
   * Fetch context from a specific repository
   */
  private async fetchRepositoryContext(
    repository: string
  ): Promise<RepositoryContext> {
    // Check cache first
    const cached = this.cache.get(repository);
    if (
      cached &&
      Date.now() - new Date(cached.lastFetched).getTime() < this.CACHE_TTL
    ) {
      return cached;
    }

    const [owner, repo] = repository.split("/");

    try {
      // Get repository tree
      const { data: tree } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: "HEAD",
        recursive: "true",
      });

      const files: GitHubFile[] = [];
      const htmlTemplates: GitHubFile[] = [];
      const markdownFiles: GitHubFile[] = [];
      const subjectLines: string[] = [];

      // Process each file in the repository
      for (const item of tree.tree) {
        if (item.type === "blob" && item.path) {
          try {
            // Get file content
            const { data: fileData } = await this.octokit.rest.git.getBlob({
              owner,
              repo,
              file_sha: item.sha!,
            });

            // Decode content
            let content = "";
            if (fileData.encoding === "base64") {
              content = Buffer.from(fileData.content, "base64").toString(
                "utf-8"
              );
            } else {
              content = fileData.content;
            }

            const file: GitHubFile = {
              name: item.path.split("/").pop() || item.path,
              path: item.path,
              content,
              type: "file",
              sha: item.sha!,
            };

            files.push(file);

            // Categorize files
            const extension = item.path.split(".").pop()?.toLowerCase();

            if (extension === "html" || extension === "htm") {
              htmlTemplates.push(file);
            } else if (extension === "md" || extension === "markdown") {
              markdownFiles.push(file);

              // Extract subject lines from markdown files if this is the subjects repository
              if (
                repository.includes("emailgenius-winner-broadcasts-subjects")
              ) {
                const extractedSubjects = this.extractSubjectLines(content);
                subjectLines.push(...extractedSubjects);
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch content for ${item.path}:`, error);
          }
        }
      }

      const context: RepositoryContext = {
        repository,
        files,
        htmlTemplates,
        markdownFiles,
        subjectLines,
        lastFetched: new Date().toISOString(),
      };

      // Cache the result
      this.cache.set(repository, context);

      return context;
    } catch (error) {
      throw new Error(
        `Failed to fetch repository context for ${repository}: ${error}`
      );
    }
  }

  /**
   * Extract subject lines from markdown content
   */
  private extractSubjectLines(markdownContent: string): string[] {
    const lines = markdownContent.split("\n");
    const subjects: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Look for lines that start with subject line indicators
      if (
        trimmedLine.startsWith("##") &&
        (trimmedLine.toLowerCase().includes("subject") ||
          trimmedLine.toLowerCase().includes("asunto"))
      ) {
        continue; // Skip headers
      }

      // Extract bullet points and numbered lists that contain subject lines
      if (trimmedLine.match(/^[\-\*\+\d]+\.?\s+(.+)$/)) {
        const subject = trimmedLine.replace(/^[\-\*\+\d]+\.?\s+/, "").trim();
        if (subject.length > 10 && subject.length < 150) {
          // Reasonable subject line length
          subjects.push(subject);
        }
      }

      // Extract lines that look like subject lines (contain emojis and action words)
      if (
        trimmedLine.length > 10 &&
        trimmedLine.length < 150 &&
        (trimmedLine.includes("🚨") ||
          trimmedLine.includes("⚠️") ||
          trimmedLine.includes("✅") ||
          trimmedLine.toLowerCase().includes("urgent") ||
          trimmedLine.toLowerCase().includes("action") ||
          trimmedLine.toLowerCase().includes("alert"))
      ) {
        subjects.push(trimmedLine);
      }
    }

    return subjects;
  }

  /**
   * Format the context data for LLM consumption
   */
  private formatContextForLLM(contexts: RepositoryContext[]): string {
    let contextString = `## DYNAMIC GITHUB REPOSITORY CONTEXT\n\n`;
    contextString += `**Context fetched at:** ${new Date().toISOString()}\n\n`;

    for (const context of contexts) {
      contextString += `### Repository: ${context.repository}\n\n`;

      // HTML Templates Section
      if (context.htmlTemplates.length > 0) {
        contextString += `#### HTML Email Templates (${context.htmlTemplates.length} files):\n\n`;

        for (const template of context.htmlTemplates.slice(0, 5)) {
          // Limit to top 5 to avoid token overflow
          contextString += `**File: ${template.path}**\n`;
          contextString += `\`\`\`html\n${this.truncateContent(
            template.content,
            1000
          )}\n\`\`\`\n\n`;
        }
      }

      // Subject Lines Section
      if (context.subjectLines.length > 0) {
        contextString += `#### High-Performing Subject Lines (${context.subjectLines.length} total):\n\n`;

        for (const subject of context.subjectLines.slice(0, 20)) {
          // Show top 20 subjects
          contextString += `- ${subject}\n`;
        }
        contextString += "\n";
      }

      // Markdown Files Section
      if (context.markdownFiles.length > 0) {
        contextString += `#### Markdown Content Files (${context.markdownFiles.length} files):\n\n`;

        for (const mdFile of context.markdownFiles.slice(0, 3)) {
          // Limit to top 3
          contextString += `**File: ${mdFile.path}**\n`;
          contextString += `${this.truncateContent(mdFile.content, 800)}\n\n`;
        }
      }

      contextString += `---\n\n`;
    }

    contextString += `## CONTEXT USAGE INSTRUCTIONS\n\n`;
    contextString += `Use the above HTML templates as structural and stylistic references for creating new email content. `;
    contextString += `Pay special attention to the high-performing subject lines and incorporate similar language patterns, `;
    contextString += `urgency indicators, and engagement elements. The HTML templates show proven formatting and design `;
    contextString += `patterns that should be adapted for the requested email type and market.\n\n`;

    return contextString;
  }

  /**
   * Truncate content to prevent token overflow
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    return content.substring(0, maxLength) + "\n\n[... content truncated ...]";
  }

  /**
   * Provide fallback context when GitHub fetch fails
   */
  private getFallbackContext(): string {
    return (
      `## FALLBACK CONTEXT\n\n` +
      `**Note:** Unable to fetch latest repository content. Using general guidelines.\n\n` +
      `### Email Best Practices:\n` +
      `- Use urgent, notification-style language\n` +
      `- Include action-oriented CTAs\n` +
      `- Incorporate security and delivery themes\n` +
      `- Use emojis for visual impact (🚨, ⚠️, ✅)\n` +
      `- Create authentic corporate signatures\n` +
      `- Focus on card, account, or profile verification themes\n\n`
    );
  }

  /**
   * Clear the cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): {
    repository: string;
    lastFetched: string;
    filesCount: number;
  }[] {
    const status: {
      repository: string;
      lastFetched: string;
      filesCount: number;
    }[] = [];
    this.cache.forEach((context, repository) => {
      status.push({
        repository,
        lastFetched: context.lastFetched,
        filesCount: context.files.length,
      });
    });
    return status;
  }
}

// Export singleton instance
export const githubContextFetcher = new GitHubContextFetcher();
