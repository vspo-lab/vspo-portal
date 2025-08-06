import * as fs from "node:fs";
import * as path from "node:path";

interface NxTarget {
  executor: string;
  options: {
    command?: string;
    commands?: string[];
    parallel?: boolean;
  };
}

interface NxProject {
  name: string;
  targets: Record<string, NxTarget>;
}

// Get all worker configurations
function getWorkerConfigs(): {
  main: string[];
  app: string[];
} {
  const devPath = path.join(__dirname, "../config/wrangler/dev");
  const prdPath = path.join(__dirname, "../config/wrangler/prd");
  
  const mainWorkers = ["vspo-portal-gateway", "vspo-portal-cron", "vspo-portal-app"];
  const appWorkers: string[] = [];
  
  // Get app workers from dev directory
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
  
  return { main: mainWorkers, app: appWorkers };
}

// Generate build-dryrun commands for all workers
function generateBuildDryrunCommands(): string[] {
  const commands: string[] = [];
  
  // Start with summary
  commands.push("echo '🚀 Starting dry run for all workers...'");
  commands.push("echo ''");
  
  // Track results
  commands.push("FAILED_WORKERS=''");
  commands.push("TOTAL_WORKERS=0");
  commands.push("PASSED_WORKERS=0");
  
  // Main workers with their specific entry points
  commands.push("echo '=== Main Workers Dry Run ==='");
  
  // Gateway
  commands.push("echo -n '  vspo-portal-gateway: '");
  commands.push("((TOTAL_WORKERS++))");
  commands.push("if wrangler deploy --config config/wrangler/dev/vspo-portal-gateway/wrangler.jsonc --dry-run --outdir dist > /dev/null 2>&1; then echo '✅ PASS'; ((PASSED_WORKERS++)); else echo '❌ FAIL'; FAILED_WORKERS=\"$FAILED_WORKERS vspo-portal-gateway\"; fi");
  
  // Cron
  commands.push("echo -n '  vspo-portal-cron: '");
  commands.push("((TOTAL_WORKERS++))");
  commands.push("if wrangler deploy --config config/wrangler/dev/vspo-portal-cron/wrangler.jsonc --dry-run --outdir dist > /dev/null 2>&1; then echo '✅ PASS'; ((PASSED_WORKERS++)); else echo '❌ FAIL'; FAILED_WORKERS=\"$FAILED_WORKERS vspo-portal-cron\"; fi");
  
  // App
  commands.push("echo -n '  vspo-portal-app: '");
  commands.push("((TOTAL_WORKERS++))");
  commands.push("if wrangler deploy --config config/wrangler/dev/vspo-portal-app/wrangler.jsonc --dry-run --outdir dist > /dev/null 2>&1; then echo '✅ PASS'; ((PASSED_WORKERS++)); else echo '❌ FAIL'; FAILED_WORKERS=\"$FAILED_WORKERS vspo-portal-app\"; fi");
  
  // App workers
  const { app: appWorkers } = getWorkerConfigs();
  if (appWorkers.length > 0) {
    commands.push("echo ''");
    commands.push("echo '=== App Workers Dry Run ==='");
    appWorkers.forEach(worker => {
      commands.push(`echo -n '  ${worker}: '`);
      commands.push("((TOTAL_WORKERS++))");
      commands.push(`if wrangler deploy --config config/wrangler/dev/vspo-portal-app/dev-${worker}.wrangler.jsonc --dry-run --outdir dist > /dev/null 2>&1; then echo '✅ PASS'; ((PASSED_WORKERS++)); else echo '❌ FAIL'; FAILED_WORKERS=\"$FAILED_WORKERS ${worker}\"; fi`);
    });
  }
  
  // Summary
  commands.push("echo ''");
  commands.push("echo '==================================='");
  commands.push("echo \"✅ Passed: $PASSED_WORKERS/$TOTAL_WORKERS\"");
  commands.push("if [ -n \"$FAILED_WORKERS\" ]; then echo \"❌ Failed workers:$FAILED_WORKERS\"; exit 1; else echo '🎉 All workers passed dry run!'; fi");
  
  return commands;
}

// Generate individual dry run targets
function generateIndividualTargets(): Record<string, NxTarget> {
  const targets: Record<string, NxTarget> = {};
  const { main: mainWorkers, app: appWorkers } = getWorkerConfigs();
  
  // Main workers
  mainWorkers.forEach(worker => {
    const targetName = `build-dryrun:${worker}`;
    let configPath = `config/wrangler/dev/${worker}/wrangler.jsonc`;
    
    targets[targetName] = {
      executor: "nx:run-commands",
      options: {
        command: `wrangler deploy --config ${configPath} --dry-run --outdir dist`,
      },
    };
  });
  
  // App workers
  appWorkers.forEach(worker => {
    const targetName = `build-dryrun:${worker}`;
    const configPath = `config/wrangler/dev/vspo-portal-app/dev-${worker}.wrangler.jsonc`;
    
    targets[targetName] = {
      executor: "nx:run-commands",
      options: {
        command: `wrangler deploy --config ${configPath} --dry-run --outdir dist`,
      },
    };
  });
  
  return targets;
}

// Generate the project configuration
function generateProjectConfig(): NxProject {
  const dryrunCommands = generateBuildDryrunCommands();
  const individualTargets = generateIndividualTargets();
  
  return {
    name: "vspo-portal-server",
    targets: {
      // Main build-dryrun target that runs all workers
      "build-dryrun": {
        executor: "nx:run-commands",
        options: {
          commands: dryrunCommands,
          parallel: false,
        },
      },
      // Individual dry run targets
      ...individualTargets,
      // CI target
      ci: {
        executor: "nx:run-commands",
        options: {
          commands: ["nx run vspo-portal-server:build-dryrun", "pnpm test"],
          parallel: false,
        },
      },
    },
  };
}

// Main function
function main() {
  const projectConfig = generateProjectConfig();
  const projectPath = path.join(__dirname, "../project.json");
  
  // Write the configuration
  fs.writeFileSync(
    projectPath,
    JSON.stringify(projectConfig, null, 2) + "\n"
  );
  
  console.log("Generated nx project configuration");
  console.log(`Total targets: ${Object.keys(projectConfig.targets).length}`);
  
  // List all targets
  console.log("\nAvailable targets:");
  Object.keys(projectConfig.targets).forEach(target => {
    console.log(`  - nx run vspo-portal-server:${target}`);
  });
}

main();