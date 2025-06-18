import { z } from "zod";

// Schema for clip analysis data
export const ClipAnalysisSchema = z.object({
  id: z.string(),
  videoId: z.string(),
  isShort: z.boolean(),
  isVspoClip: z.boolean(),
  confidence: z.number().min(0).max(1),
  analyzedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Input schema (for creating new analysis)
export const ClipAnalysisInputSchema = ClipAnalysisSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update schema (for updating existing analysis)
export const ClipAnalysisUpdateSchema = ClipAnalysisInputSchema.partial().omit({
  videoId: true,
});

// Types
export type ClipAnalysis = z.infer<typeof ClipAnalysisSchema>;
export type ClipAnalysisInput = z.infer<typeof ClipAnalysisInputSchema>;
export type ClipAnalysisUpdate = z.infer<typeof ClipAnalysisUpdateSchema>;

// Creator functions
export const createClipAnalysis = (
  analysis: ClipAnalysisInput,
): ClipAnalysisInput => {
  return ClipAnalysisInputSchema.parse(analysis);
};

export const updateClipAnalysis = (
  update: ClipAnalysisUpdate,
): ClipAnalysisUpdate => {
  return ClipAnalysisUpdateSchema.parse(update);
};

// Helper functions
export const isHighConfidence = (analysis: ClipAnalysis): boolean => {
  return analysis.confidence >= 0.8;
};

// Analysis result type for AI service responses
export const AnalysisResultSchema = z.object({
  isShort: z.boolean(),
  isVspoClip: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(), // Optional reasoning from AI
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const createAnalysisResult = (
  result: AnalysisResult,
): AnalysisResult => {
  return AnalysisResultSchema.parse(result);
};
