import { NextRequest, NextResponse } from "next/server";
import { SessionService } from "@/lib/database/services/session.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, user_id, email } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    let session = await SessionService.getSession(session_id);
    if (!session) {
      session = await SessionService.createSession(session_id, user_id, email);
    } else if (user_id || email) {
      session = await SessionService.updateSession(session_id, {
        user_id,
        email,
      });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error managing session:", error);
    return NextResponse.json(
      { error: "Error managing session" },
      { status: 500 }
    );
  }
}

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
    const session = await SessionService.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Error fetching session" },
      { status: 500 }
    );
  }
}
