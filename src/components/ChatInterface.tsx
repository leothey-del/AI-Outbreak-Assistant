import { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import MessageBubbleProps from './MessageBubbleProps';
import type { Message } from '../types'; 
import { askGemini } from '../services/gemini'; 
import { getFilteredLocationsFromText } from '../utils/filterLocations';

interface ChatInterfaceProps {
  onFilterLocations: (pins: any[]) => void;
 
}

export const ChatInterface = ({ onFilterLocations, }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];

    if (lastMessage.sender === 'user') {
      setIsBotTyping(true);
      const fetchBotResponse = async () => {
        const aiResponseText = await askGemini(messages); 

        const filteredPins = await getFilteredLocationsFromText(aiResponseText);
        onFilterLocations(filteredPins);

        const geminiReply: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: aiResponseText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, geminiReply]);
        setIsBotTyping(false);
      };
      fetchBotResponse();
    }
  }, [messages, onFilterLocations]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const handleSendMessage = (text: string) => {
    onFilterLocations([]); // Wipe old pins instantly on fresh query
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
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
          const cleanText = msg.text.replace(/\[LOCATIONS:\s*.*?\]/, '').trim();
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
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};