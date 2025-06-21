import type { Span } from "@opentelemetry/api";
import * as Sentry from "@sentry/cloudflare";
import { AppError } from "@vspo-lab/error";
import { Err, type Result } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import type { ApiEnv } from "../../../config/env/api";
import type { CommonEnv } from "../../../config/env/common";
import type { AppWorkerEnv } from "../../../config/env/internal";
import type { BindingWorkflowEnv } from "../../../config/env/workflow";

type PerformanceTiming = {
  start: number;
  end: number;
  duration: number;
  timeOrigin: number;
};

const measurePerformance = (startTime: number): PerformanceTiming => {
  const endTime = performance.now();
  return {
    start: startTime,
    end: endTime,
    duration: endTime - startTime,
    timeOrigin: performance.timeOrigin,
  };
};

export const withTracerResult = async <T, E extends AppError = AppError>(
  tracerName: string,
  spanName: string,
  callback: (span: Span) => Promise<Result<T, E>>,
): Promise<Result<T, E>> => {
  // Start performance measurement
  const startTime = performance.now();

  return Sentry.startSpan(
    {
      name: spanName,
    },
    async (span) => {
      const traceId = span.spanContext().traceId;
      const spanId = span.spanContext().spanId;

      AppLogger.info(`${spanName} started`, {
        trace_id: traceId,
        span_id: spanId,
        tracer_name: `${tracerName}-${spanName}`,
        start_time: startTime,
        time_origin: performance.timeOrigin,
      });

      return await AppLogger.runWithContext(
        {
          additionalFields: {
            trace_id: traceId,
            span_id: spanId,
            tracer_name: `${tracerName}-${spanName}`,
            span_name: spanName,
          },
        },
        async () => {
          try {
            const result = await callback(span);

            // Measure performance and add to span
            const timing = measurePerformance(startTime);

            AppLogger.info(`${spanName} completed`, {
              trace_id: traceId,
              span_id: spanId,
              performance_duration_ms: timing.duration,
              success: !result.err,
            });

            if (result.err) {
              span.recordException(result.err);
            }
            return result;
          } catch (error) {
            // Measure performance even on error
            const timing = measurePerformance(startTime);
            let appError: E;
            if (error instanceof AppError) {
              appError = error as E;
            } else if (error instanceof Error) {
              appError = new AppError({
                message: "Unexpected error occurred",
                code: "INTERNAL_SERVER_ERROR",
                cause: error,
              }) as E;
            } else {
              appError = new AppError({
                message: "Unknown error occurred",
                code: "INTERNAL_SERVER_ERROR",
                cause: new Error(String(error)),
              }) as E;
            }

            AppLogger.error(`${spanName} failed`, {
              trace_id: traceId,
              span_id: spanId,
              performance_duration_ms: timing.duration,
              error: appError.message,
            });

            span.recordException(appError);
            Sentry.captureException(appError);
            return Err(appError);
          } finally {
            span.end();
          }
        },
      );
    },
  );
};

export const withTracer = async <T>(
  tracerName: string,
  spanName: string,
  callback: (span: Span) => Promise<T>,
): Promise<T> => {
  // Start performance measurement
  const startTime = performance.now();

  return Sentry.startSpan(
    {
      name: spanName,
    },
    async (span) => {
      const traceId = span.spanContext().traceId;
      const spanId = span.spanContext().spanId;

      AppLogger.info(`${spanName} started`, {
        trace_id: traceId,
        span_id: spanId,
        tracer_name: `${tracerName}-${spanName}`,
        start_time: startTime,
        time_origin: performance.timeOrigin,
      });

      return await AppLogger.runWithContext(
        {
          additionalFields: {
            trace_id: traceId,
            span_id: spanId,
            tracer_name: `${tracerName}-${spanName}`,
            span_name: spanName,
          },
        },
        async () => {
          try {
            const result = await callback(span);

            // Measure performance and add to span
            const timing = measurePerformance(startTime);

            AppLogger.info(`${spanName} completed`, {
              trace_id: traceId,
              span_id: spanId,
              performance_duration_ms: timing.duration,
            });

            return result;
          } catch (error) {
            // Measure performance even on error
            const timing = measurePerformance(startTime);

            AppLogger.error(`${spanName} failed`, {
              trace_id: traceId,
              span_id: spanId,
              performance_duration_ms: timing.duration,
              error: error instanceof Error ? error.message : String(error),
            });

            span.recordException(error);
            Sentry.captureException(error);
            throw error;
          } finally {
            span.end();
          }
        },
      );
    },
  );
};

export type UnifiedEnv = CommonEnv & ApiEnv & AppWorkerEnv & BindingWorkflowEnv;

type Handler<T = unknown, E = UnifiedEnv> = {
  fetch?: (req: Request, env: E, ctx: ExecutionContext) => Promise<Response>;
  queue?: (
    batch: MessageBatch<T>,
    env: E,
    ctx: ExecutionContext,
  ) => Promise<void>;
  scheduled?: (
    controller: ScheduledController,
    env: E,
    ctx: ExecutionContext,
  ) => Promise<void>;
};

export const createHandler = <T, E extends UnifiedEnv = UnifiedEnv>(
  handler: Handler<T, E>,
) => {
  return Sentry.withSentry(
    (env) => ({
      dsn: env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      beforeSend: (event) => {
        event.tags = {
          ...event.tags,
          request_id: AppLogger.getCurrentRequestId(),
          trace_id: String(AppLogger.getAdditionalFields()?.trace_id ?? ""),
          span_id: String(AppLogger.getAdditionalFields()?.span_id ?? ""),
          tracer_name: String(
            AppLogger.getAdditionalFields()?.tracer_name ?? "",
          ),
          span_name: String(AppLogger.getAdditionalFields()?.span_name ?? ""),
        };
        return event;
      },
    }),
    // https://docs.sentry.io/platforms/javascript/guides/cloudflare/#setup-cloudflare-workers
    handler as unknown as ExportedHandler<E>,
  );
};
