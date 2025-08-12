import * as fs from "node:fs";
import * as path from "node:path";

// Parse worker.ts file to extract service types
function extractWorkerServiceTypes(): Map<string, string> {
  const workerPath = path.join(__dirname, "../config/env/worker.ts");
  const workerContent = fs.readFileSync(workerPath, "utf-8");
  
  const services = new Map<string, string>();
  
  // Extract imports to understand which services are available
  const importMatch = workerContent.match(/import type \{([^}]+)\} from ".*\/application"/s);
  if (!importMatch) {
    throw new Error("Could not find service imports in worker.ts");
  }
  
  const importedServices = importMatch[1]
    .split(",")
    .map(s => s.trim())
    .filter(s => s.endsWith("Service"));
  
  // Extract the zBindingAppWorkerEnv object definition
  const objectMatch = workerContent.match(/\.object\(\{([^}]+)\}\)/s);
  if (!objectMatch) {
    throw new Error("Could not find zBindingAppWorkerEnv object definition");
  }
  
  const objectContent = objectMatch[1];
  
  // Parse each service binding
  const serviceRegex = /(\w+):\s*z\.custom<Service<(\w+)>>/g;
  let match;
  
  while ((match = serviceRegex.exec(objectContent)) !== null) {
    const [, bindingName, serviceType] = match;
    if (importedServices.includes(serviceType)) {
      services.set(bindingName, serviceType);
    }
  }
  
  return services;
}

// Read the existing api.d.ts file and extract service method signatures
function extractServiceMethods(content: string): Map<string, string[]> {
  const services = new Map<string, string[]>();
  
  // Extract available service class names from api.d.ts
  const serviceClasses: string[] = [];
  const classRegex = /declare class (\w+Service) extends RpcTarget/g;
  let classMatch;
  
  while ((classMatch = classRegex.exec(content)) !== null) {
    const serviceName = classMatch[1];
    // Include all service classes
    serviceClasses.push(serviceName);
  }
  
  // Extract methods from each service class
  for (const serviceName of serviceClasses) {
    const regex = new RegExp(
      `declare class ${serviceName} extends RpcTarget \\{([^}]+)\\}`,
      "s"
    );
    const match = content.match(regex);
    if (match) {
      const methodsBlock = match[1];
      const methods: string[] = [];
      
      // Parse methods more carefully to handle multi-line method signatures
      const lines = methodsBlock.split("\n");
      let currentMethod = "";
      let depth = 0;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines and private members
        if (!trimmedLine || trimmedLine.includes("#private")) {
          continue;
        }
        
        // Count parentheses and angle brackets to handle multi-line signatures
        for (const char of trimmedLine) {
          if (char === "(" || char === "<") depth++;
          if (char === ")" || char === ">") depth--;
        }
        
        currentMethod += (currentMethod ? " " : "") + trimmedLine;
        
        // If we've closed all parentheses/brackets and the line ends with semicolon, we have a complete method
        if (depth === 0 && trimmedLine.endsWith(";")) {
          methods.push(currentMethod);
          currentMethod = "";
        }
      }
      
      services.set(serviceName, methods);
    }
  }
  
  return services;
}

// Convert service methods to query/command service interfaces
function generateServiceInterfaces(
  services: Map<string, string[]>,
  workerServices: Map<string, string>
): string {
  const interfaces: string[] = [];
  
  // Build serviceTypeToName mapping dynamically
  const serviceTypeToName: Record<string, string> = {};
  const serviceClasses = Array.from(services.keys());
  
  for (const serviceClass of serviceClasses) {
    const baseName = serviceClass.replace("Service", "");
    // Map Query and Command variants to the base service class
    serviceTypeToName[`${baseName}QueryService`] = serviceClass;
    serviceTypeToName[`${baseName}CommandService`] = serviceClass;
  }
  
  // Special case for ClipAnalysisQueryService
  serviceTypeToName["ClipAnalysisQueryService"] = "ClipAnalysisService";
  
  // Determine which methods belong to query vs command
  const queryMethodPatterns = [
    "search",
    "list",
    "get",
    "exists",
    "find",
    "deleted",
  ];
  
  // Group methods by service type
  const serviceTypeMethods = new Map<string, string[]>();
  
  for (const [bindingName, serviceType] of workerServices) {
    serviceTypeMethods.set(serviceType, []);
  }
  
  // Map service methods to their CQRS counterparts
  for (const [serviceName, methods] of services) {
    for (const method of methods) {
      // Skip constructor and other non-method declarations
      if (
        method.includes("constructor") ||
        !method.includes("(")
      ) {
        continue;
      }
      
      // Extract method name
      const methodName = method.split("(")[0].trim();
      
      // Determine target service type
      let targetServiceType: string | undefined;
      
      // Check if it's a query method
      const isQueryMethod = queryMethodPatterns.some(pattern => 
        methodName.toLowerCase().includes(pattern)
      );
      
      // Find the appropriate service type from workerServices
      for (const [bindingName, serviceType] of workerServices) {
        // Check if this service type maps back to the current service
        if (serviceTypeToName[serviceType] === serviceName) {
          if (serviceType.includes("Query") && isQueryMethod) {
            targetServiceType = serviceType;
            break;
          } else if (serviceType.includes("Command") && !isQueryMethod) {
            targetServiceType = serviceType;
            break;
          }
        }
      }
      
      if (targetServiceType && serviceTypeMethods.has(targetServiceType)) {
        serviceTypeMethods.get(targetServiceType)!.push(method);
      }
    }
  }
  
  // Generate interfaces
  for (const [serviceType, methods] of serviceTypeMethods) {
    if (methods.length > 0) {
      interfaces.push(
        `interface ${serviceType} {\n  ${methods.join("\n  ")}\n}`
      );
    } else if (serviceType === "ClipAnalysisQueryService") {
      // Special case for empty service
      interfaces.push(
        `interface ClipAnalysisQueryService {\n  // No methods exposed yet\n}`
      );
    }
  }
  
  return interfaces.join("\n\n");
}

// Generate the BindingAppWorkerEnv type
function generateWorkerEnvType(workerServices: Map<string, string>): string {
  const lines: string[] = [
    "// Worker Environment Type",
    "type BindingAppWorkerEnv = {",
    "  APP_KV: KVNamespace;",
  ];
  
  // Group by query/command
  const queryServices: string[] = [];
  const commandServices: string[] = [];
  
  for (const [bindingName, serviceType] of workerServices) {
    if (bindingName === "APP_KV") continue;
    
    const line = `  ${bindingName}: Service<${serviceType}>;`;
    if (serviceType.includes("Query")) {
      queryServices.push(line);
    } else {
      commandServices.push(line);
    }
  }
  
  if (queryServices.length > 0) {
    lines.push("  // CQRS Query Services");
    lines.push(...queryServices);
  }
  
  if (commandServices.length > 0) {
    lines.push("  // CQRS Command Services");
    lines.push(...commandServices);
  }
  
  lines.push("};");
  
  return lines.join("\n");
}

function generateWorkerTypes(): void {
  const projectRoot = path.join(__dirname, "../../../");
  const apiTypesPath = path.join(
    projectRoot,
    "service/vspo-schedule/v2/web/src/features/shared/types/api.d.ts"
  );

  // Read existing content
  const existingContent = fs.readFileSync(apiTypesPath, "utf-8");
  
  // Extract worker services from worker.ts
  const workerServices = extractWorkerServiceTypes();

  // Extract service methods from existing declarations
  const services = extractServiceMethods(existingContent);

  // Generate service interfaces
  const serviceInterfaces = generateServiceInterfaces(services, workerServices);

  // Generate worker environment type
  const workerEnvType = generateWorkerEnvType(workerServices);

  // Combine all generated types
  const generatedSection = [
    "\n// Worker Service Types - Generated, do not edit manually",
    "// Generated from service/server/config/env/worker.ts",
    "",
    "// Service binding type from Cloudflare Workers",
    "interface Socket {",
    "  readonly readable: ReadableStream;",
    "  readonly writable: WritableStream;",
    "  readonly closed: Promise<void>;",
    "  close(): Promise<void>;",
    "  startTls(): Socket;",
    "}",
    "",
    "interface SocketAddress {",
    "  hostname: string;",
    "  port: number;",
    "}",
    "",
    "interface SocketOptions {",
    "  secureTransport?: string;",
    "  allowHalfOpen?: boolean;",
    "}",
    "",
    "type Service<T = unknown> = {",
    "  fetch(input: URL | RequestInfo, init?: RequestInit): Promise<Response>;",
    "  connect(address: string | SocketAddress, options?: SocketOptions): Socket;",
    "} & T;",
    "",
    "// KVNamespace type from Cloudflare Workers",
    "interface KVNamespace {",
    "  get(key: string, options?: Partial<KVNamespaceGetOptions<any>>): Promise<string | null>;",
    "  put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: KVNamespacePutOptions): Promise<void>;",
    "  delete(key: string): Promise<void>;",
    "  list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult>;",
    "}",
    "",
    "interface KVNamespaceGetOptions<Type> {",
    "  type: Type;",
    "  cacheTtl?: number;",
    "}",
    "",
    "interface KVNamespacePutOptions {",
    "  expiration?: number;",
    "  expirationTtl?: number;",
    "  metadata?: any;",
    "}",
    "",
    "interface KVNamespaceListOptions {",
    "  limit?: number;",
    "  prefix?: string | null;",
    "  cursor?: string | null;",
    "}",
    "",
    "interface KVNamespaceListResult {",
    "  keys: { name: string; expiration?: number; metadata?: any }[];",
    "  list_complete: boolean;",
    "  cursor?: string;",
    "}",
    "",
    serviceInterfaces,
    "",
    workerEnvType,
  ].join("\n");

  // Find insertion point
  const lines = existingContent.split("\n");
  let insertIndex = lines.length;
  let endIndex = lines.length;

  // Look for existing generated section
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("// Worker Service Types")) {
      insertIndex = i;
      // Find end of section
      for (let j = i + 1; j < lines.length; j++) {
        if (
          lines[j].includes("export {") ||
          (j + 1 < lines.length && lines[j].trim() === "" && lines[j + 1].includes("export {"))
        ) {
          endIndex = j;
          break;
        }
      }
      break;
    }
  }

  // If no existing section, insert before export statement
  if (insertIndex === lines.length) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes("export {")) {
        insertIndex = i - 1;
        endIndex = i - 1;
        break;
      }
    }
  }

  // Replace or insert the generated section
  if (insertIndex < lines.length) {
    lines.splice(
      insertIndex,
      endIndex - insertIndex,
      ...generatedSection.split("\n")
    );
  } else {
    lines.push(...generatedSection.split("\n"));
  }

  // Write back
  fs.writeFileSync(apiTypesPath, lines.join("\n"));
  console.log(`Generated worker types to ${apiTypesPath}`);
}

// Run the generator
try {
  generateWorkerTypes();
} catch (error) {
  console.error("Error generating worker types:", error);
  process.exit(1);
}