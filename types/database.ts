export interface Session {
  id: number;
  session_id: string;
  user_id?: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
  expires_at?: Date;
}

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
  status: "draft" | "generated" | "sent" | "archived";
  created_at: Date;
  updated_at: Date;
}

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

export interface Template {
  id: number;
  template_name: string;
  template_source?: string;
  template_content?: string;
  market_segment?: string;
  last_synced: Date;
}

export interface ContextCache {
  id: number;
  context_type: string;
  context_data: Record<string, unknown>;
  created_at: Date;
  expires_at?: Date;
}
