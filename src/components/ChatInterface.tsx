import { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import ChatHistory from './ChatHistory';
import MessageBubbleProps from './MessageBubbleProps';
import type { Message } from '../types'; 
import { askGemini, GeminiRequestError } from '../services/gemini';
import { getFilteredLocationsFromText } from '../utils/filterLocations';
import type { MapIncident } from '../data/mapLocation';
import {
  createConversationId,
  getConversationTitle,
  loadChatHistory,
  saveChatHistory,
  type ChatConversation,
} from '../utils/chatHistory';

const starterSuggestions = [
  'Which cities in the Philippines have reported rabies cases?',
  'Which regions in Japan have reported COVID-19 cases?',
  'Which provinces in the Philippines have reported dengue cases?',
];

const EMPTY_MESSAGES: Message[] = [];

interface ChatInterfaceProps {
  onFilterLocations: (pins: MapIncident[]) => void;
  isHistoryOpen: boolean;
  onHistoryOpenChange: (isOpen: boolean) => void;
}

export const ChatInterface = ({
  onFilterLocations,
  isHistoryOpen,
  onHistoryOpenChange,
}: ChatInterfaceProps) => {
  const [initialHistory] = useState(() => {
    try {
      return { conversations: loadChatHistory(), error: null };
    } catch (error: unknown) {
      console.error('Failed to load saved chat history:', error);
      return {
        conversations: [] as ChatConversation[],
        error: 'Could not load saved chats from this browser.',
      };
    }
  });
  const [conversations, setConversations] = useState(initialHistory.conversations);
  const conversationsRef = useRef(initialHistory.conversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(initialHistory.error);
  const [isSuggestionExpanded, setIsSuggestionExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLElement>(null);
  const nextMessageId = useRef(0);
  const previousConversationIdRef = useRef(activeConversationId);
  const activeConversation = conversations.find(({ id }) => id === activeConversationId);
  const messages = activeConversation?.messages ?? EMPTY_MESSAGES;
  const lastBotMessage = [...messages].reverse().find(({ sender }) => sender === 'bot');
  const suggestedQuestion = lastBotMessage?.text.match(/\[SUGGESTION:\s*(.*?)\]/i)?.[1]?.trim() || null;

  const updateConversationMessages = (conversationId: string, nextMessages: Message[]) => {
    const updatedConversation: ChatConversation = {
      id: conversationId,
      title: getConversationTitle(nextMessages),
      updatedAt: new Date().toISOString(),
      messages: nextMessages,
    };
    const existingIndex = conversationsRef.current.findIndex(({ id }) => id === conversationId);
    const nextConversations = existingIndex === -1
      ? [...conversationsRef.current, updatedConversation]
      : conversationsRef.current.map((conversation) =>
        conversation.id === conversationId ? updatedConversation : conversation,
      );

    conversationsRef.current = nextConversations;
    setConversations(nextConversations);
    try {
      saveChatHistory(nextConversations);
      setStorageError(null);
    } catch (error: unknown) {
      console.error('Failed to save chat history:', error);
      setStorageError('Could not save chat history in this browser. Check your browser storage settings.');
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInputText(question);
    inputRef.current?.focus();
  };

  const createMessageId = (existingMessages: Message[]): string => {
    let id = `message-${nextMessageId.current++}`;
    while (existingMessages.some((message) => message.id === id)) {
      id = `message-${nextMessageId.current++}`;
    }
    return id;
  };

  useEffect(() => {
    const scrollContainer = chatScrollRef.current;
    if (!scrollContainer) return;

    const conversationChanged = previousConversationIdRef.current !== activeConversationId;
    const isNearBottom = scrollContainer.scrollHeight
      - scrollContainer.scrollTop
      - scrollContainer.clientHeight < 100;

    previousConversationIdRef.current = activeConversationId;

    if (conversationChanged) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    } else if (isNearBottom) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [activeConversationId, messages, isWaitingForReply]);

  const handleSendMessage = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || isBotTyping) return;

    const conversationId = activeConversationId ?? createConversationId();
    const currentMessages = activeConversation?.messages ?? [];
    if (!activeConversationId) setActiveConversationId(conversationId);

    onFilterLocations([]);
    setIsSuggestionExpanded(false);
    const userMessage: Message = {
      id: createMessageId(currentMessages),
      sender: 'user',
      text: trimmedText,
      timestamp: new Date(),
    };
    const conversationHistory = [...currentMessages, userMessage];
    updateConversationMessages(conversationId, conversationHistory);
    setIsBotTyping(true);
    setIsWaitingForReply(true);

    try {
      const aiResponseText = await askGemini(conversationHistory);
      setIsWaitingForReply(false);

      const geminiReply: Message = {
        id: createMessageId(conversationHistory),
        sender: 'bot',
        text: aiResponseText,
        timestamp: new Date(),
      };
      const latestMessages = conversationsRef.current
        .find(({ id }) => id === conversationId)?.messages ?? conversationHistory;
      updateConversationMessages(conversationId, [...latestMessages, geminiReply]);

      const filteredPins = await getFilteredLocationsFromText(aiResponseText);
      onFilterLocations(filteredPins);
    } catch (error: unknown) {
      setIsWaitingForReply(false);
      console.error('Failed to process the chat response:', error);
      const errorMessage = error instanceof GeminiRequestError
        ? error.message
        : 'Something went wrong while processing your request. Please try again.';
      const latestMessages = conversationsRef.current
        .find(({ id }) => id === conversationId)?.messages ?? conversationHistory;
      const errorReply: Message = {
        id: createMessageId(latestMessages),
        sender: 'bot',
        text: errorMessage,
        timestamp: new Date(),
      };
      updateConversationMessages(conversationId, [...latestMessages, errorReply]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setInputText('');
    setIsSuggestionExpanded(false);
    onHistoryOpenChange(false);
    onFilterLocations([]);
  };

  const selectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setInputText('');
    setIsSuggestionExpanded(false);
    onHistoryOpenChange(false);
    onFilterLocations([]);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-slate-900 shadow-2xl md:flex-row">
      <aside
        className={`hidden h-full shrink-0 flex-col overflow-hidden bg-slate-900 transition-[width] duration-300 ease-out motion-reduce:transition-none md:flex ${
          isHistoryOpen ? 'w-72' : 'w-0'
        }`}
      >
        <div className="flex h-[69px] w-72 shrink-0 items-center gap-2.5 border-b border-slate-800/80 px-4">
          {isHistoryOpen && (
            <button
              type="button"
              onClick={() => onHistoryOpenChange(false)}
              disabled={isBotTyping}
              aria-label="Collapse chat history"
              aria-pressed={isHistoryOpen}
              title="Collapse sidebar"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M9 4v16" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          )}
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={`truncate text-base font-semibold text-slate-100 ${isHistoryOpen ? '' : 'hidden'}`}>
              Outbreak Assistant
            </span>
          </div>
        </div>
        {isHistoryOpen && (
          <>
            <button
              type="button"
              onClick={startNewChat}
              disabled={isBotTyping}
              className="mx-3 my-3 flex w-auto shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-200 transition-colors hover:bg-[#303030] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
              </svg>
              New chat
            </button>
            <ChatHistory
              conversations={conversations}
              activeConversationId={activeConversationId}
              storageError={storageError}
              isBusy={isBotTyping}
              onSelect={selectConversation}
              onNewChat={startNewChat}
              onClose={() => onHistoryOpenChange(false)}
            />
          </>
        )}
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="chat-desktop-header z-10 hidden items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-5 py-4 backdrop-blur-md md:flex">
        <div className="flex min-w-0 items-center gap-3">
          {!isHistoryOpen && (
            <button
              type="button"
              onClick={() => onHistoryOpenChange(true)}
              disabled={isBotTyping}
              aria-label="Open chat history"
              aria-pressed={false}
              title="Open sidebar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
                <path d="M9 4v16" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </button>
          )}
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wide text-slate-100">
              Epidemiological AI Engine
            </h1>
            <p className="text-xs font-medium text-slate-400">Global Surveillance Node</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={startNewChat}
            disabled={isBotTyping}
            aria-label="Start a new chat"
            title="New chat"
            className="hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 md:flex"
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
          </button>
          <span className="ml-1 hidden items-center rounded border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[10px] font-semibold text-indigo-300 md:inline-flex">
            v2.5-Flash
          </span>
        </div>
      </header>

      <>
      <div className="relative min-h-0 flex-1 overflow-hidden">
      <div className={`h-full min-h-0 flex flex-col ${isHistoryOpen ? 'hidden md:flex' : ''}`}>
      {storageError && (
        <p role="alert" className="border-b border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">
          {storageError}
        </p>
      )}
      <main ref={chatScrollRef} className="relative min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain touch-pan-y bg-gradient-to-b from-slate-950 to-slate-900 p-5 custom-scrollbar">
        {messages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <h3 className="mb-5 text-base font-semibold text-slate-200">How can I help you?</h3>
            <div className="flex max-w-lg flex-wrap justify-center gap-2">
              {starterSuggestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => handleSuggestionClick(question)}
                  className="max-w-full rounded-full border border-slate-700/80 bg-transparent px-3 py-1.5 text-center text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const cleanText = msg.text
            .replace(/\[LOCATIONS:\s*.*?\]/i, '')
            .replace(/\[SUGGESTION:\s*.*?\]/i, '')
            .trim();
          const messageToRender = { ...msg, text: cleanText };

          return (
            <MessageBubbleProps key={msg.id} message={messageToRender} />
          );
        })}
        
        {/* Assistant response skeleton */}
        {isWaitingForReply && (
          <div role="status" className="flex w-full items-start gap-3 py-2">
            <span className="sr-only">Assistant is composing a response.</span>
            <div aria-hidden="true" className="min-w-0 flex-1 pt-0.5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wide text-slate-300">AI Assistant</span>
                  <span className="h-1 w-1 rounded-full bg-indigo-400 motion-safe:animate-pulse" />
                  <span className="text-[11px] text-slate-500">Composing response</span>
                </div>
                <div className="space-y-2.5">
                  <div className="skeleton-shimmer h-3 w-[92%] rounded-full" />
                  <div className="skeleton-shimmer h-3 w-full rounded-full" />
                  <div className="skeleton-shimmer h-3 w-3/5 rounded-full" />
                </div>
            </div>
          </div>
        )}
      </main>

      {/* Clean Dashboard Input Container */}
      <div className="shrink-0 bg-slate-900 p-4">
        {messages.length > 0 && suggestedQuestion && !isBotTyping && (
          <div className="mb-2 flex items-center justify-start gap-1">
            <svg
              aria-hidden="true"
              className="h-3 w-3 shrink-0 text-indigo-300"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6 3v5a4 4 0 0 0 4 4h9m-4-4 4 4-4 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
            <div className="flex min-w-0 flex-col items-start">
              <button
                type="button"
                aria-expanded={isSuggestionExpanded}
                aria-controls="follow-up-suggestion"
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => setIsSuggestionExpanded((expanded) => !expanded)}
                className="text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                Suggestion
              </button>
              <button
                type="button"
                id="follow-up-suggestion"
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  handleSuggestionClick(suggestedQuestion);
                  setIsSuggestionExpanded(false);
                }}
                hidden={!isSuggestionExpanded}
                className="max-w-full rounded-full border border-slate-700/80 bg-transparent px-3 py-1.5 text-left text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {suggestedQuestion}
              </button>
            </div>
          </div>
        )}
        <ChatInput
          value={inputText}
          onChange={setInputText}
          onSendMessage={handleSendMessage}
          inputRef={inputRef}
          disabled={isBotTyping}
        />
      </div>
      </div>
      </div>
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          isHistoryOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!isHistoryOpen}
        inert={!isHistoryOpen}
      >
        <button
          type="button"
          aria-label="Close chat history"
          tabIndex={isHistoryOpen ? 0 : -1}
          onClick={() => onHistoryOpenChange(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
            isHistoryOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          role="dialog"
          aria-modal={isHistoryOpen}
          aria-label="Chat history"
          className={`absolute inset-y-0 left-0 flex w-[min(84vw,340px)] flex-col border-r border-slate-800 bg-slate-900 shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
            isHistoryOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <ChatHistory
            conversations={conversations}
            activeConversationId={activeConversationId}
            storageError={storageError}
            isBusy={isBotTyping}
            onSelect={selectConversation}
            onNewChat={startNewChat}
            onClose={() => onHistoryOpenChange(false)}
          />
        </div>
      </div>
      </>
      </div>
    </div>
  );
};