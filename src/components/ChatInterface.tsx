import { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import MessageBubbleProps from './MessageBubbleProps';
import type { Message } from '../types'; 
import { askGemini, GeminiRequestError } from '../services/gemini';
import { getFilteredLocationsFromText } from '../utils/filterLocations';
import type { MapIncident } from '../data/mapLocation';

const starterSuggestions = [
  'Which cities in the Philippines have reported rabies cases?',
  'Which regions in Japan have reported COVID-19 cases?',
  'Which provinces in the Philippines have reported dengue cases?',
];

interface ChatInterfaceProps {
  onFilterLocations: (pins: MapIncident[]) => void;
 
}

export const ChatInterface = ({ onFilterLocations, }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const [suggestedQuestion, setSuggestedQuestion] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const nextMessageId = useRef(0);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const handleSendMessage = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || isBotTyping) return;

    onFilterLocations([]);
    setSuggestedQuestion(null);
    const userMessage: Message = {
      id: `message-${nextMessageId.current++}`,
      sender: 'user',
      text: trimmedText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsBotTyping(true);

    try {
      const history = [...messages, userMessage];
      const aiResponseText = await askGemini(history);
      const suggestionMatch = aiResponseText.match(/\[SUGGESTION:\s*(.*?)\]/i);
      const nextSuggestion = suggestionMatch?.[1]?.trim() || null;
      setSuggestedQuestion(nextSuggestion);

      const geminiReply: Message = {
        id: `message-${nextMessageId.current++}`,
        sender: 'bot',
        text: aiResponseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, geminiReply]);

      const filteredPins = await getFilteredLocationsFromText(aiResponseText);
      onFilterLocations(filteredPins);
    } catch (error: unknown) {
      console.error('Failed to process the chat response:', error);
      const errorMessage = error instanceof GeminiRequestError
        ? error.message
        : 'Something went wrong while processing your request. Please try again.';
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: errorMessage,
        timestamp: new Date(),
      }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Premium Dashboard Header */}
      <header className="bg-slate-950/60 backdrop-blur-md border-b border-slate-800/80 px-5 py-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h1 className="text-sm font-bold tracking-wide text-slate-100 uppercase">
              Epidemiological AI Engine
            </h1>
            <p className="text-xs text-slate-400 font-medium">Global Surveillance Node</p>
          </div>
        </div>
        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-semibold px-2 py-0.5 rounded border border-indigo-500/20">
          v2.5-Flash
        </span>
      </header>

      {/* Main Conversational Viewport */}
      <main className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gradient-to-b from-slate-950 to-slate-900">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 my-auto">
            <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-2xl text-indigo-400">🤖</div>
            <h3 className="text-sm font-semibold text-slate-200">System Ready</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Inquire regarding global public health alerts, outbreak metrics, or localized transmission patterns.
            </p>
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
        
        {/* Enterprise Loading Skeleton */}
        {isBotTyping && (
          <div className="flex items-start space-x-3 max-w-[85%] animate-pulse">
            <div className="h-7 w-7 rounded-lg bg-slate-800 flex-shrink-0" />
            <div className="space-y-2 w-full">
              <div className="h-3 bg-slate-800 rounded w-1/3" />
              <div className="h-16 bg-slate-800/60 rounded-xl w-full border border-slate-800" />
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </main>

      {/* Clean Dashboard Input Container */}
      <div className="p-4 bg-slate-950/40 backdrop-blur-md border-t border-slate-800/80">
        {messages.length === 0 && (
          <div className="mb-3">
            <p className="mb-2 text-xs font-medium text-slate-400">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {starterSuggestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleSendMessage(question)}
                  className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-left text-xs text-indigo-200 transition-colors hover:border-indigo-400/60 hover:bg-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.length > 0 && suggestedQuestion && !isBotTyping && (
          <div className="mb-3">
            <p className="mb-2 text-xs font-medium text-slate-400">Ask the AI next</p>
            <button
              type="button"
              onClick={() => handleSendMessage(suggestedQuestion)}
              className="max-w-full rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-left text-xs text-indigo-200 transition-colors hover:border-indigo-400/60 hover:bg-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {suggestedQuestion}
            </button>
          </div>
        )}
        <ChatInput onSendMessage={handleSendMessage} disabled={isBotTyping} />
      </div>
    </div>
  );
};