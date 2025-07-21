import { BaseError, type ErrorContext } from "./base";
import { codeToStatus, type ErrorCode } from "./code";

export class AppError extends BaseError {
  public readonly name = "AppError";
  public readonly retry: boolean;
  public readonly code: ErrorCode;
  public readonly status: number;

  constructor(opts: {
    message: string;
    code: ErrorCode;
    cause?: unknown;
    context?: ErrorContext;
    retry?: boolean;
  }) {
    super({
      message: opts.message,
      ...(opts.cause instanceof Error ? { cause: opts.cause } : {}),
      ...(opts.context ? { context: opts.context } : {}),
    });
    this.retry = opts.retry ?? false;
    this.code = opts.code;
    this.status = codeToStatus(opts.code);
  }
}
