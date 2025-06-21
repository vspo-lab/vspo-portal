import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { videoTable } from "./index";

// Clip analysis table for storing AI analysis results
export const clipAnalysisTable = pgTable(
  "clip_analysis",
  {
    id: text("id").primaryKey(), // Unique identifier
    videoId: text("video_id")
      .notNull()
      .references(() => videoTable.id, { onDelete: "cascade" })
      .unique(), // Foreign key to video table
    isShort: boolean("is_short").notNull(), // Whether the clip is a short video
    isVspoClip: boolean("is_vspo_clip").notNull(), // Whether the clip is a VSPO official clip
    confidence: numeric("confidence", { precision: 3, scale: 2 }).notNull(), // Confidence score (0.00-1.00)
    analyzedAt: timestamp("analyzed_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(), // When the analysis was performed
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(), // Record creation timestamp
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(), // Last update timestamp
  },
  (table) => ({
    videoIdIdx: index("clip_analysis_video_id_idx").on(table.videoId),
    isShortIdx: index("clip_analysis_is_short_idx").on(table.isShort),
    isVspoClipIdx: index("clip_analysis_is_vspo_clip_idx").on(table.isVspoClip),
    analyzedAtIdx: index("clip_analysis_analyzed_at_idx").on(table.analyzedAt),
  }),
);

// Type definitions
export type InsertClipAnalysis = typeof clipAnalysisTable.$inferInsert;
export type SelectClipAnalysis = typeof clipAnalysisTable.$inferSelect;

// Zod schemas for validation
export const insertClipAnalysisSchema = createInsertSchema(clipAnalysisTable);
export const selectClipAnalysisSchema = createSelectSchema(clipAnalysisTable);

// Helper function to create validated insert data
export const createInsertClipAnalysis = (data: InsertClipAnalysis) =>
  insertClipAnalysisSchema.parse(data);
