import { useState, useEffect } from 'preact/hooks';
import { qdrantApi } from '../services/qdrantApi';
import { configProvider } from '../services/ConfigurationProvider';
import { availableTools, executeTool } from '../services/tools';
import type { Tool, ToolCall } from '../services/interfaces';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ToolManager } from './ToolManager';
import type { ChatMessage } from '../types/types';

interface ChatInterfaceProps {
  providerName: string;
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

  return (
    <div className="chat-tab">
      <div className="chat-interface">
        <ChatMessages
          messages={messages}
          expandedToolInfos={expandedToolInfos}
          toggleToolInfo={toggleToolInfo}
          isLoading={isLoading}
          isUsingTools={isUsingTools}
          providerName={providerName}
        />
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
          </div>
        )}
        <ToolManager
          enabledTools={enabledTools}
          toggleTool={toggleTool}
          showToolManager={showToolManager}
          setShowToolManager={setShowToolManager}
        />
        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default ChatInterface;