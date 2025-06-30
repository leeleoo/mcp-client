import { NextRequest, NextResponse } from "next/server";
import { MCPServerConfig } from "@/lib/multi-llm-mcp-client";
import { getGlobalMCPClient } from "@/lib/global-mcp-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, command, url, args } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Server name and type cannot be empty" },
        { status: 400 }
      );
    }

    if (type !== "stdio" && type !== "sse") {
      return NextResponse.json(
        { error: "Server type must be stdio or sse" },
        { status: 400 }
      );
    }

    if (type === "stdio" && !command) {
      return NextResponse.json(
        { error: "stdio type servers require a command" },
        { status: 400 }
      );
    }

    if (type === "sse" && !url) {
      return NextResponse.json(
        { error: "sse type servers require a url" },
        { status: 400 }
      );
    }

    const mcpClient = await getGlobalMCPClient();

    if (!mcpClient) {
      return NextResponse.json(
        { error: "MCP client not initialized" },
        { status: 500 }
      );
    }

    // Build MCP server configuration
    const config: MCPServerConfig = {
      name,
      type: type as "stdio" | "sse",
    };

    if (type === "stdio") {
      config.command = command;
      config.args = args || [];
    } else {
      config.url = url;
    }

    // Try to connect to MCP server
    await mcpClient.connectToMCPServer(config);

    return NextResponse.json({
      success: true,
      message: `Successfully connected to MCP server: ${name}`,
      server: {
        name,
        type,
        status: "connected",
      },
    });
  } catch (error) {
    console.error("Failed to connect to MCP server:", error);

    let errorMessage = "Failed to connect to MCP server";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "This endpoint only supports POST requests" },
    { status: 405 }
  );
}

// Disconnect MCP server connection
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverName = searchParams.get("name");

    if (!serverName) {
      return NextResponse.json(
        { error: "Server name cannot be empty" },
        { status: 400 }
      );
    }

    const mcpClient = await getGlobalMCPClient();

    if (!mcpClient) {
      return NextResponse.json(
        { error: "MCP client not initialized" },
        { status: 500 }
      );
    }

    // Disconnect specific server or all connections
    if (serverName === "all") {
      await mcpClient.disconnectAllMCP();
    } else {
      await mcpClient.disconnectMCPServer(serverName);
    }

    return NextResponse.json({
      success: true,
      message:
        serverName === "all"
          ? `Disconnected all MCP servers`
          : `Disconnected MCP server: ${serverName}`,
    });
  } catch (error) {
    console.error("Failed to disconnect MCP server:", error);

    let errorMessage = "Failed to disconnect MCP server";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
      },
      { status: 500 }
    );
  }
}
