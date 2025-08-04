import {
  AppError,
  type BaseError,
  ErrorCodeSchema,
  type Result,
  wrap,
} from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction, PgTransactionConfig } from "drizzle-orm/pg-core";

export interface IDbConfig {
  connectionString: string;
  isQueryLoggingEnabled: boolean;
}

export type DB = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

export interface ITxManager {
  runTx<T, E extends BaseError>(
    operation: (tx: DB) => Promise<Result<T, E>>,
    config?: PgTransactionConfig,
  ): Promise<Result<T, E>>;
}

export const defaultConfig: PgTransactionConfig = {
  isolationLevel: "read committed",
  accessMode: "read write",
  deferrable: false,
};

export const createTxManager = (dbConfig: IDbConfig): ITxManager => {
  const runTx = async <T, E extends BaseError>(
    operation: (tx: DB) => Promise<Result<T, E>>,
    config?: PgTransactionConfig,
  ): Promise<Result<T, E>> => {
    const db = drizzle({
      connection: dbConfig.connectionString,
      logger: dbConfig.isQueryLoggingEnabled,
    });

    const result = await wrap(
      db.transaction(async (tx) => {
        const op = await operation(tx);
        if (op.err) {
          const logger = AppLogger.getInstance();
          logger.error(`Failed to execute transaction: ${op.err}`);
          tx.rollback();
        }
        return op;
      }, config ?? defaultConfig),
      (e) =>
        new AppError({
          message: `Failed to execute transaction: ${e}`,
          code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
          cause: e,
        }),
    );
    if (result.err) {
      throw result.err;
    }
    return result.val;
  };

  return { runTx };
};
