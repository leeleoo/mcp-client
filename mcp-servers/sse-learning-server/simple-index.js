#!/usr/bin/env node

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

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
        units: { type: "string", enum: ["celsius", "fahrenheit"], default: "celsius" },
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

// 统计数据
let stats = {
  toolCalls: 0,
  resourceReads: 0,
  promptGets: 0,
  startTime: new Date(),
};

// SSE 端点
app.get('/sse', (req, res) => {
  // 设置 SSE 头部
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // 发送初始化消息
  res.write(`data: ${JSON.stringify({
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
      serverInfo: {
        name: "sse-learning-mcp-server",
        version: "1.0.0",
      },
    },
  })}\\n\\n`);

  // 保持连接活跃
  const keepAlive = setInterval(() => {
    res.write(`: keep-alive\\n\\n`);
  }, 30000);

  // 处理连接关闭
  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// MCP 消息处理端点
app.post('/mcp', async (req, res) => {
  try {
    const { method, params, id } = req.body;
    let result;

    switch (method) {
      case 'tools/list':
        result = { tools: TOOLS };
        break;

      case 'tools/call':
        stats.toolCalls++;
        result = await handleToolCall(params);
        break;

      case 'resources/list':
        result = { resources: RESOURCES };
        break;

      case 'resources/read':
        stats.resourceReads++;
        result = await handleResourceRead(params);
        break;

      case 'prompts/list':
        result = { prompts: PROMPTS };
        break;

      case 'prompts/get':
        stats.promptGets++;
        result = await handlePromptGet(params);
        break;

      default:
        throw new Error(`未知的方法: ${method}`);
    }

    res.json({
      jsonrpc: "2.0",
      id,
      result,
    });
  } catch (error) {
    res.status(500).json({
      jsonrpc: "2.0",
      id: req.body.id,
      error: {
        code: -32603,
        message: error.message,
      },
    });
  }
});

// 工具调用处理
async function handleToolCall({ name, arguments: args }) {
  switch (name) {
    case "web_search": {
      const { query, limit = 5 } = args;
      const mockResults = [
        { title: `${query} - 维基百科`, url: `https://zh.wikipedia.org/wiki/${encodeURIComponent(query)}`, snippet: `关于"${query}"的详细介绍...` },
        { title: `${query} 教程`, url: `https://blog.example.com/${query}`, snippet: `学习${query}的完整教程...` },
        { title: `${query} 官方文档`, url: `https://docs.example.com/${query}`, snippet: `${query}的官方文档...` },
      ].slice(0, limit);

      return {
        content: [{
          type: "text",
          text: `搜索"${query}"的结果：\\n\\n${mockResults.map((r, i) => `${i + 1}. **${r.title}**\\n   ${r.url}\\n   ${r.snippet}\\n`).join("\\n")}`,
        }],
      };
    }

    case "weather_info": {
      const { city, units = "celsius" } = args;
      const tempC = Math.floor(Math.random() * 30) + 5;
      const tempF = Math.floor(tempC * 9/5 + 32);
      const conditions = ["晴朗", "多云", "小雨", "阴天"];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      const weatherData = {
        城市: city,
        天气: condition,
        温度: units === "fahrenheit" ? `${tempF}°F` : `${tempC}°C`,
        湿度: `${Math.floor(Math.random() * 40) + 40}%`,
        风速: `${Math.floor(Math.random() * 15) + 5} km/h`,
        更新时间: new Date().toLocaleString("zh-CN"),
      };

      return {
        content: [{
          type: "text",
          text: `${city}当前天气：\\n\\n${Object.entries(weatherData).map(([k, v]) => `${k}: ${v}`).join("\\n")}`,
        }],
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
        content: [{
          type: "text",
          text: `URL分析结果：\\n\\n${Object.entries(analysis).map(([k, v]) => `${k}: ${v}`).join("\\n")}`,
        }],
      };
    }

    default:
      throw new Error(`未知的工具: ${name}`);
  }
}

// 资源读取处理
async function handleResourceRead({ uri }) {
  switch (uri) {
    case "news://latest": {
      const mockNews = [
        { 标题: "AI技术新突破", 摘要: "研究人员在NLP领域取得重大进展...", 时间: new Date().toISOString(), 来源: "科技日报" },
        { 标题: "开源软件发展", 摘要: "2024年开源社区呈现新态势...", 时间: new Date().toISOString(), 来源: "开发者周刊" },
      ];

      return {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify(mockNews, null, 2),
        }],
      };
    }

    case "config://server": {
      const config = {
        服务器名称: "sse-learning-mcp-server",
        版本: "1.0.0",
        通讯方式: "HTTP + 自定义MCP",
        端口: PORT,
        启动时间: stats.startTime.toISOString(),
        支持功能: { 工具数量: TOOLS.length, 资源数量: RESOURCES.length, 提示数量: PROMPTS.length },
      };

      return {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify(config, null, 2),
        }],
      };
    }

    case "stats://usage": {
      const usageStats = {
        运行时间: `${Math.floor((Date.now() - stats.startTime) / 1000)}秒`,
        内存使用: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        请求统计: {
          工具调用: stats.toolCalls,
          资源读取: stats.resourceReads,
          提示获取: stats.promptGets,
        },
        统计时间: new Date().toISOString(),
      };

      return {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify(usageStats, null, 2),
        }],
      };
    }

    default:
      throw new Error(`未知的资源: ${uri}`);
  }
}

// 提示获取处理
async function handlePromptGet({ name, arguments: args = {} }) {
  switch (name) {
    case "technical_writing": {
      const { topic, audience = "intermediate", format = "markdown" } = args;
      if (!topic) throw new Error("缺少必需参数: topic");

      const audienceMap = { beginner: "初学者", intermediate: "中级用户", expert: "专家" };
      const prompt = `请为${audienceMap[audience] || "中级用户"}编写关于"${topic}"的技术文档。

要求：
1. 文档格式: ${format}
2. 目标读者: ${audienceMap[audience] || "中级用户"}
3. 文档结构: 概述、核心概念、应用示例、最佳实践、FAQ、参考资料

主题: ${topic}`;

      return {
        description: `为${topic}生成技术文档的提示`,
        messages: [{ role: "user", content: { type: "text", text: prompt } }],
      };
    }

    case "api_documentation": {
      const { endpoint, method, parameters = "无" } = args;
      if (!endpoint || !method) throw new Error("缺少必需参数: endpoint 和 method");

      const prompt = `请为以下API端点生成完整的文档：

**API端点**: ${endpoint}
**HTTP方法**: ${method.toUpperCase()}
**参数说明**: ${parameters}

请按照标准格式生成包含描述、参数、响应、状态码、示例和注意事项的完整文档。`;

      return {
        description: `为${method.toUpperCase()} ${endpoint}生成API文档的提示`,
        messages: [{ role: "user", content: { type: "text", text: prompt } }],
      };
    }

    default:
      throw new Error(`未知的提示: ${name}`);
  }
}

// 健康检查端点
app.get('/', (req, res) => {
  res.json({
    name: "sse-learning-mcp-server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      sse: "/sse",
      mcp: "/mcp",
    },
    capabilities: {
      tools: TOOLS.length,
      resources: RESOURCES.length,
      prompts: PROMPTS.length,
    },
    stats,
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 SSE 学习 MCP 服务器已启动`);
  console.log(`📡 服务器地址: http://localhost:${PORT}`);
  console.log(`🔌 SSE 端点: http://localhost:${PORT}/sse`);
  console.log(`📬 MCP 端点: http://localhost:${PORT}/mcp`);
  console.log(`📋 可用功能:`);
  console.log(`  🔧 工具: ${TOOLS.map(t => t.name).join(", ")}`);
  console.log(`  📄 资源: ${RESOURCES.map(r => r.name).join(", ")}`);
  console.log(`  💭 提示: ${PROMPTS.map(p => p.name).join(", ")}`);
});

export { app };