# DeepSeek MCP Client - Next.js Web 应用

DeepSeek MCP Client 是一个基于 Next.js 和 Model Context Protocol (MCP) 的现代化智能聊天 Web 应用，集成了 DeepSeek API。通过 MCP 协议，客户端可以连接到各种外部工具和资源，为 AI 对话提供更丰富的功能。

## 功能特性

- 🌐 **现代化 Web 界面**: 基于 Next.js 和 Tailwind CSS 的响应式设计
- 🚀 **Turbopack 支持**: 极速开发体验，使用 Next.js 14 的 Turbopack
- 🤖 **DeepSeek AI 集成**: 使用 DeepSeek 的强大语言模型
- 🔧 **MCP 协议支持**: 连接和使用各种 MCP 服务器
- 🌊 **实时流式响应**: 支持 Server-Sent Events 的实时对话体验
- 🛠️ **工具调用**: AI 可以调用外部工具执行任务
- 📄 **资源访问**: 读取和处理外部资源
- 💭 **提示管理**: 使用预定义的提示模板
- 🔄 **多服务器支持**: 同时连接多个 MCP 服务器
- 📱 **响应式设计**: 完美适配桌面和移动设备
- ⚡ **实时状态监控**: MCP 服务器连接状态实时显示

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- DeepSeek API Key

### 安装步骤

1. **克隆项目**

   ```bash
   git clone <repository-url>
   cd deepseek-mcp-client-nextjs
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **配置环境变量**

   创建 `.env.local` 文件：

   ```bash
   deepseek_api=your_deepseek_api_key_here
   # 或者使用
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```

4. **启动开发服务器**

   ```bash
   npm run dev
   ```

5. **访问应用**

   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 命令行版本（可选）

如果你更喜欢命令行界面，仍然可以使用：

```bash
npm run cli
```

## 使用指南

### Web 界面

1. **发送消息**: 在底部输入框中输入消息，按 Enter 发送
2. **查看 MCP 状态**: 点击右上角设置图标查看已连接的 MCP 服务器
3. **流式响应**: AI 回复会以打字效果实时显示
4. **MCP 功能**: AI 会自动调用可用的 MCP 工具和资源

### MCP 集成

AI 可以通过特殊命令调用 MCP 功能：

- `[MCP_TOOL:工具名称:参数JSON]` - 调用工具
- `[MCP_RESOURCE:资源URI]` - 读取资源
- `[MCP_PROMPT:提示名称:参数JSON]` - 获取提示

### API 端点

- `POST /api/chat` - 聊天接口，支持 SSE 流式响应
- `GET /api/mcp/status` - 获取 MCP 服务器状态
- `POST /api/mcp/connect` - 连接 MCP 服务器
- `DELETE /api/mcp/connect` - 断开 MCP 服务器

## 项目结构

```
deepseek-mcp-client-nextjs/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── chat/                 # 聊天 API
│   │   └── mcp/                  # MCP 管理 API
│   ├── globals.css               # 全局样式
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 主页面
├── src/
│   ├── lib/
│   │   └── deepseek-mcp-client.ts # MCP 客户端库
│   └── cli.ts                    # 命令行版本
├── package.json                  # 项目配置和依赖
├── next.config.js                # Next.js 配置
├── tailwind.config.js            # Tailwind CSS 配置
├── tsconfig.json                 # TypeScript 配置
└── mcp-servers.example.json      # MCP 服务器配置示例
```

## MCP 服务器连接示例

### 文件系统服务器 (stdio)

```bash
# 通过 API 连接
curl -X POST http://localhost:3000/api/mcp/connect \
  -H "Content-Type: application/json" \
  -d '{
    "name": "filesystem",
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"]
  }'
```

### 数据库服务器 (stdio)

```bash
curl -X POST http://localhost:3000/api/mcp/connect \
  -H "Content-Type: application/json" \
  -d '{
    "name": "sqlite",
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "./database.db"]
  }'
```

### SSE 服务器

```bash
curl -X POST http://localhost:3000/api/mcp/connect \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api-server",
    "type": "sse",
    "url": "http://localhost:8080/mcp"
  }'
```

## 部署

### 构建生产版本

```bash
npm run build
npm start
```

### 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 设置环境变量 `DEEPSEEK_API_KEY`
4. 部署完成

### 部署到其他平台

项目支持部署到任何支持 Node.js 的平台，如：

- Vercel
- Netlify
- Railway
- Docker

## 开发

### 开发模式（使用 Turbopack）

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

### 代码检查

```bash
npm run lint
```

## 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS, Lucide React Icons
- **构建**: Turbopack (开发), Webpack (生产)
- **AI**: DeepSeek API
- **协议**: Model Context Protocol (MCP)
- **部署**: Vercel (推荐)

## 支持的 MCP 服务器

本客户端支持所有标准的 MCP 服务器，包括但不限于：

- **@modelcontextprotocol/server-filesystem** - 文件系统访问
- **@modelcontextprotocol/server-sqlite** - SQLite 数据库
- **@modelcontextprotocol/server-brave-search** - Brave 搜索
- **@modelcontextprotocol/server-github** - GitHub 集成
- **@modelcontextprotocol/server-postgres** - PostgreSQL 数据库
- **@modelcontextprotocol/server-fetch** - HTTP 请求
- 以及其他所有兼容 MCP 协议的服务器

## 常见问题

### Q: 如何获取 DeepSeek API Key?

A: 访问 [DeepSeek 官网](https://platform.deepseek.com) 注册账号并获取 API Key。

### Q: 支持哪些 MCP 服务器?

A: 支持所有符合 MCP 规范的服务器，包括文件系统、数据库、API 调用、搜索引擎等。

### Q: 如何在生产环境中使用?

A: 构建项目后部署到支持 Node.js 的平台，并正确设置环境变量。

### Q: 可以自定义 UI 吗?

A: 是的，项目使用 Tailwind CSS，可以轻松自定义样式和布局。

### Q: 如何添加新的 MCP 服务器?

A: 通过 Web 界面的设置面板或直接调用 `/api/mcp/connect` API 端点。

## 故障排除

### 常见问题

1. **连接 MCP 服务器失败**

   - 检查服务器命令和参数是否正确
   - 确保必要的环境变量已设置
   - 验证服务器是否已安装

2. **DeepSeek API 调用失败**

   - 检查环境变量中的 API 密钥是否正确
   - 确认网络连接正常
   - 检查 API 配额是否用完

3. **Web 界面无法访问**
   - 确认开发服务器已启动
   - 检查端口 3000 是否被占用
   - 查看控制台错误信息

## 许可证

ISC License

## 贡献

欢迎提交 Issues 和 Pull Requests！

## 更新日志

### v2.0.0 (当前版本)

- 🌐 重构为 Next.js Web 应用
- 🚀 添加 Turbopack 支持
- 🎨 现代化 UI 设计
- 🌊 SSE 流式响应
- 📱 响应式设计

### v1.0.0

- 🤖 基础 CLI 版本
- 🔧 MCP 协议支持
- 🔄 多服务器连接
