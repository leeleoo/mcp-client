import axios from "axios";
import {
  BaseLLMProvider,
  Message,
  StreamingOptions,
  LLMProviderConfig,
} from "@/lib/llm-providers/base-provider";

export class ClaudeProvider extends BaseLLMProvider {
  constructor(config: LLMProviderConfig) {
    super(
      {
        ...config,
        baseURL: config.baseURL || "https://api.anthropic.com/v1/messages",
      },
      "claude-3-haiku-20240307"
    );
  }

  getName(): string {
    return "Claude";
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async sendMessage(
    messages: Message[],
    options?: StreamingOptions
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("Claude API key not configured");
    }

    // Claude API 需要特殊的消息格式
    const { systemMessage, conversationMessages } =
      this.formatMessages(messages);

    try {
      const requestBody: any = {
        model: this.getModel(),
        max_tokens: this.getMaxTokens(),
        temperature: this.getTemperature(),
        messages: conversationMessages,
        stream: !!options?.onChunk,
      };

      if (systemMessage) {
        requestBody.system = systemMessage;
      }

      const response = await axios.post(this.config.baseURL!, requestBody, {
        headers: {
          "x-api-key": this.config.apiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          ...(options?.onChunk && { Accept: "text/event-stream" }),
        },
        responseType: options?.onChunk ? "stream" : "json",
      });

      if (options?.onChunk) {
        return this.handleStreamingResponse(response, options);
      } else {
        return response.data.content[0].text;
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        "Unknown error";
      const finalError = new Error(`Claude API error: ${errorMessage}`);
      if (options?.onError) {
        options.onError(finalError);
      }
      throw finalError;
    }
  }

  private formatMessages(messages: Message[]): {
    systemMessage?: string;
    conversationMessages: any[];
  } {
    let systemMessage: string | undefined;
    const conversationMessages: any[] = [];

    for (const message of messages) {
      if (message.role === "system") {
        systemMessage = message.content;
      } else {
        conversationMessages.push({
          role: message.role,
          content: message.content,
        });
      }
    }

    return { systemMessage, conversationMessages };
  }

  private handleStreamingResponse(
    response: any,
    options: StreamingOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let fullResponse = "";

      response.data.on("data", (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        const lines = chunkStr.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();

            if (data === "[DONE]") {
              if (options.onComplete) {
                options.onComplete(fullResponse);
              }
              resolve(fullResponse);
              return;
            }

            if (data && data !== "") {
              try {
                const parsed = JSON.parse(data);
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.text
                ) {
                  const content = parsed.delta.text;
                  fullResponse += content;
                  if (options.onChunk) {
                    options.onChunk(content);
                  }
                } else if (parsed.type === "message_stop") {
                  if (options.onComplete) {
                    options.onComplete(fullResponse);
                  }
                  resolve(fullResponse);
                  return;
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      });

      response.data.on("end", () => {
        if (options.onComplete) {
          options.onComplete(fullResponse);
        }
        resolve(fullResponse);
      });

      response.data.on("error", (error: any) => {
        if (options.onError) {
          options.onError(error);
        }
        reject(error);
      });
    });
  }
}
