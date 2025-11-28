import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const checkData = async () => {
  // Dynamic import to ensure env vars are loaded first
  const { getClient } = await import("../lib/db");

  console.log("Checking database data...");

  const client = await getClient();
  try {
    // Check Sessions
    const sessionsRes = await client.query(
      "SELECT count(*) as count FROM sessions"
    );
    console.log(`Sessions count: ${sessionsRes.rows[0].count}`);

    const recentSessions = await client.query(
      "SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5"
    );
    if (recentSessions.rows.length > 0) {
      console.log(
        "Recent Sessions:",
        recentSessions.rows.map((s) => ({
          id: s.id,
          session_id: s.session_id,
          created_at: s.created_at,
        }))
      );
    }

    // Check Broadcasts
    const broadcastsRes = await client.query(
      "SELECT count(*) as count FROM broadcasts"
    );
    console.log(`Broadcasts count: ${broadcastsRes.rows[0].count}`);

    const recentBroadcasts = await client.query(
      "SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT 5"
    );
    if (recentBroadcasts.rows.length > 0) {
      console.log(
        "Recent Broadcasts:",
        recentBroadcasts.rows.map((b) => ({
          id: b.id,
          title: b.title,
          status: b.status,
          created_at: b.created_at,
        }))
      );
    }

    // Check API Requests
    const apiRequestsRes = await client.query(
      "SELECT count(*) as count FROM api_requests"
    );
    console.log(`API Requests count: ${apiRequestsRes.rows[0].count}`);
  } catch (err) {
    console.error("❌ Error checking data:", err);
  } finally {
    client.release();
    process.exit(0);
  }
};

checkData();
