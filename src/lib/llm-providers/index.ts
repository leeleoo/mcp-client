import { BaseLLMProvider, LLMProviderConfig } from "@/lib/llm-providers/base-provider";
import { DeepSeekProvider } from "@/lib/llm-providers/deepseek-provider";
import { OpenAIProvider } from "@/lib/llm-providers/openai-provider";
import { ClaudeProvider } from "@/lib/llm-providers/claude-provider";

export interface LLMProviderRegistry {
  [key: string]: new (config: LLMProviderConfig) => BaseLLMProvider;
}

export const LLM_PROVIDERS: LLMProviderRegistry = {
  deepseek: DeepSeekProvider,
  openai: OpenAIProvider,
  claude: ClaudeProvider,
};

export interface ProviderConfiguration {
  name: string;
  displayName: string;
  defaultModel: string;
  models: string[];
  envVarName: string;
  requiresApiKey: boolean;
}

export const PROVIDER_CONFIGS: Record<string, ProviderConfiguration> = {
  deepseek: {
    name: "deepseek",
    displayName: "DeepSeek",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-coder"],
    envVarName: "DEEPSEEK_API_KEY",
    requiresApiKey: true,
  },
  openai: {
    name: "openai",
    displayName: "OpenAI",
    defaultModel: "gpt-3.5-turbo",
    models: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o"],
    envVarName: "OPENAI_API_KEY",
    requiresApiKey: true,
  },
  claude: {
    name: "claude",
    displayName: "Claude",
    defaultModel: "claude-3-haiku-20240307",
    models: [
      "claude-3-haiku-20240307",
      "claude-3-sonnet-20240229",
      "claude-3-opus-20240229",
      "claude-3-5-sonnet-20241022"
    ],
    envVarName: "CLAUDE_API_KEY",
    requiresApiKey: true,
  },
};

export function createLLMProvider(
  providerName: string, 
  config: LLMProviderConfig
): BaseLLMProvider {
  const ProviderClass = LLM_PROVIDERS[providerName];
  if (!ProviderClass) {
    throw new Error(`Unknown LLM provider: ${providerName}`);
  }
  return new ProviderClass(config);
}

export function getAvailableProviders(): ProviderConfiguration[] {
  return Object.values(PROVIDER_CONFIGS);
}

export function getProviderConfig(providerName: string): ProviderConfiguration | undefined {
  return PROVIDER_CONFIGS[providerName];
}

export * from "@/lib/llm-providers/base-provider";
export * from "@/lib/llm-providers/deepseek-provider";
export * from "@/lib/llm-providers/openai-provider";
export * from "@/lib/llm-providers/claude-provider";