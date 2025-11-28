import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const verifyDb = async () => {
  // Dynamic import to ensure env vars are loaded first
  const { getClient } = await import("../lib/db");

  console.log("Verifying database schema...");
  console.log("DB_HOST:", process.env.DB_HOST);

  const client = await getClient();
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(
      "Tables found:",
      res.rows.map((r) => r.table_name)
    );

    const expectedTables = [
      "api_requests",
      "broadcasts",
      "context_cache",
      "sessions",
      "templates",
    ];
    const foundTables = res.rows.map((r) => r.table_name);

    const missing = expectedTables.filter((t) => !foundTables.includes(t));

    if (missing.length === 0) {
      console.log("✅ All expected tables are present.");
    } else {
      console.error("❌ Missing tables:", missing);
    }
  } catch (err) {
    console.error("❌ Error verifying database:", err);
  } finally {
    client.release();
    process.exit(0);
  }
};

verifyDb();
