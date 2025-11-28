import { NextRequest, NextResponse } from "next/server";
import { BroadcastService } from "@/lib/database/services/broadcast.service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id parameter" },
      { status: 400 }
    );
  }

  try {
    const broadcasts = await BroadcastService.getBroadcastsBySession(sessionId);
    return NextResponse.json(broadcasts);
  } catch (error) {
    console.error("Error fetching broadcasts:", error);
    return NextResponse.json(
      { error: "Error fetching broadcasts" },
      { status: 500 }
    );
  }
}
