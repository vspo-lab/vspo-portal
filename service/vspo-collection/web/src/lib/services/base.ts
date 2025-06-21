import { z } from "zod";

// Base pagination schemas
export const PaginationParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).optional(),
});

export const PaginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
    meta: z
      .object({
        requestId: z.string(),
        timestamp: z.string(),
        cached: z.boolean().default(false),
      })
      .optional(),
  });

// Base filter and sort schemas
export const BaseSortSchema = z.object({
  field: z.string(),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const BaseDateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

// API Response wrapper
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
      })
      .optional(),
    meta: z
      .object({
        requestId: z.string(),
        timestamp: z.string(),
        version: z.string().default("1.0"),
      })
      .optional(),
  });

// Inferred types
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    cached?: boolean;
  };
};

export type BaseSort = z.infer<typeof BaseSortSchema>;
export type BaseDateRange = z.infer<typeof BaseDateRangeSchema>;

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
};

// Error classes
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public status = 500,
    public details?: any,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string, id?: string | number) {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

// Utility functions
export class BaseService {
  private static cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  /**
   * Simulate network delay for realistic API behavior
   */
  protected static async simulateNetworkDelay(
    min = 100,
    max = 800,
  ): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Generate a unique request ID
   */
  protected static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate pagination metadata
   */
  protected static calculatePagination(
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponse<any>["pagination"] {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Apply pagination to an array
   */
  protected static paginateArray<T>(
    data: T[],
    params: PaginationParams,
  ): { items: T[]; total: number } {
    const { page, limit, offset } = params;
    const startIndex = offset !== undefined ? offset : (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      items: data.slice(startIndex, endIndex),
      total: data.length,
    };
  }

  /**
   * Sort array by field and direction
   */
  protected static sortArray<T>(data: T[], sort?: BaseSort): T[] {
    if (!sort) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sort.field];
      const bValue = (b as any)[sort.field];

      if (aValue === bValue) return 0;

      let result = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        result = aValue.localeCompare(bValue, "ja");
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        result = aValue - bValue;
      } else {
        result = String(aValue).localeCompare(String(bValue));
      }

      return sort.direction === "desc" ? -result : result;
    });
  }

  /**
   * Filter array by search query (searches multiple fields)
   */
  protected static filterBySearch<T>(
    data: T[],
    query: string,
    searchFields: (keyof T)[],
  ): T[] {
    if (!query) return data;

    const normalizedQuery = query.toLowerCase();
    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (Array.isArray(value)) {
          return value.some((v) =>
            String(v).toLowerCase().includes(normalizedQuery),
          );
        }
        return String(value).toLowerCase().includes(normalizedQuery);
      }),
    );
  }

  /**
   * Simple cache implementation
   */
  protected static setCache(key: string, data: any, ttlMinutes = 5): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    BaseService.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  protected static getCache<T>(key: string): T | null {
    const cached = BaseService.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      BaseService.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  protected static clearCache(pattern?: string): void {
    if (!pattern) {
      BaseService.cache.clear();
      return;
    }

    for (const key of BaseService.cache.keys()) {
      if (key.includes(pattern)) {
        BaseService.cache.delete(key);
      }
    }
  }

  /**
   * Create a standardized API response
   */
  protected static createResponse<T>(
    data: T,
    cached = false,
    requestId?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        requestId: requestId || BaseService.generateRequestId(),
        timestamp: new Date().toISOString(),
        version: "1.0",
      },
    };
  }

  /**
   * Create a standardized error response
   */
  protected static createErrorResponse(
    error: ServiceError,
    requestId?: string,
  ): ApiResponse<never> {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: {
        requestId: requestId || BaseService.generateRequestId(),
        timestamp: new Date().toISOString(),
        version: "1.0",
      },
    };
  }

  /**
   * Create a paginated response
   */
  protected static createPaginatedResponse<T>(
    items: T[],
    pagination: PaginatedResponse<T>["pagination"],
    cached = false,
    requestId?: string,
  ): PaginatedResponse<T> {
    return {
      data: items,
      pagination,
      meta: {
        requestId: requestId || BaseService.generateRequestId(),
        timestamp: new Date().toISOString(),
        cached,
      },
    };
  }

  /**
   * Simulate random failures for testing error handling
   */
  protected static simulateRandomFailure(rate = 0.05): void {
    if (Math.random() < rate) {
      throw new ServiceError(
        "Simulated service failure",
        "SIMULATED_ERROR",
        500,
      );
    }
  }
}

// Common validation helpers
export const validatePagination = (params: unknown): PaginationParams => {
  try {
    return PaginationParamsSchema.parse(params);
  } catch (error) {
    throw new ValidationError("Invalid pagination parameters", error);
  }
};

export const validateId = (id: unknown, resourceName = "Resource"): string => {
  if (!id || typeof id !== "string") {
    throw new ValidationError(`Invalid ${resourceName} ID`);
  }
  return id;
};

export const validateNumber = (value: unknown, fieldName = "Value"): number => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw new ValidationError(`Invalid ${fieldName}: must be a number`);
  }
  return num;
};
