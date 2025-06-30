#!/usr/bin/env node

/**
 * 原生 Streamable HTTP MCP Server
 * 不使用第三方库，纯原生实现 MCP 协议
 * 用于学习 MCP 协议的核心机制
 */

import http from 'http';
import url from 'url';
import crypto from 'crypto';

// MCP 协议常量
const MCP_VERSION = '2024-11-05';
const JSONRPC_VERSION = '2.0';

// 工具定义
const TOOLS = [
  {
    name: "calculator",
    description: "基础计算器功能",
    inputSchema: {
      type: "object",
      properties: {
        operation: { type: "string", enum: ["add", "subtract", "multiply", "divide"] },
        a: { type: "number", description: "第一个数字" },
        b: { type: "number", description: "第二个数字" }
      },
      required: ["operation", "a", "b"]
    }
  },
  {
    name: "echo",
    description: "回声工具，返回输入的消息",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "要回声的消息" }
      },
      required: ["message"]
    }
  },
  {
    name: "random_number",
    description: "生成随机数",
    inputSchema: {
      type: "object",
      properties: {
        min: { type: "number", description: "最小值", default: 0 },
        max: { type: "number", description: "最大值", default: 100 }
      }
    }
  }
];

// 资源定义
const RESOURCES = [
  {
    uri: "time://current",
    name: "当前时间",
    description: "获取当前日期和时间",
    mimeType: "text/plain"
  },
  {
    uri: "info://server",
    name: "服务器信息",
    description: "获取服务器状态信息",
    mimeType: "application/json"
  },
  {
    uri: "data://sample",
    name: "示例数据",
    description: "获取示例JSON数据",
    mimeType: "application/json"
  }
];

// 提示定义
const PROMPTS = [
  {
    name: "code_review",
    description: "代码审查助手",
    arguments: [
      { name: "code", description: "要审查的代码", required: true },
      { name: "language", description: "编程语言", required: false }
    ]
  },
  {
    name: "explain_concept",
    description: "概念解释器",
    arguments: [
      { name: "concept", description: "要解释的概念", required: true },
      { name: "level", description: "解释深度", required: false }
    ]
  }
];

// 会话管理
const sessions = new Map();

/**
 * 生成会话ID
 */
function generateSessionId() {
  return crypto.randomUUID();
}

/**
 * 解析 JSON-RPC 消息
 */
function parseJsonRpcMessage(data) {
  try {
    const message = JSON.parse(data);
    
    // 验证 JSON-RPC 格式
    if (message.jsonrpc !== JSONRPC_VERSION) {
      throw new Error('Invalid JSON-RPC version');
    }
    
    return message;
  } catch (error) {
    throw new Error(`Invalid JSON-RPC message: ${error.message}`);
  }
}

/**
 * 创建 JSON-RPC 响应
 */
function createJsonRpcResponse(id, result) {
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    result
  };
}

/**
 * 创建 JSON-RPC 错误响应
 */
function createJsonRpcError(id, code, message, data = null) {
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    error: {
      code,
      message,
      ...(data && { data })
    }
  };
}

/**
 * 创建 JSON-RPC 通知
 */
function createJsonRpcNotification(method, params) {
  return {
    jsonrpc: JSONRPC_VERSION,
    method,
    params
  };
}

/**
 * 处理 MCP 初始化
 */
function handleInitialize(request) {
  const { protocolVersion, capabilities, clientInfo } = request.params;
  
  console.log(`📋 客户端连接: ${clientInfo?.name || 'Unknown'} v${clientInfo?.version || 'Unknown'}`);
  console.log(`🔌 协议版本: ${protocolVersion}`);
  
  return createJsonRpcResponse(request.id, {
    protocolVersion: MCP_VERSION,
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
      // 支持流式传输
      streaming: {}
    },
    serverInfo: {
      name: "native-streamable-http-mcp-server",
      version: "1.0.0"
    }
  });
}

/**
 * 处理工具列表请求
 */
function handleListTools(request) {
  return createJsonRpcResponse(request.id, {
    tools: TOOLS
  });
}

/**
 * 处理工具调用
 */
function handleCallTool(request) {
  const { name, arguments: args } = request.params;
  
  console.log(`🔧 调用工具: ${name}`, args);
  
  switch (name) {
    case 'calculator': {
      const { operation, a, b } = args;
      let result;
      
      switch (operation) {
        case 'add':
          result = a + b;
          break;
        case 'subtract':
          result = a - b;
          break;
        case 'multiply':
          result = a * b;
          break;
        case 'divide':
          if (b === 0) {
            throw new Error('Division by zero');
          }
          result = a / b;
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      return createJsonRpcResponse(request.id, {
        content: [{
          type: "text",
          text: `${a} ${operation} ${b} = ${result}`
        }]
      });
    }
    
    case 'echo': {
      const { message } = args;
      return createJsonRpcResponse(request.id, {
        content: [{
          type: "text",
          text: `Echo: ${message}`
        }]
      });
    }
    
    case 'random_number': {
      const { min = 0, max = 100 } = args;
      const result = Math.floor(Math.random() * (max - min + 1)) + min;
      
      return createJsonRpcResponse(request.id, {
        content: [{
          type: "text",
          text: `随机数 (${min}-${max}): ${result}`
        }]
      });
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * 处理资源列表请求
 */
function handleListResources(request) {
  return createJsonRpcResponse(request.id, {
    resources: RESOURCES
  });
}

/**
 * 处理资源读取请求
 */
function handleReadResource(request) {
  const { uri } = request.params;
  
  console.log(`📄 读取资源: ${uri}`);
  
  switch (uri) {
    case 'time://current': {
      const now = new Date();
      return createJsonRpcResponse(request.id, {
        contents: [{
          uri,
          mimeType: "text/plain",
          text: `当前时间: ${now.toLocaleString('zh-CN')}`
        }]
      });
    }
    
    case 'info://server': {
      const info = {
        name: "native-streamable-http-mcp-server",
        version: "1.0.0",
        protocol: "Native Streamable HTTP",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid,
        activeSessions: sessions.size,
        capabilities: {
          tools: TOOLS.length,
          resources: RESOURCES.length,
          prompts: PROMPTS.length
        }
      };
      
      return createJsonRpcResponse(request.id, {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify(info, null, 2)
        }]
      });
    }
    
    case 'data://sample': {
      const sampleData = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        data: {
          message: "这是一个示例数据",
          values: [1, 2, 3, 4, 5],
          nested: {
            property: "value"
          }
        }
      };
      
      return createJsonRpcResponse(request.id, {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify(sampleData, null, 2)
        }]
      });
    }
    
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}

/**
 * 处理提示列表请求
 */
function handleListPrompts(request) {
  return createJsonRpcResponse(request.id, {
    prompts: PROMPTS
  });
}

/**
 * 处理获取提示请求
 */
function handleGetPrompt(request) {
  const { name, arguments: args = {} } = request.params;
  
  console.log(`💭 获取提示: ${name}`, args);
  
  switch (name) {
    case 'code_review': {
      const { code, language = 'unknown' } = args;
      if (!code) {
        throw new Error('Missing required parameter: code');
      }
      
      const prompt = `请审查以下${language}代码：

\`\`\`${language}
${code}
\`\`\`

请从以下方面进行评估：
1. 代码质量和可读性
2. 潜在的bug和问题
3. 性能优化建议
4. 最佳实践遵循情况
5. 安全性考虑

请提供具体的改进建议。`;

      return createJsonRpcResponse(request.id, {
        description: `代码审查提示 - ${language}`,
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: prompt
          }
        }]
      });
    }
    
    case 'explain_concept': {
      const { concept, level = 'intermediate' } = args;
      if (!concept) {
        throw new Error('Missing required parameter: concept');
      }
      
      const prompt = `请为${level}水平的学习者解释"${concept}"这个概念。

请包含：
1. 基本定义
2. 核心特点
3. 实际应用场景
4. 简单示例
5. 相关概念联系

请用通俗易懂的语言解释，并提供实际的例子。`;

      return createJsonRpcResponse(request.id, {
        description: `概念解释提示 - ${concept}`,
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: prompt
          }
        }]
      });
    }
    
    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}

/**
 * 路由 MCP 请求
 */
function routeMcpRequest(request) {
  const { method } = request;
  
  switch (method) {
    case 'initialize':
      return handleInitialize(request);
    case 'tools/list':
      return handleListTools(request);
    case 'tools/call':
      return handleCallTool(request);
    case 'resources/list':
      return handleListResources(request);
    case 'resources/read':
      return handleReadResource(request);
    case 'prompts/list':
      return handleListPrompts(request);
    case 'prompts/get':
      return handleGetPrompt(request);
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

/**
 * 处理 HTTP 请求
 */
function handleHttpRequest(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  
  // 状态端点
  if (parsedUrl.pathname === '/' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({
      name: "native-streamable-http-mcp-server",
      version: "1.0.0",
      protocol: "Native Streamable HTTP",
      status: "running",
      uptime: process.uptime(),
      activeSessions: sessions.size,
      capabilities: {
        tools: TOOLS.length,
        resources: RESOURCES.length,
        prompts: PROMPTS.length
      },
      endpoints: {
        mcp: "/mcp",
        status: "/"
      }
    }, null, 2));
    return;
  }
  
  // MCP 端点
  if (parsedUrl.pathname === '/mcp') {
    handleMcpRequest(req, res);
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

/**
 * 处理 MCP 请求
 */
function handleMcpRequest(req, res) {
  // 获取或生成会话ID
  let sessionId = req.headers['mcp-session-id'];
  if (!sessionId) {
    sessionId = generateSessionId();
    res.setHeader('Mcp-Session-Id', sessionId);
  }
  
  // 初始化会话
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      createdAt: new Date(),
      initialized: false
    });
    console.log(`✅ 创建新会话: ${sessionId}`);
  }
  
  const session = sessions.get(sessionId);
  
  if (req.method === 'GET') {
    // 流式传输连接
    handleStreamingConnection(req, res, session);
  } else if (req.method === 'POST') {
    // 处理消息
    handleMessage(req, res, session);
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }
}

/**
 * 处理流式传输连接
 */
function handleStreamingConnection(req, res, session) {
  // 设置 Server-Sent Events 头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Mcp-Session-Id': session.id
  });
  
  // 发送连接确认
  res.write('event: connect\n');
  res.write(`data: ${JSON.stringify({ sessionId: session.id })}\n\n`);
  
  // 存储响应对象用于后续流式传输
  session.response = res;
  
  // 处理客户端断开连接
  req.on('close', () => {
    console.log(`❌ 会话 ${session.id} 已断开`);
    sessions.delete(session.id);
  });
  
  // 保持连接活跃
  const keepAlive = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(keepAlive);
      return;
    }
    res.write('event: ping\ndata: {}\n\n');
  }, 30000);
  
  req.on('close', () => {
    clearInterval(keepAlive);
  });
}

/**
 * 处理消息
 */
function handleMessage(req, res, session) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      console.log(`📨 收到消息 [${session.id}]:`, body);
      
      const request = parseJsonRpcMessage(body);
      const response = routeMcpRequest(request);
      
      // 标记会话已初始化
      if (request.method === 'initialize') {
        session.initialized = true;
      }
      
      // 发送响应
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Mcp-Session-Id', session.id);
      res.writeHead(200);
      res.end(JSON.stringify(response));
      
      console.log(`📤 发送响应 [${session.id}]:`, JSON.stringify(response));
      
      // 如果有流式连接，也通过 SSE 发送
      if (session.response && !session.response.writableEnded) {
        session.response.write('event: message\n');
        session.response.write(`data: ${JSON.stringify(response)}\n\n`);
      }
      
    } catch (error) {
      console.error(`❌ 处理消息失败 [${session.id}]:`, error);
      
      const errorResponse = createJsonRpcError(
        body ? JSON.parse(body).id : null,
        -32603,
        error.message
      );
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Mcp-Session-Id', session.id);
      res.writeHead(500);
      res.end(JSON.stringify(errorResponse));
    }
  });
}

/**
 * 主函数
 */
function main() {
  const PORT = process.env.PORT || 3003;
  
  console.log('🚀 原生 Streamable HTTP MCP 服务器正在启动...');
  console.log(`📡 服务器将在端口 ${PORT} 上运行`);
  console.log(`🔗 MCP 端点: http://localhost:${PORT}/mcp`);
  console.log('📋 可用功能:');
  console.log('  🔧 工具:', TOOLS.map(t => t.name).join(', '));
  console.log('  📄 资源:', RESOURCES.map(r => r.name).join(', '));
  console.log('  💭 提示:', PROMPTS.map(p => p.name).join(', '));
  console.log('');
  
  const server = http.createServer(handleHttpRequest);
  
  server.listen(PORT, () => {
    console.log(`✅ 原生 Streamable HTTP MCP 服务器已启动在 http://localhost:${PORT}`);
    console.log(`🔌 MCP 连接端点: http://localhost:${PORT}/mcp`);
    console.log('✅ 服务器已准备好接受连接');
  });
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n正在关闭原生 Streamable HTTP MCP 服务器...');
    server.close(() => {
      console.log('✅ 服务器已关闭');
      process.exit(0);
    });
  });
  
  // 错误处理
  server.on('error', (error) => {
    console.error('❌ 服务器错误:', error);
    process.exit(1);
  });
}

// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  main,
  handleHttpRequest,
  routeMcpRequest,
  TOOLS,
  RESOURCES,
  PROMPTS
};