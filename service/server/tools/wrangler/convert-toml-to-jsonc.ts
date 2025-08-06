import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseToml } from "@iarna/toml";

// Base directory (assumes execution from service/server directory)
const SERVER_DIR = process.cwd();
const WORKFLOW_ENV_PATH = join(SERVER_DIR, "config/env/workflow.ts");

// Configuration for converting wrangler.toml to wrangler.jsonc
interface ConversionConfig {
  sourcePath: string;
  outputPath: string;
  addWorkflows?: boolean;
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

// Convert workflow name to class name
function workflowToClassName(workflowName: string): string {
  // SEARCH_STREAMS_WORKFLOW -> SearchStreamsWorkflow
  const baseName = workflowName.replace(/_WORKFLOW$/, "");
  return baseName
    .split("_")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join("") + "Workflow";
}

// Convert workflow name to service name
function workflowToServiceName(workflowName: string): string {
  // SEARCH_STREAMS_WORKFLOW -> dev-search-streams-workflow
  const name = workflowName
    .replace(/_WORKFLOW$/, "")
    .toLowerCase()
    .replace(/_/g, "-");
  return `dev-${name}-workflow`;
}

// Generate workflows section
function generateWorkflowsSection() {
  const workflowNames = extractWorkflowNames();
  return workflowNames.map(workflowName => ({
    name: workflowToServiceName(workflowName),
    binding: workflowName,
    class_name: workflowToClassName(workflowName)
  }));
}

// Convert TOML to JSONC
function convertTomlToJsonc(config: ConversionConfig): void {
  console.log(`\n📄 Converting ${config.sourcePath}...`);
  
  // Read TOML file
  const tomlContent = readFileSync(config.sourcePath, "utf-8");
  const parsedToml = parseToml(tomlContent) as any;
  
  // Add workflows section (for cron)
  if (config.addWorkflows) {
    parsedToml.workflows = generateWorkflowsSection();
  }
  
  // Convert to JSON string
  const jsonString = JSON.stringify(parsedToml, null, 2);
  
  // Add comments
  const jsoncContent = `/**
 * Auto-converted from ${config.sourcePath}
 * Generated at ${new Date().toISOString()}
 * For more details on how to configure Wrangler, refer to:
 * https://developers.cloudflare.com/workers/wrangler/configuration/
 */
${jsonString}
`;

  // Save file
  writeFileSync(config.outputPath, jsoncContent);
  console.log(`   ✅ Successfully converted to ${config.outputPath}`);
}

// Main process
function main() {
  console.log("🚀 Starting TOML to JSONC conversion...");
  
  const conversions: ConversionConfig[] = [
    {
      sourcePath: join(SERVER_DIR, "config/wrangler/dev/vspo-portal-gateway/wrangler.toml"),
      outputPath: join(SERVER_DIR, "config/wrangler/dev/vspo-portal-gateway/wrangler.jsonc"),
      addWorkflows: false
    },
    {
      sourcePath: join(SERVER_DIR, "config/wrangler/dev/vspo-portal-cron/wrangler.toml"),
      outputPath: join(SERVER_DIR, "config/wrangler/dev/vspo-portal-cron/wrangler.jsonc"),
      addWorkflows: true  // Auto-generate workflows section for cron
    }
  ];
  
  conversions.forEach(config => {
    try {
      convertTomlToJsonc(config);
    } catch (error) {
      console.error(`   ❌ Failed to convert ${config.sourcePath}:`, error);
    }
  });
  
  console.log("\n✨ Conversion complete!");
}

// Execute
main();