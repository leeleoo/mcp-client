#!/usr/bin/env node

/**
 * 原生 Streamable HTTP MCP Server 测试客户端
 * 用于测试不使用第三方库的 MCP 实现
 */

import http from 'http';

const SERVER_URL = 'http://localhost:3003';
const MCP_ENDPOINT = '/mcp';

let sessionId = null;

/**
 * 创建 JSON-RPC 请求
 */
function createJsonRpcRequest(method, params = {}, id = null) {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id: id || Date.now()
  };
}

/**
 * 发送 HTTP 请求
 */
function sendHttpRequest(path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
        ...(sessionId && { 'Mcp-Session-Id': sessionId })
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      // 获取会话ID
      if (res.headers['mcp-session-id']) {
        sessionId = res.headers['mcp-session-id'];
      }
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ response, statusCode: res.statusCode, headers: res.headers });
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * 测试初始化
 */
async function testInitialize() {
  console.log('\n🔧 测试 initialize...');
  
  const request = createJsonRpcRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    },
    clientInfo: {
      name: 'native-test-client',
      version: '1.0.0'
    }
  });
  
  try {
    const { response } = await sendHttpRequest(MCP_ENDPOINT, JSON.stringify(request));
    
    if (response.error) {
      throw new Error(`Initialize failed: ${response.error.message}`);
    }
    
    console.log('✅ Initialize 成功');
    console.log('   服务器信息:', response.result.serverInfo);
    console.log('   协议版本:', response.result.protocolVersion);
    console.log('   会话ID:', sessionId);
    
    return true;
  } catch (error) {
    console.error('❌ Initialize 失败:', error.message);
    return false;
  }
}

/**
 * 测试工具列表
 */
async function testListTools() {
  console.log('\n🔧 测试 tools/list...');
  
  const request = createJsonRpcRequest('tools/list');
  
  try {
    const { response } = await sendHttpRequest(MCP_ENDPOINT, JSON.stringify(request));
    
    if (response.error) {
      throw new Error(`List tools failed: ${response.error.message}`);
    }
    
    console.log('✅ Tools/list 成功');
    console.log('   可用工具:', response.result.tools.map(t => t.name).join(', '));
    
    return response.result.tools;
  } catch (error) {
    console.error('❌ Tools/list 失败:', error.message);
    return [];
  }
}

/**
 * 测试工具调用
 */
async function testCallTool(toolName, args) {
  console.log(`\n🔧 测试 tools/call - ${toolName}...`);
  
  const request = createJsonRpcRequest('tools/call', {
    name: toolName,
    arguments: args
  });
  
  try {
    const { response } = await sendHttpRequest(MCP_ENDPOINT, JSON.stringify(request));
    
    if (response.error) {
      throw new Error(`Call tool failed: ${response.error.message}`);
    }
    
    console.log('✅ Tools/call 成功');
    console.log('   结果:', response.result.content[0].text);
    
    return response.result;
  } catch (error) {
    console.error('❌ Tools/call 失败:', error.message);
    return null;
  }
}

/**
 * 测试资源列表
 */
async function testListResources() {
  console.log('\n📄 测试 resources/list...');
  
  const request = createJsonRpcRequest('resources/list');
  
  try {
    const { response } = await sendHttpRequest(MCP_ENDPOINT, JSON.stringify(request));
    
    if (response.error) {
      throw new Error(`List resources failed: ${response.error.message}`);
    }
    
    console.log('✅ Resources/list 成功');
    console.log('   可用资源:', response.result.resources.map(r => r.name).join(', '));
    
    return response.result.resources;
  } catch (error) {
    console.error('❌ Resources/list 失败:', error.message);
    return [];
  }
}

/**
 * 测试资源读取
 */
async function testReadResource(uri) {
  console.log(`\n📄 测试 resources/read - ${uri}...`);
  
  const request = createJsonRpcRequest('resources/read', {
    uri
  });
  
  try {
    const { response } = await sendHttpRequest(MCP_ENDPOINT, JSON.stringify(request));
    
    if (response.error) {
      throw new Error(`Read resource failed: ${response.error.message}`);
    }
    
    console.log('✅ Resources/read 成功');
    console.log('   内容预览:', response.result.contents[0].text.substring(0, 200) + '...');
    
    return response.result;
  } catch (error) {
    console.error('❌ Resources/read 失败:', error.message);
    return null;
  }
}

/**
 * 测试提示列表
 */
async function testListPrompts() {
  console.log('\n💭 测试 prompts/list...');
  
  const request = createJsonRpcRequest('prompts/list');
  
  try {
    const { response } = await sendHttpRequest(MCP_ENDPOINT, JSON.stringify(request));
    
    if (response.error) {
      throw new Error(`List prompts failed: ${response.error.message}`);
    }
    
    console.log('✅ Prompts/list 成功');
    console.log('   可用提示:', response.result.prompts.map(p => p.name).join(', '));
    
    return response.result.prompts;
  } catch (error) {
    console.error('❌ Prompts/list 失败:', error.message);
    return [];
  }
}

/**
 * 测试获取提示
 */
async function testGetPrompt(name, args) {
  console.log(`\n💭 测试 prompts/get - ${name}...`);
  
  const request = createJsonRpcRequest('prompts/get', {
    name,
    arguments: args
  });
  
  try {
    const { response } = await sendHttpRequest(MCP_ENDPOINT, JSON.stringify(request));
    
    if (response.error) {
      throw new Error(`Get prompt failed: ${response.error.message}`);
    }
    
    console.log('✅ Prompts/get 成功');
    console.log('   描述:', response.result.description);
    console.log('   消息预览:', response.result.messages[0].content.text.substring(0, 100) + '...');
    
    return response.result;
  } catch (error) {
    console.error('❌ Prompts/get 失败:', error.message);
    return null;
  }
}

/**
 * 测试服务器状态
 */
async function testServerStatus() {
  console.log('\n📊 测试服务器状态...');
  
  return new Promise((resolve, reject) => {
    const req = http.get(`${SERVER_URL}/`, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const status = JSON.parse(body);
          console.log('✅ 服务器状态获取成功');
          console.log('   名称:', status.name);
          console.log('   版本:', status.version);
          console.log('   协议:', status.protocol);
          console.log('   运行时间:', Math.floor(status.uptime), '秒');
          console.log('   活跃会话:', status.activeSessions);
          console.log('   功能数量:', `工具:${status.capabilities.tools}, 资源:${status.capabilities.resources}, 提示:${status.capabilities.prompts}`);
          resolve(status);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
  });
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🧪 原生 Streamable HTTP MCP Server 测试开始');
  console.log('📡 连接到:', SERVER_URL);
  
  try {
    // 测试服务器状态
    await testServerStatus();
    
    // 测试初始化
    const initialized = await testInitialize();
    if (!initialized) {
      throw new Error('Initialize failed, stopping tests');
    }
    
    // 测试工具
    const tools = await testListTools();
    if (tools.length > 0) {
      await testCallTool('calculator', { operation: 'add', a: 10, b: 5 });
      await testCallTool('echo', { message: '你好，MCP!' });
      await testCallTool('random_number', { min: 1, max: 100 });
    }
    
    // 测试资源
    const resources = await testListResources();
    if (resources.length > 0) {
      await testReadResource('time://current');
      await testReadResource('info://server');
      await testReadResource('data://sample');
    }
    
    // 测试提示
    const prompts = await testListPrompts();
    if (prompts.length > 0) {
      await testGetPrompt('code_review', { 
        code: 'function add(a, b) { return a + b; }', 
        language: 'JavaScript' 
      });
      await testGetPrompt('explain_concept', { 
        concept: 'MCP协议', 
        level: 'beginner' 
      });
    }
    
    console.log('\n🎉 所有测试完成！');
    console.log(`📋 会话ID: ${sessionId}`);
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
  });
}

export {
  testInitialize,
  testListTools,
  testCallTool,
  testListResources,
  testReadResource,
  testListPrompts,
  testGetPrompt,
  testServerStatus
};