import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  BaseLLMProvider,
  Message,
  createLLMProvider,
  getAvailableProviders,
  LLMProviderConfig,
} from "@/lib/llm-providers";
import { ConfigManager } from "@/lib/config-manager";

export interface MCPServerConfig {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  type: "stdio" | "sse" | "streamable-http";
  env?: Record<string, string>;
  description?: string;
  autoConnect?: boolean;
}

export interface MCPCapabilities {
  tools: Array<any>;
  resources: Array<any>;
  prompts: Array<any>;
}

export interface MCPServerStatus {
  name: string;
  status: "connected" | "disconnected" | "connecting";
  capabilities?: {
    tools: number;
    resources: number;
    prompts: number;
  };
}

export default class MultiLLMMCPClient {
  private configManager: ConfigManager;
  private currentProvider: BaseLLMProvider;
  private currentProviderName: string;
  private conversation: Message[];
  private mcpClients: Map<string, Client> = new Map();
  private availableTools: Array<any> = [];
  private availableResources: Array<any> = [];
  private availablePrompts: Array<any> = [];

  constructor(configPath?: string) {
    this.configManager = new ConfigManager(configPath);
    this.conversation = [];

    // Initialize default provider
    const defaultProvider = this.configManager.getDefaultProvider();
    this.currentProviderName = defaultProvider;
    this.currentProvider = this.initializeProvider(defaultProvider);
  }

  private initializeProvider(providerName: string): BaseLLMProvider {
    const providerConfig =
      this.configManager.getLLMProviderConfig(providerName);

    const config: LLMProviderConfig = {
      apiKey: providerConfig.apiKey || "",
      baseURL: providerConfig.baseURL,
      model: providerConfig.model,
      temperature: providerConfig.temperature,
      maxTokens: providerConfig.maxTokens,
    };

    return createLLMProvider(providerName, config);
  }

  /**
   * Switch LLM provider
   */
  switchProvider(providerName: string): void {
    try {
      this.currentProvider = this.initializeProvider(providerName);
      this.currentProviderName = providerName;
      console.log(
        `✅ Switched to LLM provider: ${this.currentProvider.getName()}`
      );
    } catch (error) {
      console.error(`❌ Failed to switch LLM provider: ${error}`);
      throw error;
    }
  }

  /**
   * Get current provider information
   */
  getCurrentProvider(): { name: string; displayName: string } {
    return {
      name: this.currentProviderName,
      displayName: this.currentProvider.getName(),
    };
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders() {
    return getAvailableProviders().map((provider) => ({
      ...provider,
      configured: !!this.configManager.getLLMProviderConfig(provider.name)
        .apiKey,
    }));
  }

  /**
   * Connect to MCP server
   */
  async connectToMCPServer(config: MCPServerConfig): Promise<void> {
    console.log(`Connecting to MCP server: ${config.name}...`);

    try {
      const client = new Client(
        {
          name: "multi-llm-mcp-client",
          version: "2.0.0",
        },
        {
          capabilities: {},
        }
      );

      let transport;

      if (config.type === "stdio" && config.command) {
        transport = new StdioClientTransport({
          command: config.command,
          args: config.args || [],
        });
      } else if (config.type === "sse" && config.url) {
        transport = new SSEClientTransport(new URL(config.url));
      } else if (config.type === "streamable-http" && config.url) {
        transport = new StreamableHTTPClientTransport(new URL(config.url));
      } else {
        throw new Error(`Invalid MCP server configuration for ${config.name}`);
      }

      console.log("transport", transport);
      await client.connect(transport);
      this.mcpClients.set(config.name, client);

      // Get server capabilities
      await this.updateServerCapabilities(config.name);

      console.log(`✅ Successfully connected to MCP server: ${config.name}`);
    } catch (error) {
      console.error(
        `❌ Failed to connect to MCP server (${config.name}):`,
        error
      );
      throw error;
    }
  }

  /**
   * Auto-connect configured MCP servers
   */
  async autoConnectMCPServers(): Promise<void> {
    const servers = this.configManager.getAutoConnectServers();
    console.log(`Auto-connecting to ${servers.length} MCP servers...`);

    for (const server of servers) {
      try {
        await this.connectToMCPServer(server);
      } catch (error) {
        console.warn(
          `Failed to auto-connect MCP server (${server.name}):`,
          error
        );
      }
    }
  }

  /**
   * Get all MCP server statuses
   */
  getMCPServerStatus(): MCPServerStatus[] {
    const configServers = this.configManager.getMCPServers();
    // console.log("configServers", configServers);
    return configServers.map((server) => {
      const client = this.mcpClients.get(server.name);
      const tools = this.availableTools.filter(
        (t) => t.serverName === server.name
      );
      const resources = this.availableResources.filter(
        (r) => r.serverName === server.name
      );
      const prompts = this.availablePrompts.filter(
        (p) => p.serverName === server.name
      );
      console.log("server", server.name, !!client);

      // console.log("client", client);
      return {
        name: server.name,
        status: client ? "connected" : "disconnected",
        capabilities: client
          ? {
              tools: tools.length,
              resources: resources.length,
              prompts: prompts.length,
            }
          : undefined,
      };
    });
  }

  /**
   * Update server capability information
   */
  private async updateServerCapabilities(serverName: string): Promise<void> {
    const client = this.mcpClients.get(serverName);
    if (!client) return;

    try {
      // Get available tools
      const toolsResult = await client.listTools();

      // Get available resources
      const resourcesResult = await client.listResources();

      // Get available prompts
      const promptsResult = await client.listPrompts();

      // Update available tools
      this.availableTools = this.availableTools.filter(
        (t) => t.serverName !== serverName
      );
      if (toolsResult.tools) {
        this.availableTools.push(
          ...toolsResult.tools.map((tool: any) => ({
            ...tool,
            serverName,
          }))
        );
      }

      // Update available resources
      this.availableResources = this.availableResources.filter(
        (r) => r.serverName !== serverName
      );
      if (resourcesResult.resources) {
        this.availableResources.push(
          ...resourcesResult.resources.map((resource: any) => ({
            ...resource,
            serverName,
          }))
        );
      }

      // Update available prompts
      this.availablePrompts = this.availablePrompts.filter(
        (p) => p.serverName !== serverName
      );
      if (promptsResult.prompts) {
        this.availablePrompts.push(
          ...promptsResult.prompts.map((prompt: any) => ({
            ...prompt,
            serverName,
          }))
        );
      }

      console.log(`📊 Server ${serverName} capabilities:`, {
        tools: toolsResult.tools?.length || 0,
        resources: resourcesResult.resources?.length || 0,
        prompts: promptsResult.prompts?.length || 0,
      });
    } catch (error) {
      console.error(
        `Failed to get server capabilities (${serverName}):`,
        error
      );
    }
  }

  /**
   * Call MCP tool
   */
  async callMCPTool(toolName: string, args: any): Promise<any> {
    const tool = this.availableTools.find((t) => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const client = this.mcpClients.get(tool.serverName);
    if (!client) {
      throw new Error(`Server not connected: ${tool.serverName}`);
    }

    try {
      console.log(`🔧 Calling tool: ${toolName}`, args);
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });
      console.log(`✅ Tool call successful: ${toolName}`);
      return result;
    } catch (error) {
      console.error(`❌ Tool call failed: ${toolName}`, error);
      throw error;
    }
  }

  /**
   * Read MCP resource
   */
  async readMCPResource(uri: string): Promise<any> {
    // Find server containing this resource
    const resource = this.availableResources.find((r) => r.uri === uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    const client = this.mcpClients.get(resource.serverName);
    if (!client) {
      throw new Error(`Server not connected: ${resource.serverName}`);
    }

    try {
      console.log(`📄 Reading resource: ${uri}`);
      const result = await client.readResource({ uri });
      console.log(`✅ Resource read successful: ${uri}`);
      return result;
    } catch (error) {
      console.error(`❌ Resource read failed: ${uri}`, error);
      throw error;
    }
  }

  /**
   * Get MCP prompt
   */
  async getMCPPrompt(promptName: string, args?: any): Promise<any> {
    const prompt = this.availablePrompts.find((p) => p.name === promptName);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptName}`);
    }

    const client = this.mcpClients.get(prompt.serverName);
    if (!client) {
      throw new Error(`Server not connected: ${prompt.serverName}`);
    }

    try {
      console.log(`💭 Getting prompt: ${promptName}`, args);
      const result = await client.getPrompt({
        name: promptName,
        arguments: args,
      });
      console.log(`✅ Prompt get successful: ${promptName}`);
      return result;
    } catch (error) {
      console.error(`❌ Prompt get failed: ${promptName}`, error);
      throw error;
    }
  }

  /**
   * Send message with MCP integration
   */
  async sendMessageWithMCP(
    message: string,
    onStreamChunk?: (chunk: string) => void
  ): Promise<string> {
    // Add user message to conversation
    this.conversation.push({ role: "user", content: message });

    // Prepare system message including available MCP functionality
    const systemMessage = this.buildSystemMessage();

    try {
      // Process MCP commands
      const mcpResponse = await this.processMCPCommands(message);
      if (mcpResponse) {
        this.conversation.push({ role: "assistant", content: mcpResponse });
        return mcpResponse;
      }

      // Use LLM to generate response
      const response = await this.currentProvider.sendMessage(
        [systemMessage, ...this.conversation],
        {
          onChunk: onStreamChunk,
        }
      );

      // Process MCP commands
      const finalResponse = await this.processMCPCommands(response);
      const finalContent = finalResponse || response;

      // Add assistant response to conversation
      this.conversation.push({ role: "assistant", content: finalContent });

      return finalContent;
    } catch (error) {
      console.error("Failed to generate response:", error);
      throw error;
    }
  }

  private buildSystemMessage(): Message {
    const toolsInfo = this.availableTools
      .map(
        (tool) =>
          `- ${tool.name}: ${tool.description} (Server: ${tool.serverName})`
      )
      .join("\n");

    const resourcesInfo = this.availableResources
      .map(
        (resource) =>
          `- ${resource.uri}: ${
            resource.name || resource.description
          } (Server: ${resource.serverName})`
      )
      .join("\n");

    const promptsInfo = this.availablePrompts
      .map(
        (prompt) =>
          `- ${prompt.name}: ${prompt.description} (Server: ${prompt.serverName})`
      )
      .join("\n");

    return {
      role: "system",
      content: `You are an AI assistant with access to MCP (Model Context Protocol) tools and resources.

Available Tools:
${toolsInfo || "None"}

Available Resources:
${resourcesInfo || "None"}  

Available Prompts:
${promptsInfo || "None"}

You can use these tools and resources to help answer questions and complete tasks. When you need to use a tool, clearly indicate your intention and the parameters you'll use.`,
    };
  }

  private async processMCPCommands(message: string): Promise<string | null> {
    // Simple command processing - can be enhanced
    if (message.toLowerCase().includes("mcp status")) {
      const status = this.getMCPServerStatus();
      return `MCP Server Status:\n${status
        .map(
          (s) =>
            `- ${s.name}: ${s.status}${
              s.capabilities
                ? ` (Tools: ${s.capabilities.tools}, Resources: ${s.capabilities.resources}, Prompts: ${s.capabilities.prompts})`
                : ""
            }`
        )
        .join("\n")}`;
    }

    if (message.toLowerCase().includes("mcp list")) {
      return this.formatMCPCapabilities();
    }

    return null;
  }

  private formatMCPCapabilities(): string {
    let result = "MCP Capabilities:\n\n";

    if (this.availableTools.length > 0) {
      result += "🔧 Tools:\n";
      for (const tool of this.availableTools) {
        result += `  - ${tool.name} (${tool.serverName}): ${tool.description}\n`;
      }
      result += "\n";
    }

    if (this.availableResources.length > 0) {
      result += "📄 Resources:\n";
      for (const resource of this.availableResources) {
        result += `  - ${resource.uri} (${resource.serverName}): ${
          resource.name || resource.description
        }\n`;
      }
      result += "\n";
    }

    if (this.availablePrompts.length > 0) {
      result += "💭 Prompts:\n";
      for (const prompt of this.availablePrompts) {
        result += `  - ${prompt.name} (${prompt.serverName}): ${prompt.description}\n`;
      }
    }

    if (
      this.availableTools.length === 0 &&
      this.availableResources.length === 0 &&
      this.availablePrompts.length === 0
    ) {
      result +=
        "No available capabilities, please connect to MCP servers first";
    }

    return result;
  }

  getMCPCapabilities(): MCPCapabilities {
    return {
      tools: this.availableTools,
      resources: this.availableResources,
      prompts: this.availablePrompts,
    };
  }

  listMCPCapabilities(): void {
    console.log("\n📋 Current available MCP capabilities:");
    console.log(`🤖 Current LLM provider: ${this.currentProvider.getName()}`);

    console.log("\n🔧 Tools:");
    if (this.availableTools.length > 0) {
      for (const tool of this.availableTools) {
        console.log(
          `  - ${tool.name} (${tool.serverName}): ${tool.description}`
        );
        if (tool.inputSchema) {
          console.log(`    Parameters: ${JSON.stringify(tool.inputSchema)}`);
        }
      }
    } else {
      console.log("    None");
    }

    console.log("\n📄 Resources:");
    if (this.availableResources.length > 0) {
      for (const resource of this.availableResources) {
        console.log(
          `  - ${resource.uri} (${resource.serverName}): ${
            resource.name || resource.description
          }`
        );
      }
    } else {
      console.log("    None");
    }

    console.log("\n💭 Prompts:");
    if (this.availablePrompts.length > 0) {
      for (const prompt of this.availablePrompts) {
        console.log(
          `  - ${prompt.name} (${prompt.serverName}): ${prompt.description}`
        );
        if (prompt.arguments) {
          console.log(`    Arguments: ${JSON.stringify(prompt.arguments)}`);
        }
      }
    } else {
      console.log("    None");
    }

    if (
      this.availableTools.length === 0 &&
      this.availableResources.length === 0 &&
      this.availablePrompts.length === 0
    ) {
      console.log(
        "  No available capabilities, please connect to MCP servers first"
      );
    }
  }

  getConversationHistory(): Message[] {
    return [...this.conversation];
  }

  clearConversation(): void {
    this.conversation = [];
  }

  async disconnectAllMCP(): Promise<void> {
    console.log("Disconnecting all MCP connections...");
    for (const [serverName, client] of this.mcpClients.entries()) {
      try {
        await client.close();
        console.log(`✅ Disconnected server: ${serverName}`);
      } catch (error) {
        console.error(`❌ Failed to disconnect server (${serverName}):`, error);
      }
    }
    this.mcpClients.clear();
    this.availableTools = [];
    this.availableResources = [];
    this.availablePrompts = [];
  }

  async disconnectMCPServer(serverName: string): Promise<void> {
    const client = this.mcpClients.get(serverName);
    if (!client) {
      throw new Error(`Server not connected: ${serverName}`);
    }

    try {
      await client.close();
      this.mcpClients.delete(serverName);

      // Remove capabilities for this server
      this.availableTools = this.availableTools.filter(
        (t) => t.serverName !== serverName
      );
      this.availableResources = this.availableResources.filter(
        (r) => r.serverName !== serverName
      );
      this.availablePrompts = this.availablePrompts.filter(
        (p) => p.serverName !== serverName
      );

      console.log(`✅ Disconnected server: ${serverName}`);
    } catch (error) {
      console.error(`❌ Failed to disconnect server (${serverName}):`, error);
      throw error;
    }
  }
}
