# 学习 MCP 服务器使用指南

## 🎯 快速开始

### 1. 测试服务器

```bash
# 进入服务器目录
cd mcp-servers/learning-server

# 运行测试
node test.js
```

### 2. 在主项目中使用

#### 方法一：通过配置文件（推荐）

将 `mcp-servers.example.json` 复制为 `mcp-servers.json`，其中已包含学习服务器配置：

```json
{
  "name": "learning-server",
  "type": "stdio",
  "command": "node",
  "args": ["mcp-servers/learning-server/index.js"],
  "description": "学习用的简单 MCP 服务器",
  "autoConnect": true
}
```

#### 方法二：CLI 手动连接

```bash
# 启动主项目 CLI
npm run cli

# 连接学习服务器
mcp connect stdio learning-server node mcp-servers/learning-server/index.js

# 查看可用功能
mcp list
mcp status
```

## 🔧 工具使用示例

### 计算器工具

```
用户: 帮我计算 25 + 17
AI: [MCP_TOOL:calculator:{"operation": "add", "a": 25, "b": 17}]
结果: 计算结果: 25 add 5 = 42
```

### 问候工具

```
用户: 生成一个对 John 的英文正式问候
AI: [MCP_TOOL:greeting:{"name": "John", "language": "en", "style": "formal"}]
结果: Good day, Mr./Ms. John!
```

### 文本分析工具

```
用户: 分析这段文本的统计信息
AI: [MCP_TOOL:text_analyzer:{"text": "Hello world. This is a test."}]
结果: 文本分析结果（包含字符数、单词数等统计信息）
```

## 📄 资源使用示例

### 获取当前时间

```
用户: 现在几点了？
AI: [MCP_RESOURCE:time://current]
结果: 包含详细时间信息的 JSON 数据
```

### 查看系统信息

```
用户: 显示系统信息
AI: [MCP_RESOURCE:system://info]
结果: Node.js 版本、内存使用、平台信息等
```

### 查看服务器状态

```
用户: MCP 服务器运行状态如何？
AI: [MCP_RESOURCE:server://status]
结果: 服务器名称、版本、可用功能统计等
```

## 💭 提示使用示例

### 代码审查

```
用户: 审查这段代码
AI: [MCP_PROMPT:code_review:{"code": "function add(a, b) { return a + b; }", "language": "JavaScript"}]
结果: 生成详细的代码审查提示模板
```

### 概念解释

```
用户: 解释什么是递归
AI: [MCP_PROMPT:explain_concept:{"concept": "递归", "level": "beginner"}]
结果: 生成适合初学者的概念解释模板
```

## 🎨 通过 Web 界面使用

1. 启动 Web 应用：`npm run dev`
2. 访问 `http://localhost:3000`
3. 点击设置图标查看 MCP 服务器状态
4. 确认 `learning-server` 显示为 "已连接"
5. 直接在聊天界面中提问，AI 会自动调用相应功能

## 🔍 实际对话示例

```
用户: 帮我计算 100 除以 8，然后用中文友好地问候李明

AI回应: 我来帮你计算并生成问候语。

[MCP_TOOL:calculator:{"operation": "divide", "a": 100, "b": 8}]

计算结果: 100 ÷ 8 = 12.5

[MCP_TOOL:greeting:{"name": "李明", "language": "zh", "style": "friendly"}]

你好，李明！很高兴见到你！

所以 100 除以 8 等于 12.5，同时向李明送上友好的问候！
```

## 🚀 扩展学习

### 修改现有功能

尝试编辑 `index.js`：

1. **增加计算器运算**：添加平方根、幂运算等
2. **扩展问候语言**：添加日语、德语等
3. **丰富文本分析**：添加关键词提取、情感分析等

### 添加新工具

参考现有工具结构，添加新功能：

```javascript
// 添加天气工具示例
{
  name: "weather",
  description: "获取天气信息",
  inputSchema: {
    type: "object",
    properties: {
      city: { type: "string", description: "城市名称" },
      unit: { type: "string", enum: ["C", "F"], default: "C" }
    },
    required: ["city"]
  }
}
```

### 添加新资源

创建动态资源：

```javascript
// 添加随机名言资源
case "quotes://random": {
  const quotes = ["生活就像海洋...", "成功是99%的汗水..."];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  return { /* 返回格式 */ };
}
```

## 📚 学习重点

通过这个服务器，你可以学会：

1. **MCP 协议基础** - 工具、资源、提示的概念和实现
2. **JSON-RPC 通信** - 客户端-服务器之间的消息格式
3. **异步编程** - Node.js 异步处理模式
4. **错误处理** - 优雅的错误处理和调试技巧
5. **模块化设计** - 如何组织和扩展 MCP 服务器功能

## 🐛 故障排除

### 服务器无法启动

1. 检查 Node.js 版本（需要 >= 16）
2. 确认依赖已安装：`npm install`
3. 查看错误日志

### 主项目无法连接

1. 确认服务器路径正确
2. 检查 `mcp-servers.json` 配置
3. 查看主项目的 MCP 状态面板

### 工具调用失败

1. 检查参数格式是否正确
2. 查看服务器错误输出
3. 使用测试脚本验证功能

这个学习服务器为你提供了一个完整的 MCP 开发起点，你可以基于它继续探索和创建更复杂的功能！