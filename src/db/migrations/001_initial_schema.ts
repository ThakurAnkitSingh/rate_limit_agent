import { SupabaseClient } from "@supabase/supabase-js";

export async function up(supabase: SupabaseClient): Promise<void> {
  // Create apps table
  await supabase.rpc("create_apps_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS apps (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        base_url TEXT NOT NULL,
        rate_limit_strategy VARCHAR(50) NOT NULL,
        request_count INTEGER NOT NULL,
        time_window INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `,
  });

  // Create api_keys table
  await supabase.rpc("create_api_keys_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
        api_key TEXT NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP WITH TIME ZONE
      );
    `,
  });

  // Create request_logs table for analytics
  await supabase.rpc("create_request_logs_table", {
    sql: `
      CREATE TABLE IF NOT EXISTS request_logs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status INTEGER NOT NULL,
        response_time INTEGER NOT NULL,
        endpoint TEXT NOT NULL
      );
    `,
  });
}

export async function down(supabase: SupabaseClient): Promise<void> {
  await supabase.rpc("drop_tables", {
    sql: `
      DROP TABLE IF EXISTS request_logs;
      DROP TABLE IF EXISTS api_keys;
      DROP TABLE IF EXISTS apps;
    `,
  });
}
