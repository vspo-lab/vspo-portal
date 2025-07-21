// Export all prompt types

// Export Category matching prompts
export {
  CATEGORY_INSTRUCTIONS,
  generateCategoryMatchPrompt,
  generateCategoryReasonPrompt,
} from "./categoryPrompts";
// Export YouTube Short prompts
export {
  generateShortCheckPrompt,
  generateShortReasonPrompt,
  SHORT_INSTRUCTIONS,
} from "./shortPrompts";
export type { CategoryInput, VideoInput } from "./types";
// Export VSPO clip prompts
export {
  generateVspoClipPrompt,
  generateVspoClipReasonPrompt,
  VSPO_CLIP_INSTRUCTIONS,
} from "./vspoClipPrompts";
