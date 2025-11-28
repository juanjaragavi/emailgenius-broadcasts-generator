import { query } from "../../db";

export interface ApiRequest {
  id: number;
  session_id: string;
  request_type: string;
  model_used?: string;
  input_tokens?: number;
  output_tokens?: number;
  cost?: number;
  response_time_ms?: number;
  status?: string;
  error_message?: string;
  created_at: Date;
}

export class ApiRequestService {
  static async logRequest(
    data: Partial<ApiRequest> & { session_id: string }
  ): Promise<ApiRequest> {
    const text = `
      INSERT INTO api_requests (
        session_id, request_type, model_used, input_tokens, output_tokens, 
        cost, response_time_ms, status, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      data.session_id,
      data.request_type,
      data.model_used,
      data.input_tokens,
      data.output_tokens,
      data.cost,
      data.response_time_ms,
      data.status,
      data.error_message,
    ];
    const res = await query(text, values);
    return res.rows[0];
  }

  static async getRequestsBySession(sessionId: string): Promise<ApiRequest[]> {
    const text = `
      SELECT * FROM api_requests 
      WHERE session_id = $1 
      ORDER BY created_at DESC
    `;
    const res = await query(text, [sessionId]);
    return res.rows;
  }
}
