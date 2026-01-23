import { query } from "../../db";

export interface Broadcast {
  id: number;
  session_id: string;
  broadcast_id: string;
  title?: string;
  content?: string;
  target_market?: string;
  email_platform?: string;
  configuration?: Record<string, unknown>;
  generated_content?: Record<string, unknown>;
  images?: Record<string, unknown>;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export class BroadcastService {
  static async createBroadcast(
    data: Partial<Broadcast> & { session_id: string }
  ): Promise<Broadcast> {
    const text = `
      INSERT INTO broadcasts (
        session_id, title, content, target_market, email_platform, 
        configuration, generated_content, images, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      data.session_id,
      data.title,
      data.content,
      data.target_market,
      data.email_platform,
      data.configuration,
      data.generated_content,
      data.images,
      data.status || "draft",
    ];
    try {
      const res = await query(text, values);
      return res.rows[0];
    } catch {
      console.warn("Using mock broadcast due to DB outage");
      const { session_id, status, ...restData } = data;
      return {
        id: Math.floor(Math.random() * 10000),
        broadcast_id: `broadcast_${Date.now()}`,
        session_id: session_id,
        status: status || "draft",
        created_at: new Date(),
        updated_at: new Date(),
        ...restData,
      } as Broadcast;
    }
  }

  static async getBroadcastsBySession(sessionId: string): Promise<Broadcast[]> {
    const text = `
      SELECT * FROM broadcasts 
      WHERE session_id = $1 
      ORDER BY created_at DESC
    `;
    try {
      const res = await query(text, [sessionId]);
      return res.rows;
    } catch {
      return [];
    }
  }

  static async getBroadcast(broadcastId: string): Promise<Broadcast | null> {
    const text = `SELECT * FROM broadcasts WHERE broadcast_id = $1`;
    const res = await query(text, [broadcastId]);
    return res.rows[0] || null;
  }

  static async updateBroadcast(
    broadcastId: string,
    data: Partial<Broadcast>
  ): Promise<Broadcast> {
    const fields = Object.keys(data).filter(
      (key) => key !== "id" && key !== "broadcast_id" && key !== "created_at"
    ) as (keyof Broadcast)[];
    if (fields.length === 0) return (await this.getBroadcast(broadcastId))!;

    const setClause = fields
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");
    const values = [broadcastId, ...fields.map((key) => data[key])];

    const text = `
      UPDATE broadcasts
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE broadcast_id = $1
      RETURNING *
    `;

    const res = await query(text, values);
    return res.rows[0];
  }

  static async getRecentBroadcasts(
    limit: number = 5,
    market?: string,
    platform?: string
  ): Promise<Broadcast[]> {
    let text = `
      SELECT * FROM broadcasts
      WHERE status = 'generated'
    `;
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (market) {
      text += ` AND target_market = $${paramIndex}`;
      values.push(market);
      paramIndex++;
    }

    if (platform) {
      text += ` AND email_platform = $${paramIndex}`;
      values.push(platform);
      paramIndex++;
    }

    text += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    values.push(limit);

    const res = await query(text, values);
    return res.rows;
  }
}
