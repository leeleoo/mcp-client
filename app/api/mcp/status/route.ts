import { NextRequest, NextResponse } from "next/server";
import { getGlobalMCPClient } from "@/lib/global-mcp-client";

export async function GET() {
  try {
    const mcpClient = getGlobalMCPClient();

    if (!mcpClient) {
      return NextResponse.json(
        { error: "MCP client not initialized" },
        { status: 500 }
      );
    }

    // Get MCP server status
    const servers = mcpClient.getMCPServerStatus();

    // Get current LLM provider information
    const currentProvider = mcpClient.getCurrentProvider();

    // Get available LLM providers
    const availableProviders = mcpClient.getAvailableProviders();

    // Get MCP capabilities
    const capabilities = mcpClient.getMCPCapabilities();

    return NextResponse.json({
      success: true,
      currentProvider,
      availableProviders,
      servers,
      capabilities: {
        tools: capabilities.tools.length,
        resources: capabilities.resources.length,
        prompts: capabilities.prompts.length,
      },
      detailed_capabilities: {
        tools: capabilities.tools,
        resources: capabilities.resources,
        prompts: capabilities.prompts,
      },
    });
  } catch (error) {
    console.error("Failed to get MCP status:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get MCP status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint only supports GET requests" },
    { status: 405 }
  );
}
