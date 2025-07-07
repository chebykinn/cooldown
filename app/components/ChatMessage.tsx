import { ChatMessage as ChatMessageType } from '../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`mb-4 ${message.isUser ? 'text-right' : 'text-left'}`}>
      <div
        className={`inline-block max-w-[80%] p-3 rounded-lg ${
          message.isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
        }`}
      >
        <p className="break-words">{message.text}</p>
        <p className="text-xs opacity-70 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
} 