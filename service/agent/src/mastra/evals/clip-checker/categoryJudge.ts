import type { LanguageModel } from "@mastra/core/llm";
import { MastraAgentJudge } from "@mastra/evals/judge";
import { z } from "zod";
import type { CategoryInput } from "./prompts";
import {
  CATEGORY_INSTRUCTIONS,
  generateCategoryMatchPrompt,
  generateCategoryReasonPrompt,
} from "./prompts";

export class CategoryMatcherJudge extends MastraAgentJudge {
  constructor(model: LanguageModel) {
    super("VTuber Stream Category Matcher", CATEGORY_INSTRUCTIONS, model);
  }

  async evaluate(input: CategoryInput): Promise<{
    matchedCategory: string | null;
    confidence: number;
    isNewCategory: boolean;
    suggestedNewCategory: string | null;
    gameTitle: string | null;
  }> {
    const categoryPrompt = generateCategoryMatchPrompt({ input });

    // Debug logging
    console.log("=== DEBUG CategoryMatcherJudge ===");
    console.log("Input:", JSON.stringify(input, null, 2));
    console.log("Existing Categories:", input.existingCategories);
    console.log(`Prompt: ${categoryPrompt.substring(0, 500)}...`);
    console.log("==================================");

    const result = await this.agent.generate(categoryPrompt, {
      output: z.object({
        matchedCategory: z.string().nullable(),
        confidence: z.number().min(0).max(1),
        isNewCategory: z.boolean(),
        suggestedNewCategory: z.string().nullable(),
        gameTitle: z.string().nullable(),
      }),
    });

    console.log("CategoryMatcherJudge result:", result.object);

    return result.object;
  }

  async getReason(args: {
    matchedCategory: string | null;
    confidence: number;
    isNewCategory: boolean;
    suggestedNewCategory: string | null;
    gameTitle: string | null;
  }): Promise<string> {
    const prompt = generateCategoryReasonPrompt(args);
    const result = await this.agent.generate(prompt, {
      output: z.object({
        reason: z.string(),
      }),
    });

    return result.object.reason;
  }

  getDefaultCategories(): string[] {
    return [
      // ゲームカテゴリ（人気タイトル）
      "APEX Legends",
      "Valorant",
      "Fortnite",
      "Minecraft",
      "Dead by Daylight",
      "League of Legends",
      "Overwatch 2",
      "Call of Duty",
      "Fall Guys",
      "Among Us",
      "Genshin Impact",
      "ポケモン",
      "スプラトゥーン",
      "マリオカート",
      "ストリートファイター",
      "原神",
      "ウマ娘",
      "モンスターハンター",
      "ファイナルファンタジー",
      "ドラゴンクエスト",
      // 配信コンテンツ
      "雑談",
      "歌枠",
      "ゲーム雑談",
      "コラボ配信",
      "企画配信",
      "お絵描き配信",
      "料理配信",
      "ASMR",
      "朝活",
      "その他",
    ];
  }

  getPopularGames(): string[] {
    return [
      "APEX Legends",
      "エーペックス",
      "エペ",
      "APEX",
      "Valorant",
      "ヴァロラント",
      "バロラント",
      "VALO",
      "Fortnite",
      "フォートナイト",
      "フォトナ",
      "Minecraft",
      "マインクラフト",
      "マイクラ",
      "Dead by Daylight",
      "デッドバイデイライト",
      "DbD",
      "DBD",
      "League of Legends",
      "リーグオブレジェンズ",
      "LoL",
      "LOL",
      "Overwatch",
      "オーバーウォッチ",
      "OW",
      "Call of Duty",
      "コールオブデューティー",
      "CoD",
      "COD",
      "Fall Guys",
      "フォールガイズ",
      "Among Us",
      "アマングアス",
      "アモングアス",
      "Genshin Impact",
      "原神",
      "げんしん",
      "ポケモン",
      "Pokemon",
      "ポケットモンスター",
      "スプラトゥーン",
      "Splatoon",
      "スプラ",
      "マリオカート",
      "Mario Kart",
      "マリカ",
      "ストリートファイター",
      "Street Fighter",
      "ストファイ",
      "スト6",
      "ウマ娘",
      "Uma Musume",
      "モンスターハンター",
      "Monster Hunter",
      "モンハン",
      "MH",
      "ファイナルファンタジー",
      "Final Fantasy",
      "FF",
      "ファイファン",
      "ドラゴンクエスト",
      "Dragon Quest",
      "ドラクエ",
      "DQ",
    ];
  }
}
