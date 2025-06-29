import MultiLLMMCPClient from "@/lib/multi-llm-mcp-client";

// Global MCP client instance
let globalMCPClient: MultiLLMMCPClient | null = null;
let initializationPromise: Promise<MultiLLMMCPClient> | null = null;

// Initialize MCP client immediately
async function initializeMCPClient(): Promise<MultiLLMMCPClient> {
  try {
    console.log("🚀 Initializing global MCP client...");
    const client = new MultiLLMMCPClient();

    // Auto-connect configured MCP servers
    await client.autoConnectMCPServers();

    console.log("✅ Global MCP client initialization completed");
    return client;
  } catch (error) {
    console.error("❌ Failed to initialize global MCP client:", error);
    // Reset state for next retry
    globalMCPClient = null;
    initializationPromise = null;
    throw error;
  }
}

// Function to ensure initialization only happens once
export async function getGlobalMCPClient(): Promise<MultiLLMMCPClient | null> {
  if (globalMCPClient) {
    return globalMCPClient;
  }

  if (!initializationPromise) {
    initializationPromise = initializeMCPClient();
  }

  try {
    globalMCPClient = await initializationPromise;
    return globalMCPClient;
  } catch (error) {
    console.error("Failed to get global MCP client:", error);
    return null;
  }
}

// Get current client instance (if already initialized)
export function getCurrentMCPClient(): MultiLLMMCPClient | null {
  return globalMCPClient;
}

// Reset client (for testing or re-initialization)
export function resetGlobalMCPClient(): void {
  globalMCPClient = null;
  initializationPromise = null;
}
