import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import {
  CategoryMatcherMetric,
  VspoClipCheckerMetric,
  YouTubeShortCheckerMetric,
} from "../evals/clip-checker";
import { vspoKeywordMap } from "../evals/clip-checker/vspoKeywords";

const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  organization: process.env.OPENAI_ORGANIZATION,
  project: process.env.OPENAI_PROJECT,
});

const generateOpenAIModel = (model: string) => {
  return openaiProvider(model);
};

// Extract member names dynamically from vspoKeywordMap
const vspoMemberNames = vspoKeywordMap.members
  .map((member) => member.nameJp)
  .join(", ");

export const clipAgent = new Agent({
  name: "clip-agent",
  instructions: `You are a YouTube content analyzer specialized in identifying Vspo clips and YouTube Shorts. 
CRITICAL: For Vspo clip detection, member keyword identification is the HIGHEST PRIORITY and MANDATORY requirement. 
A video can ONLY be classified as a Vspo clip if actual Vspo members are detected in the content, regardless of permission numbers or other indicators. 
Permission numbers (許諾番号) are supplementary information only - they do not determine if content is a Vspo clip. 
You evaluate based primarily on member keywords, then content relevance, video duration, tags, and other indicators. 
Member detection always takes precedence over permission numbers. 

OFFICIAL VSPO MEMBERS TO DETECT (search for these exact names): ${vspoMemberNames} 

CONTENT RELIABILITY HIERARCHY (in order of trust):
1. TITLE - HIGHEST RELIABILITY: Most trustworthy source for member detection
2. DESCRIPTION - MEDIUM RELIABILITY: Generally reliable but may contain false information
3. TAGS - LOWEST RELIABILITY: May contain fake/misleading member names, use with caution

MEMBER KEYWORD DETECTION PROCESS: 
1. Prioritize member detection in TITLE first (highest confidence)
2. If found in TITLE → high confidence (0.9-0.95)
3. If found only in DESCRIPTION → medium confidence (0.7-0.85)
4. If found only in TAGS → lower confidence (0.6-0.75) due to potential fake content
5. If NO member keywords found anywhere → detectedMembers = [] → isVspoClip = false

CONFIDENCE SCORING RULES:
- Member found in TITLE → confidence = 0.9-0.95
- Member found in DESCRIPTION (not title) → confidence = 0.7-0.85  
- Member found only in TAGS → confidence = 0.6-0.75 (tags may be fake)
- No members found → confidence = 0.05-0.15, isVspoClip = false

EXAMPLES: 
- Title contains '一ノ瀬うるは' → isVspoClip = true, confidence = 0.9+
- Only description contains '橘ひなの' → isVspoClip = true, confidence = 0.7-0.85
- Only tags contain member name → isVspoClip = true, confidence = 0.6-0.75 (caution: may be fake)
- Only permission number, no member names → isVspoClip = false 
- Nijisanji members mentioned → isVspoClip = false`,
  model: generateOpenAIModel("gpt-4.1-mini"),
  evals: {
    vspoClipChecker: new VspoClipCheckerMetric(
      generateOpenAIModel("gpt-4.1-mini"),
    ),
    youTubeShortChecker: new YouTubeShortCheckerMetric(
      generateOpenAIModel("gpt-4.1-mini"),
    ),
    categoryMatcher: new CategoryMatcherMetric(
      generateOpenAIModel("gpt-4.1-mini"),
    ),
  },
});
