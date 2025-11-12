import { h } from 'preact';
import { marked } from 'marked';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import type { ToolCall } from '../services/interfaces';
import type { ChatMessage } from '../types/types';

interface ChatMessagesProps {
  messages: ChatMessage[];
  expandedToolInfos: Set<string>;
  toggleToolInfo: (messageId: string) => void;
  isLoading: boolean;
  isUsingTools: boolean;
  providerName: string;
}

export function ChatMessages({
  messages,
  expandedToolInfos,
  toggleToolInfo,
  isLoading,
  isUsingTools,
  providerName
}: ChatMessagesProps) {
  // Function to render message content with Markdown support
  const renderMessageContent = (content: string) => {
    // Configure marked for safe HTML output with syntax highlighting
    const renderer = new marked.Renderer();

    // Override code block rendering
    renderer.code = function({ text, lang, escaped }) {
      let highlighted = text;
      if (lang && hljs.getLanguage(lang)) {
        try {
          highlighted = hljs.highlight(text, { language: lang }).value;
        } catch (err) {
          console.warn('Syntax highlighting failed:', err);
        }
      } else {
        // Fallback to auto-detection
        try {
          highlighted = hljs.highlightAuto(text).value;
        } catch (err) {
          console.warn('Auto syntax highlighting failed:', err);
        }
      }
      return `<pre><code class="hljs language-${lang || ''}">${highlighted}</code></pre>`;
    };

    // Override inline code rendering
    renderer.codespan = function({ text }) {
      return `<code class="inline-code">${text}</code>`;
    };

    marked.setOptions({
      breaks: true,
      gfm: true,
      async: false,
      renderer: renderer
    });

    const htmlContent = marked.parse(content) as string;
    // Sanitize HTML to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(htmlContent, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote'],
      ALLOWED_ATTR: ['href', 'class', 'target', 'rel']
    });
    return { __html: sanitizedContent };
  };
  return (
    <div className="chat-messages">
      {messages.length === 0 && (
        <div className="welcome-message">
          <h4>Chat with {providerName} AI</h4>
          <p>Ask questions or get help with your selected model.</p>
        </div>
      )}
      {messages.map(message => (
        <div key={message.id} className={`chat-message ${message.sender}`}>
          <div className="message-content">
            <div dangerouslySetInnerHTML={renderMessageContent(message.content)} />
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
  );
}