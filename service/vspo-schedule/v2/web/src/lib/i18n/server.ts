import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AppError, Err, Ok, type Result, wrap } from "@vspo-lab/error";
import i18n from "i18next";
import type { SSRConfig } from "next-i18next";
import { serverSideTranslations as originalServerSideTranslations } from "next-i18next/serverSideTranslations";
import { CloudflareAssetsBackend } from "./cf-assets";

interface I18nConfig {
  i18n: {
    defaultLocale: string;
    locales: string[];
  };
  [key: string]: unknown;
}

interface I18nInstanceConfig extends I18nConfig {
  lng: string;
  ns: string[];
  backend: {
    loadPath: string;
  };
}

/**
 * Cloudflare compatible serverSideTranslations implementation
 * Uses OpenNext to access the Assets binding
 */
export async function cloudflareServerSideTranslations(
  initialLocale: string,
  namespaces: string[] = [],
  i18nConfig: I18nConfig = { i18n: { defaultLocale: "en", locales: ["en"] } },
): Promise<Result<SSRConfig>> {
  if (typeof initialLocale !== "string") {
    return Err(
      new AppError({
        message: "Initial locale argument was not passed",
        code: "BAD_REQUEST",
        context: {},
      }),
    );
  }

  // Create configuration
  const config = {
    ...i18nConfig,
    lng: initialLocale,
    ns: namespaces,
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
  };

  // Create i18n instance
  const i18nInstance = i18n.createInstance();

  // Initialize i18n with Cloudflare backend
  const initResult = await initI18nInstance(i18nInstance, config);
  if (initResult.err) {
    return Err(initResult.err);
  }

  // Load all required namespaces
  const loadResult = await loadNamespaces(i18nInstance, namespaces);
  if (loadResult.err) {
    return Err(loadResult.err);
  }

  // Get resource data from initialized store
  const initialI18nStore: Record<
    string,
    Record<string, Record<string, unknown>>
  > = {};
  initialI18nStore[initialLocale] = {};

  // Get resources for each namespace
  for (const ns of namespaces) {
    initialI18nStore[initialLocale][ns] =
      i18nInstance.getResourceBundle(initialLocale, ns) || {};
  }

  // Return in next-i18next expected format
  return Ok({
    _nextI18Next: {
      initialI18nStore,
      initialLocale,
      ns: namespaces,
      userConfig: config,
    },
  });
}

/**
 * Helper function to initialize i18n instance
 */
async function initI18nInstance(
  i18nInstance: typeof i18n,
  config: I18nInstanceConfig,
): Promise<Result<void>> {
  const result = await wrap(
    i18nInstance.use(CloudflareAssetsBackend).init({
      ...config,
      initImmediate: false,
    }),
    (error) =>
      new AppError({
        message: "Failed to initialize i18n instance",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: {},
      }),
  );

  if (result.err) {
    return Err(result.err);
  }

  return Ok(undefined);
}

/**
 * Helper function to load all namespaces
 */
async function loadNamespaces(
  i18nInstance: typeof i18n,
  namespaces: string[],
): Promise<Result<void>> {
  const result = await wrap(
    Promise.all(
      namespaces.map(
        (ns) =>
          new Promise<void>((resolve) => {
            i18nInstance.loadNamespaces(ns, () => resolve());
          }),
      ),
    ),
    (error) =>
      new AppError({
        message: "Failed to load namespaces",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: {},
      }),
  );

  if (result.err) {
    return Err(result.err);
  }

  return Ok(undefined);
}

/**
 * Check if running in Cloudflare Edge environment
 */
async function isCloudflareEdgeEnvironment(): Promise<boolean> {
  const c = await wrap(
    getCloudflareContext({ async: true }),
    (error) =>
      new AppError({
        message: "Failed to get Cloudflare context",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: {},
      }),
  );

  if (c.err || !c.val) {
    return false;
  }

  return c.val.env.ASSETS !== undefined;
}

/**
 * Wraps the standard serverSideTranslations function with Result pattern
 */
async function wrapOriginalServerSideTranslations(
  locale: string,
  namespaces: string[],
  i18nConfig: I18nConfig,
): Promise<Result<SSRConfig>> {
  return wrap(
    originalServerSideTranslations(locale, namespaces, i18nConfig),
    (error) =>
      new AppError({
        message: "Failed to load translations with standard method",
        code: "INTERNAL_SERVER_ERROR",
        cause: error,
        context: {},
      }),
  );
}

/**
 * Combined serverSideTranslations that works in both Cloudflare Edge and regular environments
 */
export const serverSideTranslations = async (
  locale: string,
  namespaces: string[] = ["common"],
  i18nConfig: I18nConfig = {
    i18n: {
      defaultLocale: "en",
      locales: ["en", "de"],
    },
  },
): Promise<SSRConfig> => {
  // Detect environment
  const isCloudflareEnv = await isCloudflareEdgeEnvironment();

  // Create empty translation structure as fallback
  const emptyTranslations: SSRConfig = {
    _nextI18Next: {
      initialI18nStore: { [locale]: {} },
      initialLocale: locale,
      ns: namespaces,
      userConfig: {
        ...i18nConfig,
        lng: locale,
        ns: namespaces,
      },
    },
  };

  if (isCloudflareEnv) {
    // Use Cloudflare-specific implementation in Edge environment
    const result = await cloudflareServerSideTranslations(
      locale,
      namespaces,
      i18nConfig,
    );
    if (result.err) {
      console.error("Error loading translations:", result.err);
      return emptyTranslations;
    }
    return result.val;
  }
  // Use standard implementation in regular environments
  const result = await wrapOriginalServerSideTranslations(
    locale,
    namespaces,
    i18nConfig,
  );
  if (result.err) {
    console.error("Error loading translations:", result.err);
    return emptyTranslations;
  }
  return result.val;
};
