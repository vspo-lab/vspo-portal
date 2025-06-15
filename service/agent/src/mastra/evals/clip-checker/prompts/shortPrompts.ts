import type { VideoInput } from "./types";

// Base instruction for YouTube Short detection
export const SHORT_INSTRUCTIONS =
  "You are a YouTube content analyzer that identifies if videos are YouTube Shorts.";

// Detection criteria for YouTube Shorts
const SHORT_DETECTION_CRITERIA = `Check for:
- Duration: YouTube Shorts are typically 60 seconds or less
- Short-related tags: #short, #shorts, #youtubeshorts, etc.
- Title indicators: Keywords like "Short", "ショート", etc.
- Description content: Mentions of short-form content`;

// Guidelines for Short detection
const SHORT_DETECTION_GUIDELINES = `Guidelines:
- Videos ≤ 60 seconds are likely Shorts
- Presence of #short, #shorts tags strongly indicates Short
- Title/description mentioning "Short" or "ショート" suggests Short format
- Consider all factors together for final decision`;

// Examples for Short detection
const SHORT_EXAMPLES = `Example YouTube Short:
Title: "面白いゲームシーン #shorts"
Description: "短い動画でお楽しみください！ #short #youtubeshorts"
Tags: ["shorts", "short", "面白い", "ゲーム"]
Duration: 45 seconds
Response: {
  "isYouTubeShort": true,
  "hasShortTags": true,
  "durationIndicatesShort": true,
  "titleIndicatesShort": true,
  "confidence": 0.95
}

Example regular video:
Title: "完全攻略ガイド - 長編解説"
Description: "詳細な解説動画です"
Tags: ["攻略", "解説", "ガイド"]
Duration: 600 seconds
Response: {
  "isYouTubeShort": false,
  "hasShortTags": false,
  "durationIndicatesShort": false,
  "titleIndicatesShort": false,
  "confidence": 0.9
}`;

// Output format for Short detection
const SHORT_OUTPUT_FORMAT = `Return your response in this format:
{
  "isYouTubeShort": boolean,
  "hasShortTags": boolean,
  "durationIndicatesShort": boolean,
  "titleIndicatesShort": boolean,
  "confidence": number // 0.0 to 1.0
}`;

// Main prompt generation function for Short detection
export const generateShortCheckPrompt = ({
  input,
}: {
  input: VideoInput;
}) => {
  const videoInfo = `Video Information to analyze:
Title: ${input.title}
Description: ${input.description || "No description provided"}
Tags: ${input.tags && input.tags.length > 0 ? input.tags.join(", ") : "No tags provided"}
Duration: ${input.duration ? `${input.duration} seconds` : "Duration not provided"}`;

  return `Analyze if this YouTube video is a YouTube Short.

${SHORT_DETECTION_CRITERIA}

${videoInfo}

${SHORT_DETECTION_GUIDELINES}

${SHORT_EXAMPLES}

${SHORT_OUTPUT_FORMAT}`;
};

// Reason generation prompt for Short detection
export const generateShortReasonPrompt = ({
  isYouTubeShort,
  hasShortTags,
  durationIndicatesShort,
  titleIndicatesShort,
  confidence,
}: {
  isYouTubeShort: boolean;
  hasShortTags: boolean;
  durationIndicatesShort: boolean;
  titleIndicatesShort: boolean;
  confidence: number;
}) => {
  const analysisResults = `Analysis results:
- Has Short tags: ${hasShortTags ? "Yes" : "No"}
- Duration indicates Short: ${durationIndicatesShort ? "Yes" : "No"}
- Title indicates Short: ${titleIndicatesShort ? "Yes" : "No"}
- Confidence level: ${(confidence * 100).toFixed(1)}%`;

  const factors = [];
  if (hasShortTags) factors.push("presence of Short-related tags");
  if (durationIndicatesShort) factors.push("duration being 60 seconds or less");
  if (titleIndicatesShort) factors.push("title containing Short indicators");

  if (factors.length === 0) {
    factors.push("absence of Short indicators");
  }

  return `Explain why this video is${isYouTubeShort ? "" : " not"} a YouTube Short.

${analysisResults}

Return your response in this format:
{
  "reason": "This video is ${isYouTubeShort ? "a YouTube Short" : "not a YouTube Short"} because [detailed explanation based on the analysis factors]"
}`;
};
