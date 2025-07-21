import { z } from "zod";
import { videoSchema } from "@/features/shared/domain/video";

// Status types
export const statusSchema = z.enum(["live", "upcoming", "ended", "unknown"]);
export type Status = z.infer<typeof statusSchema>;

// Livestream model
export const livestreamSchema = videoSchema.extend({
  type: z.literal("livestream"),
  status: statusSchema,
  scheduledStartTime: z.string(),
  scheduledEndTime: z.string().nullable(),
});

export type Livestream = z.infer<typeof livestreamSchema>;
