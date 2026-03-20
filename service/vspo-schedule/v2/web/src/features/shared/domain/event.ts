import { z } from "zod";

/**
 * Zod schema for events
 */
export const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  startedDate: z.string(),
  contentSummary: z.any(), // Type this properly based on the actual structure
  isNotLink: z.boolean().optional(),
});

/**
 * Type definition for an event
 */
export type Event = z.infer<typeof eventSchema>;

/**
 * Type definition for events grouped by date
 */
type EventsByDate = {
  [date: string]: Event[];
};
