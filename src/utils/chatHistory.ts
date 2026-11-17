import type { Message } from '../types';

const STORAGE_KEY = 'ai-outbreak-assistant.chat-history';

export interface ChatConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
}

export const loadChatHistory = (): ChatConversation[] => {
  const storedHistory = localStorage.getItem(STORAGE_KEY);
  if (!storedHistory) return [];

  const parsed: unknown = JSON.parse(storedHistory);
  if (!Array.isArray(parsed)) {
    throw new Error('Saved chat history has an invalid format.');
  }

  return parsed.map((conversation: unknown): ChatConversation => {
    if (
      typeof conversation !== 'object'
      || conversation === null
      || !('id' in conversation)
      || typeof conversation.id !== 'string'
      || !('title' in conversation)
      || typeof conversation.title !== 'string'
      || !('updatedAt' in conversation)
      || typeof conversation.updatedAt !== 'string'
      || !Number.isFinite(Date.parse(conversation.updatedAt))
      || !('messages' in conversation)
      || !Array.isArray(conversation.messages)
    ) {
      throw new Error('A saved conversation has an invalid format.');
    }

    const messages = conversation.messages.map((message: unknown): Message => {
      if (
        typeof message !== 'object'
        || message === null
        || !('id' in message)
        || typeof message.id !== 'string'
        || !('sender' in message)
        || (message.sender !== 'user' && message.sender !== 'bot')
        || !('text' in message)
        || typeof message.text !== 'string'
        || !('timestamp' in message)
        || typeof message.timestamp !== 'string'
        || !Number.isFinite(Date.parse(message.timestamp))
      ) {
        throw new Error('A saved message has an invalid format.');
      }

      return {
        id: message.id,
        sender: message.sender,
        text: message.text,
        timestamp: new Date(message.timestamp),
      };
    });

    return {
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      messages,
    };
  });
};

export const saveChatHistory = (conversations: ChatConversation[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
};

export const createConversationId = (): string =>
  `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const getConversationTitle = (messages: Message[]): string => {
  const firstUserMessage = messages.find((message) => message.sender === 'user');
  if (!firstUserMessage) return 'New chat';
  return firstUserMessage.text.length > 48
    ? `${firstUserMessage.text.slice(0, 48).trimEnd()}...`
    : firstUserMessage.text;
};
