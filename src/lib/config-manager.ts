import { MCPServerConfig } from "@/lib/multi-llm-mcp-client";
import config from "../mcp-servers.json";

export interface AppConfig {
  llmProviders: {
    [key: string]: {
      apiKey?: string;
      baseURL?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  mcpServers: MCPServerConfig[];
  defaultProvider: string;
}

export interface ExtendedMCPServerConfig extends MCPServerConfig {
  description?: string;
  env?: Record<string, string>;
  autoConnect?: boolean;
}

export interface LLMProviderConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ConfigFile {
  defaultProvider?: string;
  llmProviders?: Record<string, Partial<LLMProviderConfig>>;
  servers?: MCPServerConfig[];
}

export class ConfigManager {
  private config: ConfigFile;

  constructor(configPath?: string) {
    // Use imported config directly with proper type casting
    this.config = {
      defaultProvider: config.defaultProvider || "deepseek",
      llmProviders: config.llmProviders || {},
      servers: (config.servers || []) as MCPServerConfig[],
    };

    // Load LLM provider configurations from environment variables
    this.loadLLMProvidersFromEnv();

    // Process the imported configuration
    this.processImportedConfig();
  }

  private processImportedConfig(): void {
    try {
      // Load MCP server configuration from imported config
      if (this.config.servers && Array.isArray(this.config.servers)) {
        this.config.servers = this.config.servers.map(
          (server: any): MCPServerConfig => {
            // Process environment variables (safer approach)
            if (server.env) {
              server.env = this.resolveEnvironmentVariables(server.env);
            }

            return server;
          }
        );
      }

      // Merge LLM provider configurations from imported config (don't override environment variables)
      if (this.config.llmProviders) {
        for (const [name, providerConfig] of Object.entries(
          this.config.llmProviders
        )) {
          if (!this.config.llmProviders![name]) {
            this.config.llmProviders![name] =
              providerConfig as Partial<LLMProviderConfig>;
          }
        }
      }

      console.log("Successfully processed imported config");
    } catch (error) {
      console.warn("Failed to process imported config:", error);
    }
  }

  private validateServerConfig(server: any): MCPServerConfig {
    // Validate required fields
    if (!server.name || typeof server.name !== "string") {
      throw new Error("Server name is required and must be a string");
    }

    if (!server.type || !["stdio", "sse"].includes(server.type)) {
      throw new Error("Server type must be 'stdio' or 'sse'");
    }

    if (server.type === "stdio" && !server.command) {
      throw new Error("stdio type servers require a command");
    }

    if (server.type === "sse" && !server.url) {
      throw new Error("sse type servers require a url");
    }

    return {
      name: server.name,
      type: server.type,
      command: server.command,
      args: server.args || [],
      url: server.url,
      env: server.env || {},
      description: server.description || "",
      autoConnect: server.autoConnect ?? false,
    };
  }

  // Process environment variables (safer approach)
  private resolveEnvironmentVariables(
    env: Record<string, string>
  ): Record<string, string> {
    const resolved: Record<string, string> = {};

    for (const [key, value] of Object.entries(env)) {
      if (typeof value === "string" && value.startsWith("$")) {
        // This is an environment variable reference
        const envVarName = value.slice(1); // Remove '$' prefix
        const envValue = process.env[envVarName];

        if (envValue) {
          resolved[key] = envValue;
        } else {
          console.warn(`Environment variable not found: ${envVarName}`);
          // Don't set the key if the environment variable is not found
        }
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  private validateEnvironmentVariable(envVar: string): boolean {
    // Only allow http and https protocols
    const urlPattern = /^https?:\/\//;
    if (urlPattern.test(envVar)) {
      return urlPattern.test(envVar);
    }
    return true;
  }

  private validateEnvVarReference(
    env: Record<string, string>
  ): Record<string, string> {
    const resolved: Record<string, string> = {};

    for (const [key, value] of Object.entries(env)) {
      // Validate key name
      if (typeof key !== "string" || key.trim() === "") {
        console.warn(`Warning: Skip invalid environment variable name: ${key}`);
        continue;
      }

      // Validate referenced environment variable name
      if (typeof value === "string" && value.startsWith("$")) {
        const envVarName = value.slice(1);
        if (!envVarName || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(envVarName)) {
          console.warn(
            `Warning: Skip invalid environment variable reference: ${value}`
          );
          continue;
        }
      }

      // Set value directly (not recommended, but kept for compatibility)
      resolved[key] = value;
    }

    return resolved;
  }

  private loadLLMProvidersFromEnv(): void {
    const providers = ["deepseek", "openai", "claude"];
    const envKeyMap = {
      deepseek: "DEEPSEEK_API_KEY",
      openai: "OPENAI_API_KEY",
      claude: "CLAUDE_API_KEY",
    };

    for (const provider of providers) {
      const envKey = envKeyMap[provider as keyof typeof envKeyMap];
      const apiKey = process.env[envKey];

      if (apiKey) {
        this.config.llmProviders![provider] = {
          apiKey,
          // Set default models
          ...(provider === "deepseek" && { model: "deepseek-chat" }),
          ...(provider === "openai" && { model: "gpt-3.5-turbo" }),
          ...(provider === "claude" && { model: "claude-3-haiku-20240307" }),
        };
      }
    }
  }

  public getDefaultProvider(): string {
    return this.config.defaultProvider || "deepseek";
  }

  public getLLMProviderConfig(providerName: string): LLMProviderConfig {
    return this.config.llmProviders?.[providerName] || {};
  }

  public getMCPServers(): MCPServerConfig[] {
    return this.config.servers || [];
  }

  public getAutoConnectServers(): MCPServerConfig[] {
    return this.config.servers?.filter((server) => server.autoConnect) || [];
  }

  // Add or update MCP server configuration
  public addMCPServer(server: MCPServerConfig): void {
    const validatedServer = this.validateServerConfig(server);
    const existingIndex = this.config.servers!.findIndex(
      (s) => s.name === server.name
    );

    if (existingIndex >= 0) {
      this.config.servers![existingIndex] = validatedServer;
    } else {
      this.config.servers!.push(validatedServer);
    }
  }

  // Remove MCP server configuration
  public removeMCPServer(serverName: string): boolean {
    const initialLength = this.config.servers!.length;
    this.config.servers = this.config.servers!.filter(
      (s) => s.name !== serverName
    );
    return this.config.servers!.length < initialLength;
  }

  // Note: Configuration is now read-only from imported JSON
  // Dynamic server management is handled in memory only
}
