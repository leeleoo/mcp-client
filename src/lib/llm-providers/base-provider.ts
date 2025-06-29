export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

export interface StreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export interface LLMProviderConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export abstract class BaseLLMProvider {
  protected config: LLMProviderConfig;
  protected defaultModel: string;

  constructor(config: LLMProviderConfig, defaultModel: string) {
    this.config = config;
    this.defaultModel = defaultModel;
  }

  abstract getName(): string;
  
  abstract sendMessage(
    messages: Message[],
    options?: StreamingOptions
  ): Promise<string>;

  abstract isConfigured(): boolean;

  protected getModel(): string {
    return this.config.model || this.defaultModel;
  }

  protected getTemperature(): number {
    return this.config.temperature || 0.7;
  }

  protected getMaxTokens(): number {
    return this.config.maxTokens || 2000;
  }
}