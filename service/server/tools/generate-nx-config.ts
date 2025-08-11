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
  const devPath = path.join(__dirname, "../config/wrangler/dev");
  
  // Get all wrangler config files and generate target names
  const targetNames: string[] = [];
  
  // Read all subdirectories
  const subdirs = fs.readdirSync(devPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  for (const subdir of subdirs) {
    const subdirPath = path.join(devPath, subdir);
    const files = fs.readdirSync(subdirPath)
      .filter(file => file.endsWith('wrangler.jsonc'));
    
    for (const file of files) {
      let targetName: string;
      
      // Determine target name
      if (subdir === 'vspo-portal-gateway' && file === 'wrangler.jsonc') {
        targetName = 'vspo-portal-gateway';
      } else if (subdir === 'vspo-portal-cron' && file === 'wrangler.jsonc') {
        targetName = 'vspo-portal-cron';
      } else if (subdir === 'vspo-portal-app') {
        if (file === 'wrangler.jsonc') {
          targetName = 'vspo-portal-app';
        } else {
          targetName = file.replace('dev-', '').replace('.wrangler.jsonc', '');
        }
      } else {
        continue;
      }
      
      targetNames.push(`nx run vspo-portal-server:build-dryrun:${targetName} || true`);
    }
  }
  
  // Sort to ensure main workers come first
  const mainWorkers = ['vspo-portal-gateway', 'vspo-portal-cron', 'vspo-portal-app'];
  const sortedTargets = [
    ...targetNames.filter(t => mainWorkers.some(m => t.includes(`:build-dryrun:${m}`))),
    ...targetNames.filter(t => !mainWorkers.some(m => t.includes(`:build-dryrun:${m}`)))
  ];
  
  return sortedTargets;
}

// Generate individual dry run targets
function generateIndividualTargets(): Record<string, NxTarget> {
  const targets: Record<string, NxTarget> = {};
  const devPath = path.join(__dirname, "../config/wrangler/dev");
  
  // Define entry points for different worker types
  const ENTRY_POINTS = {
    gateway: "cmd/server/gateway.ts",
    cron: "cmd/cron/index.ts",
    app: "cmd/server/internal/application/index.ts"
  };
  
  // Read all subdirectories
  const subdirs = fs.readdirSync(devPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  for (const subdir of subdirs) {
    const subdirPath = path.join(devPath, subdir);
    const files = fs.readdirSync(subdirPath)
      .filter(file => file.endsWith('wrangler.jsonc'));
    
    for (const file of files) {
      let targetName: string;
      let entryPoint: string;
      const configPath = path.join('config/wrangler/dev', subdir, file);
      
      // Determine target name and entry point
      if (subdir === 'vspo-portal-gateway') {
        targetName = 'vspo-portal-gateway';
        entryPoint = ENTRY_POINTS.gateway;
      } else if (subdir === 'vspo-portal-cron') {
        targetName = 'vspo-portal-cron';
        entryPoint = ENTRY_POINTS.cron;
      } else if (subdir === 'vspo-portal-app') {
        entryPoint = ENTRY_POINTS.app;
        if (file === 'wrangler.jsonc') {
          targetName = 'vspo-portal-app';
        } else {
          targetName = file.replace('dev-', '').replace('.wrangler.jsonc', '');
        }
      } else {
        continue;
      }
      
      targets[`build-dryrun:${targetName}`] = {
        executor: "nx:run-commands",
        options: {
          command: `wrangler deploy --config ${configPath} --dry-run --script ${entryPoint}`,
        },
      };
    }
  }
  
  return targets;
}

// Generate the project configuration
function generateProjectConfig(): NxProject {
  const individualTargets = generateIndividualTargets();
  
  return {
    name: "vspo-portal-server",
    targets: {
      // Main build-dryrun target that runs the shell script
      "build-dryrun": {
        executor: "nx:run-commands",
        options: {
          command: "bash scripts/dry-run-all-workers.sh",
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