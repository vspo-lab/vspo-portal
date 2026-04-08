import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const announcements = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/data/announcements" }),
  schema: z.object({
    title: z.object({ ja: z.string(), en: z.string() }),
    body: z.object({ ja: z.string(), en: z.string() }),
    date: z.string(),
    type: z.enum(["info", "update", "maintenance"]),
  }),
});

export const collections = { announcements };
