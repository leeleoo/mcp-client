#!/usr/bin/env node

import dotenv from "dotenv";
import * as readline from "readline";
import MultiLLMMCPClient, { MCPServerConfig } from "@/lib/multi-llm-mcp-client";

dotenv.config();

/**
 * 启动交互式聊天 CLI
 */
async function startCLI(): Promise<void> {
  const chat = new MultiLLMMCPClient();

  // Auto-connect configured MCP servers
  try {
    await chat.autoConnectMCPServers();
  } catch (error) {
    console.warn("Issues occurred while auto-connecting MCP servers:", error);
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("🚀 Multi-LLM MCP Client started!");
  const currentProvider = chat.getCurrentProvider();
  console.log(`🤖 Current LLM provider: ${currentProvider.displayName}`);
  console.log("\nCommand list:");
  console.log('  - "quit" or "exit": Exit');
  console.log('  - "clear": Clear conversation history');
  console.log('  - "llm list": List available LLM providers');
  console.log('  - "llm switch <provider>": Switch LLM provider');
  console.log('  - "mcp list": List MCP capabilities');
  console.log('  - "mcp status": Show MCP server status');
  console.log(
    '  - "mcp connect <type> <name> <command/url> [args...]": Connect MCP server'
  );
  console.log(
    "  - Example: mcp connect stdio weather python weather-server.py"
  );
  console.log("  - Example: mcp connect sse api http://localhost:3000/sse");
  console.log("\nStart chatting!\n");

  const handleInput = async (input: string) => {
    const trimmedInput = input.trim();

    if (trimmedInput === "quit" || trimmedInput === "exit") {
      await chat.disconnectAllMCP();
      rl.close();
      return;
    }

    if (trimmedInput === "clear") {
      chat.clearConversation();
      console.log("✅ Conversation history cleared!");
      rl.prompt();
      return;
    }

    if (trimmedInput.startsWith("llm ")) {
      const llmArgs = trimmedInput.split(" ").slice(1);

      if (llmArgs[0] === "list") {
        console.log("\n🤖 Available LLM providers:");
        const providers = chat.getAvailableProviders();
        providers.forEach((provider) => {
          const status = provider.configured
            ? "✅ Configured"
            : "❌ Not configured";
          console.log(
            `  - ${provider.displayName} (${provider.name}): ${status}`
          );
          console.log(`    Default model: ${provider.defaultModel}`);
          if (provider.configured) {
            console.log(`    Environment variable: ${provider.envVarName}`);
          }
        });
      } else if (llmArgs[0] === "switch") {
        if (llmArgs.length < 2) {
          console.log("❌ Usage: llm switch <provider>");
          rl.prompt();
          return;
        }

        const providerName = llmArgs[1];
        try {
          chat.switchProvider(providerName);
          const newProvider = chat.getCurrentProvider();
          console.log(
            `✅ Switched to LLM provider: ${newProvider.displayName}`
          );
        } catch (error) {
          console.log(`❌ Failed to switch LLM provider: ${error}`);
        }
      }

      rl.prompt();
      return;
    }

    if (trimmedInput.startsWith("mcp ")) {
      const mcpArgs = trimmedInput.split(" ").slice(1);

      if (mcpArgs[0] === "status") {
        console.log("\n🔌 MCP server status:");
        const servers = chat.getMCPServerStatus();
        if (servers.length === 0) {
          console.log("  No MCP server connections");
        }
        servers.forEach((server) => {
          const statusIcon = server.status === "connected" ? "✅" : "❌";
          console.log(`  ${statusIcon} ${server.name}: ${server.status}`);
          if (server.capabilities) {
            console.log(
              `    Tools: ${server.capabilities.tools}, Resources: ${server.capabilities.resources}, Prompts: ${server.capabilities.prompts}`
            );
          }
        });
      } else if (mcpArgs[0] === "list") {
        chat.listMCPCapabilities();
      } else if (mcpArgs[0] === "connect") {
        if (mcpArgs.length < 4) {
          console.log(
            "❌ Usage: mcp connect <type> <name> <command/url> [args...]"
          );
          rl.prompt();
          return;
        }

        const [, type, name, commandOrUrl, ...args] = mcpArgs;
        const parts = trimmedInput.split(" ").slice(2); // Remove 'mcp connect'

        if (type !== "stdio" && type !== "sse") {
          console.log('❌ Type must be "stdio" or "sse"');
          rl.prompt();
          return;
        }

        try {
          if (type === "stdio") {
            await chat.connectToMCPServer({
              name,
              type: "stdio",
              command: commandOrUrl,
              args: args,
            });
          } else {
            await chat.connectToMCPServer({
              name,
              type: "sse",
              url: commandOrUrl,
            });
          }
          console.log(`✅ Connected to MCP server: ${name}`);
        } catch (error) {
          console.log(`❌ MCP connection failed: ${error}`);
        }
      }

      rl.prompt();
      return;
    }

    // Show AI thinking prompt
    process.stdout.write("🤔 AI is thinking...");

    try {
      // Use streaming mode
      await chat.sendMessageWithMCP(trimmedInput, (chunk) => {
        // Display streaming content in real time
        process.stdout.write(chunk);
      });

      // New line at the end
      console.log("\n");
    } catch (error) {
      console.log("\n❌ Failed to get response, please try again later");
      console.error("Error details:", error);
    }

    rl.prompt();
  };

  rl.setPrompt("> ");
  rl.prompt();

  rl.on("line", handleInput);

  // Handle program exit
  rl.on("close", () => {
    console.log("\nExiting...");
    process.exit(0);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startCLI().catch(console.error);
}
