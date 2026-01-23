import { PoolClient } from "pg";

// Mock configuration for outage handling
console.warn("DATABASE DISABLED: Using mock DB implementation due to outage");

// Explicitly type the mock pool to avoid 'any' if possible, or leave as is since we aren't exporting the pool directly
const pool = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  on: (_event: string, _callback: (err: Error) => void) => {},
  connect: async () => {
    // console.log("Mock pool.connect called");
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
      query: async (_text: string, _params?: any[]) => {
        // console.log("Mock client.query called", { text });
        return {
          rows: [],
          rowCount: 0,
          command: "",
          oid: 0,
          fields: [],
        };
      },
      release: () => {},
    } as unknown as CustomPoolClient;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  query: async (_text: string, _params?: any[]) => {
    // console.log("Mock pool.query called", { text });
    return {
      rows: [],
      rowCount: 0,
      command: "",
      oid: 0,
      fields: [],
    };
  },
};

// Error handling for the pool
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  // Don't exit the process, just log the error
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    // Simulate DB lag slightly? No, immediate return is fine for disabled state.
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("executed MOCK query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Error executing MOCK query", { text, error });
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
