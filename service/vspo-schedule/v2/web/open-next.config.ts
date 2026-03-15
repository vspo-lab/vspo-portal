import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig({
  // Uncomment to enable R2 cache,
  // It should be imported as:
  // `import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";`
  // See https://opennext.js.org/cloudflare/caching for more details
  // incrementalCache: r2IncrementalCache,
});

// Disable workerd condition to prevent esbuild from resolving edge-light variants
// of @emotion/* packages that are not included by Next.js file tracing (nft).
// The default condition falls back to runtime is-browser detection, which works
// correctly on Cloudflare Workers.
config.cloudflare = {
  ...config.cloudflare,
  useWorkerdCondition: false,
};

export default config;
