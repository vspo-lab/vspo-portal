import fs from "node:fs";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AppError, Err, Ok, type Result, wrap } from "@vspo-lab/error";
import { remark } from "remark";
import html from "remark-html";

export type MarkdownContent = {
  content: string;
  data: Record<string, unknown>;
  html?: string;
};

/**
 * Check if running in Cloudflare Edge environment
 */
async function isCloudflareEdgeEnvironment(): Promise<boolean> {
  const contextResult = await wrap(
    getCloudflareContext({ async: true }),
    () =>
      new AppError({
        message: "Failed to get Cloudflare context",
        code: "INTERNAL_SERVER_ERROR",
        context: {},
      }),
  );
  if (contextResult.err) {
    return false;
  }
  return contextResult.val?.env?.ASSETS !== undefined;
}

/**
 * Fetch markdown content from Cloudflare Assets
 */
async function fetchMarkdownFromAssets(
  locale: string,
  category: string,
  slug: string,
): Promise<Result<string>> {
  // Map "default" locale to "ja"
  const actualLocale = locale === "default" ? "ja" : locale;

  const contextResult = await wrap(
    getCloudflareContext({ async: true }),
    (error) =>
      new AppError({
        message: "Failed to get Cloudflare context",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: {},
      }),
  );

  if (contextResult.err) {
    return Err(contextResult.err);
  }

  const { env } = contextResult.val;
  if (!env.ASSETS) {
    return Err(
      new AppError({
        message: "ASSETS binding not available",
        code: "INTERNAL_SERVER_ERROR",
        context: {},
      }),
    );
  }

  const assetPath = `/content/${actualLocale}/${category}/${slug}.md`;

  const responseResult = await wrap(
    env.ASSETS.fetch(`https://placeholder${assetPath}`),
    (error) =>
      new AppError({
        message: `Failed to fetch asset: ${assetPath}`,
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: {},
      }),
  );

  if (responseResult.err) {
    return Err(responseResult.err);
  }

  const response = responseResult.val;
  if (!response.ok) {
    return Err(
      new AppError({
        message: `Asset not found: ${assetPath}`,
        code: "NOT_FOUND",
        context: {},
      }),
    );
  }

  const textResult = await wrap(
    response.text(),
    (error) =>
      new AppError({
        message: "Failed to read asset text",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: {},
      }),
  );

  if (textResult.err) {
    return Err(textResult.err);
  }

  return Ok(textResult.val);
}

/**
 * Content manifest type definition
 */
type ContentManifest = {
  locales: Record<string, Record<string, string[]>>;
};

/**
 * Fetch directory listing from Cloudflare Assets
 *
 * Uses the content-manifest.json file to get the list of available markdown files.
 */
async function fetchDirectoryFromAssets(
  locale: string,
  category: string,
): Promise<Result<string[]>> {
  // Map "default" locale to "ja"
  const actualLocale = locale === "default" ? "ja" : locale;

  const contextResult = await wrap(
    getCloudflareContext({ async: true }),
    (error) =>
      new AppError({
        message: "Failed to get Cloudflare context",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: {},
      }),
  );

  if (contextResult.err) {
    return Err(contextResult.err);
  }

  const { env } = contextResult.val;
  if (!env.ASSETS) {
    return Err(
      new AppError({
        message: "ASSETS binding not available",
        code: "INTERNAL_SERVER_ERROR",
        context: {},
      }),
    );
  }

  // Fetch the content manifest file
  const manifestPath = "/content/content-manifest.json";

  const manifestResponse = await wrap(
    env.ASSETS.fetch(`https://placeholder${manifestPath}`),
    (error) =>
      new AppError({
        message: "Failed to fetch content manifest",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: { locale: actualLocale, category },
      }),
  );

  if (manifestResponse.err) {
    return Err(manifestResponse.err);
  }

  if (!manifestResponse.val.ok) {
    return Err(
      new AppError({
        message: `Content manifest not found: ${manifestPath}`,
        code: "NOT_FOUND",
        context: { locale: actualLocale, category },
      }),
    );
  }

  const manifestResult = await wrap(
    manifestResponse.val.json() as Promise<ContentManifest>,
    (error) =>
      new AppError({
        message: "Failed to parse content manifest JSON",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: { locale: actualLocale, category },
      }),
  );

  if (manifestResult.err) {
    return Err(manifestResult.err);
  }

  const manifest = manifestResult.val;
  const files = manifest.locales[actualLocale]?.[category] || [];
  return Ok(
    files
      .filter((file: string) => file.endsWith(".md"))
      .map((file: string) => file.replace(/\.md$/, "")),
  );
}

/**
 * Read markdown content from filesystem (for development)
 */
function readMarkdownFromFilesystem(
  locale: string,
  category: string,
  slug: string,
): Result<string> {
  // Map "default" locale to "ja"
  const actualLocale = locale === "default" ? "ja" : locale;

  const contentDirectory = path.join(process.cwd(), "public/content");
  const fullPath = path.join(
    contentDirectory,
    actualLocale,
    category,
    `${slug}.md`,
  );

  try {
    const content = fs.readFileSync(fullPath, "utf8");
    return Ok(content);
  } catch (error) {
    return Err(
      new AppError({
        message: `Failed to read markdown file: ${fullPath}`,
        code: "NOT_FOUND",
        cause: error,
        context: { locale: actualLocale, category, slug },
      }),
    );
  }
}

/**
 * Read directory listing from filesystem (for development)
 *
 * Reads content-manifest.json from the content root directory.
 */
function readDirectoryFromFilesystem(
  locale: string,
  category: string,
): Result<string[]> {
  // Map "default" locale to "ja"
  const actualLocale = locale === "default" ? "ja" : locale;

  const contentDirectory = path.join(process.cwd(), "public/content");

  // Read content-manifest.json
  const manifestPath = path.join(contentDirectory, "content-manifest.json");

  if (!fs.existsSync(manifestPath)) {
    return Err(
      new AppError({
        message: `Content manifest not found: ${manifestPath}`,
        code: "NOT_FOUND",
        context: { locale: actualLocale, category },
      }),
    );
  }

  try {
    const rawContent = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(rawContent) as ContentManifest;
    const files = manifest.locales[actualLocale]?.[category] || [];
    return Ok(
      files
        .filter((file: string) => file.endsWith(".md"))
        .map((file: string) => file.replace(/\.md$/, "")),
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Err(
        new AppError({
          message: "Error parsing content-manifest.json",
          code: "INTERNAL_SERVER_ERROR",
          cause: error,
          context: { locale: actualLocale, category },
        }),
      );
    }
    return Err(
      new AppError({
        message: "Error reading content-manifest.json",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: { locale: actualLocale, category },
      }),
    );
  }
}

/**
 * Parse frontmatter and content from markdown string
 */
function parseFrontmatter(fileContents: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = fileContents.match(frontmatterRegex);

  if (!match) {
    return {
      data: {},
      content: fileContents,
    };
  }

  const frontmatterString = match[1];
  const content = match[2];

  // Parse YAML-like frontmatter
  const data: Record<string, unknown> = {};
  const lines = frontmatterString.split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const colonIndex = trimmedLine.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmedLine.substring(0, colonIndex).trim();
    let value = trimmedLine.substring(colonIndex + 1).trim();

    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Handle arrays (simple format: [item1, item2])
    if (value.startsWith("[") && value.endsWith("]")) {
      const arrayContent = value.slice(1, -1);
      if (arrayContent.trim()) {
        data[key] = arrayContent
          .split(",")
          .map((item) => item.trim().replace(/^["']|["']$/g, ""));
      } else {
        data[key] = [];
      }
    }
    // Handle dates
    else if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
      data[key] = new Date(value);
    }
    // Handle numbers
    else if (!Number.isNaN(Number(value)) && value !== "") {
      data[key] = Number(value);
    }
    // Handle booleans
    else if (value === "true" || value === "false") {
      data[key] = value === "true";
    }
    // Handle strings
    else {
      data[key] = value;
    }
  }

  return {
    data,
    content,
  };
}

/**
 * Get markdown content (works in both Cloudflare and Node.js environments)
 */
export async function getMarkdownContent(
  locale: string,
  category: string,
  slug: string,
): Promise<MarkdownContent | null> {
  let fileContents: string | null = null;

  // Check if running in Cloudflare environment
  const isCloudflareEnv = await isCloudflareEdgeEnvironment();

  if (isCloudflareEnv) {
    // Use Cloudflare Assets API
    const result = await fetchMarkdownFromAssets(locale, category, slug);
    if (!result.err) {
      fileContents = result.val;
    } else {
      if (locale !== "ja") {
        // Fallback to Japanese if translation doesn't exist
        const fallbackResult = await fetchMarkdownFromAssets(
          "ja",
          category,
          slug,
        );
        if (!fallbackResult.err) {
          fileContents = fallbackResult.val;
        } else {
          console.error(
            "Failed to fetch Japanese fallback from Cloudflare Assets:",
            fallbackResult.err,
            fallbackResult.val,
          );
        }
      }
    }
  } else {
    // Use filesystem for development
    const readResult = readMarkdownFromFilesystem(locale, category, slug);
    if (!readResult.err) {
      fileContents = readResult.val;
    } else {
      console.log("Failed to read from filesystem:", readResult.err);
      fileContents = null;
    }

    if (!fileContents && locale !== "ja") {
      // Fallback to Japanese if translation doesn't exist
      console.log("Trying Japanese fallback from filesystem");
      const fallbackResult = readMarkdownFromFilesystem("ja", category, slug);
      if (!fallbackResult.err) {
        fileContents = fallbackResult.val;
        console.log("Successfully read Japanese fallback from filesystem");
      } else {
        console.log(
          "Failed to read Japanese fallback from filesystem:",
          fallbackResult.err,
        );
      }
    }
  }

  if (!fileContents) {
    return null;
  }

  const { data, content } = parseFrontmatter(fileContents);

  // Convert markdown to HTML
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  const result = {
    content,
    data,
    html: contentHtml,
  };
  return result;
}

/**
 * Get markdown content synchronously (only works in Node.js environment)
 */
export function getMarkdownContentSync(
  locale: string,
  category: string,
  slug: string,
): MarkdownContent | null {
  const fileContentsResult = readMarkdownFromFilesystem(locale, category, slug);
  if (fileContentsResult.err) {
    if (locale !== "ja") {
      // Fallback to Japanese if translation doesn't exist
      const fallbackResult = readMarkdownFromFilesystem("ja", category, slug);
      if (!fallbackResult.err) {
        const { data, content } = parseFrontmatter(fallbackResult.val);
        return { content, data, html: undefined };
      }
    }
    return null;
  }

  const { data, content } = parseFrontmatter(fileContentsResult.val);
  return { content, data, html: undefined };
}

/**
 * Get all markdown slugs for a category (works in both Cloudflare and Node.js environments)
 */
export async function getAllMarkdownSlugs(
  category: string,
  locale = "ja",
): Promise<string[]> {
  // Check if running in Cloudflare environment
  if (await isCloudflareEdgeEnvironment()) {
    // Use Cloudflare Assets API
    const result = await fetchDirectoryFromAssets(locale, category);
    if (!result.err) {
      return result.val;
    }
    console.error("Error fetching directory from assets:", result.err);
    return [];
  }
  // Use filesystem for development
  const result = readDirectoryFromFilesystem(locale, category);
  return result.err ? [] : result.val;
}

/**
 * Get all markdown slugs for a category (synchronous - only works in Node.js environment)
 */
export function getAllMarkdownSlugsSync(
  category: string,
  locale = "ja",
): string[] {
  const result = readDirectoryFromFilesystem(locale, category);
  return result.err ? [] : result.val;
}

/**
 * Safely extract string value from unknown
 */
function extractString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Safely extract string array from unknown
 */
function extractStringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];
}

/**
 * Site news item type from markdown
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

/**
 * Get all site news items from markdown (works in both Cloudflare and Node.js environments)
 */
export async function getAllSiteNewsItems(
  locale: string,
): Promise<SiteNewsMarkdownItem[]> {
  const slugs = await getAllMarkdownSlugs("site-news", locale);

  const results = await Promise.all(
    slugs.map(async (slug): Promise<SiteNewsMarkdownItem | null> => {
      const markdownContent = await getMarkdownContent(
        locale,
        "site-news",
        slug,
      );
      if (!markdownContent) return null;

      const id = Number.parseInt(slug, 10);
      if (Number.isNaN(id)) return null;

      return {
        id,
        title: extractString(markdownContent.data.title),
        content: markdownContent.content,
        html: markdownContent.html || null,
        updated: markdownContent.data.updated
          ? markdownContent.data.updated instanceof Date
            ? markdownContent.data.updated.toISOString()
            : String(markdownContent.data.updated)
          : "",
        tags: extractStringArray(markdownContent.data.tags),
        tweetLink: extractString(markdownContent.data.tweetLink) || null,
      };
    }),
  );

  return results
    .filter((item): item is SiteNewsMarkdownItem => item !== null)
    .sort((a, b) => b.id - a.id); // Sort by ID descending
}

/**
 * Get all site news items from markdown (synchronous - only works in Node.js environment)
 */
export function getAllSiteNewsItemsSync(
  locale: string,
): SiteNewsMarkdownItem[] {
  const slugs = getAllMarkdownSlugsSync("site-news", locale);

  return slugs
    .flatMap((slug): SiteNewsMarkdownItem[] => {
      const markdownContent = getMarkdownContentSync(locale, "site-news", slug);
      if (!markdownContent) return [];

      const id = Number.parseInt(slug, 10);
      if (Number.isNaN(id)) return [];

      return [
        {
          id,
          title: extractString(markdownContent.data.title),
          content: markdownContent.content,
          html: markdownContent.html || null,
          updated: markdownContent.data.updated
            ? markdownContent.data.updated instanceof Date
              ? markdownContent.data.updated.toISOString()
              : String(markdownContent.data.updated)
            : "",
          tags: extractStringArray(markdownContent.data.tags),
          tweetLink: extractString(markdownContent.data.tweetLink) || null,
        },
      ];
    })
    .sort((a, b) => b.id - a.id); // Sort by ID descending
}

/**
 * Get a single site news item from markdown
 */
export async function getSiteNewsItem(
  locale: string,
  id: string,
): Promise<SiteNewsMarkdownItem | null> {
  const markdownContent = await getMarkdownContent(locale, "site-news", id);

  if (!markdownContent) {
    return null;
  }

  const numericId = Number.parseInt(id, 10);

  if (Number.isNaN(numericId)) {
    return null;
  }

  const result = {
    id: numericId,
    title: extractString(markdownContent.data.title),
    content: markdownContent.content,
    html: markdownContent.html || null,
    updated: markdownContent.data.updated
      ? markdownContent.data.updated instanceof Date
        ? markdownContent.data.updated.toISOString()
        : String(markdownContent.data.updated)
      : "",
    tags: extractStringArray(markdownContent.data.tags),
    tweetLink: extractString(markdownContent.data.tweetLink) || null,
  };
  return result;
}
