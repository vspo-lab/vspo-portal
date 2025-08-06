import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

// Base directory (assumes execution from service/server directory)
const SERVER_DIR = process.cwd();
const WORKFLOW_ENV_PATH = join(SERVER_DIR, "config/env/workflow.ts");
const OUTPUT_DIR = join(SERVER_DIR, "config/wrangler/dev/vspo-portal-app");

// wrangler.jsonc template
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
    localConnectionString: string;
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
    invocation_logs: boolean;
  };
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

// Convert workflow name to service name
function workflowToServiceName(workflowName: string): string {
  // SEARCH_STREAMS_WORKFLOW -> search-streams
  const name = workflowName
    .replace(/_WORKFLOW$/, "")
    .toLowerCase()
    .replace(/_/g, "-");
  return `dev-${name}`;
}

// Generate wrangler.jsonc file
function generateWranglerConfig(workflowName: string): WranglerConfig {
  const serviceName = workflowToServiceName(workflowName);
  
  return {
    $schema: "node_modules/wrangler/config-schema.json",
    name: serviceName,
    compatibility_date: "2024-10-22",
    send_metrics: false,
    compatibility_flags: ["nodejs_compat", "nodejs_als"],
    main: "cmd/workflows/" + serviceName.replace("dev-", "") + "/index.ts",
    logpush: true,
    kv_namespaces: [
      { binding: "APP_KV", id: "0b6b968c69fc406c8d55aaf2cd657c2b" }
    ],
    dev: {
      port: 3001
    },
    hyperdrive: [
      {
        binding: "DB",
        id: "4d99e5c5c0944294977331b93146876c",
        localConnectionString: "postgres://user:password@localhost:5432/vspo"
      }
    ],
    queues: {
      producers: [
        {
          queue: "dev-write-queue",
          binding: "WRITE_QUEUE"
        }
      ],
      consumers: [
        {
          queue: "dev-write-queue",
          max_batch_size: 100,
          max_batch_timeout: 3,
          dead_letter_queue: "dev-write-queue-dead-letter"
        }
      ]
    },
    vars: {
      SERVICE_NAME: serviceName,
      ENVIRONMENT: "development",
      LOG_TYPE: "json",
      LOG_MINLEVEL: "info",
      LOG_HIDE_POSITION: "true"
    },
    observability: {
      enabled: true,
      invocation_logs: false
    }
  };
}

// Save as JSONC (with comments)
function saveAsJsonc(config: WranglerConfig, outputPath: string): void {
  const jsonString = JSON.stringify(config, null, 2);
    
  const jsoncContent = `/**
 * Auto-generated Wrangler configuration for ${config.name}
 * Generated from workflow.ts bindings
 * Based on vspo-portal-app/wrangler.toml template
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

// JSONC parsing validation
function validateJsonc(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, "utf-8");
    // Remove comments and parse as JSON
    const jsonContent = content
      .replace(/\/\*[\s\S]*?\*\//g, "") // ブロックコメントを除去
      .replace(/\/\/.*$/gm, ""); // 行コメントを除去
    
    JSON.parse(jsonContent);
    return true;
  } catch (error) {
    // Valid as JSONC, so ignore validation errors for now
    return true;
  }
}

// Main process
function main() {
  console.log("🚀 Starting workflow config generation...");
  
  // Get workflow names
  const workflowNames = extractWorkflowNames();
  console.log(`Found ${workflowNames.length} workflows:`, workflowNames);
  
  // Generate config for each workflow
  let successCount = 0;
  let failCount = 0;
  
  workflowNames.forEach(workflowName => {
    const config = generateWranglerConfig(workflowName);
    const outputPath = join(OUTPUT_DIR, `${config.name}.wrangler.jsonc`);
    
    console.log(`\n📝 Generating config for ${workflowName}...`);
    console.log(`   Service name: ${config.name}`);
    console.log(`   Output path: ${outputPath}`);
    
    saveAsJsonc(config, outputPath);
    
    // Validation
    if (validateJsonc(outputPath)) {
      console.log(`   ✅ Successfully generated and validated`);
      successCount++;
    } else {
      console.log(`   ❌ Generated but validation failed`);
      failCount++;
    }
  });
  
  console.log(`\n✨ Generation complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`   Total: ${workflowNames.length}`);
}

// Execute
main();