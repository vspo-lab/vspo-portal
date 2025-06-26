import type { VideoInput } from "./types";

// Base instruction for VSPO clip detection
export const VSPO_CLIP_INSTRUCTIONS =
  "You are a YouTube content analyzer that identifies if clip videos are official vspo clips.";

// System rules for VSPO member detection
const VSPO_DETECTION_RULES = `CRITICAL VSPO MEMBER DETECTION RULES:
1. **ONLY USE PROVIDED KEYWORD LIST** - You can ONLY detect members whose names appear in the provided vspoKeywords list below
2. **DO NOT USE EXTERNAL KNOWLEDGE** - Do not use your general knowledge about VTubers or any other sources
3. **STRICT KEYWORD MATCHING** - Only match exact names or variations from the provided list
4. **EXCLUDE ALL OTHER VTUBERS** - Members from Nijisanji, Hololive, or any other VTuber groups are NOT vspo members
5. **Member Detection is MANDATORY** - A video can ONLY be classified as vspo clip if actual vspo members from the list are detected

**MEMBER KEYWORD DETECTION PROCESS (prioritize by reliability):**
- Step 1: First scan TITLE for ANY occurrence of keywords from the provided list (HIGHEST PRIORITY)
- Step 2: Then scan DESCRIPTION for keywords (MEDIUM PRIORITY)  
- Step 3: Finally scan TAGS for keywords (LOWEST PRIORITY - may contain fake information)
- Step 4: If ANY keyword from the list is found, add it to detectedMembers array
- Step 5: If detectedMembers array has 1+ entries → isVspoClip = true (confidence based on source reliability)
- Step 6: If detectedMembers array is empty → isVspoClip = false (regardless of any other factors)

**CRITICAL: 許諾番号（Permission Number）があってもメンバーキーワードが最優先**
- 許諾番号が含まれていても、それだけではvspo切り抜きとは限らない
- メンバーキーワードの検出が必須条件であり、許諾番号は補助的な情報に過ぎない
- 許諾番号があってもメンバーが検出されない場合 → isVspoClip = false`;

// Important exclusions
const VSPO_EXCLUSIONS = `IMPORTANT EXCLUSIONS - THESE ARE NOT VSPO MEMBERS:
- Any Nijisanji members (にじさんじ) - NOT vspo members
- Any Hololive members - NOT vspo members  
- Any other VTuber agency members - NOT vspo members
- Only members explicitly listed in the vspoKeywords below are valid`;

// Detection criteria
const VSPO_DETECTION_CRITERIA = `Check for the following criteria:
1. **Vspo member keywords (HIGHEST PRIORITY)** - Match ONLY these exact names or variations from the list above
2. **Content relevance** - Gaming, streaming, member activities related to vspo
3. **Optional: Permission number** - Look for "許諾番号" with numbers (not required for classification)`;

// Matching rules
const VSPO_MATCHING_RULES = `STRICT MATCHING RULES:
- **MUST HAVE DETECTED MEMBERS FROM LIST**: If no members from the provided keyword list are found → isVspoClip MUST be false
- **EXACT KEYWORD MATCHING**: Only names that appear in the vspoKeywords list can be added to detectedMembers
- **NO EXTERNAL MEMBER DETECTION**: Never detect members not in the provided list, even if they seem like VTubers
- **PERMISSION NUMBER IS NOT SUFFICIENT**: 許諾番号があっても、メンバーが検出されない場合はvspo切り抜きではない
- **MEMBER KEYWORDS > PERMISSION NUMBER**: メンバーキーワード検出 > 許諾番号の有無
- **NIJISANJI EXCLUSION**: If "にじさんじ" is mentioned, this strongly indicates NON-vspo content
- **No Valid Members = Not Vspo**: Even with "ぶいすぽ" terms or permission numbers, if no valid members from the list are detected → isVspoClip = false`;

// Confidence scoring rules
const VSPO_CONFIDENCE_RULES = `CONFIDENCE SCORING RULES:
- If detectedMembers is empty (no valid members from list found) → confidence should be VERY LOW (0.05-0.15) and isVspoClip = false
- If "にじさんじ" is mentioned and no vspo members detected → confidence should be EXTREMELY LOW (0.05) and isVspoClip = false
- If detectedMembers has 1+ valid members from list → confidence should be HIGH based on source reliability:

CONTENT RELIABILITY HIERARCHY (affects confidence scoring):
1. TITLE - HIGHEST RELIABILITY: Most trustworthy source for member detection
   - Member found in TITLE → confidence = 0.9-0.95 (highest confidence)
2. DESCRIPTION - MEDIUM RELIABILITY: Generally reliable but may contain false information  
   - Member found in DESCRIPTION (not title) → confidence = 0.7-0.85 (medium confidence)
3. TAGS - LOWEST RELIABILITY: May contain fake/misleading member names, use with caution
   - Member found only in TAGS → confidence = 0.6-0.75 (lower confidence due to potential fake content)

- If only vspo-related terms but no valid members from list → confidence should be VERY LOW (0.05-0.2) and isVspoClip = false`;

// Examples for VSPO clip detection
const VSPO_EXAMPLES = `Example with valid vspo clip (member detected in TITLE - highest confidence):
Title: "【切り抜き】橘ひなの APEX配信ハイライト"
Description: "APEX配信 #ぶいすぽっ"
Tags: ["APEX", "ぶいすぽっ", "切り抜き"]
Response: {
  "isVspoClip": true,
  "hasPermissionNumber": false,
  "detectedMembers": ["橘ひなの"],
  "permissionNumber": null,
  "confidence": 0.95
}

Example with 一ノ瀬うるは in TITLE (highest confidence):
Title: "一ノ瀬うるはとのジェネギャ【ぶいすぽ/切り抜き】#一ノ瀬うるは"
Description: "#ぶいすぽ ぶいすぽっ！許諾番号：08172"
Response: {
  "isVspoClip": true,
  "hasPermissionNumber": true,
  "detectedMembers": ["一ノ瀬うるは"],
  "permissionNumber": "08172",
  "confidence": 0.95
}

Example with member only in DESCRIPTION (medium confidence):
Title: "【GTA5切り抜き】面白いシーン集"
Description: "橘ひなのの配信から面白いシーンを集めました #ぶいすぽ"
Tags: ["GTA5", "切り抜き"]
Response: {
  "isVspoClip": true,
  "hasPermissionNumber": false,
  "detectedMembers": ["橘ひなの"],
  "permissionNumber": null,
  "confidence": 0.8
}

Example with member only in TAGS (lower confidence - may be fake):
Title: "【切り抜き】面白いゲーム配信"
Description: "ゲーム配信の切り抜き"
Tags: ["切り抜き", "一ノ瀬うるは", "ゲーム"]
Response: {
  "isVspoClip": true,
  "hasPermissionNumber": false,
  "detectedMembers": ["一ノ瀬うるは"],
  "permissionNumber": null,
  "confidence": 0.7
}

Example with Nijisanji member + permission number (NOT vspo clip):
Title: "【MADTOWN】にじさんじメンバー配信"
Description: "ぶいすぽ許諾番号: 20567 #にじさんじ #MADTOWN"
Tags: ["にじさんじ", "MADTOWN"]
Response: {
  "isVspoClip": false,
  "hasPermissionNumber": true,
  "detectedMembers": [],
  "permissionNumber": "20567",
  "confidence": 0.05
}

Example with permission number but NO valid members (NOT vspo clip):
Title: "【切り抜き】他のVTuber配信"
Description: "他のVTuberの配信切り抜き 許諾番号：12345"
Tags: ["切り抜き", "配信"]
Response: {
  "isVspoClip": false,
  "hasPermissionNumber": true,
  "detectedMembers": [],
  "permissionNumber": "12345",
  "confidence": 0.1
}

Example with 許諾番号 but no vspo member names (NOT vspo clip):
Title: "【切り抜き】面白いゲーム配信"
Description: "ゲーム配信の切り抜き ぶいすぽ許諾番号：99999"
Tags: ["切り抜き", "ゲーム"]
Response: {
  "isVspoClip": false,
  "hasPermissionNumber": true,
  "detectedMembers": [],
  "permissionNumber": "99999",
  "confidence": 0.1
}

Example with vspo terms but NO valid members (NOT vspo clip):
Title: "【切り抜き】ぶいすぽ関連の話題"
Description: "ぶいすぽっ！について話している配信"
Tags: ["ぶいすぽ", "切り抜き"]
Response: {
  "isVspoClip": false,
  "hasPermissionNumber": false,
  "detectedMembers": [],
  "permissionNumber": null,
  "confidence": 0.1
}`;

// Output format specification
const VSPO_OUTPUT_FORMAT = `**REMEMBER: If detectedMembers array is empty, isVspoClip MUST be false regardless of any other factors**

**重要な判定基準:**
1. detectedMembers が空の場合 → isVspoClip = false（許諾番号があっても）
2. detectedMembers に1つ以上のメンバーがいる場合 → isVspoClip = true
3. 許諾番号の有無は補助的な情報であり、判定の決定要因ではない

Return your response in this exact JSON format:
{
  "isVspoClip": boolean, // MUST be false if no valid members from provided list are detected
  "hasPermissionNumber": boolean,
  "detectedMembers": ["only members from the provided vspoKeywords list"], // MUST only contain names from the keyword list
  "permissionNumber": "string or null",
  "confidence": number // 0.0 to 1.0, very low when no valid members from list detected
}`;

// Main prompt generation function
export const generateVspoClipPrompt = ({
  input,
  vspoKeywords,
}: {
  input: VideoInput;
  vspoKeywords: string[];
}) => {
  const memberList = `**OFFICIAL VSPO MEMBERS KEYWORDS - SEARCH FOR THESE EXACT WORDS:**
${vspoKeywords.map((keyword, index) => `${index + 1}. "${keyword}"`).join("\n")}

**ABSOLUTE RULE: NO VSPO MEMBERS FROM LIST = NOT VSPO CLIP**
If ZERO members from the above list are detected in title/description/tags, then isVspoClip = false, regardless of any other indicators.

**KEYWORD DETECTION EXAMPLES:**
- If title contains "一ノ瀬うるは" → detectedMembers = ["一ノ瀬うるは"] → isVspoClip = true  
- If description contains "橘ひなの" → detectedMembers = ["橘ひなの"] → isVspoClip = true
- If tags contain "Uruha Ichinose" → detectedMembers = ["Uruha Ichinose"] → isVspoClip = true
- If NO keywords from list found → detectedMembers = [] → isVspoClip = false`;

  const videoInfo = `Video Information to analyze:
Title: ${input.title}
Description: ${input.description || "No description provided"}
Tags: ${input.tags && input.tags.length > 0 ? input.tags.join(", ") : "No tags provided"}`;

  return `Analyze if this YouTube clip video is an official vspo clip.

${VSPO_DETECTION_RULES}

${VSPO_EXCLUSIONS}

${memberList}

${VSPO_DETECTION_CRITERIA}

${VSPO_MATCHING_RULES}

${VSPO_CONFIDENCE_RULES}

${videoInfo}

${VSPO_EXAMPLES}

${VSPO_OUTPUT_FORMAT}`;
};

// Reason generation prompt
export const generateVspoClipReasonPrompt = ({
  isVspoClip,
  hasPermissionNumber,
  detectedMembers,
  permissionNumber,
  confidence,
}: {
  isVspoClip: boolean;
  hasPermissionNumber: boolean;
  detectedMembers: string[];
  permissionNumber: string | null;
  confidence: number;
}) => {
  const analysisResults = `Analysis results:
- Permission number found: ${hasPermissionNumber ? "Yes" : "No"}
- Permission number: ${permissionNumber || "None"}
- Detected vspo members: ${detectedMembers.length > 0 ? detectedMembers.join(", ") : "None"}
- Confidence level: ${(confidence * 100).toFixed(1)}%`;

  const confidenceLevel =
    confidence < 0.5 ? "low" : confidence < 0.8 ? "moderate" : "high";
  const memberReason =
    detectedMembers.length === 0
      ? "no detected members"
      : `${detectedMembers.length} detected member(s)`;
  const permissionReason = hasPermissionNumber ? "presence" : "absence";

  return `Explain why this content is${isVspoClip ? "" : " not"} a valid vspo clip.

${analysisResults}

Return your response in this format:
{
  "reason": "This content is ${isVspoClip ? "a valid vspo clip" : "not a valid vspo clip"} because [detailed explanation]. Confidence is ${confidenceLevel} due to ${memberReason} and ${permissionReason} of permission number."
}`;
};
