import { z } from "zod";

// Zod schema definition for channel information
const channelSchema = z.object({
  id: z.string(),
  name: z.string(),
  thumbnailURL: z.string(), // Match property name from API response
  active: z.boolean().default(true),
  memberType: z.string(),
});

// Generate type from Zod schema
export type Channel = z.infer<typeof channelSchema>;
