// Request body for app registration
export interface RegisterAppRequestBody {
    name: string;
    baseUrl: string;
    rateLimitStrategy: 'token_bucket' | 'rolling_window';
    requestCount: number;
    timeWindow: number;
  }
  
  // Represents a user in the database
  export interface User {
    id: string;
    name: string;
    base_url: string;
    rate_limit_strategy: string;
    request_count: number;
    time_window: number;
  }
  