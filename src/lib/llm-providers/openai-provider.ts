import axios from "axios";
import {
  BaseLLMProvider,
  Message,
  StreamingOptions,
  LLMProviderConfig,
} from "@/lib/llm-providers/base-provider";

export class OpenAIProvider extends BaseLLMProvider {
  constructor(config: LLMProviderConfig) {
    super(
      {
        ...config,
        baseURL: config.baseURL || "https://api.openai.com/v1/chat/completions",
      },
      "gpt-3.5-turbo"
    );
  }

  getName(): string {
    return "OpenAI";
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async sendMessage(
    messages: Message[],
    options?: StreamingOptions
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      const response = await axios.post(
        this.config.baseURL!,
        {
          model: this.getModel(),
          messages: messages,
          temperature: this.getTemperature(),
          max_tokens: this.getMaxTokens(),
          stream: !!options?.onChunk,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            ...(options?.onChunk && { Accept: "text/event-stream" }),
          },
          responseType: options?.onChunk ? "stream" : "json",
        }
      );

      if (options?.onChunk) {
        return this.handleStreamingResponse(response, options);
      } else {
        return response.data.choices[0].message.content;
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        "Unknown error";
      const finalError = new Error(`OpenAI API error: ${errorMessage}`);
      if (options?.onError) {
        options.onError(finalError);
      }
      throw finalError;
    }
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
                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                  const content = parsed.choices[0].delta.content;
                  fullResponse += content;
                  if (options.onChunk) {
                    options.onChunk(content);
                  }
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
