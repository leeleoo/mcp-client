# DeepSeek MCP Client - Next.js Web Application

DeepSeek MCP Client is a modern intelligent chat web application based on Next.js and Model Context Protocol (MCP), integrated with DeepSeek API. Through the MCP protocol, the client can connect to various external tools and resources, providing richer functionality for AI conversations.

## Features

- 🌐 **Modern Web Interface**: Responsive design based on Next.js and Tailwind CSS
- 🚀 **Turbopack Support**: Lightning-fast development experience with Next.js 14's Turbopack
- 🤖 **DeepSeek AI Integration**: Powered by DeepSeek's powerful language models
- 🔧 **MCP Protocol Support**: Connect and use various MCP servers
- 🌊 **Real-time Streaming Responses**: Real-time conversation experience with Server-Sent Events
- 🛠️ **Tool Calling**: AI can call external tools to perform tasks
- 📄 **Resource Access**: Read and process external resources
- 💭 **Prompt Management**: Use predefined prompt templates
- 🔄 **Multi-server Support**: Connect to multiple MCP servers simultaneously
- 📱 **Responsive Design**: Perfect adaptation for desktop and mobile devices
- ⚡ **Real-time Status Monitoring**: Real-time display of MCP server connection status

## Quick Start

### Requirements

- Node.js 18+
- npm or yarn
- DeepSeek API Key

### Installation Steps

1. **Clone the Project**

   ```bash
   git clone <repository-url>
   cd deepseek-mcp-client-nextjs
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env.local` file:

   ```bash
   deepseek_api=your_deepseek_api_key_here
   # or use
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```

4. **Start Development Server**

   ```bash
   npm run dev
   ```

5. **Access the Application**

   Open your browser and visit [http://localhost:3000](http://localhost:3000)

### Command Line Version (Optional)

If you prefer a command line interface, you can still use:

```bash
npm run cli
```

## Usage Guide

### Web Interface

1. **Send Messages**: Type your message in the bottom input box and press Enter to send
2. **View MCP Status**: Click the settings icon in the top right corner to view connected MCP servers
3. **Streaming Responses**: AI replies are displayed in real-time with typing effect
4. **MCP Features**: AI will automatically call available MCP tools and resources

### MCP Integration

AI can call MCP functions through special commands:

- `[MCP_TOOL:tool_name:parameter_JSON]` - Call tools
- `[MCP_RESOURCE:resource_URI]` - Read resources
- `[MCP_PROMPT:prompt_name:parameter_JSON]` - Get prompts

### API Endpoints

- `POST /api/chat` - Chat interface with SSE streaming response support
- `GET /api/mcp/status` - Get MCP server status
- `POST /api/mcp/connect` - Connect to MCP server
- `DELETE /api/mcp/connect` - Disconnect MCP server

## Project Structure

```
deepseek-mcp-client-nextjs/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── chat/                 # Chat API
│   │   └── mcp/                  # MCP management API
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page
├── src/
│   ├── lib/
│   │   └── deepseek-mcp-client.ts # MCP client library
│   └── cli.ts                    # Command line version
├── package.json                  # Project configuration and dependencies
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── mcp-servers.example.json      # MCP server configuration example
```

## MCP Server Connection Examples

### Filesystem Server (stdio)

```bash
# Connect via API
curl -X POST http://localhost:3000/api/mcp/connect \
  -H "Content-Type: application/json" \
  -d '{
    "name": "filesystem",
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"]
  }'
```

### Database Server (stdio)

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

### SSE Server

```bash
curl -X POST http://localhost:3000/api/mcp/connect \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api-server",
    "type": "sse",
    "url": "http://localhost:8080/mcp"
  }'
```

## Deployment

### Build Production Version

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable `DEEPSEEK_API_KEY`
4. Deploy

### Deploy to Other Platforms

The project supports deployment to any platform that supports Node.js, such as:

- Vercel
- Netlify
- Railway
- Docker

## Development

### Development Mode (with Turbopack)

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Code Linting

```bash
npm run lint
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Build**: Turbopack (development), Webpack (production)
- **AI**: DeepSeek API
- **Protocol**: Model Context Protocol (MCP)
- **Deployment**: Vercel (recommended)

## Supported MCP Servers

This client supports all standard MCP servers, including but not limited to:

- **@modelcontextprotocol/server-filesystem** - Filesystem access
- **@modelcontextprotocol/server-sqlite** - SQLite database
- **@modelcontextprotocol/server-brave-search** - Brave search
- **@modelcontextprotocol/server-github** - GitHub integration
- **@modelcontextprotocol/server-postgres** - PostgreSQL database
- **@modelcontextprotocol/server-fetch** - HTTP requests
- And all other MCP protocol-compatible servers

## FAQ

### Q: How to get DeepSeek API Key?

A: Visit [DeepSeek Platform](https://platform.deepseek.com) to register an account and get your API Key.

### Q: Which MCP servers are supported?

A: All servers that comply with MCP specifications are supported, including filesystem, database, API calls, search engines, etc.

### Q: How to use in production environment?

A: Build the project and deploy it to a platform that supports Node.js, and set environment variables correctly.

### Q: Can I customize the UI?

A: Yes, the project uses Tailwind CSS, so you can easily customize styles and layout.

### Q: How to add new MCP servers?

A: Through the settings panel in the web interface or by directly calling the `/api/mcp/connect` API endpoint.

## Troubleshooting

### Common Issues

1. **MCP Server Connection Failed**

   - Check if server command and arguments are correct
   - Ensure necessary environment variables are set
   - Verify the server is installed

2. **DeepSeek API Call Failed**

   - Check if API key in environment variables is correct
   - Confirm network connection is working
   - Check if API quota is exhausted

3. **Web Interface Not Accessible**
   - Confirm development server is started
   - Check if port 3000 is occupied
   - Check console error messages

## License

ISC License

## Contributing

Issues and Pull Requests are welcome!

## Changelog

### v2.0.0 (Current)

- 🌐 Refactored as Next.js Web application
- 🚀 Added Turbopack support
- 🎨 Modern UI design
- 🌊 SSE streaming responses
- 📱 Responsive design

### v1.0.0

- 🤖 Basic CLI version
- 🔧 MCP protocol support
- 🔄 Multi-server connections
