import { z } from "zod";
import { videoSchema } from "@/features/shared/domain/video";

/**
 * Zod schema for clips
 */
export const clipSchema = videoSchema.extend({
  type: z.literal("clip"),
  publishedAt: z.string(),
});

/**
 * Zod schema for pagination information
 */
export const paginationSchema = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
  totalItems: z.number(),
  itemsPerPage: z.number(),
});

/**
 * Zod schema for sort options
 */
export const sortOptionSchema = z.enum(["new", "popular", "recommended"]);

/**
 * Zod schema for clip filter conditions
 */
export const clipFilterSchema = z.object({
  members: z.array(z.string()),
  keyword: z.string(),
  timeframe: z.enum(["all", "1day", "1week", "1month"]),
});

// Infer types from schemas
export type Clip = z.infer<typeof clipSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type SortOption = z.infer<typeof sortOptionSchema>;
export type ClipFilter = z.infer<typeof clipFilterSchema>;
