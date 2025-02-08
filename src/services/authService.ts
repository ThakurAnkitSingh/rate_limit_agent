import supabase from "../config/supabase";
import { generateJWT } from "../utils/jwt";
import { NotFoundError, ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

export class AuthService {
  async generateAPIKey(appId: string): Promise<string> {
    try {
      // Verify app exists
      const { data: app, error: appError } = await supabase
        .from("apps")
        .select("id")
        .eq("id", appId)
        .single();

      if (appError || !app) {
        throw new NotFoundError("App not found");
      }

      // Generate API Key
      const apiKey = generateJWT({ appId });

      // Save the API Key to the database
      const { error: insertError } = await supabase.from("api_keys").insert([
        {
          app_id: appId,
          api_key: apiKey,
          is_active: true,
          created_at: new Date(),
        },
      ]);

      if (insertError) {
        logger.error("Error saving API key:", insertError);
        throw new Error("Failed to save API key");
      }

      return apiKey;
    } catch (error) {
      logger.error("Error generating API key:", { appId, error });
      throw error;
    }
  }

  async revokeAPIKey(apiKey: string): Promise<void> {
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("api_key", apiKey);

    if (error) {
      logger.error("Error revoking API key:", error);
      throw new Error("Failed to revoke API key");
    }
  }

  async validateAPIKey(apiKey: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("api_keys")
      .select("is_active")
      .eq("api_key", apiKey)
      .single();

    if (error || !data) {
      return false;
    }

    return data.is_active;
  }
}

export const authService = new AuthService();
export const generateAPIKeyService =
  authService.generateAPIKey.bind(authService);
