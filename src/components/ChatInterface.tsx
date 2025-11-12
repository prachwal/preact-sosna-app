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
}

function ChatInterface({ providerName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set(availableTools.map(t => t.function.name)));
  const [showToolManager, setShowToolManager] = useState(false);

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
      const response = await qdrantApi.generateResponse(inputValue.trim(), {
        model: selectedModel,
        temperature: 0.7,
        maxTokens: 1000,
        ...(enabledToolList.length > 0 && { tools: enabledToolList }),
        systemPrompt: `You are a helpful AI assistant with access to various tools. When asked about available tools, list them clearly. Use tools when appropriate to help users with calculations and other tasks.`
      });

      let aiContent = response.content;

      // Handle tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          try {
            const result = executeTool(toolCall);
            aiContent += `\n\nWykonałem narzędzie ${toolCall.function.name}: ${result}`;
          } catch (toolError) {
            aiContent += `\n\nBłąd wykonania narzędzia ${toolCall.function.name}: ${toolError instanceof Error ? toolError.message : 'Nieznany błąd'}`;
          }
        }
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        sender: 'ai',
        timestamp: new Date(),
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