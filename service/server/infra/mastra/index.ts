import { MastraClient } from "@mastra/client-js";
import {
  AppError,
  Err,
  ErrorCodeSchema,
  Ok,
  type Result,
  wrap,
} from "@vspo-lab/error";
import { z } from "zod";
import { withTracerResult } from "../http/trace/cloudflare";

const ClipAnalysisResponseSchema = z.object({
  isVSPOClip: z.object({
    result: z.boolean(),
    confidence: z.number().min(0).max(1),
    vspoMembers: z.array(z.string()),
    permissionNumber: z.string().optional(),
    reasoning: z.string(),
  }),
  isYouTubeShort: z.object({
    result: z.boolean(),
    confidence: z.number().min(0).max(1),
    duration: z.number().optional(),
    hasShortTag: z.boolean(),
    reasoning: z.string(),
  }),
  category: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    confidence: z.number().min(0).max(1),
    suggestedNewCategory: z.string().optional(),
    reasoning: z.string(),
  }),
});

export type ClipAnalysisResponse = z.infer<typeof ClipAnalysisResponseSchema>;

export interface IMastraService {
  analyzeClip(params: {
    title: string;
    description: string;
    tags: string[];
    duration: number;
    existingCategories?: string[];
  }): Promise<Result<ClipAnalysisResponse, AppError>>;
}

type MastraConfig = {
  cfAccessClientId: string;
  cfAccessClientSecret: string;
  baseUrl: string;
  agentId: string;
  retries?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
  headers?: Record<string, string>;
};

// Factory function following the project pattern
export const createMastraService = (config: MastraConfig): IMastraService => {
  const client = new MastraClient({
    baseUrl: config.baseUrl,
    retries: config.retries,
    backoffMs: config.backoffMs,
    maxBackoffMs: config.maxBackoffMs,
    headers: {
      "CF-Access-Client-Id": config.cfAccessClientId,
      "CF-Access-Client-Secret": config.cfAccessClientSecret,
      ...config.headers,
    },
  });

  const analyzeClip = async (params: {
    title: string;
    description: string;
    tags: string[];
    duration: number;
    existingCategories?: string[];
  }): Promise<Result<ClipAnalysisResponse, AppError>> => {
    return withTracerResult("mastra", "analyzeClip", async (_span) => {
      // Prepare the message for the agent
      const messageContent = JSON.stringify({
        title: params.title,
        description: params.description,
        tags: params.tags,
        duration: params.duration,
        existingCategories: params.existingCategories || [],
      });

      // Call the Mastra agent
      const agent = client.getAgent(config.agentId);
      const responseResult = await wrap(
        agent.generate({
          messages: messageContent,
          output: ClipAnalysisResponseSchema,
        }),
        (err) =>
          new AppError({
            message: `Mastra API error: ${err.message}`,
            code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
            cause: err,
          }),
      );

      if (responseResult.err) {
        return Err(responseResult.err);
      }
      const validatedResult = ClipAnalysisResponseSchema.safeParse(
        responseResult.val.object,
      );
      if (!validatedResult.success) {
        return Err(
          new AppError({
            message: "Invalid clip analysis result format",
            code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
          }),
        );
      }

      return Ok(validatedResult.data);
    });
  };

  return {
    analyzeClip,
  };
};
