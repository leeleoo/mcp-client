import { NextRequest, NextResponse } from "next/server";
import { getCurrentMCPClient } from "@/lib/global-mcp-client";

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json();

    if (!provider || typeof provider !== "string") {
      return NextResponse.json(
        { error: "提供商名称不能为空" },
        { status: 400 }
      );
    }

    const mcpClient = getCurrentMCPClient();

    if (!mcpClient) {
      return NextResponse.json(
        { error: "MCP 客户端未初始化" },
        { status: 500 }
      );
    }

    try {
      mcpClient.switchProvider(provider);
      const currentProvider = mcpClient.getCurrentProvider();

      return NextResponse.json({
        success: true,
        message: `已切换到 LLM 提供商: ${currentProvider.displayName}`,
        currentProvider,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: `切换 LLM 提供商失败: ${error}`,
          success: false,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("切换 LLM 提供商失败:", error);

    let errorMessage = "切换 LLM 提供商失败";
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
    { error: "此端点仅支持 POST 请求" },
    { status: 405 }
  );
}