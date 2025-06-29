#!/usr/bin/env node

/**
 * 学习用的简单 MCP 服务器
 * 包含基本的工具、资源和提示功能
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 创建服务器实例
const server = new Server(
  {
    name: "learning-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// 工具列表
const TOOLS = [
  {
    name: "calculator",
    description: "执行基本的数学计算",
    inputSchema: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["add", "subtract", "multiply", "divide"],
          description: "要执行的数学运算",
        },
        a: {
          type: "number",
          description: "第一个数字",
        },
        b: {
          type: "number",
          description: "第二个数字",
        },
      },
      required: ["operation", "a", "b"],
    },
  },
  {
    name: "greeting",
    description: "生成个性化的问候语",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "要问候的人的姓名",
        },
        language: {
          type: "string",
          enum: ["zh", "en", "es", "fr"],
          description: "问候语的语言",
          default: "zh",
        },
        style: {
          type: "string",
          enum: ["formal", "casual", "friendly"],
          description: "问候语的风格",
          default: "friendly",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "text_analyzer",
    description: "分析文本的基本统计信息",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "要分析的文本",
        },
      },
      required: ["text"],
    },
  },
];

// 资源列表
const RESOURCES = [
  {
    uri: "time://current",
    name: "当前时间",
    description: "获取当前的日期和时间信息",
    mimeType: "application/json",
  },
  {
    uri: "system://info",
    name: "系统信息",
    description: "获取运行环境的基本信息",
    mimeType: "application/json",
  },
  {
    uri: "server://status",
    name: "服务器状态",
    description: "获取 MCP 服务器的状态信息",
    mimeType: "application/json",
  },
];

// 提示模板列表
const PROMPTS = [
  {
    name: "code_review",
    description: "代码审查提示模板",
    arguments: [
      {
        name: "code",
        description: "要审查的代码",
        required: true,
      },
      {
        name: "language",
        description: "编程语言",
        required: false,
      },
    ],
  },
  {
    name: "explain_concept",
    description: "概念解释提示模板",
    arguments: [
      {
        name: "concept",
        description: "要解释的概念",
        required: true,
      },
      {
        name: "level",
        description: "解释的难度等级 (beginner/intermediate/advanced)",
        required: false,
      },
    ],
  },
];

// 实现工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// 实现工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "calculator": {
        const { operation, a, b } = args;
        let result;

        switch (operation) {
          case "add":
            result = a + b;
            break;
          case "subtract":
            result = a - b;
            break;
          case "multiply":
            result = a * b;
            break;
          case "divide":
            if (b === 0) {
              throw new Error("除数不能为零");
            }
            result = a / b;
            break;
          default:
            throw new Error(`不支持的运算: ${operation}`);
        }

        return {
          content: [
            {
              type: "text",
              text: `计算结果: ${a} ${operation} ${b} = ${result}`,
            },
          ],
        };
      }

      case "greeting": {
        const { name: userName, language = "zh", style = "friendly" } = args;
        const greetings = {
          zh: {
            formal: `您好，${userName}先生/女士！`,
            casual: `嗨，${userName}！`,
            friendly: `你好，${userName}！很高兴见到你！`,
          },
          en: {
            formal: `Good day, Mr./Ms. ${userName}!`,
            casual: `Hi, ${userName}!`,
            friendly: `Hello, ${userName}! Nice to meet you!`,
          },
          es: {
            formal: `Buenos días, Sr./Sra. ${userName}!`,
            casual: `¡Hola, ${userName}!`,
            friendly: `¡Hola, ${userName}! ¡Encantado de conocerte!`,
          },
          fr: {
            formal: `Bonjour, M./Mme ${userName}!`,
            casual: `Salut, ${userName}!`,
            friendly: `Bonjour, ${userName}! Ravi de vous rencontrer!`,
          },
        };

        const greeting = greetings[language]?.[style] || greetings.zh.friendly;

        return {
          content: [
            {
              type: "text",
              text: greeting,
            },
          ],
        };
      }

      case "text_analyzer": {
        const { text } = args;
        const words = text.split(/\\s+/).filter((word) => word.length > 0);
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\\s/g, "").length;
        const sentences = text
          .split(/[.!?]+/)
          .filter((s) => s.trim().length > 0).length;
        const paragraphs = text
          .split(/\\n\\s*\\n/)
          .filter((p) => p.trim().length > 0).length;

        const analysis = {
          字符数: characters,
          字符数_不含空格: charactersNoSpaces,
          单词数: words.length,
          句子数: sentences,
          段落数: paragraphs,
          平均单词长度:
            words.length > 0
              ? (charactersNoSpaces / words.length).toFixed(2)
              : 0,
        };

        return {
          content: [
            {
              type: "text",
              text: `文本分析结果:\\n${JSON.stringify(analysis, null, 2)}`,
            },
          ],
        };
      }

      default:
        throw new Error(`未知的工具: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `错误: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 实现资源列表处理器
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: RESOURCES,
  };
});

// 实现资源读取处理器
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case "time://current": {
        const now = new Date();
        const timeInfo = {
          时间戳: now.getTime(),
          ISO字符串: now.toISOString(),
          本地时间: now.toLocaleString("zh-CN"),
          UTC时间: now.toUTCString(),
          年: now.getFullYear(),
          月: now.getMonth() + 1,
          日: now.getDate(),
          小时: now.getHours(),
          分钟: now.getMinutes(),
          秒: now.getSeconds(),
          星期: [
            "星期日",
            "星期一",
            "星期二",
            "星期三",
            "星期四",
            "星期五",
            "星期六",
          ][now.getDay()],
        };

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(timeInfo, null, 2),
            },
          ],
        };
      }

      case "system://info": {
        const systemInfo = {
          平台: process.platform,
          架构: process.arch,
          Node版本: process.version,
          内存使用: {
            RSS: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
            堆总计: `${Math.round(
              process.memoryUsage().heapTotal / 1024 / 1024
            )} MB`,
            堆使用: `${Math.round(
              process.memoryUsage().heapUsed / 1024 / 1024
            )} MB`,
          },
          运行时间: `${Math.round(process.uptime())} 秒`,
          工作目录: process.cwd(),
        };

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(systemInfo, null, 2),
            },
          ],
        };
      }

      case "server://status": {
        const serverStatus = {
          服务器名称: "learning-mcp-server",
          版本: "1.0.0",
          状态: "运行中",
          启动时间: new Date().toISOString(),
          可用工具数: TOOLS.length,
          可用资源数: RESOURCES.length,
          可用提示数: PROMPTS.length,
          工具列表: TOOLS.map((t) => t.name),
          资源列表: RESOURCES.map((r) => r.name),
          提示列表: PROMPTS.map((p) => p.name),
        };

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(serverStatus, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`未知的资源: ${uri}`);
    }
  } catch (error) {
    throw new Error(`读取资源失败: ${error.message}`);
  }
});

// 实现提示列表处理器
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: PROMPTS,
  };
});

// 实现提示获取处理器
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "code_review": {
        const { code, language = "通用" } = args || {};
        if (!code) {
          throw new Error("请提供要审查的代码");
        }

        const prompt = `请对以下${language}代码进行详细的审查：

\`\`\`${language.toLowerCase()}
${code}
\`\`\`

请从以下方面进行评估：
1. **代码质量**: 代码的可读性、可维护性
2. **性能**: 潜在的性能问题和优化建议
3. **安全性**: 可能的安全隐患
4. **最佳实践**: 是否遵循了编程最佳实践
5. **改进建议**: 具体的改进方案

请提供详细的分析和建议。`;

        return {
          description: `${language}代码审查提示`,
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: prompt,
              },
            },
          ],
        };
      }

      case "explain_concept": {
        const { concept, level = "intermediate" } = args || {};
        if (!concept) {
          throw new Error("请提供要解释的概念");
        }

        const levelMap = {
          beginner: "初学者",
          intermediate: "中级",
          advanced: "高级",
        };

        const prompt = `请为${
          levelMap[level] || "中级"
        }水平的学习者解释以下概念：

**概念**: ${concept}

请按照以下结构进行解释：

1. **基本定义**: 用简单明了的语言定义这个概念
2. **核心特点**: 列出这个概念的主要特征
3. **实际应用**: 举例说明在实际中如何应用
4. **相关概念**: 提及相关或相似的概念
5. **学习建议**: 给出进一步学习的建议

${level === "beginner" ? "请使用通俗易懂的语言，避免过于复杂的术语。" : ""}
${level === "advanced" ? "可以包含深入的技术细节和高级概念。" : ""}`;

        return {
          description: `${levelMap[level]}级别的概念解释提示`,
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: prompt,
              },
            },
          ],
        };
      }

      default:
        throw new Error(`未知的提示: ${name}`);
    }
  } catch (error) {
    throw new Error(`获取提示失败: ${error.message}`);
  }
});

// 错误处理
process.on("SIGINT", async () => {
  console.log("\\n正在关闭服务器...");
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\\n收到终止信号，正在关闭服务器...");
  await server.close();
  process.exit(0);
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();

  console.error("🚀 学习用 MCP 服务器已启动");
  console.error("📋 可用功能:");
  console.error("  🔧 工具:", TOOLS.map((t) => t.name).join(", "));
  console.error("  📄 资源:", RESOURCES.map((r) => r.name).join(", "));
  console.error("  💭 提示:", PROMPTS.map((p) => p.name).join(", "));
  console.error("");

  await server.connect(transport);
}

// 如果直接运行此文件，则启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("服务器启动失败:", error);
    process.exit(1);
  });
}
