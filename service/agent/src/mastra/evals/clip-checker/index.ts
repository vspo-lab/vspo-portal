import { Metric, type MetricResult } from "@mastra/core/eval";
import type { LanguageModel } from "@mastra/core/llm";

import { CategoryMatcherJudge } from "./categoryJudge";
import type { CategoryInput, VideoInput } from "./prompts";
import { YouTubeShortCheckerJudge } from "./shortJudge";
import { VspoClipCheckerJudge } from "./vspoJudge";

export interface VspoClipMetricResult extends MetricResult {
  info: {
    reason: string;
    isVspoClip: boolean;
    hasPermissionNumber: boolean;
    detectedMembers: string[];
    permissionNumber: string | null;
    confidence: number;
  };
}

export interface YouTubeShortMetricResult extends MetricResult {
  info: {
    reason: string;
    isYouTubeShort: boolean;
    hasShortTags: boolean;
    durationIndicatesShort: boolean;
    titleIndicatesShort: boolean;
    confidence: number;
  };
}

export interface CategoryMatcherMetricResult extends MetricResult {
  info: {
    reason: string;
    matchedCategory: string | null;
    confidence: number;
    isNewCategory: boolean;
    suggestedNewCategory: string | null;
    gameTitle: string | null;
  };
}

export class VspoClipCheckerMetric extends Metric {
  private judge: VspoClipCheckerJudge;

  constructor(model: LanguageModel) {
    super();
    this.judge = new VspoClipCheckerJudge(model);
  }

  async measure(input: string, output: string): Promise<VspoClipMetricResult> {
    // Parse the input as VideoInput (assuming it's JSON)
    const videoInput: VideoInput = JSON.parse(input);
    const result = await this.judge.evaluate(videoInput);
    const score = await this.calculateScore(
      result.isVspoClip,
      result.confidence,
    );
    const reason = await this.judge.getReason(result);

    return {
      score,
      info: {
        reason,
        ...result,
      },
    };
  }

  async calculateScore(
    isVspoClip: boolean,
    confidence: number,
  ): Promise<number> {
    // Use confidence to weight the score
    // If it's a vspo clip, return the confidence level
    // If it's not a vspo clip, return 1 - confidence (higher confidence in "not vspo" = higher score)
    return isVspoClip ? confidence : 1 - confidence;
  }
}

export class YouTubeShortCheckerMetric extends Metric {
  private judge: YouTubeShortCheckerJudge;

  constructor(model: LanguageModel) {
    super();
    this.judge = new YouTubeShortCheckerJudge(model);
  }

  async measure(
    input: string,
    output: string,
  ): Promise<YouTubeShortMetricResult> {
    // Parse the input as VideoInput (assuming it's JSON)
    const videoInput: VideoInput = JSON.parse(input);
    const result = await this.judge.evaluate(videoInput);
    const score = await this.calculateScore(
      result.isYouTubeShort,
      result.confidence,
    );
    const reason = await this.judge.getReason(result);

    return {
      score,
      info: {
        reason,
        ...result,
      },
    };
  }

  async calculateScore(
    isYouTubeShort: boolean,
    confidence: number,
  ): Promise<number> {
    // Use confidence as score weighting for YouTube Short detection
    return isYouTubeShort ? confidence : 1 - confidence;
  }
}

export class CategoryMatcherMetric extends Metric {
  private judge: CategoryMatcherJudge;

  constructor(model: LanguageModel) {
    super();
    this.judge = new CategoryMatcherJudge(model);
  }

  async measure(
    input: string,
    output: string,
  ): Promise<CategoryMatcherMetricResult> {
    // Parse the input as CategoryInput (assuming it's JSON)
    const categoryInput: CategoryInput = JSON.parse(input);
    const result = await this.judge.evaluate(categoryInput);
    const score = await this.calculateScore(
      result.confidence,
      result.isNewCategory,
    );
    const reason = await this.judge.getReason(result);

    return {
      score,
      info: {
        reason,
        ...result,
      },
    };
  }

  async calculateScore(
    confidence: number,
    isNewCategory: boolean,
  ): Promise<number> {
    // Higher confidence = higher score
    // New categories get a slight boost if confidence is high (encouraging discovery)
    const baseScore = confidence;
    const newCategoryBonus = isNewCategory && confidence > 0.7 ? 0.1 : 0;
    return Math.min(1.0, baseScore + newCategoryBonus);
  }
}
