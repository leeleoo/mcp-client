#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

console.log("🧪 开始测试 SSE 学习 MCP 服务器...");
console.log("");

// 启动测试服务器的子进程
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serverProcess;

// 等待服务器启动
function waitForServer(port, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function checkServer() {
      fetch(`http://localhost:${port}/sse`)
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - startTime > timeout) {
            reject(new Error(`服务器在 ${timeout}ms 内未启动`));
          } else {
            setTimeout(checkServer, 500);
          }
        });
    }
    
    checkServer();
  });
}

async function runTests() {
  const SERVER_PORT = 3001;
  const SERVER_URL = `http://localhost:${SERVER_PORT}/sse`;

  try {
    // 启动测试服务器
    console.log("🚀 启动测试服务器...");
    serverProcess = spawn("node", [join(__dirname, "index.js")], {
      env: { ...process.env, PORT: SERVER_PORT },
      stdio: ["ignore", "pipe", "pipe"],
    });

    serverProcess.stdout.on("data", (data) => {
      process.stdout.write(`[服务器] ${data}`);
    });

    serverProcess.stderr.on("data", (data) => {
      process.stderr.write(`[服务器] ${data}`);
    });

    // 等待服务器启动
    console.log("⏳ 等待服务器启动...");
    await waitForServer(SERVER_PORT);
    console.log("✅ 服务器已启动");
    console.log("");

    // 创建 MCP 客户端
    const client = new Client(
      {
        name: "sse-test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    // 创建 SSE 传输层
    console.log(`🔌 连接到 SSE 端点: ${SERVER_URL}`);
    const transport = new SSEClientTransport(new URL(SERVER_URL));
    await client.connect(transport);
    console.log("✅ 已连接到 MCP 服务器");
    console.log("");

    // 测试工具列表
    console.log("🔧 测试工具列表...");
    const toolsResponse = await client.listTools();
    console.log(`✅ 获取到 ${toolsResponse.tools.length} 个工具:`);
    toolsResponse.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log("");

    // 测试资源列表
    console.log("📄 测试资源列表...");
    const resourcesResponse = await client.listResources();
    console.log(`✅ 获取到 ${resourcesResponse.resources.length} 个资源:`);
    resourcesResponse.resources.forEach(resource => {
      console.log(`   - ${resource.uri}: ${resource.name}`);
    });
    console.log("");

    // 测试提示列表
    console.log("💭 测试提示列表...");
    const promptsResponse = await client.listPrompts();
    console.log(`✅ 获取到 ${promptsResponse.prompts.length} 个提示:`);
    promptsResponse.prompts.forEach(prompt => {
      console.log(`   - ${prompt.name}: ${prompt.description}`);
    });
    console.log("");

    // 测试工具调用
    console.log("🔧 测试工具调用...");
    
    // 测试网页搜索工具
    console.log("1. 测试 web_search 工具");
    const searchResult = await client.callTool({
      name: "web_search",
      arguments: { query: "JavaScript", limit: 3 }
    });
    console.log("✅ web_search 工具调用成功");
    console.log(`📤 结果预览: ${searchResult.content[0].text.substring(0, 100)}...`);
    console.log("");

    // 测试天气工具
    console.log("2. 测试 weather_info 工具");
    const weatherResult = await client.callTool({
      name: "weather_info",
      arguments: { city: "北京", units: "celsius" }
    });
    console.log("✅ weather_info 工具调用成功");
    console.log(`📤 结果预览: ${weatherResult.content[0].text.substring(0, 100)}...`);
    console.log("");

    // 测试URL分析工具
    console.log("3. 测试 url_analyzer 工具");
    const urlResult = await client.callTool({
      name: "url_analyzer",
      arguments: { url: "https://github.com/microsoft/vscode" }
    });
    console.log("✅ url_analyzer 工具调用成功");
    console.log(`📤 结果预览: ${urlResult.content[0].text.substring(0, 100)}...`);
    console.log("");

    // 测试资源读取
    console.log("📄 测试资源读取...");
    
    // 测试新闻资源
    console.log("1. 读取 news://latest 资源");
    const newsResult = await client.readResource({ uri: "news://latest" });
    console.log("✅ 新闻资源读取成功");
    console.log(`📤 数据类型: ${newsResult.contents[0].mimeType}`);
    console.log("");

    // 测试服务器配置资源
    console.log("2. 读取 config://server 资源");
    const configResult = await client.readResource({ uri: "config://server" });
    console.log("✅ 服务器配置读取成功");
    console.log(`📤 数据类型: ${configResult.contents[0].mimeType}`);
    console.log("");

    // 测试提示获取
    console.log("💭 测试提示获取...");
    
    // 测试技术写作提示
    console.log("1. 获取 technical_writing 提示");
    const techWritingPrompt = await client.getPrompt({
      name: "technical_writing",
      arguments: { 
        topic: "React Hooks",
        audience: "intermediate",
        format: "markdown"
      }
    });
    console.log("✅ technical_writing 提示获取成功");
    console.log(`📤 提示长度: ${techWritingPrompt.messages[0].content.text.length} 字符`);
    console.log("");

    // 测试API文档提示
    console.log("2. 获取 api_documentation 提示");
    const apiDocPrompt = await client.getPrompt({
      name: "api_documentation",
      arguments: { 
        endpoint: "/api/users",
        method: "POST",
        parameters: "name, email, password"
      }
    });
    console.log("✅ api_documentation 提示获取成功");
    console.log(`📤 提示长度: ${apiDocPrompt.messages[0].content.text.length} 字符`);
    console.log("");

    // 关闭连接
    await client.close();
    console.log("🔌 已断开与 MCP 服务器的连接");
    console.log("");

    console.log("🎉 所有测试完成！SSE MCP 服务器工作正常。");

  } catch (error) {
    console.error("❌ 测试失败:", error);
    process.exit(1);
  } finally {
    // 清理服务器进程
    if (serverProcess) {
      console.log("🛑 关闭测试服务器...");
      serverProcess.kill("SIGTERM");
      
      // 等待进程结束
      await new Promise((resolve) => {
        serverProcess.on("exit", resolve);
        setTimeout(() => {
          serverProcess.kill("SIGKILL");
          resolve();
        }, 3000);
      });
    }
  }
}

// 运行测试
runTests();