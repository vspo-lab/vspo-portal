import { AppError, Err, Ok, type Result } from "@vspo-lab/error";
import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import type * as apiGen from "./gen/openapi";
import { isLocalEnv, MockHandler } from "./mock";

interface ApiErrorResponse {
  error: {
    code: AppError["code"] | string;
    message: string;
    requestId: string;
  };
}

// Define a simpler approach without using type assertions
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

export interface VSPOApiOptions {
  /**
   * API Key for authentication
   */
  apiKey?: string;

  /**
   * Cloudflare Access Client ID
   */
  cfAccessClientId?: string;

  /**
   * Cloudflare Access Client Secret
   */
  cfAccessClientSecret?: string;

  /**
   * Custom session ID to include in requests
   */
  sessionId?: string;

  /**
   * Base URL for API requests
   *
   */
  baseUrl?: string;

  /**
   * Retry on network errors
   */
  retry?: {
    /**
     * How many attempts should be made
     * The maximum number of requests will be `attempts + 1`
     * `0` means no retries
     *
     * @default 3
     */
    attempts?: number;

    /**
     * Return how many milliseconds to wait until the next attempt is made
     *
     * @default `(retryCount) => Math.round(Math.exp(retryCount) * 50)`
     */
    backoff?: (retryCount: number) => number;
  };
}

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

  private async request<TData>(
    config: AxiosRequestConfig,
  ): Promise<Result<TData, AppError>> {
    let err: Error | null = null;

    const requestConfig = {
      ...config,
      headers: {
        ...config.headers,
        ...this.getHeaders(),
      },
    };

    for (let i = 0; i <= this.retry.attempts; i++) {
      try {
        const response = await axios.request<TData>(requestConfig);
        return Ok(response.data);
      } catch (error) {
        // Initialize with default values satisfying AppError structure
        let errorMessage = "An unexpected error occurred.";
        // Use a default code that is definitely in the AppError['code'] union
        let determinedCode: AppError["code"] = "INTERNAL_SERVER_ERROR";
        // AppError['status'] expects number, not number | undefined. Use 0 for non-HTTP errors.
        let errorStatus = 0;
        // Ensure cause is Error | undefined
        const errorCause: Error | undefined =
          error instanceof Error ? error : undefined;

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          // Axios error handling
          if (error.response) {
            // Error response from server
            const apiError = error.response.data?.error;
            errorStatus = error.response.status; // Assign actual HTTP status
            errorMessage = apiError?.message || `API Error: ${errorStatus}`;
            // Use the specific error code from the API if available and valid
            if (apiError?.code) {
              if (isValidAppErrorCode(apiError.code)) {
                determinedCode = apiError.code;
              } else {
                // If code from API is not a valid AppError code, use default
                determinedCode = "INTERNAL_SERVER_ERROR";
              }
            } else {
              // If no specific code from API, keep default ('INTERNAL_SERVER_ERROR')
              determinedCode = "INTERNAL_SERVER_ERROR";
            }

            // Client errors (4xx) are usually not recoverable with retries
            if (errorStatus >= 400 && errorStatus < 500) {
              err = error;
              break;
            }
          } else if (error.request) {
            // Request made but no response received
            errorMessage = "No response received from the server.";
            determinedCode = "INTERNAL_SERVER_ERROR";
            errorStatus = 0;
          } else {
            // Setup error before request was sent
            errorMessage = error.message;
            determinedCode = "INTERNAL_SERVER_ERROR";
            errorStatus = 0;
          }
        } else {
          // Handle non-Axios errors
          errorMessage = error instanceof Error ? error.message : String(error);
          determinedCode = "INTERNAL_SERVER_ERROR";
          errorStatus = 0;
        }

        err = new AppError({
          message: errorMessage,
          code: determinedCode,
          cause: errorCause,
        });

        // If this is not the last attempt, wait before retrying
        if (i < this.retry.attempts) {
          const backoff = this.retry.backoff(i);
          console.debug(
            `Attempt ${i + 1} of ${this.retry.attempts + 1} failed, retrying in ${backoff}ms: ${errorMessage}`,
          );
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }

    // If we get here, all retries failed
    return Err(err as AppError);
  }

  public get streams() {
    return {
      list: (
        params: apiGen.ListStreamsParams,
        options?: AxiosRequestConfig,
      ): Promise<Result<apiGen.ListStreams200, AppError>> => {
        // Use mock data if in local environment
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          const mockData = MockHandler.getStreams(params);
          return Promise.resolve(Ok(mockData));
        }

        return this.request<apiGen.ListStreams200>({
          ...options,
          method: "GET",
          url: `${this.baseUrl}/streams`,
          params,
        });
      },

      search: (
        body: apiGen.PostStreamBody,
        options?: AxiosRequestConfig,
      ): Promise<Result<apiGen.PostStream200, AppError>> => {
        // Use mock data if in local environment
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          const mockData = MockHandler.searchStreams(body);
          return Promise.resolve(Ok(mockData));
        }

        return this.request<apiGen.PostStream200>({
          ...options,
          method: "POST",
          url: `${this.baseUrl}/streams/search`,
          data: body,
        });
      },
    };
  }

  public get creators() {
    return {
      list: (
        params: apiGen.ListCreatorsParams,
        options?: AxiosRequestConfig,
      ): Promise<Result<apiGen.ListCreators200, AppError>> => {
        // Use mock data if in local environment
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          const mockData = MockHandler.getCreators(params);
          return Promise.resolve(Ok(mockData));
        }

        return this.request<apiGen.ListCreators200>({
          ...options,
          method: "GET",
          url: `${this.baseUrl}/creators`,
          params,
        });
      },
    };
  }

  public get clips() {
    return {
      list: (
        params: apiGen.ListClipsParams,
        options?: AxiosRequestConfig,
      ): Promise<Result<apiGen.ListClips200, AppError>> => {
        // Use mock data if in local environment
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          const mockData = MockHandler.getClips(params);
          return Promise.resolve(Ok(mockData));
        }

        return this.request<apiGen.ListClips200>({
          ...options,
          method: "GET",
          url: `${this.baseUrl}/clips`,
          params,
        });
      },
    };
  }

  public get events() {
    return {
      list: (
        params: apiGen.ListEventsParams,
        options?: AxiosRequestConfig,
      ): Promise<Result<apiGen.ListEvents200, AppError>> => {
        // Use mock data if in local environment
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          const mockData = MockHandler.getEvents(params);
          return Promise.resolve(Ok(mockData));
        }

        return this.request<apiGen.ListEvents200>({
          ...options,
          method: "GET",
          url: `${this.baseUrl}/events`,
          params,
        });
      },

      create: (
        body: apiGen.CreateEventBody,
        options?: AxiosRequestConfig,
      ): Promise<Result<apiGen.CreateEvent201, AppError>> => {
        // Note: For creation endpoints, we still make the API call
        // as mocking creation would require storing state
        return this.request<apiGen.CreateEvent201>({
          ...options,
          method: "POST",
          url: `${this.baseUrl}/events`,
          data: body,
        });
      },

      get: (
        id: string,
        options?: AxiosRequestConfig,
      ): Promise<Result<apiGen.GetEvent200, AppError>> => {
        // Use mock data if in local environment
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          try {
            const mockData = MockHandler.getEvent(id);
            return Promise.resolve(Ok(mockData));
          } catch (_error) {
            // If event not found, return a NOT_FOUND error
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
          ...options,
          method: "GET",
          url: `${this.baseUrl}/events/${id}`,
        });
      },
    };
  }

  public get freechats() {
    return {
      list: (
        params: apiGen.ListFreechatsParams,
        options?: AxiosRequestConfig,
      ): Promise<Result<apiGen.ListFreechats200, AppError>> => {
        // Use mock data if in local environment
        if (isLocalEnv({ baseUrl: this.baseUrl })) {
          const mockData = MockHandler.getFreechats(params);
          return Promise.resolve(Ok(mockData));
        }

        return this.request<apiGen.ListFreechats200>({
          ...options,
          method: "GET",
          url: `${this.baseUrl}/freechats`,
          params,
        });
      },
    };
  }
}
