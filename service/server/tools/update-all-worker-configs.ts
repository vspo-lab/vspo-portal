#!/usr/bin/env node
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

interface UpdateStep {
  name: string;
  command: string;
  description: string;
}

// Define all the update steps
const updateSteps: UpdateStep[] = [
  {
    name: "Generate Wrangler Configs",
    command: "pnpm tools:generate-all-configs",
    description: "Generate all worker wrangler configurations",
  },
  {
    name: "Generate Worker Types",
    command: "pnpm tools:generate-worker-types",
    description: "Generate TypeScript types for worker bindings",
  },
  {
    name: "Generate NX Config",
    command: "pnpm tools:generate-nx-config",
    description: "Generate nx project.json with build targets",
  },
];

// Additional files that need to be updated when workers change
const filesToUpdate = [
  {
    path: "../../../.github/workflows/deploy-server-workers.yaml",
    description: "GitHub Actions deployment workflow",
    updateFunction: updateDeploymentWorkflow,
  },
  {
    path: "../../../.github/workflows/server-worker-dryrun.yaml",
    description: "GitHub Actions dry run workflow",
    updateFunction: updateDryRunWorkflow,
  },
];

// Get all worker names from the wrangler configs
function getAllWorkers(): { main: string[]; app: string[] } {
  const devPath = path.join(__dirname, "../config/wrangler/dev");
  const mainWorkers = ["vspo-portal-gateway", "vspo-portal-cron", "vspo-portal-app"];
  const appWorkers: string[] = [];
  
  // Get app workers from directory
  const appDir = path.join(devPath, "vspo-portal-app");
  if (fs.existsSync(appDir)) {
    const files = fs.readdirSync(appDir);
    files.forEach(file => {
      if (file.endsWith(".wrangler.jsonc")) {
        const workerName = file.replace(/^dev-/, "").replace(".wrangler.jsonc", "");
        if (!appWorkers.includes(workerName)) {
          appWorkers.push(workerName);
        }
      }
    });
  }
  
  return { main: mainWorkers, app: appWorkers.sort() };
}

// Update deployment workflow with current workers
function updateDeploymentWorkflow(filePath: string): void {
  const { app: appWorkers } = getAllWorkers();
  const content = fs.readFileSync(filePath, "utf-8");
  
  // Update workflow_dispatch options
  const optionsStart = content.indexOf("options:");
  const optionsEnd = content.indexOf("\n\njobs:", optionsStart);
  
  if (optionsStart === -1 || optionsEnd === -1) {
    console.warn("⚠️  Could not find options section in deployment workflow");
    return;
  }
  
  const newOptions = [
    "        options:",
    "          - ''",
    "          - 'vspo-portal-gateway'",
    "          - 'vspo-portal-cron'",
    "          - 'vspo-portal-app'",
    ...appWorkers.map(w => `          - '${w}'`),
  ].join("\n");
  
  // Update matrix worker list
  const matrixStart = content.indexOf("matrix:\n        worker:");
  const matrixEnd = content.indexOf("\n    steps:", matrixStart);
  
  if (matrixStart === -1 || matrixEnd === -1) {
    console.warn("⚠️  Could not find matrix section in deployment workflow");
    return;
  }
  
  const newMatrix = [
    "      matrix:",
    "        worker:",
    ...appWorkers.map(w => `          - '${w}'`),
  ].join("\n");
  
  // Replace sections
  let updatedContent = content.substring(0, optionsStart) + 
    newOptions + 
    content.substring(optionsEnd);
    
  const newMatrixStart = updatedContent.indexOf("matrix:\n        worker:");
  const newMatrixEnd = updatedContent.indexOf("\n    steps:", newMatrixStart);
  
  updatedContent = updatedContent.substring(0, newMatrixStart) + 
    newMatrix + 
    updatedContent.substring(newMatrixEnd);
  
  fs.writeFileSync(filePath, updatedContent);
}

// Update dry run workflow with current workers
function updateDryRunWorkflow(filePath: string): void {
  const { app: appWorkers } = getAllWorkers();
  const content = fs.readFileSync(filePath, "utf-8");
  
  // Update workflow_dispatch options (similar to deployment workflow)
  const optionsStart = content.indexOf("options:");
  const optionsEnd = content.indexOf("\n\njobs:", optionsStart);
  
  if (optionsStart === -1 || optionsEnd === -1) {
    console.warn("⚠️  Could not find options section in dry run workflow");
    return;
  }
  
  const newOptions = [
    "        options:",
    "          - ''",
    "          - 'vspo-portal-gateway'",
    "          - 'vspo-portal-cron'",
    "          - 'vspo-portal-app'",
    ...appWorkers.map(w => `          - '${w}'`),
  ].join("\n");
  
  // Update matrix section
  const matrixStart = content.indexOf("matrix:\n        worker:\n          - vspo-portal-gateway");
  const matrixEnd = content.indexOf("\n    steps:", matrixStart);
  
  if (matrixStart === -1 || matrixEnd === -1) {
    console.warn("⚠️  Could not find matrix section in dry run workflow");
    return;
  }
  
  const newMatrix = [
    "      matrix:",
    "        worker:",
    "          - vspo-portal-gateway",
    "          - vspo-portal-cron",
    "          - vspo-portal-app",
    ...appWorkers.map(w => `          - ${w}`),
  ].join("\n");
  
  // Replace sections
  let updatedContent = content.substring(0, optionsStart) + 
    newOptions + 
    content.substring(optionsEnd);
    
  const newMatrixStart = updatedContent.indexOf("matrix:\n        worker:\n          - vspo-portal-gateway");
  const newMatrixEnd = updatedContent.indexOf("\n    steps:", newMatrixStart);
  
  updatedContent = updatedContent.substring(0, newMatrixStart) + 
    newMatrix + 
    updatedContent.substring(newMatrixEnd);
  
  fs.writeFileSync(filePath, updatedContent);
}

// Main update function
async function updateAllWorkerConfigs(): Promise<void> {
  console.log("🔄 Updating all worker configurations...\n");
  
  const { main: mainWorkers, app: appWorkers } = getAllWorkers();
  console.log(`📊 Found ${mainWorkers.length} main workers and ${appWorkers.length} app workers\n`);
  
  // Run all generation scripts
  for (const step of updateSteps) {
    console.log(`📝 ${step.name}...`);
    console.log(`   ${step.description}`);
    
    try {
      execSync(step.command, { 
        stdio: "inherit",
        cwd: path.join(__dirname, "..")
      });
      console.log(`   ✅ Success\n`);
    } catch (error) {
      console.error(`   ❌ Failed: ${error}\n`);
      process.exit(1);
    }
  }
  
  // Update additional files
  console.log("📄 Updating workflow files...");
  for (const file of filesToUpdate) {
    const filePath = path.join(__dirname, file.path);
    if (fs.existsSync(filePath)) {
      console.log(`   ${file.description}`);
      try {
        file.updateFunction(filePath);
        console.log(`   ✅ Updated ${path.basename(filePath)}`);
      } catch (error) {
        console.error(`   ❌ Failed to update ${path.basename(filePath)}: ${error}`);
      }
    } else {
      console.warn(`   ⚠️  File not found: ${file.path}`);
    }
  }
  
  console.log("\n✨ All configurations updated successfully!");
  
  // Generate web configs as well
  console.log("\n🌐 Updating web configurations...");
  try {
    execSync("cd ../vspo-schedule/v2/web && pnpm tools:generate-wrangler-config", {
      stdio: "inherit",
      cwd: path.join(__dirname, "..")
    });
    console.log("✅ Web configurations updated\n");
  } catch (error) {
    console.warn("⚠️  Could not update web configurations (may need to run manually)\n");
  }
  
  // Summary
  console.log("📋 Summary of updated configurations:");
  console.log("   - Wrangler configurations (dev/prd)");
  console.log("   - Worker TypeScript types");
  console.log("   - NX project.json");
  console.log("   - GitHub Actions workflows");
  console.log("   - Web service bindings");
  console.log("\n🎉 Configuration update complete!");
}

// Run the update
updateAllWorkerConfigs().catch(error => {
  console.error("❌ Error updating configurations:", error);
  process.exit(1);
});