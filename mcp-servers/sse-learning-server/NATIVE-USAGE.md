# 原生 Streamable HTTP MCP Server 使用指南

这是一个完全原生实现的 Streamable HTTP MCP Server，不使用任何第三方 MCP SDK，用于学习和理解 MCP 协议的核心机制。

## 特性

- ✅ 完全原生实现，无第三方依赖
- ✅ 支持完整的 MCP 协议 (2024-11-05)
- ✅ 支持 Server-Sent Events (SSE) 流式传输
- ✅ 支持会话管理
- ✅ 实现了工具 (Tools)、资源 (Resources)、提示 (Prompts) 功能
- ✅ 包含完整的错误处理和 CORS 支持
- ✅ 提供详细的测试和使用示例

## 快速开始

### 启动服务器

```bash
# 启动原生 MCP 服务器
node native-streamable-http-server.js
```

服务器将在 `http://localhost:3003` 启动，MCP 端点为 `/mcp`。

### 运行测试

```bash
# 运行完整测试套件
node native-test.js
```

## MCP 协议实现详解

### 1. HTTP 传输层

**端点**: `POST /mcp`

**请求头**:
- `Content-Type: application/json`
- `Mcp-Session-Id: <session-id>` (可选，服务器会自动生成)

**响应头**:
- `Content-Type: application/json`
- `Mcp-Session-Id: <session-id>`

### 2. JSON-RPC 2.0 消息格式

所有 MCP 消息都使用 JSON-RPC 2.0 格式：

```json
{
  "jsonrpc": "2.0",
  "method": "方法名",
  "params": { "参数": "值" },
  "id": 请求ID
}
```

### 3. 会话管理

- 每个客户端连接都有一个唯一的会话ID
- 会话ID通过 `Mcp-Session-Id` 头传递
- 服务器自动管理会话状态和清理

### 4. 流式传输 (SSE)

**端点**: `GET /mcp`

建立 Server-Sent Events 连接用于实时消息传输：

```javascript
// 建立 SSE 连接
const eventSource = new EventSource('http://localhost:3003/mcp');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
};
```

## 支持的 MCP 方法

### 初始化

```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {}
    },
    "clientInfo": {
      "name": "client-name",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

### 工具 (Tools)

#### 列出工具
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 2
}
```

#### 调用工具
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "calculator",
    "arguments": {
      "operation": "add",
      "a": 10,
      "b": 5
    }
  },
  "id": 3
}
```

**可用工具**:
- `calculator`: 基础计算器 (add, subtract, multiply, divide)
- `echo`: 回声工具
- `random_number`: 随机数生成器

### 资源 (Resources)

#### 列出资源
```json
{
  "jsonrpc": "2.0",
  "method": "resources/list",
  "id": 4
}
```

#### 读取资源
```json
{
  "jsonrpc": "2.0",
  "method": "resources/read",
  "params": {
    "uri": "time://current"
  },
  "id": 5
}
```

**可用资源**:
- `time://current`: 当前时间
- `info://server`: 服务器信息
- `data://sample`: 示例数据

### 提示 (Prompts)

#### 列出提示
```json
{
  "jsonrpc": "2.0",
  "method": "prompts/list",
  "id": 6
}
```

#### 获取提示
```json
{
  "jsonrpc": "2.0",
  "method": "prompts/get",
  "params": {
    "name": "code_review",
    "arguments": {
      "code": "function test() { return 42; }",
      "language": "JavaScript"
    }
  },
  "id": 7
}
```

**可用提示**:
- `code_review`: 代码审查提示
- `explain_concept`: 概念解释提示

## 使用示例

### 在现有项目中集成

将服务器配置添加到 `mcp-servers.json`:

```json
{
  "servers": [
    {
      "name": "native-learning-server",
      "type": "sse",
      "url": "http://localhost:3003/mcp",
      "description": "原生 Streamable HTTP MCP 学习服务器",
      "autoConnect": true
    }
  ]
}
```

### 命令行测试

```bash
# 启动服务器
node native-streamable-http-server.js

# 在另一个终端运行测试
node native-test.js

# 或者使用 curl 测试
curl -X POST http://localhost:3003/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"curl-test","version":"1.0.0"}},"id":1}'
```

### 与现有客户端连接

```bash
# 通过 CLI 连接
npm run cli
> mcp connect sse native-learning http://localhost:3003/mcp

# 测试工具调用
> [MCP_TOOL:calculator:{"operation":"add","a":10,"b":5}]

# 测试资源读取
> [MCP_RESOURCE:time://current]

# 测试提示
> [MCP_PROMPT:code_review:{"code":"function test() { return 42; }","language":"JavaScript"}]
```

## 错误处理

服务器实现了完整的 JSON-RPC 2.0 错误处理：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "内部服务器错误",
    "data": "详细错误信息"
  }
}
```

常见错误代码:
- `-32700`: 解析错误
- `-32600`: 无效请求
- `-32601`: 方法未找到
- `-32602`: 无效参数
- `-32603`: 内部错误

## 学习要点

这个实现展示了以下 MCP 协议的核心概念：

1. **JSON-RPC 2.0 消息格式**: 所有 MCP 通信都基于 JSON-RPC 2.0
2. **会话管理**: 每个客户端连接维护独立的会话状态
3. **能力协商**: 通过 `initialize` 方法协商客户端和服务器的能力
4. **流式传输**: 支持 Server-Sent Events 进行实时消息传输
5. **错误处理**: 完整的错误处理和状态码管理
6. **CORS 支持**: 支持跨域请求，便于 Web 客户端集成

## 扩展说明

这个原生实现可以作为学习 MCP 协议的基础，你可以：

1. 添加更多自定义工具
2. 实现更复杂的资源提供者
3. 创建高级提示模板
4. 添加认证和授权机制
5. 实现数据持久化
6. 添加更多传输协议支持

## 与第三方库的对比

这个原生实现与使用 `@modelcontextprotocol/sdk` 的实现效果完全一致，但提供了更深入的学习价值：

- **透明性**: 完全可见的协议实现细节
- **可定制性**: 更容易根据需求进行定制
- **学习价值**: 深入理解 MCP 协议的工作原理
- **零依赖**: 不依赖任何第三方 MCP 库

这使得它成为学习 MCP 协议的理想选择。