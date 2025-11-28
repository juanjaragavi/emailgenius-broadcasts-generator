import { query } from "../../db";

export interface Session {
  id: number;
  session_id: string;
  user_id?: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
  expires_at?: Date;
}

export class SessionService {
  static async createSession(
    sessionId: string,
    userId?: string,
    email?: string
  ): Promise<Session> {
    const text = `
      INSERT INTO sessions (session_id, user_id, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (session_id) DO UPDATE
      SET updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [sessionId, userId, email];
    const res = await query(text, values);
    return res.rows[0];
  }

  static async getSession(sessionId: string): Promise<Session | null> {
    const text = `SELECT * FROM sessions WHERE session_id = $1`;
    const res = await query(text, [sessionId]);
    return res.rows[0] || null;
  }

  static async updateSession(
    sessionId: string,
    data: Partial<Session>
  ): Promise<Session> {
    // Dynamic update query
    const fields = Object.keys(data).filter(
      (key) => key !== "id" && key !== "session_id" && key !== "created_at"
    ) as (keyof Session)[];
    if (fields.length === 0) return (await this.getSession(sessionId))!;

    const setClause = fields
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");
    const values = [sessionId, ...fields.map((key) => data[key])];

    const text = `
      UPDATE sessions
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE session_id = $1
      RETURNING *
    `;

    const res = await query(text, values);
    return res.rows[0];
  }
}
