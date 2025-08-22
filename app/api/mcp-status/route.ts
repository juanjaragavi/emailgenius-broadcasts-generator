import { NextRequest, NextResponse } from "next/server";
import { githubContextFetcher } from "@/lib/mcp/github-context-fetcher";

/**
 * MCP Status API Endpoint
 *
 * This endpoint provides diagnostics and status information about the
 * Model Context Protocol integration and GitHub context fetching.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "status";

    switch (action) {
      case "status":
        return await handleStatusRequest();

      case "test":
        return await handleTestRequest();

      case "cache":
        return await handleCacheRequest();

      case "clear-cache":
        return await handleClearCacheRequest();

      default:
        return NextResponse.json(
          {
            error: "Invalid action",
            availableActions: ["status", "test", "cache", "clear-cache"],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in MCP status endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleStatusRequest() {
  const status = {
    service: "GitHub Context MCP Integration",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: {
      hasGitHubToken: !!process.env.GITHUB_TOKEN,
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
    },
    targetRepositories: [
      "juanjaragavi/topfinanzas-ac-image-email-templates",
      "juanjaragavi/emailgenius-winner-broadcasts-subjects",
    ],
    cache: githubContextFetcher.getCacheStatus(),
  };

  return NextResponse.json(status);
}

async function handleTestRequest() {
  try {
    console.log("Starting MCP integration test...");

    const startTime = Date.now();
    const context = await githubContextFetcher.fetchEmailContext();
    const endTime = Date.now();

    const testResults = {
      success: true,
      fetchTime: `${endTime - startTime}ms`,
      contextLength: context.length,
      contextPreview: context.substring(0, 500) + "...",
      cache: githubContextFetcher.getCacheStatus(),
      timestamp: new Date().toISOString(),
    };

    console.log("MCP integration test completed successfully");
    return NextResponse.json(testResults);
  } catch (error) {
    console.error("MCP integration test failed:", error);

    const testResults = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(testResults, { status: 500 });
  }
}

async function handleCacheRequest() {
  const cacheStatus = githubContextFetcher.getCacheStatus();

  return NextResponse.json({
    cacheStatus,
    totalCachedRepositories: cacheStatus.length,
    timestamp: new Date().toISOString(),
  });
}

async function handleClearCacheRequest() {
  try {
    githubContextFetcher.clearCache();

    return NextResponse.json({
      message: "Cache cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to clear cache",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST method for more complex operations
export async function POST(request: NextRequest) {
  try {
    const { action, repository } = await request.json();

    switch (action) {
      case "fetch-specific":
        if (!repository) {
          return NextResponse.json(
            {
              error: "Repository parameter required for fetch-specific action",
            },
            { status: 400 }
          );
        }

        // This would require extending the GitHubContextFetcher to support single repo fetching
        return NextResponse.json(
          { message: "Specific repository fetching not yet implemented" },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          { error: "Invalid action for POST request" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in MCP status POST endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
