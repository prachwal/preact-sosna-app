import ChatInterface from './ChatInterface';

interface ChatTabProps {
  providerName?: string;
}

export default function ChatTab({ providerName = "OpenRouter" }: ChatTabProps) {
  return <ChatInterface providerName={providerName} />;
}