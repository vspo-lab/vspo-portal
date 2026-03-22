/**
 * Type definitions for markdown content.
 * Separated from markdown.ts so client components can import types
 * without pulling in server-only code.
 */
export type SiteNewsMarkdownItem = {
  id: number;
  title: string;
  content: string;
  html?: string | null;
  updated: string;
  tags: string[];
  tweetLink?: string | null;
};
