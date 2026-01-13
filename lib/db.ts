import { Pool, PoolConfig, PoolClient } from "pg";

console.log("lib/db.ts: DB_HOST is", process.env.DB_HOST);

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Max 10 concurrent connections for Next.js serverless
  idleTimeoutMillis: 60000, // 30 seconds
  connectionTimeoutMillis: 30000, // 10 seconds
  ssl: {
    rejectUnauthorized: false, // For Cloud SQL public IP, we might need this if not using Cloud SQL Proxy
  },
};

// Create a new pool instance
const pool = new Pool(poolConfig);

// Error handling for the pool
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  // Don't exit the process, just log the error
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Error executing query", { text, error });
    throw error;
  }
};

interface CustomPoolClient extends PoolClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastQuery?: any[];
}

export const getClient = async () => {
  const client = (await pool.connect()) as CustomPoolClient;
  const query = client.query;
  const release = client.release;

  // Monkey patch the query method to keep track of the last query executed
  const timeout = setTimeout(() => {
    console.error("A client has been checked out for more than 5 seconds!");
    console.error(
      `The last executed query on this client was: ${JSON.stringify(client.lastQuery)}`
    );
  }, 5000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).query = (...args: any[]) => {
    client.lastQuery = args;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return query.apply(client, args as any);
  };

  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
};

export default pool;
