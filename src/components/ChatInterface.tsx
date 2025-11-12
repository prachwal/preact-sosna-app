import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { qdrantApi } from '../services/qdrantApi';
import { configProvider } from '../services/ConfigurationProvider';
import { availableTools, executeTool, getToolDescriptions } from '../services/tools';
import type { Tool, ToolCall } from '../services/interfaces';

interface ChatInterfaceProps {
  providerName: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  toolInfo?: {
    toolCalls: ToolCall[];
    results: any[];
    errors: string[];
  };
}

function ChatInterface({ providerName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set(availableTools.map(t => t.function.name)));
  const [showToolManager, setShowToolManager] = useState(false);
  const [expandedToolInfos, setExpandedToolInfos] = useState<Set<string>>(new Set());
  const [isUsingTools, setIsUsingTools] = useState(false);

  // Load enabled tools from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('chat-enabled-tools');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEnabledTools(new Set(parsed));
      } catch (e) {
        // Use default if parsing fails
        setEnabledTools(new Set(availableTools.map(t => t.function.name)));
      }
    }
  }, []);

  // Save enabled tools to localStorage
  useEffect(() => {
    localStorage.setItem('chat-enabled-tools', JSON.stringify(Array.from(enabledTools)));
  }, [enabledTools]);

  const toggleToolInfo = (messageId: string) => {
    setExpandedToolInfos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const toggleTool = (toolName: string) => {
    setEnabledTools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolName)) {
        newSet.delete(toolName);
      } else {
        newSet.add(toolName);
      }
      return newSet;
    });
  };

  const getEnabledTools = (): Tool[] => {
    return availableTools.filter(tool => enabledTools.has(tool.function.name));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    setIsUsingTools(false);

    try {
      const selectedModel = configProvider.getSelectedModel();

      // Check if user is asking about available tools
      const lowerInput = inputValue.trim().toLowerCase();
      if (lowerInput.includes('jakie masz narzędzia') ||
          lowerInput.includes('what tools do you have') ||
          lowerInput.includes('available tools')) {
        const enabledToolList = getEnabledTools();
        const toolDescriptions = enabledToolList.map(tool =>
          `- ${tool.function.name}: ${tool.function.description}`
        ).join('\n');
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `Mam dostępne następujące narzędzia:\n\n${toolDescriptions}`,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
        return;
      }

      const enabledToolList = getEnabledTools();

      // Tool call loop
      let conversationMessages: any[] = [
        { role: 'system', content: `You are a helpful AI assistant with access to various tools. When asked about available tools, list them clearly. Use tools when appropriate to help users with calculations and other tasks. You can use multiple tools in sequence if needed.` },
        { role: 'user', content: inputValue.trim() }
      ];

      let finalResponse = '';
      let allToolCalls: ToolCall[] = [];
      let allToolResults: any[] = [];
      let allToolErrors: string[] = [];

      while (true) {
        const response = await qdrantApi.generateResponse('', {
          model: selectedModel,
          temperature: 0.7,
          maxTokens: 1000,
          ...(enabledToolList.length > 0 && { tools: enabledToolList }),
          messages: conversationMessages
        });

        finalResponse = response.content;

        // If no tool calls, we're done
        if (!response.toolCalls || response.toolCalls.length === 0) {
          break;
        }

        // Execute tool calls and add to conversation
        setIsUsingTools(true);

        for (const toolCall of response.toolCalls) {
          try {
            const result = await executeTool(toolCall);
            allToolResults.push(result);
            allToolCalls.push(toolCall);

            // Add tool call and result to conversation
            conversationMessages.push({
              role: 'assistant',
              content: response.content,
              tool_calls: response.toolCalls
            });
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result)
            });
          } catch (toolError) {
            const errorMsg = `Error executing ${toolCall.function.name}: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`;
            allToolErrors.push(errorMsg);
            allToolCalls.push(toolCall);

            // Add tool call and error to conversation
            conversationMessages.push({
              role: 'assistant',
              content: response.content,
              tool_calls: response.toolCalls
            });
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: errorMsg })
            });
          }
        }
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: finalResponse,
        sender: 'ai',
        timestamp: new Date(),
        ...(allToolCalls.length > 0 && {
          toolInfo: {
            toolCalls: allToolCalls,
            results: allToolResults,
            errors: allToolErrors
          }
        })
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);

      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${errorMessage}`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-tab">
      <div className="chat-interface">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h4>Chat with {providerName} AI</h4>
              <p>Ask questions or get help with your selected model: {configProvider.getSelectedModel()}</p>
            </div>
          )}
          {messages.map(message => (
            <div key={message.id} className={`chat-message ${message.sender}`}>
              <div className="message-content">
                {message.content}
                {message.toolInfo && (
                  <div className="tool-info-container">
                    <button
                      className="tool-info-toggle"
                      onClick={() => toggleToolInfo(message.id)}
                    >
                      {expandedToolInfos.has(message.id) ? '▼' : '▶'} Wykorzystane narzędzia ({message.toolInfo.toolCalls.length})
                    </button>
                    {expandedToolInfos.has(message.id) && (
                      <div className="tool-info-content">
                        {message.toolInfo.toolCalls.map((toolCall, index) => (
                          <div key={index} className="tool-call-info">
                            <div className="tool-call-header">
                              <span className="tool-name">🔧 {toolCall.function.name}</span>
                              <span className="tool-params">📝 Parametry: {toolCall.function.arguments}</span>
                            </div>
                            <div className="tool-result">
                              {message.toolInfo!.results[index] && (
                                <div className="tool-success">
                                  {toolCall.function.name === 'search_vector_database' && (
                                    <div>
                                      📊 Znaleziono {message.toolInfo!.results[index].length} wyników:
                                      {message.toolInfo!.results[index].map((item: any, resultIndex: number) => (
                                        <div key={resultIndex} className="search-result">
                                          <div className="result-header">
                                            {resultIndex + 1}. <strong>ID: {item.id}</strong> (score: {item.score.toFixed(3)})
                                          </div>
                                          <div className="result-text">
                                            📄 Tekst: {item.text.substring(0, 200)}{item.text.length > 200 ? '...' : ''}
                                          </div>
                                          <div className="result-metadata">
                                            📋 Metadane: {item.metadata.fileName || 'brak'}, chunk {item.metadata.chunkIndex}/{item.metadata.totalChunks}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {toolCall.function.name === 'get_full_document' && (
                                    <div>
                                      📄 Pobrano dokument: {message.toolInfo!.results[index].fileName}
                                      <div className="document-text">
                                        📝 Pełny tekst ({message.toolInfo!.results[index].chunkCount} chunków): {message.toolInfo!.results[index].fullText.substring(0, 500)}{message.toolInfo!.results[index].fullText.length > 500 ? '...' : ''}
                                      </div>
                                      <div className="document-chunks">
                                        🔍 Szczegóły chunków:
                                        {message.toolInfo!.results[index].chunks.slice(0, 3).map((chunk: any, chunkIndex: number) => (
                                          <div key={chunkIndex} className="chunk-info">
                                            <div className="chunk-text">
                                              📄 Chunk {chunk.chunkIndex}: {chunk.text.substring(0, 100)}{chunk.text.length > 100 ? '...' : ''}
                                            </div>
                                          </div>
                                        ))}
                                        {message.toolInfo!.results[index].chunks.length > 3 && (
                                          <div>... i {message.toolInfo!.results[index].chunks.length - 3} więcej chunków</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {toolCall.function.name === 'calculate_factorial' && (
                                    <div>
                                      🧮 Wynik: {message.toolInfo!.results[index]}
                                    </div>
                                  )}
                                </div>
                              )}
                              {message.toolInfo!.errors[index] && (
                                <div className="tool-error">
                                  ❌ {message.toolInfo!.errors[index]}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message ai loading">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                {isUsingTools && (
                  <div className="tool-usage-indicator">
                    🔧 AI używa narzędzi...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
          </div>
        )}

        <div className="tool-manager">
          <button
            className="tool-manager-toggle"
            onClick={() => setShowToolManager(!showToolManager)}
          >
            {showToolManager ? '▼' : '▶'} Tools ({enabledTools.size}/{availableTools.length})
          </button>

          {showToolManager && (
            <div className="tool-manager-content">
              <h5>Available Tools</h5>
              {availableTools.map(tool => (
                <div key={tool.function.name} className="tool-item">
                  <label className="tool-label">
                    <input
                      type="checkbox"
                      checked={enabledTools.has(tool.function.name)}
                      onChange={() => toggleTool(tool.function.name)}
                    />
                    <div className="tool-info">
                      <strong>{tool.function.name}</strong>
                      <p>{tool.function.description}</p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chat-input-area">
          <textarea
            placeholder="Type your message here..."
            className="chat-input"
            rows={3}
            value={inputValue}
            onChange={(e) => setInputValue((e.target as HTMLTextAreaElement).value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;