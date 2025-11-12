import { h } from 'preact';

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

export function ChatInput({
  inputValue,
  setInputValue,
  onSendMessage,
  isLoading
}: ChatInputProps) {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
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
        onClick={onSendMessage}
        disabled={!inputValue.trim() || isLoading}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}