// Request body for app registration
export interface RegisterAppRequestBody {
    name: string;
    baseUrl: string;
    strategy: 'token_bucket' | 'rolling_window';
    requestCount: number;
    timeWindow: number;
  }
  
  // Represents a user in the database
  export interface App {
    id: string;
    name: string;
    base_url: string;
    strategy: string;
    request_count: number;
    time_window: number;
  }
  