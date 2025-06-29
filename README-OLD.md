# DeepSeek MCP Client

一个集成了 Model Context Protocol (MCP) 功能的 DeepSeek API 客户端。

## 特性

- 🤖 集成 DeepSeek AI 聊天功能
- 🔌 支持连接多个 MCP 服务器
- 🔧 调用 MCP 工具 (Tools)
- 📄 读取 MCP 资源 (Resources)
- 💭 获取 MCP 提示 (Prompts)
- 🔄 支持 stdio 和 SSE 传输方式
- 🌏 中文界面和交互

## 安装依赖

```bash
npm install
```

## 配置

1. 创建 `.env` 文件并设置 DeepSeek API 密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
deepseek_api=your-deepseek-api-key-here
```

2. （可选）复制并修改 MCP 服务器配置：

```bash
cp mcp-servers.example.json mcp-servers.json
```

## 使用方法

### 启动客户端

```bash
# 开发模式
npm run dev

# 或构建后运行
npm run build
npm start
```

### 基本命令

启动后，你可以使用以下命令：

- `quit` 或 `exit` - 退出程序
- `clear` - 清空对话历史
- `mcp list` - 列出当前可用的 MCP 功能
- `mcp connect <type> <name> <command/url> [args...]` - 连接到 MCP 服务器

### 连接 MCP 服务器示例

#### 文件系统服务器 (stdio)

```
mcp connect stdio filesystem npx -y @modelcontextprotocol/server-filesystem /Users/username/Documents
```

#### SQLite 数据库服务器 (stdio)

```
mcp connect stdio sqlite npx -y @modelcontextprotocol/server-sqlite --db-path ./database.db
```

#### Brave 搜索服务器 (stdio)

先设置环境变量：

```bash
export BRAVE_API_KEY=your-brave-api-key
```

然后连接：

```
mcp connect stdio brave-search npx -y @modelcontextprotocol/server-brave-search
```

#### GitHub 服务器 (stdio)

先设置环境变量：

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=your-github-token
```

然后连接：

```
mcp connect stdio github npx -y @modelcontextprotocol/server-github
```

#### SSE 服务器示例

```
mcp connect sse web-search http://localhost:3000/sse
```

### 与 AI 对话

连接服务器后，你可以直接与 DeepSeek AI 对话，AI 会自动使用可用的 MCP 功能来帮助你：

```
💬 您: 请帮我搜索关于人工智能的最新新闻

💬 您: 列出当前目录下的所有文件

💬 您: 查询数据库中的用户表
```

### MCP 功能使用

AI 助手会自动识别需求并调用相应的 MCP 功能，你也可以通过特殊命令手动调用：

- `[MCP_TOOL:工具名称:参数JSON]` - 调用工具
- `[MCP_RESOURCE:资源URI]` - 读取资源
- `[MCP_PROMPT:提示名称:参数JSON]` - 获取提示

## 支持的 MCP 服务器

本客户端支持所有标准的 MCP 服务器，包括但不限于：

- **@modelcontextprotocol/server-filesystem** - 文件系统访问
- **@modelcontextprotocol/server-sqlite** - SQLite 数据库
- **@modelcontextprotocol/server-brave-search** - Brave 搜索
- **@modelcontextprotocol/server-github** - GitHub 集成
- **@modelcontextprotocol/server-postgres** - PostgreSQL 数据库
- **@modelcontextprotocol/server-fetch** - HTTP 请求
- 以及其他所有兼容 MCP 协议的服务器

## 传输方式

支持两种传输方式：

1. **stdio** - 标准输入输出，适用于本地命令行工具
2. **sse** - Server-Sent Events，适用于远程 HTTP 服务器

## 开发

### 项目结构

```
deepseek-mcp-client/
├── src/
│   └── index.ts          # 主要代码
├── dist/                 # 编译输出
├── package.json
├── tsconfig.json
├── .env                  # API 密钥配置
├── mcp-servers.json      # MCP 服务器配置
└── README.md
```

### 构建

```bash
npm run build
```

### 开发模式

```bash
npm run dev
```

## 故障排除

### 常见问题

1. **连接 MCP 服务器失败**

   - 检查服务器命令和参数是否正确
   - 确保必要的环境变量已设置
   - 验证服务器是否已安装（例如：`npx -y @modelcontextprotocol/server-filesystem`）

2. **DeepSeek API 调用失败**

   - 检查 `.env` 文件中的 API 密钥是否正确
   - 确认网络连接正常
   - 检查 API 配额是否用完

3. **工具调用失败**
   - 使用 `mcp list` 检查工具是否可用
   - 验证工具参数格式是否正确
   - 查看控制台错误信息

### 调试

启用详细日志：

```bash
DEBUG=mcp* npm run dev
```

## 许可证

ISC

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [Model Context Protocol 官方文档](https://modelcontextprotocol.io/)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
