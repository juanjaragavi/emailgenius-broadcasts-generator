import { query } from "../../db";

export interface ILBroadcastRecord {
  [key: string]: unknown;
}

const TABLE_NAME = "il_broadcasts";
let cachedColumns: string[] | null = null;
let tableChecked = false;

const preferredColumns = [
  "id",
  "subject",
  "title",
  "preheader",
  "preview_text",
  "preview",
  "email_body",
  "body",
  "content",
  "market",
  "country",
  "locale",
  "platform",
  "email_platform",
  "language",
  "spam_score",
  "created_at",
  "sent_at",
  "updated_at",
];

const preferredOrderColumns = ["created_at", "sent_at", "updated_at", "id"];

async function ensureColumns(): Promise<string[]> {
  if (tableChecked && cachedColumns) return cachedColumns;

  try {
    const tableRes = await query(
      `SELECT to_regclass('public.${TABLE_NAME}') as exists`
    );

    const exists = (tableRes.rows?.[0] as { exists: unknown } | undefined)
      ?.exists;
    tableChecked = true;

    if (!exists) {
      cachedColumns = [];
      return cachedColumns;
    }

    const columnsRes = await query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
      [TABLE_NAME]
    );

    cachedColumns = columnsRes.rows.map(
      (r: { column_name: string }) => r.column_name
    );
    return cachedColumns;
  } catch (error) {
    console.warn("⚠️ Could not introspect il_broadcasts columns", error);
    cachedColumns = [];
    tableChecked = true;
    return cachedColumns;
  }
}

function selectColumns(columns: string[]): string[] {
  if (!columns.length) return [];
  const whitelisted = columns.filter((c) => preferredColumns.includes(c));
  return (whitelisted.length ? whitelisted : columns).map((c) => `"${c}"`);
}

function pickOrderColumn(columns: string[]): string {
  const found = preferredOrderColumns.find((c) => columns.includes(c));
  return found || columns[0];
}

export class ILBroadcastService {
  static async getRecentBroadcasts(options?: {
    limit?: number;
    market?: string;
    platform?: string;
  }): Promise<ILBroadcastRecord[]> {
    const columns = await ensureColumns();
    if (!columns.length) return [];

    const selectList = selectColumns(columns);
    if (!selectList.length) return [];

    const orderColumn = pickOrderColumn(columns);

    let text = `SELECT ${selectList.join(", ")} FROM ${TABLE_NAME}`;
    const values: Array<string | number> = [];
    const filters: string[] = [];

    const marketColumn = columns.find((c) =>
      ["market", "country", "locale"].includes(c)
    );
    if (options?.market && marketColumn) {
      filters.push(`"${marketColumn}" = $${values.length + 1}`);
      values.push(options.market);
    }

    const platformColumn = columns.find((c) =>
      ["platform", "email_platform"].includes(c)
    );
    if (options?.platform && platformColumn) {
      filters.push(`"${platformColumn}" = $${values.length + 1}`);
      values.push(options.platform);
    }

    if (filters.length) {
      text += ` WHERE ${filters.join(" AND ")}`;
    }

    text += ` ORDER BY "${orderColumn}" DESC LIMIT $${values.length + 1}`;
    values.push(options?.limit ?? 5);

    try {
      const res = await query(text, values);
      return res.rows as ILBroadcastRecord[];
    } catch (error) {
      console.warn("⚠️ Failed to fetch il_broadcasts", error);
      return [];
    }
  }
}
