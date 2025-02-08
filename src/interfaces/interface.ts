// Request body for app registration
export interface RegisterAppRequestBody {
  name: string;
  baseUrl: string;
  strategy: RateLimitStrategy;
  requestCount: number;
  timeWindow: number;
}

// Represents a user in the database
export interface App {
  id: string;
  name: string;
  base_url: string;
  strategy: RateLimitStrategy;
  request_count: number;
  time_window: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface APIKey {
  id: string;
  app_id: string;
  api_key: string;
  created_at: Date;
  is_active: boolean;
}

export type RateLimitStrategy =
  | "token_bucket"
  | "rolling_window"
  | "leaky_bucket"
  | "fixed_window";

export interface RateLimitResponse {
  isLimited: boolean;
  remainingTokens?: number;
  nextRefillTime?: number;
  queuePosition?: number;
}

export interface QueuedRequest {
  appId: string;
  apiKey: string;
  timestamp: number;
  payload?: any;
}

export interface RateLimitConfig {
  requestCount: number;
  timeWindow: number;
}
