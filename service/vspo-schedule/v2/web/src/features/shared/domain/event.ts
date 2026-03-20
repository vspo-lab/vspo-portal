import { z } from "zod";

/**
 * Zod schema for events
 */
export const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  startedDate: z.string(),
  contentSummary: z.record(z.string(), z.unknown()).default({}),
  isNotLink: z.boolean().optional(),
});

/**
 * Type definition for an event
 */
export type Event = z.infer<typeof eventSchema>;
