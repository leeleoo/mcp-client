# SSE Learning MCP Server

This is an MCP server example based on HTTP + Server-Sent Events (SSE) communication, designed for learning and demonstrating the network communication patterns of the MCP protocol.

## 🌟 Features

- **SSE-based Communication**: Uses HTTP + Server-Sent Events for bidirectional communication
- **Express.js Framework**: HTTP server built on Express.js
- **CORS Support**: Supports cross-origin requests for easy client connections from different ports
- **Rich Functionality**: Includes three types of MCP functionality: tools, resources, and prompts
- **Mock Data**: Provides simulated web search, weather queries, and other features
- **Comprehensive Documentation**: Complete API documentation and usage examples

## 📋 Feature List

### 🔧 Tools

1. **web_search** - Simulated web search functionality
   - Parameters: `query` (search keywords), `limit` (number of results)
   - Returns a list of simulated search results

2. **weather_info** - Get weather information
   - Parameters: `city` (city name), `units` (temperature unit)
   - Returns simulated weather data

3. **url_analyzer** - Analyze basic URL information
   - Parameters: `url` (URL to analyze)
   - Returns structured analysis results of the URL

### 📄 Resources

1. **news://latest** - Latest news summary
   - Returns simulated news list (JSON format)

2. **config://server** - Server configuration information
   - Returns current server configuration (JSON format)

3. **stats://usage** - Usage statistics
   - Returns server runtime statistics (JSON format)

### 💭 Prompts

1. **technical_writing** - Technical documentation writing assistant
   - Parameters: `topic` (document topic), `audience` (target audience), `format` (document format)
   - Generates detailed prompts for technical documentation writing

2. **api_documentation** - API documentation generator
   - Parameters: `endpoint` (API endpoint), `method` (HTTP method), `parameters` (parameter description)
   - Generates standardized prompts for API documentation

## 🚀 Quick Start

### Install Dependencies

```bash
cd mcp-servers/sse-learning-server
npm install
```

### Start Server

```bash
npm start
```

The server starts on port 3001 by default, with SSE endpoint at: `http://localhost:3001/sse`

### Development Mode

```bash
npm run dev
```

Starts with `--watch` mode, automatically restarts when files are modified.

### Run Tests

```bash
npm test
```

Runs comprehensive functionality tests to verify all tools, resources, and prompts work correctly.

## 🔧 Configuration Options

### Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Runtime environment (development/production)

### Example Configuration

```bash
PORT=3001 NODE_ENV=development npm start
```

## 📡 Connecting to Client

### Configure in mcp-servers.json

```json
{
  "servers": [
    {
      "name": "sse-learning-server",
      "type": "sse",
      "url": "http://localhost:3001/sse",
      "description": "SSE Learning MCP Server",
      "autoConnect": true
    }
  ]
}
```

### Manual Connection Example

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const client = new Client({
  name: "my-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

const transport = new SSEClientTransport(new URL("http://localhost:3001/sse"));
await client.connect(transport);

// Use client...
const tools = await client.listTools();
```

## 🧪 Test Examples

### Test Tool Calls

```javascript
// Web search
const searchResult = await client.callTool({
  name: "web_search",
  arguments: { query: "TypeScript", limit: 5 }
});

// Weather query
const weatherResult = await client.callTool({
  name: "weather_info",
  arguments: { city: "Shanghai", units: "celsius" }
});

// URL analysis
const urlResult = await client.callTool({
  name: "url_analyzer",
  arguments: { url: "https://example.com/path?param=value" }
});
```

### Test Resource Reading

```javascript
// Read news
const news = await client.readResource({ uri: "news://latest" });

// Read server configuration
const config = await client.readResource({ uri: "config://server" });

// Read usage statistics
const stats = await client.readResource({ uri: "stats://usage" });
```

### Test Prompt Retrieval

```javascript
// Technical writing prompt
const techPrompt = await client.getPrompt({
  name: "technical_writing",
  arguments: { 
    topic: "Docker Containerization",
    audience: "beginner",
    format: "markdown"
  }
});

// API documentation prompt
const apiPrompt = await client.getPrompt({
  name: "api_documentation",
  arguments: { 
    endpoint: "/api/auth/login",
    method: "POST",
    parameters: "username, password"
  }
});
```

## 🏗️ Architecture Overview

### SSE vs Stdio

Compared to stdio transport, SSE transport has the following characteristics:

**Advantages:**
- Based on standard HTTP protocol, easier to deploy and debug
- Supports cross-origin requests (CORS)
- Can pass through network firewalls and proxies
- Supports load balancing and cluster deployment
- Easier to integrate into existing web services

**Disadvantages:**
- Requires additional HTTP server
- Slightly higher overhead compared to stdio
- Need to handle network connection states

### Directory Structure

```
sse-learning-server/
├── package.json          # Project configuration and dependencies
├── index.js              # Main server file
├── test.js               # Test file
├── native-streamable-http-server.js  # Native implementation
├── native-test.js        # Native implementation tests
├── NATIVE-USAGE.md       # Native implementation usage guide
└── README.md             # Documentation
```

## 🔍 Debugging Tips

### Server Logs

The server outputs detailed log information including:
- Startup information and configuration
- Connection status
- Request processing flow
- Error information

### HTTP Endpoint Testing

You can directly access HTTP endpoints for debugging:

```bash
# Check server status
curl http://localhost:3001/sse

# View server information
curl http://localhost:3001/
```

### Browser Debugging

Visit `http://localhost:3001/sse` in your browser to see SSE connection status.

## 🚨 Important Notes

1. **Port Conflicts**: Ensure port 3001 is not occupied by other programs
2. **Network Firewall**: Ensure firewall allows access to the specified port
3. **CORS Settings**: Configure CORS policy appropriately for production use
4. **Error Handling**: Server includes comprehensive error handling, but pay attention to network connection stability

## 📚 References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Express.js Documentation](https://expressjs.com/)
- [Server-Sent Events Specification](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

## 🤝 Contributing

Welcome to submit Issues and Pull Requests to improve this learning example!

## 🎓 Native Implementation

This repository also includes a **native implementation** (`native-streamable-http-server.js`) that demonstrates how to build an MCP server without any third-party SDK dependencies. This implementation provides:

- **Zero Dependencies**: Built using only Node.js built-in modules
- **Educational Value**: Deep understanding of MCP protocol mechanics
- **Full Compatibility**: Achieves the same functionality as SDK-based implementations
- **Complete Documentation**: Detailed usage guide in `NATIVE-USAGE.md`

To run the native implementation:

```bash
# Start native server
node native-streamable-http-server.js

# Run native tests
node native-test.js
```

The native implementation is perfect for learning the core concepts of the MCP protocol and understanding how it works under the hood.