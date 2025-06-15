import type { LanguageModel } from "@mastra/core/llm";
import { MastraAgentJudge } from "@mastra/evals/judge";
import { z } from "zod";

import {
  VSPO_CLIP_INSTRUCTIONS,
  type VideoInput,
  generateVspoClipPrompt,
  generateVspoClipReasonPrompt,
} from "./prompts";
import { vspoKeywordMap } from "./vspoKeywords";

export class VspoClipCheckerJudge extends MastraAgentJudge {
  private vspoKeywords: string[];

  constructor(model: LanguageModel) {
    super("Vspo Clip Checker", VSPO_CLIP_INSTRUCTIONS, model);

    // Extract all search keywords from the vspo keyword map
    this.vspoKeywords = vspoKeywordMap.members.flatMap(
      (member) => member.searchKeywords,
    );
  }

  async evaluate(input: VideoInput): Promise<{
    isVspoClip: boolean;
    hasPermissionNumber: boolean;
    detectedMembers: string[];
    permissionNumber: string | null;
    confidence: number;
  }> {
    const clipPrompt = generateVspoClipPrompt({
      input,
      vspoKeywords: this.vspoKeywords,
    });

    // Debug logging
    console.log("=== DEBUG VspoClipCheckerJudge ===");
    console.log("Input:", JSON.stringify(input, null, 2));
    console.log("Vspo Keywords Count:", this.vspoKeywords.length);
    console.log("First 10 Keywords:", this.vspoKeywords.slice(0, 10));
    console.log(`Prompt: ${clipPrompt.substring(0, 500)}...`);
    console.log("=====================================");

    const result = await this.agent.generate(clipPrompt, {
      output: z.object({
        isVspoClip: z.boolean(),
        hasPermissionNumber: z.boolean(),
        detectedMembers: z.array(z.string()),
        permissionNumber: z.string().nullable(),
        confidence: z.number().min(0).max(1),
      }),
    });

    console.log("VspoClipCheckerJudge result:", result.object);

    return result.object;
  }

  async getReason(args: {
    isVspoClip: boolean;
    hasPermissionNumber: boolean;
    detectedMembers: string[];
    permissionNumber: string | null;
    confidence: number;
  }): Promise<string> {
    const prompt = generateVspoClipReasonPrompt(args);
    const result = await this.agent.generate(prompt, {
      output: z.object({
        reason: z.string(),
      }),
    });

    return result.object.reason;
  }

  getVspoKeywords(): string[] {
    return this.vspoKeywords;
  }

  getVspoMembers() {
    return vspoKeywordMap.members;
  }
}
