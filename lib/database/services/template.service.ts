import { query } from "../../db";

export interface Template {
  id: number;
  template_name: string;
  template_source?: string;
  template_content?: string;
  market_segment?: string;
  last_synced: Date;
}

export class TemplateService {
  static async upsertTemplate(
    data: Partial<Template> & { template_name: string }
  ): Promise<Template> {
    const text = `
      INSERT INTO templates (template_name, template_source, template_content, market_segment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (template_name) DO UPDATE
      SET 
        template_source = EXCLUDED.template_source,
        template_content = EXCLUDED.template_content,
        market_segment = EXCLUDED.market_segment,
        last_synced = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [
      data.template_name,
      data.template_source,
      data.template_content,
      data.market_segment,
    ];
    const res = await query(text, values);
    return res.rows[0];
  }

  static async getTemplate(templateName: string): Promise<Template | null> {
    const text = `SELECT * FROM templates WHERE template_name = $1`;
    const res = await query(text, [templateName]);
    return res.rows[0] || null;
  }
}
