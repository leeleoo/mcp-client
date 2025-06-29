import { NextRequest, NextResponse } from "next/server";
import MultiLLMMCPClient from "@/lib/multi-llm-mcp-client";

let globalMCPClient: MultiLLMMCPClient | null = null;
let initializationPromise: Promise<void> | null = null;

// Initialize MCP client immediately
async function initializeMCPClient(): Promise<void> {
  if (!globalMCPClient) {
    try {
      console.log("🚀 Initializing MCP client...");
      globalMCPClient = new MultiLLMMCPClient();
      // Auto-connect configured MCP servers
      await globalMCPClient.autoConnectMCPServers();
      console.log("✅ MCP client initialization completed");
    } catch (error) {
      console.error("❌ Failed to initialize MCP client:", error);
      throw error;
    }
  }
}

export async function GET() {
  try {
    if (!initializationPromise) {
      initializationPromise = initializeMCPClient();
    }

    await initializationPromise;

    const serverStatus = globalMCPClient?.getMCPServerStatus() || [];

    return NextResponse.json({
      success: true,
      message: "MCP client initialization successful",
      servers: serverStatus,
    });
  } catch (error) {
    console.error("Initialization failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "MCP client initialization failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
