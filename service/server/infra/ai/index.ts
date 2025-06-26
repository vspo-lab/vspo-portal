import {
  AppError,
  Err,
  ErrorCodeSchema,
  Ok,
  type Result,
  wrap,
} from "@vspo-lab/error";
import OpenAI from "openai";
import { z } from "zod";
import { vspoKeywordMap } from "../../config/data/keyword";
import { TargetLangSchema } from "../../domain/translate";
import { withTracerResult } from "../http/trace/cloudflare";

const languageCodeMapping: Record<string, string> = {
  en: "English",
  ja: "Japanese",
  fr: "French",
  de: "German",
  es: "Spanish",
  cn: "Chinese (Simplified)",
  tw: "Chinese (Traditional)",
  ko: "Korean",
};

const openAIResponseSchema = z.object({
  content: z.string(),
});

const urlSummaryResponseSchema = z.object({
  talents: z.array(z.string()),
  type: z.enum(["merchandise", "event", "other"]),
  details: z
    .object({
      releaseDate: z.string().optional(),
      price: z.string().optional(),
      eventDate: z.string().optional(),
      location: z.string().optional(),
      access: z.string().optional(),
    })
    .optional(),
  websiteUrl: z.string().optional(),
  summary: z.string(),
});

export type URLSummaryResponse = z.infer<typeof urlSummaryResponseSchema>;

export interface IAIService {
  translateText(
    text: string,
    targetLang: string,
    prompt?: string,
  ): Promise<Result<{ translatedText: string }, AppError>>;

  summarizeURL(url: string): Promise<Result<string, AppError>>;
}

type AIConfig = {
  apiKey: string;
  organization: string;
  project: string;
  baseURL: string;
};

export const createAIService = (config: AIConfig): IAIService => {
  const openai = new OpenAI({
    apiKey: config.apiKey,
    organization: config.organization,
    project: config.project,
    baseURL: config.baseURL,
  });

  const translateText = async (
    text: string,
    targetLang: string,
    prompt?: string,
  ): Promise<Result<{ translatedText: string }, AppError>> => {
    return withTracerResult("ai", "translateText", async (span) => {
      const parseResult = TargetLangSchema.safeParse(targetLang);
      if (!parseResult.success) {
        return Err(
          new AppError({
            message: "Invalid target language",
            code: "BAD_REQUEST",
          }),
        );
      }

      if (parseResult.data === "default" || !text) {
        return Ok({ translatedText: text });
      }
      const targetLanguage = languageCodeMapping[parseResult.data] || "English";

      const keywordMapString = JSON.stringify(vspoKeywordMap, null, 2);
      const systemPrompt = `Please translate the following user message into ${targetLanguage}. Ensure consistency in name translations according to the following mapping: ${keywordMapString}. Return the translation in a JSON object with the key "content".`;
      const responseResult = await wrap(
        openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [
            prompt
              ? { role: "system", content: prompt }
              : { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          max_tokens: 3000,
          response_format: { type: "json_object" },
        }),
        (err) =>
          new AppError({
            message: `OpenAI API error: ${err.message}`,
            code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
          }),
      );

      if (responseResult.err) {
        return Err(responseResult.err);
      }

      const response = responseResult.val.choices[0].message?.content;
      if (!response) {
        return Err(
          new AppError({
            message: "Empty AI response",
            code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
          }),
        );
      }

      const parsedResponse = openAIResponseSchema.safeParse(
        JSON.parse(response),
      );
      if (!parsedResponse.success) {
        return Err(
          new AppError({
            message: "Invalid OpenAI response format",
            code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
          }),
        );
      }

      return Ok({ translatedText: parsedResponse.data.content });
    });
  };

  const summarizeURL = async (
    url: string,
  ): Promise<Result<string, AppError>> => {
    const keywordMapString = JSON.stringify(vspoKeywordMap, null, 2);
    const prompt = `
    Please extract information from the following URL and output it as structured data in Japanese.

    ## Output Format
    Please include the following information:
    - talents: Array of related VTuber names from VSPO! members
    - type: Either "merchandise", "event", or "other"
    - details: Detailed information
      - releaseDate: Release date (for merchandise)
      - price: Price information (for merchandise)
      - eventDate: Event date (for events)
      - location: Venue location (for events)
      - access: Access information (location/transportation)
    - websiteUrl: The original website URL
    - summary: Brief summary of the content (within 100 characters)

    ## Notes
    - If information is not found, please leave the corresponding field empty
    - Please use the following official names for talents

    ## Name Dictionary
    ${keywordMapString}

    ## Important
    Please respond in Japanese.
    `;
    const responseResult = await wrap(
      openai.responses.create({
        input: url,
        instructions: prompt,
        model: "gpt-4o-2024-08-06",
        tools: [{ type: "web_search_preview" }],
      }),
      (err) =>
        new AppError({
          message: `OpenAI API error: ${err.message}`,
          code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
        }),
    );

    if (responseResult.err) {
      return Err(responseResult.err);
    }

    const response = responseResult.val.output_text;
    if (!response) {
      return Err(
        new AppError({
          message: "Empty AI response",
          code: ErrorCodeSchema.Enum.INTERNAL_SERVER_ERROR,
        }),
      );
    }

    return Ok(response);
  };

  return {
    translateText,
    summarizeURL,
  };
};
