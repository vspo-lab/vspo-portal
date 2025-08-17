#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const WORKER_ENV_PATH = join(process.cwd(), "config/env/worker.ts");
const BASE_OUTPUT_DIR = join(process.cwd(), "config/wrangler");

interface ServiceConfig {
  name: string;
  binding: string;
  className: string;
}

interface QueueProducer {
  queue: string;
  binding: string;
}

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
  services?: Array<{
    binding: string;
    service: string;
    environment?: string;
  }>;
  queues?: {
    producers?: QueueProducer[];
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

// Extract service names from worker.ts
function extractServiceBindings(): ServiceConfig[] {
  const content = readFileSync(WORKER_ENV_PATH, "utf-8");
  const services: ServiceConfig[] = [];
  
  // Extract service bindings using regex
  const regex = /(\w+_SERVICE):\s*z\.custom<Service<(\w+)>>/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const binding = match[1];
    const className = match[2];
    
    // Convert binding name to service name
    // STREAM_QUERY_SERVICE -> stream-query
    const serviceName = binding
      .replace(/_SERVICE$/, "")
      .toLowerCase()
      .replace(/_/g, "-");
    
    services.push({
      name: serviceName,
      binding,
      className
    });
  }
  
  return services;
}

// Generate individual service config
function generateServiceConfig(
  service: ServiceConfig,
  env: string,
  port: number
): WranglerConfig {
  const envPrefix = getEnvPrefix();
  const serviceName = `${envPrefix}${service.name}`;
  const config: WranglerConfig = {
    $schema: "node_modules/wrangler/config-schema.json",
    name: serviceName,
    compatibility_date: "2024-10-22",
    send_metrics: false,
    compatibility_flags: ["nodejs_compat", "nodejs_als"],
    main: "cmd/server/internal/application/index.ts",
    logpush: true,
    kv_namespaces: [
      {
        binding: "APP_KV",
        id: getKvId(env),
      },
    ],
    dev: {
      port: port,
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
      SERVICE_NAME: serviceName,
      ENVIRONMENT: env === "dev" ? "development" : "production",
      LOG_TYPE: "json",
      LOG_MINLEVEL: "info",
      LOG_HIDE_POSITION: "true",
    },
    observability: {
      enabled: true
    },
    queues: {
      producers: [
        {
          queue: `${env}-write-queue`,
          binding: "WRITE_QUEUE"
        }
      ],
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
  const outputDir = join(BASE_OUTPUT_DIR, env, "vspo-portal-service");
  
  console.log(`🚀 Starting service config generation for ${env} environment...`);
  
  const services = extractServiceBindings();
  console.log(`\nFound ${services.length} services`);
  
  console.log("\n📝 Generating service configs...");
  
  let port = 3100; // Starting port for services
  for (const service of services) {
    const config = generateServiceConfig(service, env, port);
    // Create a directory for each service (without env prefix in directory name)
    const serviceDir = join(outputDir, service.name);
    const outputPath = join(serviceDir, "wrangler.jsonc");
    
    saveAsJsonc(
      config,
      outputPath,
      `Auto-generated Wrangler configuration for ${getEnvPrefix()}${service.name}`
    );
    
    console.log(`   ✅ ${getEnvPrefix()}${service.name}`);
    port++; // Increment port for next service
  }
  
  console.log("\n✨ All service configurations generated successfully!");
  console.log(`\nGenerated files:`);
  console.log(`  - Service configs: ${outputDir}/<service-name>/wrangler.jsonc (${services.length} services)`);
  
  if (env === "prd") {
    console.log("\n⚠️  Note: Please update the following IDs for production:");
    console.log("  - KV namespace ID in getKvId()");
    console.log("  - Hyperdrive ID in getHyperdriveId()");
  }
}

main().catch(console.error);