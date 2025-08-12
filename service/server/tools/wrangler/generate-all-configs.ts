import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

// Base directory (assumes execution from service/server directory)
const SERVER_DIR = process.cwd();
const WORKFLOW_ENV_PATH = join(SERVER_DIR, "config/env/workflow.ts");
const WORKER_ENV_PATH = join(SERVER_DIR, "config/env/worker.ts");
const APP_INDEX_PATH = join(SERVER_DIR, "cmd/server/internal/application/index.ts");

// Get environment from arguments (default is dev)
const ENV = process.argv[2] || "dev";
const BASE_OUTPUT_DIR = join(SERVER_DIR, "config/wrangler", ENV);

// Common wrangler.jsonc settings
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
  queues?: {
    producers?: Array<{
      queue: string;
      binding: string;
    }>;
    consumers?: Array<{
      queue: string;
      max_batch_size: number;
      max_batch_timeout: number;
      dead_letter_queue: string;
    }>;
  };
  vars?: Record<string, string>;
  observability?: {
    enabled: boolean;
  };
  services?: Array<{
    binding: string;
    service: string;
    entrypoint?: string;
  }>;
  workflows?: Array<{
    name: string;
    binding: string;
    class_name: string;
  }>;
}

// Extract workflow names from workflow.ts
function extractWorkflowNames(): string[] {
  const content = readFileSync(WORKFLOW_ENV_PATH, "utf-8");
  const workflowNames: string[] = [];

  // Extract constant names containing the string 'WORKFLOW' using regex
  const regex = /(\w+_WORKFLOW):\s*z\.custom<Workflow>/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    workflowNames.push(match[1]);
  }
  
  return workflowNames;
}

// Extract service names from worker.ts
function extractServiceBindings(): Array<{binding: string, service: string, entrypoint: string}> {
  const content = readFileSync(WORKER_ENV_PATH, "utf-8");
  const serviceBindings: Array<{binding: string, service: string, entrypoint: string}> = [];

  // Extract service bindings using regex
  const regex = /(\w+_SERVICE):\s*z\.custom<Service<(\w+)>>/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const binding = match[1];
    const serviceClass = match[2];
    
    // Convert service name to worker name
    const serviceName = binding
      .replace(/_SERVICE$/, "")
      .toLowerCase()
      .replace(/_/g, "-");
    
    serviceBindings.push({
      binding: binding,
      service: `${getEnvPrefix()}${serviceName}`,
      entrypoint: serviceClass
    });
  }
  
  return serviceBindings;
}

// Get prefix based on environment
function getEnvPrefix(): string {
  return ENV === "prd" ? "" : `${ENV}-`;
}

// Get KV ID based on environment
function getKvId(env: string = ENV): string {
  // TODO: Set KV ID for prd environment
  return env === "prd" ? "PRODUCTION_KV_ID_HERE" : "0b6b968c69fc406c8d55aaf2cd657c2b";
}

// Get Hyperdrive ID based on environment
function getHyperdriveId(env: string = ENV): string {
  // TODO: Set Hyperdrive ID for prd environment
  return env === "prd" ? "PRODUCTION_HYPERDRIVE_ID_HERE" : "4d99e5c5c0944294977331b93146876c";
}

// Convert workflow name to service name
function workflowToServiceName(workflowName: string): string {
  const envPrefix = getEnvPrefix();
  const name = workflowName
    .replace(/_WORKFLOW$/, "")
    .toLowerCase()
    .replace(/_/g, "-");
  return `${envPrefix}${name}`;
}

// Convert workflow name to class name
function workflowToClassName(workflowName: string): string {
  // SEARCH_STREAMS_WORKFLOW -> SearchStreamsWorkflow
  const baseName = workflowName.replace(/_WORKFLOW$/, "");
  return baseName
    .split("_")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join("") + "Workflow";
}

// Save as JSONC (with comments)
function saveAsJsonc(config: WranglerConfig, outputPath: string, comment: string): void {
  const jsonString = JSON.stringify(config, null, 2);
    
  const jsoncContent = `/**
 * ${comment}
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

// 1. Generate configuration files for each workflow
function generateWorkflowConfigs(workflowNames: string[]): void {
  console.log("\n📝 Generating workflow configs...");
  
  workflowNames.forEach(workflowName => {
    const serviceName = workflowToServiceName(workflowName);
    const baseName = workflowName
      .replace(/_WORKFLOW$/, "")
      .toLowerCase()
      .replace(/_/g, "-");
    
    const config: WranglerConfig = {
      $schema: "node_modules/wrangler/config-schema.json",
      name: serviceName,
      compatibility_date: "2024-10-22",
      send_metrics: false,
      compatibility_flags: ["nodejs_compat", "nodejs_als"],
      // All workflows use the same app entry point
      main: "cmd/server/internal/application/index.ts",
      logpush: true,
      kv_namespaces: [
        { binding: "APP_KV", id: getKvId() }
      ],
      ...(ENV === "dev" && {
        dev: {
          port: 3001
        }
      }),
      hyperdrive: [
        {
          binding: "DB",
          id: getHyperdriveId(),
          ...(ENV === "dev" && {
            localConnectionString: "postgres://user:password@localhost:5432/vspo"
          })
        }
      ],
      queues: {
        producers: [
          {
            queue: `${getEnvPrefix()}write-queue`,
            binding: "WRITE_QUEUE"
          }
        ],
        consumers: [
          {
            queue: `${getEnvPrefix()}write-queue`,
            max_batch_size: 100,
            max_batch_timeout: 3,
            dead_letter_queue: `${getEnvPrefix()}write-queue-dead-letter`
          }
        ]
      },
      vars: {
        SERVICE_NAME: serviceName,
        ENVIRONMENT: ENV === "prd" ? "production" : "development",
        LOG_TYPE: "json",
        LOG_MINLEVEL: "info",
        LOG_HIDE_POSITION: "true"
      },
      observability: {
        enabled: true
      }
    };
    
    const outputPath = join(BASE_OUTPUT_DIR, "vspo-portal-app", `${serviceName}.wrangler.jsonc`);
    saveAsJsonc(config, outputPath, `Auto-generated Wrangler configuration for ${serviceName}`);
    console.log(`   ✅ ${serviceName}`);
  });
}

// 2. Generate Gateway configuration (including CQRS service bindings only)
function generateGatewayConfig(serviceBindings: Array<{binding: string, service: string, entrypoint: string}>): void {
  console.log("\n📝 Generating gateway config with service bindings...");
  
  const envPrefix = getEnvPrefix();
  
  const config: WranglerConfig = {
    $schema: "node_modules/wrangler/config-schema.json",
    name: `${envPrefix}vspo-portal-gateway`,
    compatibility_date: "2024-10-22",
    send_metrics: false,
    compatibility_flags: ["nodejs_compat", "nodejs_als"],
    main: "cmd/server/gateway.ts",
    logpush: true,
    kv_namespaces: [
      { binding: "APP_KV", id: getKvId() }
    ],
    ...(ENV === "dev" && {
      dev: {
        port: 3000
      }
    }),
    services: serviceBindings,
    vars: {
      SERVICE_NAME: `${envPrefix}vspo-portal-gateway`,
      ENVIRONMENT: ENV === "prd" ? "production" : "development",
      LOG_TYPE: "json",
      LOG_MINLEVEL: "info",
      LOG_HIDE_POSITION: "true"
    },
    observability: {
      enabled: true,
      
    }
  };
  
  const outputPath = join(BASE_OUTPUT_DIR, "vspo-portal-gateway/wrangler.jsonc");
  saveAsJsonc(config, outputPath, "Gateway configuration with service bindings");
  console.log("   ✅ Gateway config generated");
}


// 3. Generate Cron configuration (including workflows section and CQRS service bindings)
function generateCronConfig(workflowNames: string[], serviceBindings: Array<{binding: string, service: string, entrypoint: string}>): void {
  console.log("\n📝 Generating cron config with workflow definitions and service bindings...");
  
  const envPrefix = getEnvPrefix();
  
  // Generate workflows section with _WORKFLOW binding names
  const workflows = workflowNames.map(workflowName => ({
    name: workflowToServiceName(workflowName) + "-workflow",
    binding: workflowName,  // Keep original _WORKFLOW name
    class_name: workflowToClassName(workflowName)
  }));
  
  const config: WranglerConfig = {
    $schema: "node_modules/wrangler/config-schema.json",
    name: `${envPrefix}vspo-portal-cron`,
    compatibility_date: "2024-10-22",
    send_metrics: false,
    compatibility_flags: ["nodejs_compat", "nodejs_als"],
    main: "cmd/cron/index.ts",
    logpush: true,
    ...(ENV === "dev" && {
      dev: {
        port: 3002
      }
    }),
    services: serviceBindings,
    workflows: workflows,
    vars: {
      SERVICE_NAME: `${envPrefix}vspo-portal-cron`,
      ENVIRONMENT: ENV === "prd" ? "production" : "development",
      LOG_TYPE: "json",
      LOG_MINLEVEL: "info",
      LOG_HIDE_POSITION: "true"
    },
    observability: {
      enabled: true,
      
    }
  };
  
  // Add cron triggers for prd environment
  if (ENV === "prd") {
    (config as any).triggers = {
      crons: [ "0 0,7,18 * * *", "5 0,7,18 * * *", "*/2 * * * *", "*/30 * * * *", "*/1 * * * *" ]
    };
  }
  
  const outputPath = join(BASE_OUTPUT_DIR, "vspo-portal-cron/wrangler.jsonc");
  saveAsJsonc(config, outputPath, "Cron configuration with workflow definitions and service bindings");
  console.log("   ✅ Cron config generated");
}

// Main process
function main() {
  console.log(`🚀 Starting all config generation for ${ENV} environment...`);
  
  // Get workflow names
  const workflowNames = extractWorkflowNames();
  console.log(`\nFound ${workflowNames.length} workflows`);
  
  // Get service bindings
  const serviceBindings = extractServiceBindings();
  console.log(`Found ${serviceBindings.length} service bindings`);
  
  try {
    // 1. Generate configuration files for each workflow
    generateWorkflowConfigs(workflowNames);
    
    // 2. Generate Gateway configuration (including CQRS services only)
    generateGatewayConfig(serviceBindings);
    
    // 3. Generate Cron configuration (including workflow definitions and CQRS services)
    generateCronConfig(workflowNames, serviceBindings);
    
    console.log("\n✨ All configurations generated successfully!");
    console.log("\nGenerated files:");
    console.log(`  - Gateway: config/wrangler/${ENV}/vspo-portal-gateway/wrangler.jsonc`);
    console.log(`  - Cron: config/wrangler/${ENV}/vspo-portal-cron/wrangler.jsonc`);
    console.log(`  - Workflows: config/wrangler/${ENV}/vspo-portal-app/*.wrangler.jsonc (${workflowNames.length} files)`);
    
    if (ENV === "prd") {
      console.log("\n⚠️  Note: Please update the following IDs for production:");
      console.log("  - KV namespace ID in getKvId()");
      console.log("  - Hyperdrive ID in getHyperdriveId()");
    }
  } catch (error) {
    console.error("\n❌ Error during generation:", error);
    process.exit(1);
  }
}

// Execute
main();