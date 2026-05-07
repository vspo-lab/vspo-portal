import { AppError, Err, Ok, type Result } from "@vspo-lab/error";
import type * as apiGen from "./gen/openapi";
import { isLocalEnv, MockHandler } from "./mock";

type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
};

function isValidAppErrorCode(code: string): code is AppError["code"] {
  return [
    "BAD_REQUEST",
    "FORBIDDEN",
    "INTERNAL_SERVER_ERROR",
    "USAGE_EXCEEDED",
    "DISABLED",
    "NOT_FOUND",
    "NOT_UNIQUE",
    "RATE_LIMITED",
    "UNAUTHORIZED",
    "PRECONDITION_FAILED",
    "INSUFFICIENT_PERMISSIONS",
    "METHOD_NOT_ALLOWED",
  ].includes(code);
}

export type RequestOptions = {
  signal?: AbortSignal;
};

type RequestConfig = {
  method: string;
  url: string;
  params?: Record<string, string | string[] | undefined>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal | undefined;
};

export type VSPOApiOptions = {
  apiKey?: string;
  cfAccessClientId?: string;
  cfAccessClientSecret?: string;
  sessionId?: string;
  baseUrl?: string;
  retry?: {
    /** @default 3 */
    attempts?: number;
    /** @default `(retryCount) => Math.round(Math.exp(retryCount) * 50)` */
    backoff?: (retryCount: number) => number;
  };
};

export class VSPOApi {
  private readonly apiKey: string | undefined;
  private readonly cfAccessClientId: string | undefined;
  private readonly cfAccessClientSecret: string | undefined;
  private readonly sessionId: string | undefined;
  public readonly baseUrl: string;

  public readonly retry: {
    attempts: number;
    backoff: (retryCount: number) => number;
  };

  constructor(opts: VSPOApiOptions = {}) {
    this.apiKey = opts.apiKey;
    this.cfAccessClientId = opts.cfAccessClientId;
    this.cfAccessClientSecret = opts.cfAccessClientSecret;
    this.sessionId = opts.sessionId;
    this.baseUrl = opts.baseUrl ?? "http://localhost:3000";

    this.retry = {
      attempts: opts.retry?.attempts ?? 3,
      backoff: opts.retry?.backoff ?? ((n) => Math.round(Math.exp(n) * 50)),
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["x-api-key"] = this.apiKey;
    }

    if (this.cfAccessClientId) {
      headers["CF-Access-Client-Id"] = this.cfAccessClientId;
    }

    if (this.cfAccessClientSecret) {
      headers["CF-Access-Client-Secret"] = this.cfAccessClientSecret;
    }

    if (this.sessionId) {
      headers["x-session-id"] = this.sessionId;
    }

    return headers;
  }

  /** Build a URL with query parameters appended. */
  private buildUrl(
    base: string,
    params?: Record<string, string | string[] | undefined>,
  ): string {
    if (!params) return base;

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          searchParams.append(key, v);
        }
      } else {
        searchParams.append(key, value);
      }
    }

    const qs = searchParams.toString();
    return qs ? `${base}?${qs}` : base;
  }

  private async request<TData>(
    config: RequestConfig,
  ): Promise<Result<TData, AppError>> {
    let err: Error | null = null;

    for (let i = 0; i <= this.retry.attempts; i++) {
      const url = this.buildUrl(config.url, config.params);
      const init: RequestInit = {
        method: config.method,
        headers: {
          ...this.getHeaders(),
          ...config.headers,
        },
        ...(config.signal != null ? { signal: config.signal } : {}),
      };

      if (config.data !== undefined) {
        init.body = JSON.stringify(config.data);
      }

      let response: Response;
      try {
        response = await fetch(url, init);
      } catch (error) {
        const errorCause = error instanceof Error ? error : undefined;
        err = new AppError({
          message:
            error instanceof Error
              ? error.message
              : "No response received from the server.",
          code: "INTERNAL_SERVER_ERROR",
          cause: errorCause,
        });

        if (i < this.retry.attempts) {
          const backoff = this.retry.backoff(i);
          await new Promise((r) => setTimeout(r, backoff));
        }
        continue;
      }

      if (response.ok) {
        const data = (await response.json()) as TData;
        return Ok(data);
      }

      // Error response from server
      let errorMessage = `API Error: ${response.status}`;
      let determinedCode: AppError["code"] = "INTERNAL_SERVER_ERROR";

      try {
        const body = (await response.json()) as ApiErrorResponse;
        const apiError = body?.error;
        if (apiError?.message) {
          errorMessage = apiError.message;
        }
        if (apiError?.code && isValidAppErrorCode(apiError.code)) {
          determinedCode = apiError.code;
        }
      } catch {
        // Could not parse error body — keep defaults
      }

      err = new AppError({
        message: errorMessage,
        code: determinedCode,
      });

      // Client errors (4xx) are usually not recoverable with retries
      if (response.status >= 400 && response.status < 500) {
        break;
      }

      if (i < this.retry.attempts) {
        const backoff = this.retry.backoff(i);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }

    return Err(err as AppError);
  }

  public get streams() {
    return {
      list: (
        params: apiGen.ListStreamsParams,
        options?: RequestOptions,
      ): Promise<Result<apiGen.ListStreams200, AppError>> => {
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          const mockData = MockHandler.getStreams(params);
          return Promise.resolve(Ok(mockData));
        }

        return this.request<apiGen.ListStreams200>({
          method: "GET",
          url: `${this.baseUrl}/streams`,
          params,
          signal: options?.signal,
        });
      },

      search: (
        body: apiGen.PostStreamBody,
        options?: RequestOptions,
      ): Promise<Result<apiGen.PostStream200, AppError>> => {
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          const mockData = MockHandler.searchStreams(body);
          return Promise.resolve(Ok(mockData));
        }

        return this.request<apiGen.PostStream200>({
          method: "POST",
          url: `${this.baseUrl}/streams/search`,
          data: body,
          signal: options?.signal,
        });
      },
    };
  }

  public get creators() {
    return {
      list: (
        params: apiGen.ListCreatorsParams,
        options?: RequestOptions,
      ): Promise<Result<apiGen.ListCreators200, AppError>> => {
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          const mockData = MockHandler.getCreators(params);
          return Promise.resolve(Ok(mockData));
        }

        return this.request<apiGen.ListCreators200>({
          method: "GET",
          url: `${this.baseUrl}/creators`,
          params,
          signal: options?.signal,
        });
      },
    };
  }

  public get clips() {
    return {
      list: (
        params: apiGen.ListClipsParams,
        options?: RequestOptions,
      ): Promise<Result<apiGen.ListClips200, AppError>> => {
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          const mockData = MockHandler.getClips(params);
          return Promise.resolve(Ok(mockData));
        }

        return this.request<apiGen.ListClips200>({
          method: "GET",
          url: `${this.baseUrl}/clips`,
          params,
          signal: options?.signal,
        });
      },
    };
  }

  public get events() {
    return {
      list: (
        params: apiGen.ListEventsParams,
        options?: RequestOptions,
      ): Promise<Result<apiGen.ListEvents200, AppError>> => {
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          const mockData = MockHandler.getEvents(params);
          return Promise.resolve(Ok(mockData));
        }

        return this.request<apiGen.ListEvents200>({
          method: "GET",
          url: `${this.baseUrl}/events`,
          params,
          signal: options?.signal,
        });
      },

      create: (
        body: apiGen.CreateEventBody,
        options?: RequestOptions,
      ): Promise<Result<apiGen.CreateEvent201, AppError>> => {
        return this.request<apiGen.CreateEvent201>({
          method: "POST",
          url: `${this.baseUrl}/events`,
          data: body,
          signal: options?.signal,
        });
      },

      get: (
        id: string,
        options?: RequestOptions,
      ): Promise<Result<apiGen.GetEvent200, AppError>> => {
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          try {
            const mockData = MockHandler.getEvent(id);
            return Promise.resolve(Ok(mockData));
          } catch (_error) {
            return Promise.resolve(
              Err(
                new AppError({
                  message: `Event with ID ${id} not found`,
                  code: "NOT_FOUND",
                }),
              ),
            );
          }
        }

        return this.request<apiGen.GetEvent200>({
          method: "GET",
          url: `${this.baseUrl}/events/${id}`,
          signal: options?.signal,
        });
      },
    };
  }

  public get freechats() {
    return {
      list: (
        params: apiGen.ListFreechatsParams,
        options?: RequestOptions,
      ): Promise<Result<apiGen.ListFreechats200, AppError>> => {
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          const mockData = MockHandler.getFreechats(params);
          return Promise.resolve(Ok(mockData));
        }

        return this.request<apiGen.ListFreechats200>({
          method: "GET",
          url: `${this.baseUrl}/freechats`,
          params,
          signal: options?.signal,
        });
      },
    };
  }
}
