import { AsyncLocalStorage } from "node:async_hooks";

interface Fields {
  [key: string]: unknown;
}

interface CustomLogger {
  debug(message: string, fields?: Fields): void;
  info(message: string, fields?: Fields): void;
  warn(message: string, fields?: Fields): void;
  error(message: string, fields?: Fields): void;
}

interface LogContext {
  requestId: string;
  additionalFields?: Fields;
  service?: string;
}

const loggerStorage = new AsyncLocalStorage<LogContext>();

// Add log level constants
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Add type for string log levels
type LogLevelString = "debug" | "info" | "warn" | "error";

// Add function to convert string to LogLevel
function parseLogLevel(level: string | number): LogLevel {
  if (typeof level === "number") {
    return level as LogLevel;
  }

  const lowerLevel = level.toLowerCase() as LogLevelString;
  switch (lowerLevel) {
    case "debug":
      return LogLevel.DEBUG;
    case "info":
      return LogLevel.INFO;
    case "warn":
      return LogLevel.WARN;
    case "error":
      return LogLevel.ERROR;
    default:
      console.warn(`Invalid log level: ${level}. Defaulting to DEBUG.`);
      return LogLevel.DEBUG;
  }
}

class AppLogger implements CustomLogger {
  private static instance: AppLogger;
  private minLevel: LogLevel = LogLevel.DEBUG; // Default to DEBUG level

  private constructor() {}

  static getInstance(env?: {
    LOG_TYPE: string;
    LOG_MINLEVEL: string | number;
    LOG_HIDE_POSITION: boolean;
  }): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }

    // Set minimum log level if provided
    if (env?.LOG_MINLEVEL !== undefined) {
      AppLogger.instance.minLevel = parseLogLevel(env.LOG_MINLEVEL);
    }

    return AppLogger.instance;
  }

  private getContext(): LogContext {
    const context = loggerStorage.getStore();
    if (!context) {
      return { requestId: crypto.randomUUID() };
    }
    return context;
  }

  static async runWithContext<T>(
    context: Partial<LogContext>,
    fn: () => Promise<T>,
  ): Promise<T> {
    const fullContext: LogContext = {
      requestId:
        AppLogger.getCurrentRequestId() ||
        context.requestId ||
        crypto.randomUUID(),
      ...(context.additionalFields
        ? { additionalFields: context.additionalFields }
        : {}),
      ...(context.service ? { service: context.service } : {}),
    };
    return loggerStorage.run(fullContext, fn);
  }

  static getCurrentRequestId(): string | undefined {
    return loggerStorage.getStore()?.requestId;
  }

  static getAdditionalFields(): Fields | undefined {
    return loggerStorage.getStore()?.additionalFields;
  }

  static debug(message: string, fields?: Fields): void {
    AppLogger.getInstance().debug(message, fields);
  }

  static info(message: string, fields?: Fields): void {
    AppLogger.getInstance().info(message, fields);
  }

  static warn(message: string, fields?: Fields): void {
    AppLogger.getInstance().warn(message, fields);
  }

  static error(message: string, fields?: Fields): void {
    AppLogger.getInstance().error(message, fields);
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  debug(message: string, fields?: Fields): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const context = this.getContext();
    console.debug(message, {
      requestId: context.requestId,
      service: context.service,
      ...(context.additionalFields || {}),
      ...fields,
    });
  }

  info(message: string, fields?: Fields): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const context = this.getContext();
    console.info(message, {
      requestId: context.requestId,
      service: context.service,
      ...(context.additionalFields || {}),
      ...fields,
    });
  }

  warn(message: string, fields?: Fields): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const context = this.getContext();
    console.warn(message, {
      requestId: context.requestId,
      service: context.service,
      ...(context.additionalFields || {}),
      ...fields,
    });
  }

  error(message: string, fields?: Fields): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const context = this.getContext();
    console.error(message, {
      requestId: context.requestId,
      service: context.service,
      ...(context.additionalFields || {}),
      ...fields,
    });
  }
}

export {
  type CustomLogger,
  type LogContext,
  AppLogger,
  LogLevel,
  type LogLevelString,
};
