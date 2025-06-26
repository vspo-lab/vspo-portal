import type { CategoryInput } from "./types";

// Base instruction for category matching
export const CATEGORY_INSTRUCTIONS =
  "You are a VTuber streaming content categorization analyzer that matches video content to the most appropriate category with focus on games (specific titles), chatting, and other streaming content.";

// VTuber content classification guidelines
const CATEGORY_CLASSIFICATION_GUIDELINES = `VTuber Content Classification Guidelines:
1. **Game Content** - Look for specific game titles, gaming keywords, gameplay mentions
2. **Chatting Content** - Look for conversation, talk, discussion, daily life topics
3. **Other Streaming Content** - Singing, drawing, cooking, ASMR, collaboration, special projects`;

// Popular game keywords
const GAME_KEYWORDS = `Popular Game Keywords to Watch For:
- APEX系: "APEX", "エーペックス", "エペ", "APEX Legends"
- Valorant系: "Valorant", "ヴァロラント", "バロラント", "VALO"
- Minecraft系: "Minecraft", "マインクラフト", "マイクラ"
- その他人気ゲーム: "フォートナイト", "デッバイ", "原神", "ポケモン", "スプラ", etc.`;

// Chatting keywords
const CHATTING_KEYWORDS = `Chatting Keywords to Watch For:
- "雑談", "おしゃべり", "トーク", "話", "日常", "近況", "相談", "質問コーナー"`;

// Analysis guidelines
const CATEGORY_ANALYSIS_GUIDELINES = `Analysis Guidelines:
1. **Game Detection Priority**: 
   - Search for specific game titles in title/description/tags
   - If found, match to the specific game category or suggest new game category
   - Extract the actual game title for gameTitle field
   
2. **Chatting Detection**:
   - Look for chatting keywords
   - Consider content without game mentions as potential chatting
   
3. **Confidence Scoring**:
   - High confidence (0.8-1.0): Clear game title or chatting keywords found
   - Medium confidence (0.5-0.7): Partial matches or contextual clues
   - Low confidence (0.1-0.4): Ambiguous content or no clear indicators

4. **New Category Suggestions**:
   - Suggest new game-specific categories for unrecognized games
   - Use format: "Game Title" (exact game name)
   - For non-game content, suggest descriptive categories`;

// Examples for category matching
const CATEGORY_EXAMPLES = `Example with specific game:
Title: "【APEX】ランク上げ頑張る！"
Description: "APEX Legendsでランクマッチに挑戦"
Tags: ["APEX", "ランク", "FPS"]
Existing Categories: ["雑談", "歌枠", "その他"]
Response: {
  "matchedCategory": null,
  "confidence": 0.9,
  "isNewCategory": true,
  "suggestedNewCategory": "APEX Legends",
  "gameTitle": "APEX Legends"
}

Example with chatting:
Title: "おはよう雑談！今日の予定話すよ～"
Description: "朝の雑談配信です"
Tags: ["雑談", "おしゃべり", "朝活"]
Existing Categories: ["APEX Legends", "雑談", "歌枠"]
Response: {
  "matchedCategory": "雑談",
  "confidence": 0.95,
  "isNewCategory": false,
  "suggestedNewCategory": null,
  "gameTitle": null
}

Example with existing game category match:
Title: "マイクラで建築しよう！"
Description: "Minecraftで街作り"
Tags: ["Minecraft", "建築", "マイクラ"]
Existing Categories: ["Minecraft", "雑談", "歌枠"]
Response: {
  "matchedCategory": "Minecraft",
  "confidence": 0.9,
  "isNewCategory": false,
  "suggestedNewCategory": null,
  "gameTitle": "Minecraft"
}`;

// Output format for category matching
const CATEGORY_OUTPUT_FORMAT = `Return your response in this exact JSON format:
{
  "matchedCategory": "string or null",
  "confidence": number, // 0.0 to 1.0
  "isNewCategory": boolean,
  "suggestedNewCategory": "string or null",
  "gameTitle": "string or null" // Extract specific game title if detected
}`;

// Main prompt generation function for category matching
export const generateCategoryMatchPrompt = ({
  input,
}: {
  input: CategoryInput;
}) => {
  const existingCategories = `Existing Categories:
${input.existingCategories.map((cat, index) => `${index + 1}. ${cat}`).join("\n")}`;

  const videoInfo = `Video Information to analyze:
Title: ${input.title}
Description: ${input.description || "No description provided"}
Tags: ${input.tags && input.tags.length > 0 ? input.tags.join(", ") : "No tags provided"}`;

  return `Analyze this VTuber streaming content and determine the most appropriate category from the existing list, or suggest a new category if none fit well.

${CATEGORY_CLASSIFICATION_GUIDELINES}

${existingCategories}

${GAME_KEYWORDS}

${CHATTING_KEYWORDS}

${videoInfo}

${CATEGORY_ANALYSIS_GUIDELINES}

${CATEGORY_EXAMPLES}

${CATEGORY_OUTPUT_FORMAT}`;
};

// Reason generation prompt for category matching
export const generateCategoryReasonPrompt = ({
  matchedCategory,
  confidence,
  isNewCategory,
  suggestedNewCategory,
  gameTitle,
}: {
  matchedCategory: string | null;
  confidence: number;
  isNewCategory: boolean;
  suggestedNewCategory: string | null;
  gameTitle: string | null;
}) => {
  const classificationResults = `Classification results:
- Matched category: ${matchedCategory || "None"}
- Confidence level: ${(confidence * 100).toFixed(1)}%
- Is new category: ${isNewCategory ? "Yes" : "No"}
- Suggested new category: ${suggestedNewCategory || "None"}
- Detected game title: ${gameTitle || "None"}`;

  const confidenceLevel =
    confidence < 0.5 ? "low" : confidence < 0.8 ? "moderate" : "high";

  let categoryDescription: string;
  if (isNewCategory) {
    categoryDescription = `should be categorized as a new category '${suggestedNewCategory}'`;
  } else {
    categoryDescription = `matches the category '${matchedCategory}'`;
  }

  const gameInfo = gameTitle ? `Detected game: ${gameTitle}.` : "";

  return `Explain the category classification decision for this VTuber streaming content.

${classificationResults}

Return your response in this format:
{
  "reason": "This VTuber streaming content ${categoryDescription} because [detailed explanation]. ${gameInfo} Confidence is ${confidenceLevel} due to [reasoning about confidence level]."
}`;
};
