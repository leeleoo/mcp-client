# 学习用 MCP 服务器

这是一个简单的 Model Context Protocol (MCP) 服务器，专为学习 MCP 协议和开发而创建。

## 📋 功能特性

### 🔧 工具 (Tools)

1. **calculator** - 基本数学计算器
   - 支持加法、减法、乘法、除法
   - 参数：`operation`, `a`, `b`

2. **greeting** - 多语言问候生成器
   - 支持中文、英文、西班牙文、法文
   - 支持正式、随意、友好三种风格
   - 参数：`name`, `language`, `style`

3. **text_analyzer** - 文本分析工具
   - 统计字符数、单词数、句子数等
   - 参数：`text`

### 📄 资源 (Resources)

1. **time://current** - 当前时间信息
   - 包含时间戳、ISO字符串、本地时间等

2. **system://info** - 系统信息
   - Node.js版本、内存使用、平台信息等

3. **server://status** - 服务器状态
   - 服务器运行状态和可用功能列表

### 💭 提示 (Prompts)

1. **code_review** - 代码审查模板
   - 参数：`code` (必需), `language` (可选)

2. **explain_concept** - 概念解释模板
   - 参数：`concept` (必需), `level` (可选)

## 🚀 安装和运行

### 1. 安装依赖

```bash
cd mcp-servers/learning-server
npm install
```

### 2. 运行服务器

```bash
# 普通运行
npm start

# 开发模式（文件变化时自动重启）
npm run dev
```

### 3. 在主项目中连接

在主项目的配置文件中添加：

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

或者通过 CLI 手动连接：

```bash
mcp connect stdio learning-server node mcp-servers/learning-server/index.js
```

## 📚 使用示例

### 工具调用示例

```javascript
// 计算器工具
[MCP_TOOL:calculator:{"operation": "add", "a": 10, "b": 5}]
// 结果: 计算结果: 10 add 5 = 15

// 问候工具
[MCP_TOOL:greeting:{"name": "张三", "language": "zh", "style": "friendly"}]
// 结果: 你好，张三！很高兴见到你！

// 文本分析工具
[MCP_TOOL:text_analyzer:{"text": "这是一个测试文本。包含两个句子。"}]
// 结果: 文本分析统计信息
```

### 资源读取示例

```javascript
// 获取当前时间
[MCP_RESOURCE:time://current]

// 获取系统信息
[MCP_RESOURCE:system://info]

// 获取服务器状态
[MCP_RESOURCE:server://status]
```

### 提示使用示例

```javascript
// 代码审查提示
[MCP_PROMPT:code_review:{"code": "function add(a, b) { return a + b; }", "language": "JavaScript"}]

// 概念解释提示
[MCP_PROMPT:explain_concept:{"concept": "MCP协议", "level": "beginner"}]
```

## 🔧 开发和扩展

### 添加新工具

1. 在 `TOOLS` 数组中添加工具定义
2. 在 `CallToolRequestSchema` 处理器中添加实现

```javascript
const TOOLS = [
  // ... 现有工具
  {
    name: "new_tool",
    description: "新工具的描述",
    inputSchema: {
      type: "object",
      properties: {
        // 参数定义
      },
      required: ["param1"],
    },
  },
];

// 在处理器中添加
case "new_tool": {
  const { param1 } = args;
  // 工具逻辑
  return {
    content: [
      {
        type: "text",
        text: "结果",
      },
    ],
  };
}
```

### 添加新资源

1. 在 `RESOURCES` 数组中添加资源定义
2. 在 `ReadResourceRequestSchema` 处理器中添加实现

### 添加新提示

1. 在 `PROMPTS` 数组中添加提示定义
2. 在 `GetPromptRequestSchema` 处理器中添加实现

## 🐛 调试技巧

### 查看服务器日志

服务器会在 stderr 输出调试信息：

```bash
node index.js 2> debug.log
```

### 测试工具连接

```bash
# 在主项目中测试
npm run cli
mcp list
mcp status
```

### 验证工具功能

通过主项目的 Web 界面或 CLI 测试各个工具是否正常工作。

## 📖 学习要点

这个服务器演示了 MCP 协议的核心概念：

1. **协议实现** - 如何使用 MCP SDK 创建服务器
2. **工具系统** - 如何定义和实现可调用的工具
3. **资源系统** - 如何提供可读取的资源
4. **提示系统** - 如何创建可重用的提示模板
5. **错误处理** - 如何优雅地处理错误情况
6. **类型安全** - 如何使用 JSON Schema 定义参数

## 🔄 下一步学习

1. 尝试修改现有工具的功能
2. 添加自己的工具、资源或提示
3. 学习更复杂的 MCP 服务器示例
4. 了解 MCP 协议的高级特性

## 📝 注意事项

- 服务器使用 stdio 传输，适合本地开发和学习
- 所有输出到 stdout 的内容都会被 MCP 客户端接收
- 调试信息应该输出到 stderr
- 确保 JSON 格式的正确性