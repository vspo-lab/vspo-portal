import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AppError, Err, Ok, type Result, wrap } from "@vspo-lab/error";
import type {
  BackendModule,
  ReadCallback,
  ResourceKey,
  Services,
} from "i18next";

interface BackendOptions {
  loadPath: string;
}

interface CloudflareAssets {
  fetch(url: string): Promise<Response>;
}

// Define a simpler interface for the CloudflareContext that won't conflict with OpenNext's types
interface CloudflareContextEnv {
  env: {
    ASSETS?: CloudflareAssets;
    [key: string]: unknown;
  };
}

export class CloudflareAssetsBackend implements BackendModule {
  type = "backend" as const;
  private services: Services | undefined;
  private options: BackendOptions = {
    loadPath: "/locales/{{lng}}/{{ns}}.json",
  };

  static type = "backend";

  constructor(services?: Services, options: Partial<BackendOptions> = {}) {
    this.init(services, options);
  }

  init(services?: Services, options: Partial<BackendOptions> = {}): void {
    this.services = services;
    this.options = {
      ...this.options,
      ...options,
    };
  }

  async read(
    language: string,
    namespace: string,
    callback: ReadCallback,
  ): Promise<void> {
    const result = await this.fetchTranslations(language, namespace);

    if (result.err) {
      callback(result.err, false);
    } else {
      callback(null, result.val);
    }
  }

  private async fetchTranslations(
    language: string,
    namespace: string,
  ): Promise<Result<ResourceKey>> {
    // Get Cloudflare context using OpenNext
    const cloudflareContextResult = await this.getCloudflareContext();
    if (cloudflareContextResult.err) {
      return Err(cloudflareContextResult.err);
    }

    const { env } = cloudflareContextResult.val;

    // Check if ASSETS binding is available
    if (!env.ASSETS) {
      return Err(
        new AppError({
          message: "ASSETS binding not available",
          code: "INTERNAL_SERVER_ERROR",
          context: {},
        }),
      );
    }

    // Build the path to the locale file
    const loadPath = this.options.loadPath
      .replace("{{lng}}", language)
      .replace("{{ns}}", namespace);

    // Fetch the locale file from ASSETS
    const responseResult = await this.fetchAsset(env.ASSETS, loadPath);
    if (responseResult.err) {
      return Err(responseResult.err);
    }

    const response = responseResult.val;
    if (!response.ok) {
      return Err(
        new AppError({
          message: `Failed to load ${loadPath} (${response.status})`,
          code: "INTERNAL_SERVER_ERROR",
          context: {},
        }),
      );
    }

    // Parse the JSON response
    const dataResult = await this.parseJsonResponse(response);
    if (dataResult.err) {
      return Err(dataResult.err);
    }

    return Ok(dataResult.val as ResourceKey);
  }

  private async getCloudflareContext(): Promise<Result<CloudflareContextEnv>> {
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

    // Cast to our simplified interface
    const cloudflareContext =
      contextResult.val as unknown as CloudflareContextEnv;
    return Ok(cloudflareContext);
  }

  private async fetchAsset(
    assets: CloudflareAssets,
    loadPath: string,
  ): Promise<Result<Response>> {
    return wrap(
      assets.fetch(`https://placeholder${loadPath}`),
      (error) =>
        new AppError({
          message: `Failed to fetch asset: ${loadPath}`,
          code: "INTERNAL_SERVER_ERROR",
          cause: error,
          context: {},
        }),
    );
  }

  private async parseJsonResponse(
    response: Response,
  ): Promise<Result<Record<string, unknown>>> {
    return wrap(
      response.json() as Promise<Record<string, unknown>>,
      (error) =>
        new AppError({
          message: "Failed to parse JSON response",
          code: "INTERNAL_SERVER_ERROR",
          cause: error,
          context: {},
        }),
    );
  }
}
