import { type UIMessage } from "ai";

// Helper function to extract text content from UIMessage
export const getMessageContent = (message: UIMessage): string => {
  if (typeof message.content === 'string') {
    return message.content;
  }
  // In AI SDK v5, content can be an array of parts
  if (Array.isArray(message.content)) {
    return message.content
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join(' ');
  }
  return '';
};