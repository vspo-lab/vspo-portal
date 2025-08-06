import * as fs from "node:fs";
import * as path from "node:path";

interface ServiceBinding {
  binding: string;
  service: string;
  entrypoint?: string;
}

interface WranglerConfig {
  $schema: string;
  name: string;
  main: string;
  compatibility_date: string;
  compatibility_flags: string[];
  assets: {
    binding: string;
    directory: string;
  };
  observability: {
    enabled: boolean;
    invocation_logs: boolean;
  };
  build: {
    command: string;
    watch_dir: string;
  };
  placement: {
    mode: string;
  };
  services: ServiceBinding[];
}

// Extract worker services from the server's worker.ts file
function extractWorkerServices(): Map<string, string> {
  const serverWorkerPath = path.join(__dirname, "../../../../server/config/env/worker.ts");
  const workerContent = fs.readFileSync(serverWorkerPath, "utf-8");
  
  const services = new Map<string, string>();
  
  // Extract the zBindingAppWorkerEnv object definition
  // Use [\s\S] instead of 's' flag for compatibility
  const objectMatch = workerContent.match(/\.object\(\{([\s\S]+?)\}\)/);
  if (!objectMatch) {
    throw new Error("Could not find zBindingAppWorkerEnv object definition");
  }
  
  const objectContent = objectMatch[1];
  
  // Parse each service binding
  const serviceRegex = /(\w+):\s*z\.custom<Service<(\w+)>>/g;
  let match;
  
  while ((match = serviceRegex.exec(objectContent)) !== null) {
    const [, bindingName, serviceType] = match;
    // Skip APP_KV as it's not a service binding
    if (bindingName !== "APP_KV") {
      services.set(bindingName, serviceType);
    }
  }
  
  return services;
}

// Generate service bindings for wrangler config
function generateServiceBindings(env: "dev" | "prd"): ServiceBinding[] {
  const services = extractWorkerServices();
  const bindings: ServiceBinding[] = [];
  
  // Add all CQRS service bindings with their service type as entrypoint
  for (const [bindingName, serviceType] of services) {
    bindings.push({
      binding: bindingName,
      service: `${env}-vspo-portal-app`,
      entrypoint: serviceType // Each service type is its own entrypoint
    });
  }
  
  return bindings;
}

// Update wrangler config file
function updateWranglerConfig(env: "dev" | "prd"): void {
  const configPath = path.join(__dirname, `../config/wrangler/${env}/wrangler.jsonc`);
  
  // Read existing config
  const configContent = fs.readFileSync(configPath, "utf-8");
  
  // Parse JSONC (remove comments)
  const jsonContent = configContent
    .split("\n")
    .map(line => {
      // Remove single-line comments
      const commentIndex = line.indexOf("//");
      if (commentIndex >= 0) {
        // Check if // is inside a string
        const beforeComment = line.substring(0, commentIndex);
        const quoteCount = (beforeComment.match(/"/g) || []).length;
        if (quoteCount % 2 === 0) {
          return line.substring(0, commentIndex);
        }
      }
      return line;
    })
    .join("\n")
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "");
  
  const config: WranglerConfig = JSON.parse(jsonContent);
  
  // Update services
  config.services = generateServiceBindings(env);
  
  // Convert back to JSONC with proper formatting
  let output = `/**
 * For more details on how to configure Wrangler, refer to:
 * https://developers.cloudflare.com/workers/wrangler/configuration/
 */
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "${config.name}",
  "main": "${config.main}",
  "compatibility_date": "${config.compatibility_date}",
  "compatibility_flags": ${JSON.stringify(config.compatibility_flags)},
  "assets": {
    "binding": "${config.assets.binding}",
    "directory": "${config.assets.directory}"
  },
  "observability": {
    "enabled": ${config.observability.enabled},
    "invocation_logs": ${config.observability.invocation_logs}
  },
  "build": {
    "command": "${config.build.command}",
    "watch_dir": "${config.build.watch_dir}"
  },
  /**
   * Smart Placement
   * Docs: https://developers.cloudflare.com/workers/configuration/smart-placement/#smart-placement
   */
  "placement": { "mode": "${config.placement.mode}" },

  /**
   * Bindings
   * Bindings allow your Worker to interact with resources on the Cloudflare Developer Platform, including
   * databases, object storage, AI inference, real-time communication and more.
   * https://developers.cloudflare.com/workers/runtime-apis/bindings/
   */

  /**
   * Environment Variables
   * https://developers.cloudflare.com/workers/wrangler/configuration/#environment-variables
   */
  // "vars": { "MY_VARIABLE": "production_value" },
  /**
   * Note: Use secrets to store sensitive data.
   * https://developers.cloudflare.com/workers/configuration/secrets/
   */

  /**
   * Static Assets
   * https://developers.cloudflare.com/workers/static-assets/binding/
   */
  // "assets": { "directory": "./public/", "binding": "ASSETS" },

  /**
   * Service Bindings (communicate between multiple Workers)
   * https://developers.cloudflare.com/workers/wrangler/configuration/#service-bindings
   */
  "services": [
`;

  // Add service bindings with proper formatting
  config.services.forEach((service, index) => {
    output += `    {\n`;
    output += `      "binding": "${service.binding}",\n`;
    output += `      "service": "${service.service}"`;
    if (service.entrypoint) {
      output += `,\n      "entrypoint": "${service.entrypoint}"`;
    }
    output += `\n    }`;
    if (index < config.services.length - 1) {
      output += ",";
    }
    output += "\n";
  });

  output += `  ]
}
`;

  // Write the updated config
  fs.writeFileSync(configPath, output);
  console.log(`Updated ${configPath}`);
}

// Main function
function generateWranglerConfigs(): void {
  try {
    console.log("Generating wrangler configurations for web...");
    
    // Update both dev and prd configs
    updateWranglerConfig("dev");
    updateWranglerConfig("prd");
    
    console.log("Wrangler configurations generated successfully!");
  } catch (error) {
    console.error("Error generating wrangler configs:", error);
    process.exit(1);
  }
}

// Run the generator
generateWranglerConfigs();