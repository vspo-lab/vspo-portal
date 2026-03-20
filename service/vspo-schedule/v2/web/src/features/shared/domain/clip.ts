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

// Infer types from schemas
export type Clip = z.infer<typeof clipSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
