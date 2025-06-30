import { NextRequest, NextResponse } from "next/server";
import { getGlobalMCPClient } from "@/lib/global-mcp-client";

export async function POST(request: NextRequest) {
  try {
    const { message, history, provider } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "消息内容不能为空" }, { status: 400 });
    }

    const mcpClient = await getGlobalMCPClient();

    if (!mcpClient) {
      return NextResponse.json(
        { error: "MCP client not initialized" },
        { status: 500 }
      );
    }

    // 如果指定了提供商，切换到该提供商
    if (provider && provider !== mcpClient.getCurrentProvider().name) {
      try {
        mcpClient.switchProvider(provider);
      } catch (error) {
        return NextResponse.json(
          { error: `无法切换到提供商 "${provider}": ${error}` },
          { status: 400 }
        );
      }
    }

    // 创建 SSE 流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // 发送流式响应
        mcpClient
          .sendMessageWithMCP(message, (chunk: string) => {
            // 发送每个流式块
            const data = JSON.stringify({ content: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          })
          .then((finalResponse) => {
            // 发送完成信号
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          })
          .catch((error) => {
            console.error("聊天流式响应错误:", error);
            const errorData = JSON.stringify({
              error: "抱歉，处理您的请求时出现错误，请稍后重试。",
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("聊天 API 错误:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "此端点仅支持 POST 请求" },
    { status: 405 }
  );
}
