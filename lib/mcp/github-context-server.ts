import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "@octokit/rest";

/**
 * GitHub Context MCP Server
 *
 * This MCP server provides reliable access to specific GitHub repositories
 * containing email templates and marketing assets for the EmailGenius system.
 *
 * Repositories accessed:
 * - topfinanzas-ac-image-email-templates
 * - emailgenius-winner-broadcasts-subjects
 */

interface GitHubFile {
  name: string;
  path: string;
  content: string;
  type: "file" | "dir";
  sha: string;
}

interface RepositoryContent {
  repository: string;
  files: GitHubFile[];
  lastUpdated: string;
}

interface MatchResult {
  line: number;
  content: string;
  context: {
    before: string;
    after: string;
  };
}

interface FileAnalysis {
  repository: string;
  totalFiles: number;
  fileTypes: Record<string, number>;
  structure: FileStructureAnalysis;
  lastUpdated: string;
  files?: GitHubFile[];
  error?: string;
}

// Tool call argument interfaces
interface FetchRepositoryContentArgs {
  repository: string;
  includeContent?: boolean;
  fileTypes?: string[];
}

interface SearchRepositoryFilesArgs {
  repository: string;
  searchTerm: string;
  fileExtension?: string;
}

interface GetEmailTemplatesSummaryArgs {
  includeContent?: boolean;
}

interface FileStructureAnalysis {
  totalFiles: number;
  directories: string[];
  directoriesCount: number;
  htmlFiles: string[];
  markdownFiles: string[];
  imageFiles: string[];
  otherFiles: string[];
}

class GitHubContextServer {
  private server: Server;
  private octokit: Octokit;
  private cache: Map<string, RepositoryContent> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.server = new Server(
      {
        name: "github-context-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Octokit with authentication (if available)
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN, // Optional: for higher rate limits
    });

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "fetch_repository_content",
            description:
              "Fetch all content from a specific GitHub repository, including HTML files, Markdown files, and images",
            inputSchema: {
              type: "object",
              properties: {
                repository: {
                  type: "string",
                  description: "Repository name in format 'owner/repo'",
                  enum: [
                    "juanjaragavi/topfinanzas-ac-image-email-templates",
                    "juanjaragavi/emailgenius-winner-broadcasts-subjects",
                  ],
                },
                includeContent: {
                  type: "boolean",
                  description:
                    "Whether to include file contents (default: true)",
                  default: true,
                },
                fileTypes: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description:
                    "File extensions to include (e.g., ['html', 'md', 'txt']). Leave empty for all files.",
                  default: [],
                },
              },
              required: ["repository"],
            },
          },
          {
            name: "search_repository_files",
            description:
              "Search for specific files or patterns within the repositories",
            inputSchema: {
              type: "object",
              properties: {
                repository: {
                  type: "string",
                  description: "Repository name in format 'owner/repo'",
                  enum: [
                    "juanjaragavi/topfinanzas-ac-image-email-templates",
                    "juanjaragavi/emailgenius-winner-broadcasts-subjects",
                  ],
                },
                searchTerm: {
                  type: "string",
                  description:
                    "Search term to look for in file names or content",
                },
                fileExtension: {
                  type: "string",
                  description:
                    "Specific file extension to filter by (e.g., 'html', 'md')",
                },
              },
              required: ["repository", "searchTerm"],
            },
          },
          {
            name: "get_email_templates_summary",
            description:
              "Get a comprehensive summary of all email templates and assets from both repositories",
            inputSchema: {
              type: "object",
              properties: {
                includeContent: {
                  type: "boolean",
                  description:
                    "Whether to include full file contents in the summary",
                  default: false,
                },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "fetch_repository_content":
            return await this.fetchRepositoryContent(
              args as unknown as FetchRepositoryContentArgs
            );

          case "search_repository_files":
            return await this.searchRepositoryFiles(
              args as unknown as SearchRepositoryFilesArgs
            );

          case "get_email_templates_summary":
            return await this.getEmailTemplatesSummary(
              args as unknown as GetEmailTemplatesSummaryArgs
            );

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        console.error(`Error in tool ${name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });
  }

  private async fetchRepositoryContent(args: FetchRepositoryContentArgs) {
    const { repository, includeContent = true, fileTypes = [] } = args;

    // Check cache first
    const cacheKey = `${repository}_${includeContent}_${fileTypes.join(",")}`;
    const cachedResult = this.cache.get(cacheKey);

    if (
      cachedResult &&
      Date.now() - new Date(cachedResult.lastUpdated).getTime() < this.CACHE_TTL
    ) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(cachedResult, null, 2),
          },
        ],
      };
    }

    try {
      const [owner, repo] = repository.split("/");

      // Get repository tree
      const { data: tree } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: "HEAD",
        recursive: "true",
      });

      const files: GitHubFile[] = [];

      for (const item of tree.tree) {
        if (item.type === "blob" && item.path) {
          // Filter by file types if specified
          if (fileTypes.length > 0) {
            const extension = item.path.split(".").pop()?.toLowerCase();
            if (!extension || !fileTypes.includes(extension)) {
              continue;
            }
          }

          let content = "";
          if (includeContent) {
            try {
              const { data: fileData } = await this.octokit.rest.git.getBlob({
                owner,
                repo,
                file_sha: item.sha!,
              });

              // Decode content based on encoding
              if (fileData.encoding === "base64") {
                content = Buffer.from(fileData.content, "base64").toString(
                  "utf-8"
                );
              } else {
                content = fileData.content;
              }
            } catch (error) {
              console.warn(`Failed to fetch content for ${item.path}:`, error);
              content = `[Error fetching content: ${
                error instanceof Error ? error.message : String(error)
              }]`;
            }
          }

          files.push({
            name: item.path.split("/").pop() || item.path,
            path: item.path,
            content,
            type: "file",
            sha: item.sha!,
          });
        }
      }

      const result: RepositoryContent = {
        repository,
        files,
        lastUpdated: new Date().toISOString(),
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch repository content: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async searchRepositoryFiles(args: SearchRepositoryFilesArgs) {
    const { repository, searchTerm, fileExtension } = args;

    try {
      const [owner, repo] = repository.split("/");

      // Build search query
      let query = `${searchTerm} repo:${repository}`;
      if (fileExtension) {
        query += ` extension:${fileExtension}`;
      }

      const { data: searchResults } = await this.octokit.rest.search.code({
        q: query,
        per_page: 50,
      });

      const results = [];
      for (const item of searchResults.items) {
        try {
          // Get file content
          const { data: fileData } = await this.octokit.rest.repos.getContent({
            owner,
            repo,
            path: item.path,
          });

          if ("content" in fileData) {
            const content = Buffer.from(fileData.content, "base64").toString(
              "utf-8"
            );

            results.push({
              name: item.name,
              path: item.path,
              content,
              url: item.html_url,
              matches: this.findMatches(content, searchTerm),
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch content for ${item.path}:`, error);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query,
                totalResults: searchResults.total_count,
                files: results,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Failed to search repository files: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async getEmailTemplatesSummary(args: GetEmailTemplatesSummaryArgs) {
    const { includeContent = false } = args;

    const repositories = [
      "juanjaragavi/topfinanzas-ac-image-email-templates",
      "juanjaragavi/emailgenius-winner-broadcasts-subjects",
    ];

    const summary = {
      generatedAt: new Date().toISOString(),
      repositories: [] as FileAnalysis[],
    };

    for (const repository of repositories) {
      try {
        const repoContent = await this.fetchRepositoryContent({
          repository,
          includeContent,
        });

        const parsedContent = JSON.parse(repoContent.content[0].text);

        // Analyze the content
        const analysis: FileAnalysis = {
          repository,
          totalFiles: parsedContent.files.length,
          fileTypes: this.getFileTypeDistribution(parsedContent.files),
          structure: this.analyzeFileStructure(parsedContent.files),
          lastUpdated: parsedContent.lastUpdated,
        };

        if (includeContent) {
          analysis.files = parsedContent.files;
        }

        summary.repositories.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze repository ${repository}:`, error);
        summary.repositories.push({
          repository,
          totalFiles: 0,
          fileTypes: {},
          structure: {
            totalFiles: 0,
            directories: [],
            directoriesCount: 0,
            htmlFiles: [],
            markdownFiles: [],
            imageFiles: [],
            otherFiles: [],
          },
          lastUpdated: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  private findMatches(content: string, searchTerm: string): MatchResult[] {
    const lines = content.split("\n");
    const matches: MatchResult[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(searchTerm.toLowerCase())) {
        matches.push({
          line: i + 1,
          content: lines[i].trim(),
          context: {
            before: lines[i - 1]?.trim() || "",
            after: lines[i + 1]?.trim() || "",
          },
        });
      }
    }

    return matches;
  }

  private getFileTypeDistribution(files: GitHubFile[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    files.forEach((file) => {
      const extension = file.path.split(".").pop()?.toLowerCase() || "unknown";
      distribution[extension] = (distribution[extension] || 0) + 1;
    });

    return distribution;
  }

  private analyzeFileStructure(files: GitHubFile[]): FileStructureAnalysis {
    const structure = {
      totalFiles: files.length,
      directories: new Set<string>(),
      htmlFiles: [] as string[],
      markdownFiles: [] as string[],
      imageFiles: [] as string[],
      otherFiles: [] as string[],
    };

    files.forEach((file) => {
      // Track directories
      const dir = file.path.split("/").slice(0, -1).join("/");
      if (dir) {
        structure.directories.add(dir);
      }

      // Categorize files by type
      const extension = file.path.split(".").pop()?.toLowerCase();
      switch (extension) {
        case "html":
        case "htm":
          structure.htmlFiles.push(file.path);
          break;
        case "md":
        case "markdown":
          structure.markdownFiles.push(file.path);
          break;
        case "png":
        case "jpg":
        case "jpeg":
        case "gif":
        case "svg":
          structure.imageFiles.push(file.path);
          break;
        default:
          structure.otherFiles.push(file.path);
      }
    });

    return {
      ...structure,
      directories: Array.from(structure.directories),
      directoriesCount: structure.directories.size,
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("GitHub Context MCP Server running on stdio");
  }
}

// Export for use in other modules
export { GitHubContextServer };

// Run server if this file is executed directly
if (require.main === module) {
  const server = new GitHubContextServer();
  server.run().catch(console.error);
}
