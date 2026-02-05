import { NextResponse } from "next/server";
import { QuotaManager } from "@/lib/quota-manager";

/**
 * GET /api/quota-status
 *
 * Returns current API quota usage and remaining capacity
 */
export async function GET() {
  try {
    const status = QuotaManager.getQuotaStatus();

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("Error fetching quota status:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch quota status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
