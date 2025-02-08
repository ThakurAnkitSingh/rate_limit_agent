import supabase from "../config/supabase";
import { App, RegisterAppRequestBody } from "../interfaces/interface";
import { NotFoundError, ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

export class AppService {
  async registerApp(appData: RegisterAppRequestBody): Promise<string> {
    const { name, baseUrl, strategy, requestCount, timeWindow } = appData;

    // Validate the strategy
    if (
      ![
        "token_bucket",
        "rolling_window",
        "leaky_bucket",
        "fixed_window",
      ].includes(strategy)
    ) {
      throw new ValidationError("Invalid rate limiting strategy");
    }

    const { data, error } = await supabase
      .from("apps")
      .insert([
        {
          name,
          base_url: baseUrl,
          rate_limit_strategy: strategy,
          request_count: requestCount,
          time_window: timeWindow,
        },
      ])
      .select("id");

    if (error) {
      logger.error("Error registering app:", error);
      throw new Error(`Error registering app: ${error.message}`);
    }

    return data?.[0]?.id || "";
  }

  async fetchAppData(appId: string): Promise<App> {
    const { data, error } = await supabase
      .from("apps")
      .select("*")
      .eq("id", appId)
      .single();

    if (error || !data) {
      logger.error("Error fetching app data:", { appId, error });
      throw new NotFoundError("App not found");
    }

    return data as App;
  }

  async updateApp(
    appId: string,
    updateData: Partial<RegisterAppRequestBody>
  ): Promise<void> {
    const { error } = await supabase
      .from("apps")
      .update({
        ...updateData,
        updated_at: new Date(),
      })
      .eq("id", appId);

    if (error) {
      logger.error("Error updating app:", { appId, error });
      throw new Error(`Error updating app: ${error.message}`);
    }
  }
}

export const appService = new AppService();
export const fetchAppData = appService.fetchAppData.bind(appService);
