import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";

const config = defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
  }),
  tagCache: doShardedTagCache({ baseShardSize: 12 }),
  queue: doQueue,
  enableCacheInterception: true,
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
