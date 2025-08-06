import {
  AppError,
  type BaseError,
  ErrorCodeSchema,
  type Result,
} from "@vspo-lab/error";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgTransactionConfig } from "drizzle-orm/pg-core";
import {
  type DB,
  defaultConfig,
  type IDbConfig,
  type ITxManager,
} from "../../infra/repository/transaction";

export class TestTxManager implements ITxManager {
  constructor(private readonly dbConfig: IDbConfig) {}

  async runTx<T, E extends BaseError>(
    operation: (tx: DB) => Promise<Result<T, E>>,
    config?: PgTransactionConfig,
  ): Promise<Result<T, E>> {
    const db = drizzle({
      connection: this.dbConfig.connectionString,
      logger: this.dbConfig.isQueryLoggingEnabled,
    });

    let result: Result<T, E> | undefined;

    try {
      await db.transaction(async (tx) => {
        result = await operation(tx);
        throw new Error("FORCE_ROLLBACK");
      }, config ?? defaultConfig);
    } catch (error: unknown) {
      if (error instanceof Error && error.message !== "FORCE_ROLLBACK") {
        throw new AppError({
          message: `Unexpected error during transaction execution: ${error}`,
          code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
        });
      }
    }

    if (!result) {
      throw new AppError({
        message: "Transaction result does not exist",
        code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
      });
    }
    if (result.err) {
      throw result.err;
    }
    if (result.val === undefined) {
      throw new AppError({
        message: "Transaction result is undefined",
        code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
      });
    }
    return result;
  }
}
