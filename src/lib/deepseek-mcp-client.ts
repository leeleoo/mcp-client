import axios from "axios";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

export interface MCPServerConfig {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  type: "stdio" | "sse";
}

export interface MCPCapabilities {
  tools: Array<any>;
  resources: Array<any>;
  prompts: Array<any>;
}

export default class DeepSeekMCPClient {
  private apiKey: string;
  private baseURL: string;
  private conversation: Message[];
  private mcpClients: Map<string, Client> = new Map();
  private availableTools: Array<any> = [];
  private availableResources: Array<any> = [];
  private availablePrompts: Array<any> = [];

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey || process.env.deepseek_api || process.env.DEEPSEEK_API_KEY || "";
    this.baseURL = "https://api.deepseek.com/v1/chat/completions";
    this.conversation = [];

    if (!this.apiKey) {
      throw new Error("DeepSeek API key not found in environment variables");
    }
  }

  /**
   * 连接到 MCP 服务器
   */
  async connectToMCPServer(config: MCPServerConfig): Promise<void> {
    console.log(`正在连接到 MCP 服务器: ${config.name}...`);

    try {
      const client = new Client(
        {
          name: "deepseek-mcp-client",
          version: "1.0.0",
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
      } else {
        throw new Error(`Invalid MCP server configuration for ${config.name}`);
      }

      await client.connect(transport);
      this.mcpClients.set(config.name, client);

      // 获取服务器能力
      await this.updateServerCapabilities(config.name);

      console.log(`✅ 成功连接到 MCP 服务器: ${config.name}`);
    } catch (error) {
      console.error(`❌ 连接 MCP 服务器失败 (${config.name}):`, error);
      throw error;
    }
  }

  /**
   * 更新服务器能力信息
   */
  private async updateServerCapabilities(serverName: string): Promise<void> {
    const client = this.mcpClients.get(serverName);
    if (!client) return;

    try {
      // 获取可用工具
      const toolsResponse = await client.listTools();
      if (toolsResponse.tools) {
        this.availableTools.push(
          ...toolsResponse.tools.map((tool) => ({
            ...tool,
            serverName,
          }))
        );
      }

      // 获取可用资源
      const resourcesResponse = await client.listResources();
      if (resourcesResponse.resources) {
        this.availableResources.push(
          ...resourcesResponse.resources.map((resource) => ({
            ...resource,
            serverName,
          }))
        );
      }

      // 获取可用提示
      const promptsResponse = await client.listPrompts();
      if (promptsResponse.prompts) {
        this.availablePrompts.push(
          ...promptsResponse.prompts.map((prompt) => ({
            ...prompt,
            serverName,
          }))
        );
      }

      console.log(`📊 服务器 ${serverName} 能力:`, {
        工具数量: toolsResponse.tools?.length || 0,
        资源数量: resourcesResponse.resources?.length || 0,
        提示数量: promptsResponse.prompts?.length || 0,
      });
    } catch (error) {
      console.error(`获取服务器能力失败 (${serverName}):`, error);
    }
  }

  /**
   * 调用 MCP 工具
   */
  async callMCPTool(toolName: string, args: any): Promise<any> {
    const tool = this.availableTools.find((t) => t.name === toolName);
    if (!tool) {
      throw new Error(`工具 "${toolName}" 不存在`);
    }

    const client = this.mcpClients.get(tool.serverName);
    if (!client) {
      throw new Error(`服务器 "${tool.serverName}" 未连接`);
    }

    try {
      console.log(`🔧 调用工具: ${toolName}`, args);
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });

      console.log(`✅ 工具调用成功: ${toolName}`);
      return result;
    } catch (error) {
      console.error(`❌ 工具调用失败: ${toolName}`, error);
      throw error;
    }
  }

  /**
   * 读取 MCP 资源
   */
  async readMCPResource(uri: string): Promise<any> {
    // 找到包含该资源的服务器
    const resource = this.availableResources.find((r) => r.uri === uri);
    if (!resource) {
      throw new Error(`资源 "${uri}" 不存在`);
    }

    const client = this.mcpClients.get(resource.serverName);
    if (!client) {
      throw new Error(`服务器 "${resource.serverName}" 未连接`);
    }

    try {
      console.log(`📄 读取资源: ${uri}`);
      const result = await client.readResource({ uri });

      console.log(`✅ 资源读取成功: ${uri}`);
      return result;
    } catch (error) {
      console.error(`❌ 资源读取失败: ${uri}`, error);
      throw error;
    }
  }

  /**
   * 获取 MCP 提示
   */
  async getMCPPrompt(promptName: string, args?: any): Promise<any> {
    const prompt = this.availablePrompts.find((p) => p.name === promptName);
    if (!prompt) {
      throw new Error(`提示 "${promptName}" 不存在`);
    }

    const client = this.mcpClients.get(prompt.serverName);
    if (!client) {
      throw new Error(`服务器 "${prompt.serverName}" 未连接`);
    }

    try {
      console.log(`💭 获取提示: ${promptName}`, args);
      const result = await client.getPrompt({
        name: promptName,
        arguments: args,
      });

      console.log(`✅ 提示获取成功: ${promptName}`);
      return result;
    } catch (error) {
      console.error(`❌ 提示获取失败: ${promptName}`, error);
      throw error;
    }
  }

  /**
   * 处理带有 MCP 集成的消息 - SSE 流式模式
   */
  async sendMessageWithMCP(
    message: string,
    onStreamChunk?: (chunk: string) => void
  ): Promise<string> {
    this.conversation.push({ role: "user", content: message });

    // 准备系统消息，包括可用的 MCP 功能
    const systemMessage = this.buildSystemMessage();
    const messages = [systemMessage, ...this.conversation];

    try {
      const response = await axios.post(
        this.baseURL,
        {
          model: "deepseek-chat",
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true, // 启用流式响应
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          responseType: "stream",
        }
      );

      let assistantMessage = "";

      // 处理 SSE 流式响应
      return new Promise((resolve, reject) => {
        response.data.on("data", (chunk: Buffer) => {
          const chunkStr = chunk.toString();
          const lines = chunkStr.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();

              if (data === "[DONE]") {
                // 流结束，处理 MCP 命令
                this.processMCPCommands(assistantMessage)
                  .then((mcpResult) => {
                    let finalResponse = assistantMessage;
                    if (mcpResult) {
                      const mcpResultText = `\n\n🔧 MCP 执行结果:\n${mcpResult}`;
                      finalResponse += mcpResultText;
                      if (onStreamChunk) {
                        onStreamChunk(mcpResultText);
                      }
                    }

                    this.conversation.push({
                      role: "assistant",
                      content: finalResponse,
                    });
                    resolve(finalResponse);
                  })
                  .catch(reject);
                return;
              }

              if (data && data !== "") {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content;
                    assistantMessage += content;

                    // 实时回调流式内容
                    if (onStreamChunk) {
                      onStreamChunk(content);
                    }
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        });

        response.data.on("end", () => {
          // 如果没有收到 [DONE] 信号，也需要处理结束
          if (assistantMessage) {
            this.processMCPCommands(assistantMessage)
              .then((mcpResult) => {
                let finalResponse = assistantMessage;
                if (mcpResult) {
                  const mcpResultText = `\n\n🔧 MCP 执行结果:\n${mcpResult}`;
                  finalResponse += mcpResultText;
                  if (onStreamChunk) {
                    onStreamChunk(mcpResultText);
                  }
                }

                this.conversation.push({
                  role: "assistant",
                  content: finalResponse,
                });
                resolve(finalResponse);
              })
              .catch(reject);
          } else {
            resolve(assistantMessage);
          }
        });

        response.data.on("error", (error: any) => {
          reject(error);
        });
      });
    } catch (error: any) {
      console.error(
        "Error calling DeepSeek API:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 构建包含 MCP 功能的系统消息
   */
  private buildSystemMessage(): Message {
    const toolsList = this.availableTools
      .map(
        (tool) =>
          `- ${tool.name}: ${tool.description || "无描述"} (服务器: ${
            tool.serverName
          })`
      )
      .join("\n");

    const resourcesList = this.availableResources
      .map(
        (resource) =>
          `- ${resource.uri}: ${resource.description || "无描述"} (服务器: ${
            resource.serverName
          })`
      )
      .join("\n");

    const promptsList = this.availablePrompts
      .map(
        (prompt) =>
          `- ${prompt.name}: ${prompt.description || "无描述"} (服务器: ${
            prompt.serverName
          })`
      )
      .join("\n");

    const systemContent = `你是一个集成了 Model Context Protocol (MCP) 功能的 AI 助手。

可用的 MCP 功能:

🔧 工具 (Tools):
${toolsList || "暂无可用工具"}

📄 资源 (Resources):
${resourcesList || "暂无可用资源"}

💭 提示 (Prompts):
${promptsList || "暂无可用提示"}

你可以通过特殊命令来使用这些 MCP 功能:
- 使用工具: [MCP_TOOL:工具名称:参数JSON]
- 读取资源: [MCP_RESOURCE:资源URI]
- 获取提示: [MCP_PROMPT:提示名称:参数JSON]

请根据用户需求智能地使用这些功能来提供更好的帮助。`;

    return { role: "system", content: systemContent };
  }

  /**
   * 处理消息中的 MCP 命令
   */
  private async processMCPCommands(message: string): Promise<string | null> {
    const mcpCommandRegex =
      /\[MCP_(TOOL|RESOURCE|PROMPT):([^:]+)(?::([^\]]+))?\]/g;
    let match;
    let results: string[] = [];

    while ((match = mcpCommandRegex.exec(message)) !== null) {
      const [fullMatch, type, name, argsStr] = match;

      try {
        let result;

        if (type === "TOOL") {
          const args = argsStr ? JSON.parse(argsStr) : {};
          result = await this.callMCPTool(name, args);
        } else if (type === "RESOURCE") {
          result = await this.readMCPResource(name);
        } else if (type === "PROMPT") {
          const args = argsStr ? JSON.parse(argsStr) : undefined;
          result = await this.getMCPPrompt(name, args);
        }

        if (result) {
          results.push(`${type} ${name}: ${JSON.stringify(result, null, 2)}`);
        }
      } catch (error) {
        results.push(`❌ ${type} ${name} 执行失败: ${error}`);
      }
    }

    return results.length > 0 ? results.join("\n\n") : null;
  }

  /**
   * 获取当前 MCP 能力
   */
  getMCPCapabilities(): MCPCapabilities {
    return {
      tools: this.availableTools,
      resources: this.availableResources,
      prompts: this.availablePrompts,
    };
  }

  /**
   * 列出所有可用的 MCP 功能
   */
  listMCPCapabilities(): void {
    console.log("\n📋 当前可用的 MCP 功能:");

    if (this.availableTools.length > 0) {
      console.log("\n🔧 工具:");
      this.availableTools.forEach((tool) => {
        console.log(
          `  - ${tool.name} (${tool.serverName}): ${
            tool.description || "无描述"
          }`
        );
      });
    }

    if (this.availableResources.length > 0) {
      console.log("\n📄 资源:");
      this.availableResources.forEach((resource) => {
        console.log(
          `  - ${resource.uri} (${resource.serverName}): ${
            resource.description || "无描述"
          }`
        );
      });
    }

    if (this.availablePrompts.length > 0) {
      console.log("\n💭 提示:");
      this.availablePrompts.forEach((prompt) => {
        console.log(
          `  - ${prompt.name} (${prompt.serverName}): ${
            prompt.description || "无描述"
          }`
        );
      });
    }

    if (
      this.availableTools.length === 0 &&
      this.availableResources.length === 0 &&
      this.availablePrompts.length === 0
    ) {
      console.log("  暂无可用功能，请先连接 MCP 服务器");
    }
  }

  /**
   * 获取对话历史
   */
  getConversationHistory(): Message[] {
    return [...this.conversation];
  }

  /**
   * 清空对话历史
   */
  clearConversation(): void {
    this.conversation = [];
  }

  /**
   * 断开所有 MCP 连接
   */
  async disconnectAllMCP(): Promise<void> {
    console.log("正在断开所有 MCP 连接...");

    for (const [serverName, client] of this.mcpClients) {
      try {
        await client.close();
        console.log(`✅ 已断开服务器: ${serverName}`);
      } catch (error) {
        console.error(`❌ 断开服务器失败 (${serverName}):`, error);
      }
    }

    this.mcpClients.clear();
    this.availableTools = [];
    this.availableResources = [];
    this.availablePrompts = [];
  }
}
