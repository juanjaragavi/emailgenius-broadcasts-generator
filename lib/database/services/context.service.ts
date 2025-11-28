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
    const res = await query(text, values);
    return res.rows[0];
  }

  static async getContext(contextType: string): Promise<ContextCache | null> {
    const text = `
      SELECT * FROM context_cache 
      WHERE context_type = $1 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const res = await query(text, [contextType]);
    return res.rows[0] || null;
  }
}
