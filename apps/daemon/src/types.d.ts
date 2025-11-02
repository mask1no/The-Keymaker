declare module "@jito-foundation/jito-js";
declare module "@helius-labs/helius-grpc";
declare module "@keymaker/logger";
declare module "@keymaker/types";

// Augment Drizzle's BetterSQLite3Database to include execute used by code
declare module "drizzle-orm/better-sqlite3" {
  interface BetterSQLite3Database<TSchema extends Record<string, never> = Record<string, never>> {
    execute: (sql: string, params?: unknown[]) => unknown;
  }
}


