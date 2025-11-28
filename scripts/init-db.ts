import dotenv from "dotenv";
// Load environment variables from .env.local BEFORE other imports
dotenv.config({ path: ".env.local" });

console.log("DB_HOST:", process.env.DB_HOST);

const initDb = async () => {
  // Dynamic import to ensure env vars are loaded
  const { getClient } = await import("../lib/db");

  console.log("Initializing database schema...");

  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Create application user
    try {
      await client.query(`
            DO
            $do$
            BEGIN
            IF NOT EXISTS (
                SELECT FROM pg_catalog.pg_roles
                WHERE  rolname = 'emailgenius_app') THEN
                CREATE ROLE emailgenius_app LOGIN PASSWORD 'your_secure_password_here';
            END IF;
            END
            $do$;
        `);
      console.log("User emailgenius_app checked/created.");
    } catch (e) {
      console.warn(
        "Could not create user emailgenius_app, might already exist or permission denied.",
        e
      );
    }

    // Grant connect
    await client.query(
      `GRANT CONNECT ON DATABASE emailgenius TO emailgenius_app;`
    );

    // Sessions/User Management
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );
    `);

    // Broadcast Generation History
    await client.query(`
      CREATE TABLE IF NOT EXISTS broadcasts (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL REFERENCES sessions(session_id),
        broadcast_id UUID DEFAULT gen_random_uuid() UNIQUE,
        title VARCHAR(500),
        content TEXT,
        target_market VARCHAR(50),
        email_platform VARCHAR(50),
        configuration JSONB,
        generated_content JSONB,
        images JSONB,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // API Request Logging
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_requests (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL REFERENCES sessions(session_id),
        request_type VARCHAR(50),
        model_used VARCHAR(100),
        input_tokens INTEGER,
        output_tokens INTEGER,
        cost DECIMAL(10, 6),
        response_time_ms INTEGER,
        status VARCHAR(50),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Template Cache
    await client.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        template_name VARCHAR(255) UNIQUE,
        template_source VARCHAR(50),
        template_content TEXT,
        market_segment VARCHAR(50),
        last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Context Cache
    await client.query(`
      CREATE TABLE IF NOT EXISTS context_cache (
        id SERIAL PRIMARY KEY,
        context_type VARCHAR(100),
        context_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );
    `);

    // Create Indexes
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_broadcasts_session_id ON broadcasts(session_id);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_api_requests_session_id ON api_requests(session_id);`
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_templates_market_segment ON templates(market_segment);`
    );

    // Grant privileges
    await client.query(
      `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO emailgenius_app;`
    );
    await client.query(
      `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO emailgenius_app;`
    );

    await client.query("COMMIT");
    console.log("Database schema initialized successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error initializing database schema:", error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
};

initDb();
