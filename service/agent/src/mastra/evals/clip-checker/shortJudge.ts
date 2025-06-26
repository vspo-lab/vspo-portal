import type { LanguageModel } from "@mastra/core/llm";
import { MastraAgentJudge } from "@mastra/evals/judge";
import { z } from "zod";
import type { VideoInput } from "./prompts";
import {
  SHORT_INSTRUCTIONS,
  generateShortCheckPrompt,
  generateShortReasonPrompt,
} from "./prompts";

export class YouTubeShortCheckerJudge extends MastraAgentJudge {
  constructor(model: LanguageModel) {
    super("YouTube Short Checker", SHORT_INSTRUCTIONS, model);
  }

  async evaluate(input: VideoInput): Promise<{
    isYouTubeShort: boolean;
    hasShortTags: boolean;
    durationIndicatesShort: boolean;
    titleIndicatesShort: boolean;
    confidence: number;
  }> {
    const shortPrompt = generateShortCheckPrompt({ input });

    const result = await this.agent.generate(shortPrompt, {
      output: z.object({
        isYouTubeShort: z.boolean(),
        hasShortTags: z.boolean(),
        durationIndicatesShort: z.boolean(),
        titleIndicatesShort: z.boolean(),
        confidence: z.number().min(0).max(1),
      }),
    });

    return result.object;
  }

  async getReason(args: {
    isYouTubeShort: boolean;
    hasShortTags: boolean;
    durationIndicatesShort: boolean;
    titleIndicatesShort: boolean;
    confidence: number;
  }): Promise<string> {
    const prompt = generateShortReasonPrompt(args);
    const result = await this.agent.generate(prompt, {
      output: z.object({
        reason: z.string(),
      }),
    });

    return result.object.reason;
  }

  getShortIndicators(): string[] {
    return [
      "#short",
      "#shorts",
      "#youtubeshorts",
      "#shortsvideo",
      "ショート",
      "Short",
      "Shorts",
    ];
  }
}
