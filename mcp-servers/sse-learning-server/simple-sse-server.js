#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
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
      name: "sse-learning-mcp-server",
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
          是否HTTPS: urlObj.protocol === "https:",
          分析时间: new Date().toISOString(),
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
        const mockNews = [
          {
            标题: "AI技术新突破",
            摘要: "研究人员在NLP领域取得重大进展...",
            时间: new Date().toISOString(),
            来源: "科技日报",
          },
          {
            标题: "开源软件发展",
            摘要: "2024年开源社区呈现新态势...",
            时间: new Date().toISOString(),
            来源: "开发者周刊",
          },
        ];

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(mockNews, null, 2),
            },
          ],
        };
      }

      case "config://server": {
        const config = {
          服务器信息: {
            名称: "sse-learning-mcp-server",
            版本: "1.0.0",
            启动时间: new Date().toISOString(),
          },
          内存使用: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
          功能配置: {
            工具数量: TOOLS.length,
            资源数量: RESOURCES.length,
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

        const prompt = `请为${audience}编写关于"${topic}"的技术文档，格式：${format}`;
        return {
          description: `为${topic}生成技术文档的提示`,
          messages: [{ role: "user", content: { type: "text", text: prompt } }],
        };
      }

      case "api_documentation": {
        const { endpoint, method, parameters = "无" } = args;
        if (!endpoint || !method) throw new Error("缺少必需参数");

        const prompt = `请为API端点 ${method.toUpperCase()} ${endpoint} 生成文档，参数：${parameters}`;
        return {
          description: `为API生成文档的提示`,
          messages: [{ role: "user", content: { type: "text", text: prompt } }],
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
  const PORT = process.env.PORT || 3002; // 改用 3002 端口避免冲突
  
  console.log("🚀 简化版 SSE 学习用 MCP 服务器正在启动...");
  console.log(`📡 服务器将在端口 ${PORT} 上运行`);
  console.log(`🔗 SSE 端点: http://localhost:${PORT}/sse`);
  console.log("📋 可用功能:");
  console.log("  🔧 工具:", TOOLS.map((t) => t.name).join(", "));
  console.log("  📄 资源:", RESOURCES.map((r) => r.name).join(", "));
  console.log("  💭 提示:", PROMPTS.map((p) => p.name).join(", "));
  console.log("");

  const app = express();
  
  app.use(cors());
  app.use(express.json());

  // SSE 端点处理
  app.get("/sse", async (req, res) => {
    console.log("📡 新的 SSE 连接请求");
    
    try {
      // 创建 MCP 服务器实例
      const server = createMCPServer();
      
      // 创建 SSE 传输（注意：第一个参数是 POST 端点路径）
      const transport = new SSEServerTransport("/sse", res);
      
      // 连接服务器（自动启动传输）
      await server.connect(transport);
      
      console.log(`✅ SSE 连接已建立，会话ID: ${transport.sessionId}`);
      
      // 处理连接关闭
      transport.onclose = () => {
        console.log(`❌ SSE 连接已关闭，会话ID: ${transport.sessionId}`);
      };
      
      // 存储传输用于消息处理
      req.app.locals.transports = req.app.locals.transports || new Map();
      req.app.locals.transports.set(transport.sessionId, transport);
      
    } catch (error) {
      console.error("SSE 连接失败:", error);
      res.status(500).json({ error: "SSE 连接失败" });
    }
  });

  // POST 消息端点处理
  app.post("/sse", async (req, res) => {
    console.log("📩 收到 POST 消息请求");
    
    try {
      const transports = req.app.locals.transports || new Map();
      
      // 寻找合适的传输（简化版：使用第一个可用的传输）
      const transport = Array.from(transports.values())[0];
      
      if (!transport) {
        console.error("没有找到活跃的传输连接");
        return res.status(404).json({ error: "没有活跃的连接" });
      }
      
      await transport.handlePostMessage(req, res);
    } catch (error) {
      console.error("处理 POST 消息失败:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "处理消息失败" });
      }
    }
  });

  // 状态端点
  app.get("/", (req, res) => {
    const transports = req.app.locals.transports || new Map();
    res.json({
      name: "sse-learning-mcp-server",
      version: "1.0.0",
      status: "运行中",
      activeConnections: transports.size,
      capabilities: {
        tools: TOOLS.length,
        resources: RESOURCES.length,
        prompts: PROMPTS.length,
      }
    });
  });

  // 启动服务器
  app.listen(PORT, () => {
    console.log(`✅ HTTP 服务器已启动在 http://localhost:${PORT}`);
    console.log(`🔌 MCP 连接端点: http://localhost:${PORT}/sse`);
    console.log("✅ 简化版 SSE MCP 服务器已准备好接受连接");
  });
}

// 错误处理
process.on("SIGINT", () => {
  console.log("\n正在关闭 SSE MCP 服务器...");
  process.exit(0);
});

// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ 服务器启动失败:", error);
    process.exit(1);
  });
}