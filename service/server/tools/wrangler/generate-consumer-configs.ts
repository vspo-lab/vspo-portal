#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const BASE_OUTPUT_DIR = join(process.cwd(), "config/wrangler");

interface QueueConsumer {
  queue: string;
  max_batch_size: number;
  max_batch_timeout: number;
  dead_letter_queue: string;
}

interface WranglerConfig {
  $schema: string;
  name: string;
  compatibility_date: string;
  send_metrics: boolean;
  compatibility_flags: string[];
  main: string;
  logpush: boolean;
  kv_namespaces?: Array<{
    binding: string;
    id: string;
  }>;
  dev?: {
    port: number;
  };
  hyperdrive?: Array<{
    binding: string;
    id: string;
    localConnectionString?: string;
  }>;
  vars: Record<string, string>;
  observability?: {
    enabled: boolean;
  };
  queues?: {
    consumers?: QueueConsumer[];
  };
}

function getEnvPrefix(): string {
  const env = process.argv[2] || "dev";
  return env === "dev" ? "dev-" : "";
}

function getKvId(env: string): string {
  return env === "prd" 
    ? "14bf3d407655490e9f377efbb4c3352b"
    : "0b6b968c69fc406c8d55aaf2cd657c2b";
}

function getHyperdriveId(env: string): string {
  return env === "prd"
    ? "cca2ae902ed44343ba0d34130f937a88"
    : "4d99e5c5c0944294977331b93146876c";
}

// Generate consumer config
function generateConsumerConfig(env: string): WranglerConfig {
  const envPrefix = getEnvPrefix();
  const consumerName = `${envPrefix}write-queue`;
  
  const config: WranglerConfig = {
    $schema: "node_modules/wrangler/config-schema.json",
    name: consumerName,
    compatibility_date: "2024-10-22",
    send_metrics: false,
    compatibility_flags: ["nodejs_compat", "nodejs_als"],
    main: "cmd/queue/consumer.ts", // Assuming queue handlers are in cmd/queue
    logpush: true,
    kv_namespaces: [
      {
        binding: "APP_KV",
        id: getKvId(env),
      },
    ],
    dev: {
      port: 3200, // Using a different port range for consumers
    },
    hyperdrive: [
      {
        binding: "DB",
        id: getHyperdriveId(env),
        ...(env === "dev" && {
          localConnectionString: "postgres://user:password@localhost:5432/vspo",
        }),
      },
    ],
    vars: {
      SERVICE_NAME: consumerName,
      ENVIRONMENT: env === "dev" ? "development" : "production",
      LOG_TYPE: "json",
      LOG_MINLEVEL: "info",
      LOG_HIDE_POSITION: "true",
    },
    observability: {
      enabled: true
    },
    queues: {
      consumers: [
        {
          queue: `${env}-write-queue`,
          max_batch_size: 100,
          max_batch_timeout: 3,
          dead_letter_queue: `${env}-write-queue-dead-letter`
        }
      ]
    }
  };

  return config;
}

// Save config as JSONC with header comment
function saveAsJsonc(
  config: WranglerConfig,
  outputPath: string,
  description: string
): void {
  const jsonString = JSON.stringify(config, null, 2);
  
  const jsoncContent = `/**
 * ${description}
 * Generated at ${new Date().toISOString()}
 * For more details on how to configure Wrangler, refer to:
 * https://developers.cloudflare.com/workers/wrangler/configuration/
 */
${jsonString}
`;

  // Create directory if it doesn't exist
  mkdirSync(dirname(outputPath), { recursive: true });
  
  // Save file
  writeFileSync(outputPath, jsoncContent);
}

// Main execution
async function main() {
  const env = process.argv[2] || "dev";
  
  console.log(`🚀 Starting consumer config generation for ${env} environment...`);
  
  console.log("\n📝 Generating consumer config...");
  
  const config = generateConsumerConfig(env);
  
  // Create directory structure: vspo-portal-consumer/write-queue/
  const consumerDir = join(BASE_OUTPUT_DIR, env, "vspo-portal-consumer", "write-queue");
  const outputPath = join(consumerDir, "wrangler.jsonc");
  
  saveAsJsonc(
    config,
    outputPath,
    `Auto-generated Wrangler configuration for ${getEnvPrefix()}write-queue consumer`
  );
  
  console.log(`   ✅ ${getEnvPrefix()}write-queue consumer`);
  
  console.log("\n✨ Consumer configuration generated successfully!");
  console.log(`\nGenerated file:`);
  console.log(`  - Consumer config: ${outputPath}`);
  
  if (env === "prd") {
    console.log("\n⚠️  Note: Please update the following IDs for production:");
    console.log("  - KV namespace ID in getKvId()");
    console.log("  - Hyperdrive ID in getHyperdriveId()");
  }
}

main().catch(console.error);