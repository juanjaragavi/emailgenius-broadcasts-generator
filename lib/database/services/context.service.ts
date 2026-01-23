import { query } from "../../db";

export interface ContextCache {
  id: number;
  context_type: string;
  context_data: Record<string, unknown>;
  created_at: Date;
  expires_at?: Date;
}

export class ContextService {
  static async cacheContext(
    contextType: string,
    data: Record<string, unknown>,
    ttlSeconds: number = 3600
  ): Promise<ContextCache> {
    const text = `
      INSERT INTO context_cache (context_type, context_data, expires_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP + interval '${ttlSeconds} seconds')
      RETURNING *
    `;
    const values = [contextType, data];
    try {
      const res = await query(text, values);
      return res.rows[0];
    } catch {
      console.warn("Using mock context cache due to DB outage");
      return {
        id: 0,
        context_type: contextType,
        context_data: data,
        created_at: new Date(),
        expires_at: new Date(Date.now() + ttlSeconds * 1000),
      } as ContextCache;
    }
  }

  static async getContext(contextType: string): Promise<ContextCache | null> {
    const text = `
      SELECT * FROM context_cache 
      WHERE context_type = $1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY created_at DESC
      LIMIT 1
    `;
    try {
      const res = await query(text, [contextType]);
      return res.rows[0] || null;
    } catch {
      return null;
    }
  }
}
