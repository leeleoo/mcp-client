#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🧪 开始测试简单 SSE MCP 服务器...");

let serverProcess;
const SERVER_PORT = 3001;

// 等待服务器启动
function waitForServer(port, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function checkServer() {
      fetch(`http://localhost:${port}`)
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
  try {
    // 启动服务器
    console.log("🚀 启动测试服务器...");
    serverProcess = spawn("node", [join(__dirname, "simple-index.js")], {
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

    // 测试健康检查
    console.log("🏥 测试健康检查端点...");
    const healthResponse = await fetch(`http://localhost:${SERVER_PORT}`);
    const healthData = await healthResponse.json();
    console.log("✅ 健康检查成功");
    console.log(`📊 服务器状态: ${healthData.status}`);
    console.log(`🔧 工具数量: ${healthData.capabilities.tools}`);
    console.log(`📄 资源数量: ${healthData.capabilities.resources}`);
    console.log(`💭 提示数量: ${healthData.capabilities.prompts}`);
    console.log("");

    // 测试工具列表
    console.log("🔧 测试工具列表...");
    const toolsResponse = await fetch(`http://localhost:${SERVER_PORT}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/list",
        params: {},
        id: 1,
      }),
    });
    const toolsData = await toolsResponse.json();
    console.log(`✅ 获取到 ${toolsData.result.tools.length} 个工具:`);
    toolsData.result.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log("");

    // 测试工具调用
    console.log("🔧 测试工具调用...");
    
    // 测试搜索工具
    console.log("1. 测试 web_search 工具");
    const searchResponse = await fetch(`http://localhost:${SERVER_PORT}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "web_search",
          arguments: { query: "Node.js", limit: 3 }
        },
        id: 2,
      }),
    });
    const searchData = await searchResponse.json();
    console.log("✅ web_search 工具调用成功");
    console.log(`📤 结果预览: ${searchData.result.content[0].text.substring(0, 100)}...`);
    console.log("");

    // 测试天气工具
    console.log("2. 测试 weather_info 工具");
    const weatherResponse = await fetch(`http://localhost:${SERVER_PORT}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "weather_info",
          arguments: { city: "上海", units: "celsius" }
        },
        id: 3,
      }),
    });
    const weatherData = await weatherResponse.json();
    console.log("✅ weather_info 工具调用成功");
    console.log(`📤 结果预览: ${weatherData.result.content[0].text.substring(0, 100)}...`);
    console.log("");

    // 测试资源列表
    console.log("📄 测试资源列表...");
    const resourcesResponse = await fetch(`http://localhost:${SERVER_PORT}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "resources/list",
        params: {},
        id: 4,
      }),
    });
    const resourcesData = await resourcesResponse.json();
    console.log(`✅ 获取到 ${resourcesData.result.resources.length} 个资源:`);
    resourcesData.result.resources.forEach(resource => {
      console.log(`   - ${resource.uri}: ${resource.name}`);
    });
    console.log("");

    // 测试资源读取
    console.log("📄 测试资源读取...");
    const newsResponse = await fetch(`http://localhost:${SERVER_PORT}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "resources/read",
        params: { uri: "news://latest" },
        id: 5,
      }),
    });
    const newsData = await newsResponse.json();
    console.log("✅ 新闻资源读取成功");
    console.log(`📤 数据类型: ${newsData.result.contents[0].mimeType}`);
    console.log("");

    // 测试提示列表
    console.log("💭 测试提示列表...");
    const promptsResponse = await fetch(`http://localhost:${SERVER_PORT}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "prompts/list",
        params: {},
        id: 6,
      }),
    });
    const promptsData = await promptsResponse.json();
    console.log(`✅ 获取到 ${promptsData.result.prompts.length} 个提示:`);
    promptsData.result.prompts.forEach(prompt => {
      console.log(`   - ${prompt.name}: ${prompt.description}`);
    });
    console.log("");

    // 测试提示获取
    console.log("💭 测试提示获取...");
    const promptResponse = await fetch(`http://localhost:${SERVER_PORT}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "prompts/get",
        params: {
          name: "technical_writing",
          arguments: { topic: "Docker容器化", audience: "beginner" }
        },
        id: 7,
      }),
    });
    const promptData = await promptResponse.json();
    console.log("✅ technical_writing 提示获取成功");
    console.log(`📤 提示长度: ${promptData.result.messages[0].content.text.length} 字符`);
    console.log("");

    // 测试 SSE 连接
    console.log("📡 测试 SSE 连接...");
    const sseResponse = await fetch(`http://localhost:${SERVER_PORT}/sse`);
    if (sseResponse.ok) {
      console.log("✅ SSE 端点可访问");
      console.log(`📤 Content-Type: ${sseResponse.headers.get("content-type")}`);
    } else {
      console.log("❌ SSE 端点访问失败");
    }
    console.log("");

    console.log("🎉 所有测试完成！简单 SSE MCP 服务器工作正常。");

  } catch (error) {
    console.error("❌ 测试失败:", error);
    process.exit(1);
  } finally {
    // 清理服务器进程
    if (serverProcess) {
      console.log("🛑 关闭测试服务器...");
      serverProcess.kill("SIGTERM");
      
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

runTests();