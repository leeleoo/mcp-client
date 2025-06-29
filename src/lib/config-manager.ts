import { MCPServerConfig } from "@/lib/deepseek-mcp-client";
import config from "../mcp-servers.json";
import fs from "fs";
import path from "path";
import os from "os";

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
  private configPath: string;
  private config: ConfigFile;

  constructor(configPath?: string) {
    this.configPath =
      configPath || path.join(process.cwd(), "src", "mcp-servers.json");

    // Default configuration
    this.config = {
      defaultProvider: "deepseek",
      llmProviders: {},
      servers: [],
    };

    // Load LLM provider configurations from environment variables
    this.loadLLMProvidersFromEnv();

    try {
      this.loadFromFile();
    } catch (error) {
      console.warn("Failed to load config file, using default configuration");
    }
  }

  private loadFromFile(): void {
    if (!fs.existsSync(this.configPath)) {
      console.warn(`Config file not found: ${this.configPath}`);
      return;
    }

    try {
      const fileContent = fs.readFileSync(this.configPath, "utf-8");
      const fileConfig = JSON.parse(fileContent);

      // Load MCP server configuration from JSON file
      if (fileConfig.servers && Array.isArray(fileConfig.servers)) {
        this.config.servers = fileConfig.servers.map(
          (server: any): MCPServerConfig => {
            // Process environment variables (safer approach)
            if (server.env) {
              server.env = this.resolveEnvironmentVariables(server.env);
            }

            return server;
          }
        );
      }

      // Merge LLM provider configurations from file (don't override environment variables)
      if (fileConfig.llmProviders) {
        for (const [name, providerConfig] of Object.entries(
          fileConfig.llmProviders
        )) {
          if (!this.config.llmProviders![name]) {
            this.config.llmProviders![name] =
              providerConfig as Partial<LLMProviderConfig>;
          }
        }
      }

      // Update default provider
      if (fileConfig.defaultProvider) {
        this.config.defaultProvider = fileConfig.defaultProvider;
      }

      // console.log(`Successfully loaded config file: ${this.configPath}`);
    } catch (error) {
      // If config file doesn't exist or is corrupted, shouldn't crash, use default configuration instead
      console.warn(`Failed to parse config file: ${this.configPath}`, error);
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
            `Warning: Skip invalid environment variable reference: ${envVar}`
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

  // Save configuration to file
  public saveToFile(): void {
    try {
      // Create config directory if it doesn't exist
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Write configuration
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      console.log(`Configuration saved to: ${this.configPath}`);
    } catch (error) {
      console.error(`Failed to save configuration: ${error}`);
      throw error;
    }
  }
}
