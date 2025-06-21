// Export all prompt types
export type { VideoInput, CategoryInput } from "./types";

// Export VSPO clip prompts
export {
  VSPO_CLIP_INSTRUCTIONS,
  generateVspoClipPrompt,
  generateVspoClipReasonPrompt,
} from "./vspoClipPrompts";

// Export YouTube Short prompts
export {
  SHORT_INSTRUCTIONS,
  generateShortCheckPrompt,
  generateShortReasonPrompt,
} from "./shortPrompts";

// Export Category matching prompts
export {
  CATEGORY_INSTRUCTIONS,
  generateCategoryMatchPrompt,
  generateCategoryReasonPrompt,
} from "./categoryPrompts";
