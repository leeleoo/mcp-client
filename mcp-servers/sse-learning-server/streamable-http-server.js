#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";

// 工具定义
const TOOLS = [
  {
    name: "web_search",
    description: "模拟网页搜索功能",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "搜索关键词" },
        limit: { type: "number", description: "返回结果数量限制", default: 5 },
      },
      required: ["query"],
    },
  },
  {
    name: "weather_info",
    description: "获取天气信息（模拟）",
    inputSchema: {
      type: "object",
      properties: {
        city: { type: "string", description: "城市名称" },
        units: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
          default: "celsius",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "url_analyzer",
    description: "分析URL的基本信息",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "要分析的URL" },
      },
      required: ["url"],
    },
  },
];

// 资源定义
const RESOURCES = [
  {
    uri: "news://latest",
    name: "最新新闻",
    description: "获取最新新闻摘要",
    mimeType: "application/json",
  },
  {
    uri: "config://server",
    name: "服务器配置",
    description: "获取当前服务器配置信息",
    mimeType: "application/json",
  },
  {
    uri: "stats://usage",
    name: "使用统计",
    description: "获取服务器使用统计信息",
    mimeType: "application/json",
  },
];

// 提示定义
const PROMPTS = [
  {
    name: "technical_writing",
    description: "技术文档写作助手",
    arguments: [
      { name: "topic", description: "文档主题", required: true },
      { name: "audience", description: "目标读者", required: false },
      { name: "format", description: "文档格式", required: false },
    ],
  },
  {
    name: "api_documentation",
    description: "API文档生成器",
    arguments: [
      { name: "endpoint", description: "API端点路径", required: true },
      { name: "method", description: "HTTP方法", required: true },
      { name: "parameters", description: "参数说明", required: false },
    ],
  },
];

// 创建 MCP 服务器
function createMCPServer() {
  const server = new Server(
    {
      name: "streamable-http-learning-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // 设置工具处理器
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "web_search": {
        const { query, limit = 5 } = args;
        const mockResults = [
          {
            title: `${query} - 维基百科`,
            url: `https://zh.wikipedia.org/wiki/${encodeURIComponent(query)}`,
            snippet: `关于"${query}"的详细介绍...`,
          },
          {
            title: `${query} 教程`,
            url: `https://blog.example.com/${query}`,
            snippet: `学习${query}的完整教程...`,
          },
          {
            title: `${query} 官方文档`,
            url: `https://docs.example.com/${query}`,
            snippet: `${query}的官方文档...`,
          },
        ].slice(0, limit);

        return {
          content: [
            {
              type: "text",
              text: `搜索"${query}"的结果：\n\n${mockResults
                .map(
                  (r, i) =>
                    `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}\n`
                )
                .join("\n")}`,
            },
          ],
        };
      }

      case "weather_info": {
        const { city, units = "celsius" } = args;
        const tempC = Math.floor(Math.random() * 30) + 5;
        const tempF = Math.floor((tempC * 9) / 5 + 32);
        const conditions = ["晴朗", "多云", "小雨", "阴天"];
        const condition =
          conditions[Math.floor(Math.random() * conditions.length)];

        const weatherData = {
          城市: city,
          天气: condition,
          温度: units === "fahrenheit" ? `${tempF}°F` : `${tempC}°C`,
          湿度: `${Math.floor(Math.random() * 40) + 40}%`,
          风速: `${Math.floor(Math.random() * 15) + 5} km/h`,
          更新时间: new Date().toLocaleString("zh-CN"),
        };

        return {
          content: [
            {
              type: "text",
              text: `${city}当前天气：\n\n${Object.entries(weatherData)
                .map(([k, v]) => `${k}: ${v}`)
                .join("\n")}`,
            },
          ],
        };
      }

      case "url_analyzer": {
        const { url } = args;
        const urlObj = new URL(url);
        const analysis = {
          协议: urlObj.protocol,
          主机: urlObj.hostname,
          端口: urlObj.port || "默认端口",
          路径: urlObj.pathname,
          查询参数: urlObj.search || "无",
          片段: urlObj.hash || "无",
          域名: urlObj.hostname,
          安全连接: urlObj.protocol === "https:",
        };

        return {
          content: [
            {
              type: "text",
              text: `URL分析结果：\n\n${Object.entries(analysis)
                .map(([k, v]) => `${k}: ${v}`)
                .join("\n")}`,
            },
          ],
        };
      }

      default:
        throw new Error(`未知的工具: ${name}`);
    }
  });

  // 设置资源处理器
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: RESOURCES };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    switch (uri) {
      case "news://latest": {
        const news = {
          标题: "MCP协议升级到Streamable HTTP",
          时间: new Date().toISOString(),
          内容: "Model Context Protocol 已从 SSE 传输升级到更强大的 Streamable HTTP 传输",
          来源: "MCP官方",
        };

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(news, null, 2),
            },
          ],
        };
      }

      case "config://server": {
        const config = {
          服务器信息: {
            名称: "streamable-http-learning-mcp-server",
            版本: "1.0.0",
            传输协议: "Streamable HTTP",
            启动时间: new Date().toISOString(),
          },
          内存使用: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
          功能配置: {
            工具数量: TOOLS.length,
            资源数量: RESOURCES.length,
            提示数量: PROMPTS.length,
          },
        };

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(config, null, 2),
            },
          ],
        };
      }

      case "stats://usage": {
        const stats = {
          工具调用次数: Math.floor(Math.random() * 100),
          资源读取次数: Math.floor(Math.random() * 50),
          连接数: Math.floor(Math.random() * 10),
          当前时间: new Date().toISOString(),
        };

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`未知的资源: ${uri}`);
    }
  });

  // 设置提示处理器
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: PROMPTS };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    switch (name) {
      case "technical_writing": {
        const { topic, audience = "intermediate", format = "markdown" } = args;
        if (!topic) throw new Error("缺少必需参数: topic");

        const prompt = `请为${audience}编写关于"${topic}"的技术文档，格式：${format}

请包含以下部分：
1. 概述
2. 主要特性
3. 使用指南
4. 示例代码
5. 最佳实践
6. 常见问题

确保内容清晰、准确且易于理解。`;

        return {
          description: `为${topic}生成技术文档的提示`,
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: prompt,
              },
            },
          ],
        };
      }

      case "api_documentation": {
        const { endpoint, method, parameters = "无" } = args;
        if (!endpoint || !method) throw new Error("缺少必需参数");

        const prompt = `请为以下API端点生成完整的文档：

**端点**: ${method.toUpperCase()} ${endpoint}
**参数**: ${parameters}

请包含：
1. 端点描述
2. 请求格式
3. 响应格式
4. 状态码说明
5. 错误处理
6. 示例请求和响应
7. 注意事项

确保文档详细且易于开发者理解。`;

        return {
          description: `为API生成文档的提示`,
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: prompt,
              },
            },
          ],
        };
      }

      default:
        throw new Error(`未知的提示: ${name}`);
    }
  });

  return server;
}

// 主函数
async function main() {
  const PORT = process.env.PORT || 3002;

  console.log("🚀 Streamable HTTP 学习用 MCP 服务器正在启动...");
  console.log(`📡 服务器将在端口 ${PORT} 上运行`);
  console.log(`🔗 MCP 端点: http://localhost:${PORT}/mcp`);
  console.log("📋 可用功能:");
  console.log("  🔧 工具:", TOOLS.map((t) => t.name).join(", "));
  console.log("  📄 资源:", RESOURCES.map((r) => r.name).join(", "));
  console.log("  💭 提示:", PROMPTS.map((p) => p.name).join(", "));
  console.log("");

  const app = express();

  // CORS 设置
  app.use(
    cors({
      origin: true,
      credentials: true,
      exposedHeaders: ["Mcp-Session-Id"],
      allowedHeaders: ["Content-Type", "Mcp-Session-Id", "Authorization"],
    })
  );

  app.use(express.json());

  // 存储会话传输
  const transports = new Map();

  // Streamable HTTP 端点
  app.all("/mcp", async (req, res) => {
    console.log("📩 收到 MCP 请求:", req.method);

    try {
      const sessionId = req.headers["mcp-session-id"] || randomUUID();
      let transport = transports.get(sessionId);

      if (!transport) {
        // 创建新的传输
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId,
        });

        // 创建并连接服务器
        const server = createMCPServer();
        await server.connect(transport);

        // 存储传输
        transports.set(sessionId, transport);

        // 清理断开的连接
        transport.onclose = () => {
          console.log(`❌ 会话 ${sessionId} 已关闭`);
          transports.delete(sessionId);
        };

        console.log(`✅ 创建新会话: ${sessionId}`);
      }

      // 处理请求
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("处理 MCP 请求失败:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "内部服务器错误",
          },
          id: null,
        });
      }
    }
  });

  // 状态端点
  app.get("/", (req, res) => {
    res.json({
      name: "streamable-http-learning-mcp-server",
      version: "1.0.0",
      protocol: "Streamable HTTP",
      status: "运行中",
      activeConnections: transports.size,
      capabilities: {
        tools: TOOLS.length,
        resources: RESOURCES.length,
        prompts: PROMPTS.length,
      },
      endpoints: {
        mcp: "/mcp",
        status: "/",
      },
    });
  });

  // 启动服务器
  app.listen(PORT, () => {
    console.log(
      `✅ Streamable HTTP MCP 服务器已启动在 http://localhost:${PORT}`
    );
    console.log(`🔌 MCP 连接端点: http://localhost:${PORT}/mcp`);
    console.log("✅ 服务器已准备好接受连接");
  });
}

// 错误处理
process.on("SIGINT", () => {
  console.log("\n正在关闭 Streamable HTTP MCP 服务器...");
  process.exit(0);
});

// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ 服务器启动失败:", error);
    process.exit(1);
  });
}
