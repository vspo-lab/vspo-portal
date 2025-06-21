// Shared types for all clip-checker prompts
export interface VideoInput {
  title: string;
  description?: string;
  tags?: string[];
  duration?: number; // Duration in seconds for Short detection
}

export interface CategoryInput {
  title: string;
  description?: string;
  tags?: string[];
  existingCategories: string[];
}
