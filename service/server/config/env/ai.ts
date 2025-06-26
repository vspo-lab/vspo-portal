import { z } from "zod";

export const zAIEnv = z.object({
  OPENAI_API_KEY: z.string(),
  OPENAI_ORGANIZATION: z.string(),
  OPENAI_PROJECT: z.string(),
  OPENAI_BASE_URL: z.string(),
  MASTRA_BASE_URL: z.string().default("http://localhost:4111"),
  MASTRA_AGENT_ID: z.string().default("clip-agent"),
  MASTRA_CF_ACCESS_CLIENT_ID: z.string().default("x-api-key"),
  MASTRA_CF_ACCESS_CLIENT_SECRET: z.string().default("x-api-key"),
});

export type AIEnv = z.infer<typeof zAIEnv>;
