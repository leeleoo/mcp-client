# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Multi-LLM MCP (Model Context Protocol) client project built with Next.js. The project integrates multiple LLM providers (DeepSeek, OpenAI, Claude) with Model Context Protocol capabilities, allowing users to switch between different AI models and connect to various MCP servers through both a modern web interface and a command-line interface.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server with Turbopack (recommended)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint code linting
- `npm run cli` - Run the command-line interface version

## Architecture Overview

### Core Components

1. **MultiLLMMCPClient** (`src/lib/multi-llm-mcp-client.ts`):
   - Central client class managing multiple LLM providers and MCP server connections
   - Supports provider switching between DeepSeek, OpenAI, and Claude
   - Handles both stdio and SSE transport types for MCP servers
   - Implements streaming responses using Server-Sent Events
   - Manages conversation history and MCP capabilities (tools, resources, prompts)
   - Processes special MCP command syntax: `[MCP_TOOL:name:args]`, `[MCP_RESOURCE:uri]`, `[MCP_PROMPT:name:args]`

2. **LLM Provider System** (`src/lib/llm-providers/`):
   - **BaseLLMProvider**: Abstract base class defining the provider interface
   - **DeepSeekProvider**: DeepSeek API integration with streaming support
   - **OpenAIProvider**: OpenAI API integration with streaming support
   - **ClaudeProvider**: Claude API integration with streaming support
   - Provider registry and configuration management

3. **Configuration Manager** (`src/lib/config-manager.ts`):
   - Centralized configuration system for LLM providers and MCP servers
   - Environment variable management and JSON configuration loading
   - Auto-connect functionality for MCP servers

4. **Next.js Web Application**:
   - Modern React-based interface with real-time streaming chat
   - LLM provider selection and switching interface
   - MCP server status monitoring and management panel
   - Responsive design using Tailwind CSS
   - Server-side API routes for chat, LLM, and MCP operations

5. **API Routes**:
   - `/api/chat` - Handles streaming chat requests with provider selection and MCP integration
   - `/api/llm/switch` - Switch between LLM providers
   - `/api/mcp/connect` - Connect/disconnect MCP servers
   - `/api/mcp/status` - Get comprehensive status (LLM providers + MCP servers)

6. **CLI Interface** (`src/cli.ts`):
   - Alternative command-line interface with multi-LLM support
   - Interactive commands for provider switching and MCP server management
   - Real-time streaming responses in terminal

### Key Architectural Patterns

- **Provider Abstraction**: Unified interface for multiple LLM providers with seamless switching
- **Global Multi-LLM Client**: Single shared instance across API routes maintaining both LLM and MCP connections
- **Configuration-Driven Setup**: JSON and environment variable based configuration for providers and servers
- **Streaming Architecture**: Both web and CLI interfaces use SSE streaming for real-time responses
- **Transport Abstraction**: Supports both stdio (process-based) and SSE (network-based) MCP servers
- **Capability Discovery**: Automatic detection and management of tools, resources, and prompts from connected servers
- **Auto-Connect**: Configurable automatic connection to MCP servers on startup

## Environment Configuration

The application supports multiple LLM providers. Configure the desired providers in `.env.local`:

```bash
# LLM Provider API Keys
DEEPSEEK_API_KEY=your_deepseek_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here

# MCP Server Environment Variables
BRAVE_API_KEY=your_brave_api_key_here
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here

# Optional: Custom model configurations
DEEPSEEK_MODEL=deepseek-chat
OPENAI_MODEL=gpt-3.5-turbo
CLAUDE_MODEL=claude-3-haiku-20240307
```

Copy `.env.example` to `.env.local` and fill in your API keys. At least one LLM provider must be configured.

## MCP Integration Details

### Server Connection Types

1. **Stdio Transport**: Spawns external processes (e.g., `npx @modelcontextprotocol/server-filesystem`)
2. **SSE Transport**: Connects to HTTP-based MCP servers via Server-Sent Events

### MCP Command Processing

The system processes special syntax in AI responses:
- `[MCP_TOOL:tool_name:{"arg": "value"}]` - Executes MCP tools
- `[MCP_RESOURCE:resource_uri]` - Reads MCP resources  
- `[MCP_PROMPT:prompt_name:{"arg": "value"}]` - Gets MCP prompts

### Capability Management

- Tools, resources, and prompts are automatically discovered from connected servers
- Each capability is tagged with its source server name
- System message includes available capabilities for AI context

## Development Notes

### Key Files to Understand

- `src/lib/multi-llm-mcp-client.ts` - Core multi-LLM MCP client implementation
- `src/lib/llm-providers/` - LLM provider implementations and abstractions
- `src/lib/config-manager.ts` - Configuration management system
- `app/api/chat/route.ts` - Streaming chat API with provider selection and MCP integration
- `app/api/llm/switch/route.ts` - LLM provider switching API
- `app/page.tsx` - Main React chat interface with provider selection
- `app/api/mcp/connect/route.ts` - MCP server management API
- `mcp-servers.json` - MCP server and LLM provider configuration file

### Import Aliases

The project uses TypeScript path aliases for cleaner imports:
- `@/*` - Points to `./src/*`
- `@/lib/*` - Points to `./src/lib/*`
- `@/lib/llm-providers/*` - Points to `./src/lib/llm-providers/*`
- `@/app/*` - Points to `./app/*`

Example usage:
```typescript
// Instead of: import MultiLLMMCPClient from "../../../../src/lib/multi-llm-mcp-client"
import MultiLLMMCPClient from "@/lib/multi-llm-mcp-client";

// Instead of: import { OpenAIProvider } from "../../lib/llm-providers/openai-provider"
import { OpenAIProvider } from "@/lib/llm-providers/openai-provider";
```

### Build System

- Uses Next.js 14 with App Router
- Turbopack enabled for faster development builds
- TypeScript with strict configuration
- ESLint for code quality

### State Management

- React state for UI components including provider selection
- Global multi-LLM client instance for provider and server connections
- Provider switching with configuration persistence
- Conversation history maintained in client instance
- Real-time status updates for both LLM providers and MCP servers

## LLM Provider Management

### Switching Providers
Providers can be switched via:
- Web UI: Settings panel provider selection
- CLI: `llm switch <provider>`
- API: `POST /api/llm/switch` with `{"provider": "openai"}`

### Supported Providers
- **DeepSeek**: `deepseek-chat`, `deepseek-coder`
- **OpenAI**: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`, `gpt-4o`
- **Claude**: `claude-3-haiku-20240307`, `claude-3-sonnet-20240229`, `claude-3-opus-20240229`

## Testing MCP Servers

### Built-in Learning Server

The project includes a simple MCP server for learning (`mcp-servers/learning-server/`):

**Features:**
- **Tools**: calculator, greeting, text_analyzer
- **Resources**: time://current, system://info, server://status  
- **Prompts**: code_review, explain_concept

**Quick test:**
```bash
cd mcp-servers/learning-server
node test.js
```

**Usage examples:**
```bash
# Tools
[MCP_TOOL:calculator:{"operation": "add", "a": 10, "b": 5}]
[MCP_TOOL:greeting:{"name": "张三", "language": "zh", "style": "friendly"}]

# Resources
[MCP_RESOURCE:time://current]
[MCP_RESOURCE:system://info]

# Prompts
[MCP_PROMPT:code_review:{"code": "function test() {}", "language": "JavaScript"}]
```

### External MCP Servers

Configure servers in `mcp-servers.json` or connect manually:
```bash
# CLI commands
mcp connect stdio filesystem npx -y @modelcontextprotocol/server-filesystem /path/to/directory
mcp connect stdio sqlite npx -y @modelcontextprotocol/server-sqlite --db-path ./database.db
mcp connect stdio brave-search npx -y @modelcontextprotocol/server-brave-search

# Check status
mcp status
llm list
```

## Configuration File Format

Example `mcp-servers.json`:
```json
{
  "defaultProvider": "deepseek",
  "llmProviders": {
    "deepseek": {
      "model": "deepseek-chat",
      "temperature": 0.7,
      "maxTokens": 2000
    },
    "openai": {
      "model": "gpt-3.5-turbo"
    }
  },
  "servers": [
    {
      "name": "filesystem",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"],
      "autoConnect": true
    }
  ]
}
```

## Deployment Considerations

- Designed for deployment on Vercel or similar Node.js platforms
- Environment variables for all desired LLM providers must be set
- MCP servers running as stdio processes may have limitations in serverless environments
- SSE-based MCP servers are more suitable for production deployments
- Provider configurations can be overridden via environment variables