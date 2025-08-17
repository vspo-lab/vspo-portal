#!/usr/bin/env node
import { spawn } from "node:child_process";
import { promisify } from "node:util";

const execCommand = promisify(spawn);

interface GenerationTask {
  name: string;
  script: string;
  env: string;
}

async function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

async function generateConfigs(env: string) {
  console.log(`\n🚀 Generating all worker configurations for ${env} environment...\n`);

  const tasks: GenerationTask[] = [
    { name: "Workflow configs", script: "tools:generate-all-configs", env },
    { name: "Service configs", script: "tools:generate-service-configs", env },
    { name: "Consumer configs", script: "tools:generate-consumer-configs", env },
  ];

  for (const task of tasks) {
    console.log(`📝 Generating ${task.name}...`);
    try {
      await runCommand("pnpm", [`${task.script}:${env}`]);
      console.log(`   ✅ ${task.name} generated successfully!\n`);
    } catch (error) {
      console.error(`   ❌ Failed to generate ${task.name}:`, error);
      throw error;
    }
  }
}

async function main() {
  const env = process.argv[2];

  if (!env || !["dev", "prd"].includes(env)) {
    console.error("Usage: node generate-all-worker-configs.ts <dev|prd>");
    process.exit(1);
  }

  try {
    await generateConfigs(env);
    
    console.log(`✨ All configurations for ${env} environment generated successfully!\n`);
    console.log("Generated configuration directories:");
    console.log(`  - ${env}/vspo-portal-gateway/     (Gateway configs)`);
    console.log(`  - ${env}/vspo-portal-cron/        (Cron configs)`);
    console.log(`  - ${env}/vspo-portal-service/     (Service and Workflow configs)`);
    console.log(`  - ${env}/vspo-portal-consumer/     (Consumer configs)\n`);
    
    if (env === "prd") {
      console.log("⚠️  Note: Please update the following production IDs:");
      console.log("  - KV namespace IDs");
      console.log("  - Hyperdrive IDs");
      console.log("  - Queue names and IDs\n");
    }
  } catch (error) {
    console.error("\n❌ Failed to generate configurations:", error);
    process.exit(1);
  }
}

main();