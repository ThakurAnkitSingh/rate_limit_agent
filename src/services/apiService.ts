import supabase from '../config/supabase';
import { RegisterAppRequestBody } from '../interfaces/interface';

// Handles the logic for registering an app
export const registerAppService = async (appData: RegisterAppRequestBody): Promise<string> => {
  const { name, baseUrl, strategy, requestCount, timeWindow } = appData;

  const { data, error } = await supabase
    .from('apps')
    .insert([
      {
        name,
        base_url: baseUrl,
        rate_limit_strategy: strategy,
        request_count: requestCount,
        time_window: timeWindow,
      },
    ])
    .select('id') // Select only the `id` field

  if (error) {
    throw new Error(`Error registering app: ${error.message}`);
  }

  // Return the app's unique ID
  return data?.[0]?.id || '';
};
