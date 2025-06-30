# SSE 学习用 MCP 服务器

这是一个基于 HTTP + Server-Sent Events (SSE) 通讯的 MCP 服务器示例，用于学习和演示 MCP 协议的网络通讯模式。

## 🌟 特性

- **基于 SSE 的通讯**: 使用 HTTP + Server-Sent Events 进行双向通讯
- **Express.js 框架**: 基于 Express.js 构建的 HTTP 服务器
- **CORS 支持**: 支持跨域请求，便于在不同端口的客户端连接
- **丰富的功能**: 包含工具、资源和提示三种 MCP 功能类型
- **模拟数据**: 提供模拟的网页搜索、天气查询等功能
- **详细文档**: 完整的 API 文档和使用示例

## 📋 功能列表

### 🔧 工具 (Tools)

1. **web_search** - 模拟网页搜索功能
   - 参数: `query` (搜索关键词), `limit` (结果数量)
   - 返回模拟的搜索结果列表

2. **weather_info** - 获取天气信息
   - 参数: `city` (城市名称), `units` (温度单位)
   - 返回模拟的天气数据

3. **url_analyzer** - 分析URL的基本信息
   - 参数: `url` (要分析的URL)
   - 返回URL的结构化分析结果

### 📄 资源 (Resources)

1. **news://latest** - 最新新闻摘要
   - 返回模拟的新闻列表 (JSON格式)

2. **config://server** - 服务器配置信息
   - 返回当前服务器配置 (JSON格式)

3. **stats://usage** - 使用统计信息
   - 返回服务器运行统计 (JSON格式)

### 💭 提示 (Prompts)

1. **technical_writing** - 技术文档写作助手
   - 参数: `topic` (文档主题), `audience` (目标读者), `format` (文档格式)
   - 生成技术文档写作的详细提示

2. **api_documentation** - API文档生成器
   - 参数: `endpoint` (API端点), `method` (HTTP方法), `parameters` (参数说明)
   - 生成API文档的标准化提示

## 🚀 快速开始

### 安装依赖

```bash
cd mcp-servers/sse-learning-server
npm install
```

### 启动服务器

```bash
npm start
```

服务器默认在端口 3001 启动，SSE 端点为: `http://localhost:3001/sse`

### 开发模式

```bash
npm run dev
```

使用 `--watch` 模式启动，文件修改时自动重启。

### 运行测试

```bash
npm test
```

运行完整的功能测试，验证所有工具、资源和提示是否正常工作。

## 🔧 配置选项

### 环境变量

- `PORT`: 服务器端口 (默认: 3001)
- `NODE_ENV`: 运行环境 (development/production)

### 示例配置

```bash
PORT=3001 NODE_ENV=development npm start
```

## 📡 连接到客户端

### 在 mcp-servers.json 中配置

```json
{
  "servers": [
    {
      "name": "sse-learning-server",
      "type": "sse",
      "url": "http://localhost:3001/sse",
      "description": "SSE 学习用 MCP 服务器",
      "autoConnect": true
    }
  ]
}
```

### 手动连接示例

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const client = new Client({
  name: "my-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

const transport = new SSEClientTransport(new URL("http://localhost:3001/sse"));
await client.connect(transport);

// 使用客户端...
const tools = await client.listTools();
```

## 🧪 测试示例

### 测试工具调用

```javascript
// 网页搜索
const searchResult = await client.callTool({
  name: "web_search",
  arguments: { query: "TypeScript", limit: 5 }
});

// 天气查询
const weatherResult = await client.callTool({
  name: "weather_info",
  arguments: { city: "上海", units: "celsius" }
});

// URL 分析
const urlResult = await client.callTool({
  name: "url_analyzer",
  arguments: { url: "https://example.com/path?param=value" }
});
```

### 测试资源读取

```javascript
// 读取新闻
const news = await client.readResource({ uri: "news://latest" });

// 读取服务器配置
const config = await client.readResource({ uri: "config://server" });

// 读取使用统计
const stats = await client.readResource({ uri: "stats://usage" });
```

### 测试提示获取

```javascript
// 技术写作提示
const techPrompt = await client.getPrompt({
  name: "technical_writing",
  arguments: { 
    topic: "Docker容器化",
    audience: "beginner",
    format: "markdown"
  }
});

// API 文档提示
const apiPrompt = await client.getPrompt({
  name: "api_documentation",
  arguments: { 
    endpoint: "/api/auth/login",
    method: "POST",
    parameters: "username, password"
  }
});
```

## 🏗️ 架构说明

### SSE vs Stdio

与 stdio 传输方式相比，SSE 传输有以下特点：

**优点:**
- 基于标准 HTTP 协议，更容易部署和调试
- 支持跨域请求 (CORS)
- 可以通过网络防火墙和代理
- 支持负载均衡和集群部署
- 更容易集成到现有的 Web 服务中

**缺点:**
- 需要额外的 HTTP 服务器
- 相比 stdio 有稍高的开销
- 需要处理网络连接状态

### 目录结构

```
sse-learning-server/
├── package.json          # 项目配置和依赖
├── index.js              # 主服务器文件
├── test.js               # 测试文件
└── README.md             # 文档
```

## 🔍 调试技巧

### 服务器日志

服务器会输出详细的日志信息，包括：
- 启动信息和配置
- 连接状态
- 请求处理过程
- 错误信息

### HTTP 端点测试

可以直接访问 HTTP 端点进行调试：

```bash
# 检查服务器状态
curl http://localhost:3001/sse

# 查看服务器信息
curl http://localhost:3001/
```

### 浏览器调试

在浏览器中访问 `http://localhost:3001/sse` 可以看到 SSE 连接状态。

## 🚨 注意事项

1. **端口冲突**: 确保端口 3001 没有被其他程序占用
2. **网络防火墙**: 确保防火墙允许访问指定端口
3. **CORS 设置**: 如果在生产环境中使用，请适当配置 CORS 策略
4. **错误处理**: 服务器包含完整的错误处理机制，但请注意网络连接的稳定性

## 📚 参考资料

- [Model Context Protocol 规范](https://modelcontextprotocol.io/)
- [MCP SDK 文档](https://github.com/modelcontextprotocol/typescript-sdk)
- [Express.js 文档](https://expressjs.com/)
- [Server-Sent Events 规范](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个学习示例！