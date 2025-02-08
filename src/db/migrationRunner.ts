import supabase from "../config/supabase";
import { logger } from "../utils/logger";
import * as initialSchema from "./migrations/001_initial_schema";

const migrations = [
  initialSchema,
  // Add more migrations here as needed
];

export async function runMigrations(
  direction: "up" | "down" = "up"
): Promise<void> {
  try {
    logger.info(`Running migrations ${direction}`);

    for (const migration of direction === "up"
      ? migrations
      : [...migrations].reverse()) {
      await migration[direction](supabase);
    }

    logger.info("Migrations completed successfully");
  } catch (error) {
    logger.error("Migration failed:", error);
    throw error;
  }
}

if (require.main === module) {
  const direction = process.argv[2] as "up" | "down";
  runMigrations(direction).catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}
