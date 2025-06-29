"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Settings,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface MCPServerStatus {
  name: string;
  status: "connected" | "disconnected" | "connecting";
  capabilities?: {
    tools: number;
    resources: number;
    prompts: number;
  };
}

interface LLMProvider {
  name: string;
  displayName: string;
  configured: boolean;
  defaultModel: string;
  models: string[];
}

interface CurrentProvider {
  name: string;
  displayName: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mcpServers, setMcpServers] = useState<MCPServerStatus[]>([]);
  const [showMcpPanel, setShowMcpPanel] = useState(false);
  const [currentProvider, setCurrentProvider] =
    useState<CurrentProvider | null>(null);
  const [availableProviders, setAvailableProviders] = useState<LLMProvider[]>(
    []
  );
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // 创建助手消息占位符
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          history: messages,
          provider: selectedProvider || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();

              if (data === "[DONE]") {
                // 流式响应结束
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, isStreaming: false }
                      : msg
                  )
                );
                break;
              }

              if (data && data !== "") {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    assistantContent += parsed.content;

                    // 实时更新消息内容
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: assistantContent }
                          : msg
                      )
                    );
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "Sorry, an error occurred while processing your request.",
                isStreaming: false,
              }
            : msg
        )
      );
    }

    setIsLoading(false);
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 获取 MCP 服务器状态和 LLM 提供商信息
  const fetchMcpStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/mcp/status");
      console.log("response", response);
      if (response.ok) {
        const data = await response.json();
        setMcpServers(data.servers || []);
        setCurrentProvider(data.currentProvider);
        setAvailableProviders(data.availableProviders || []);

        // 如果还没有选择提供商，设置为当前提供商
        if (!selectedProvider && data.currentProvider) {
          setSelectedProvider(data.currentProvider.name);
        }
      }
    } catch (error) {
      console.error("Failed to get MCP status:", error);
    }
  }, [selectedProvider]);

  // 初始化 MCP 客户端
  const initializeMCP = useCallback(async () => {
    try {
      console.log("🚀 Initializing MCP client...");
      const response = await fetch("/api/init");
      if (response.ok) {
        const data = await response.json();
        console.log("✅ MCP 客户端初始化成功:", data);
        // 初始化成功后获取状态
        await fetchMcpStatus();
      } else {
        const errorData = await response.json();
        console.error("❌ MCP 客户端初始化失败:", errorData);
      }
    } catch (error) {
      console.error("❌ MCP 客户端初始化失败:", error);
    }
  }, [fetchMcpStatus]);

  useEffect(() => {
    // 页面加载时先初始化 MCP 客户端
    initializeMCP();

    // 定期刷新状态
    const interval = setInterval(fetchMcpStatus, 10000); // 每10秒刷新一次
    return () => clearInterval(interval);
  }, [initializeMCP, fetchMcpStatus]);

  // 连接 MCP 服务器
  const handleConnectMcp = async (config: {
    name: string;
    type: string;
    command?: string;
    url?: string;
    args?: string[];
  }) => {
    try {
      const response = await fetch("/api/mcp/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        fetchMcpStatus();
      } else {
        console.error("连接 MCP 服务器失败");
      }
    } catch (error) {
      console.error("连接 MCP 服务器失败:", error);
    }
  };

  // 切换 LLM 提供商
  const handleSwitchProvider = async (providerName: string) => {
    try {
      const response = await fetch("/api/llm/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider: providerName }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentProvider(data.currentProvider);
        setSelectedProvider(providerName);
        console.log(data.message);
      } else {
        const errorData = await response.json();
        console.error("切换 LLM 提供商失败:", errorData.error);
      }
    } catch (error) {
      console.error("切换 LLM 提供商失败:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 chat-container">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Multi-LLM MCP Client
              </h1>
              <p className="text-sm text-gray-500">
                {currentProvider
                  ? `当前: ${currentProvider.displayName}`
                  : "智能聊天助手"}{" "}
                • 支持 MCP 协议
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* MCP 状态指示器 */}
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">
                MCP: {mcpServers.filter((s) => s.status === "connected").length}{" "}
                个已连接
              </span>
            </div>

            <button
              onClick={() => setShowMcpPanel(!showMcpPanel)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 控制面板 */}
        {showMcpPanel && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            {/* LLM 提供商选择 */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">LLM 提供商</h3>
              <div className="grid gap-2">
                {availableProviders.map((provider) => (
                  <div
                    key={provider.name}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedProvider === provider.name
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white hover:bg-gray-50"
                    } ${!provider.configured ? "opacity-50" : ""}`}
                    onClick={() => {
                      if (
                        provider.configured &&
                        selectedProvider !== provider.name
                      ) {
                        handleSwitchProvider(provider.name);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          selectedProvider === provider.name
                            ? "bg-blue-500"
                            : provider.configured
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                      <span className="font-medium">
                        {provider.displayName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {provider.defaultModel}
                      </span>
                      {!provider.configured && (
                        <span className="text-xs text-red-500">未配置</span>
                      )}
                    </div>
                    {selectedProvider === provider.name && (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* MCP 服务器状态 */}
            <h3 className="font-semibold text-gray-900 mb-3">MCP 服务器状态</h3>
            <div className="grid gap-2">
              {mcpServers.map((server) => (
                <div
                  key={server.name}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        server.status === "connected"
                          ? "bg-green-500"
                          : server.status === "connecting"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="font-medium">{server.name}</span>
                    {server.capabilities && (
                      <span className="text-sm text-gray-500">
                        工具: {server.capabilities.tools} | 资源:{" "}
                        {server.capabilities.resources} | 提示:{" "}
                        {server.capabilities.prompts}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {server.status === "connected" && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {server.status === "connecting" && (
                      <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                    )}
                    {server.status === "disconnected" && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}

              {mcpServers.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  暂无 MCP 服务器连接
                </div>
              )}
            </div>
          </div>
        )}

        {/* 消息区域 */}
        <div className="flex-1 message-container p-6 space-y-4 min-h-96 max-h-96">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                欢迎使用 Multi-LLM MCP Client
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                这是一个集成了 Model Context Protocol 的智能聊天应用。 您可以与
                AI 对话，AI 能够通过 MCP 协议调用各种工具和资源。
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 message-enter ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user"
                    ? "bg-blue-500"
                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              <div
                className={`max-w-3xl rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-white border border-gray-200 text-gray-900"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                  {message.isStreaming && (
                    <span className="typing-animation ml-1"></span>
                  )}
                </div>

                <div
                  className={`text-xs mt-2 opacity-70 ${
                    message.role === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的消息... (Shift+Enter 换行)"
              className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-12 max-h-32"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl px-6 py-3 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">发送</span>
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500 text-center">
            Multi-LLM MCP Client • 支持多个 LLM 提供商、流式响应和 MCP 协议集成
          </div>
        </div>
      </div>
    </div>
  );
}
