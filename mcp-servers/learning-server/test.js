#!/usr/bin/env node

/**
 * 学习 MCP 服务器的测试脚本
 * 用于验证服务器功能是否正常
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 开始测试学习 MCP 服务器...\n');

// 启动服务器进程
const serverPath = join(__dirname, 'index.js');
console.log('📂 服务器路径:', serverPath);
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// 测试消息列表
const tests = [
  {
    name: '获取工具列表',
    message: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    }
  },
  {
    name: '测试计算器工具',
    message: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'calculator',
        arguments: {
          operation: 'add',
          a: 10,
          b: 5
        }
      }
    }
  },
  {
    name: '测试问候工具',
    message: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'greeting',
        arguments: {
          name: '小明',
          language: 'zh',
          style: 'friendly'
        }
      }
    }
  },
  {
    name: '获取资源列表',
    message: {
      jsonrpc: '2.0',
      id: 4,
      method: 'resources/list'
    }
  },
  {
    name: '读取时间资源',
    message: {
      jsonrpc: '2.0',
      id: 5,
      method: 'resources/read',
      params: {
        uri: 'time://current'
      }
    }
  },
  {
    name: '获取提示列表',
    message: {
      jsonrpc: '2.0',
      id: 6,
      method: 'prompts/list'
    }
  }
];

let testIndex = 0;
let responses = [];

// 处理服务器响应
server.stdout.on('data', (data) => {
  const response = data.toString().trim();
  if (response) {
    try {
      const parsed = JSON.parse(response);
      responses.push(parsed);
      
      console.log(`✅ ${tests[testIndex - 1]?.name || '响应'}`);
      console.log(`📤 ID: ${parsed.id || 'N/A'}`);
      
      if (parsed.result) {
        if (parsed.result.tools) {
          console.log(`🔧 工具数量: ${parsed.result.tools.length}`);
          console.log(`🔧 工具名称: ${parsed.result.tools.map(t => t.name).join(', ')}`);
        } else if (parsed.result.content) {
          console.log(`💬 结果: ${parsed.result.content[0]?.text || JSON.stringify(parsed.result.content)}`);
        } else if (parsed.result.resources) {
          console.log(`📄 资源数量: ${parsed.result.resources.length}`);
          console.log(`📄 资源名称: ${parsed.result.resources.map(r => r.name).join(', ')}`);
        } else if (parsed.result.contents) {
          console.log(`📄 内容: ${parsed.result.contents[0]?.text ? '时间信息已获取' : JSON.stringify(parsed.result.contents[0])}`);
        } else if (parsed.result.prompts) {
          console.log(`💭 提示数量: ${parsed.result.prompts.length}`);
          console.log(`💭 提示名称: ${parsed.result.prompts.map(p => p.name).join(', ')}`);
        } else {
          console.log(`📄 结果: ${JSON.stringify(parsed.result)}`);
        }
      } else if (parsed.error) {
        console.log(`❌ 错误: ${parsed.error.message}`);
      }
      
      console.log('');
      
      // 发送下一个测试
      if (testIndex < tests.length) {
        setTimeout(() => sendNextTest(), 100);
      } else {
        console.log('🎉 所有测试完成！');
        server.kill();
        process.exit(0);
      }
    } catch (error) {
      console.log(`❌ 解析响应失败: ${error.message}`);
      console.log(`📄 原始响应: ${response}`);
    }
  }
});

// 处理服务器错误输出
server.stderr.on('data', (data) => {
  const message = data.toString().trim();
  if (message && !message.includes('学习用 MCP 服务器已启动')) {
    console.log(`🖥️  服务器: ${message}`);
  }
});

// 处理服务器退出
server.on('close', (code) => {
  console.log(`🔚 服务器进程退出，代码: ${code}`);
});

// 发送下一个测试消息
function sendNextTest() {
  if (testIndex < tests.length) {
    const test = tests[testIndex];
    console.log(`🚀 执行测试: ${test.name}`);
    
    const message = JSON.stringify(test.message) + '\n';
    server.stdin.write(message);
    testIndex++;
  }
}

// 等待服务器启动，然后开始测试
setTimeout(() => {
  console.log('📡 开始发送测试消息...\n');
  sendNextTest();
}, 1000);

// 处理测试超时
setTimeout(() => {
  console.log('⏰ 测试超时，结束进程');
  server.kill();
  process.exit(1);
}, 10000);