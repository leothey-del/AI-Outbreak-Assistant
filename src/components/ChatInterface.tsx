import { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import MessageBubbleProps from './MessageBubbleProps';
import type { Message } from '../types'; // Adjusted import path to match your folder structure
import { askGemini } from '../services/gemini'; // Adjusted import path
import { getFilteredLocationsFromText } from '../utils/filterLocations';

export const ChatInterface = ({ onFilterLocations }: { onFilterLocations: (pins: any[]) => void }) => {

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

        // Add the 'await' keyword right here because looking up maps takes a split second!
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
    // 1. THE MAP RESET FIX: Clear out any previous active pins right when a new search begins!
    // This removes old country data (like India/Spain) before the new response loads.
    onFilterLocations([]);

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <header className="bg-white border-b p-3 shadow-sm flex items-center">
        <h1 className="text-md font-bold text-blue-600">AI Outbreak Assistant</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          // Clean the text by removing the [LOCATIONS: ...] block if it exists
          const cleanText = msg.text.replace(/\[LOCATIONS:\s*.*?\]/, '').trim();

          // Create a shallow copy of the message with the cleaned text
          const messageToRender = { ...msg, text: cleanText };

          return (
            <MessageBubbleProps key={msg.id} message={messageToRender} />
          );
        })}
        
        {isBotTyping && (
          <div className="text-sm text-slate-400 italic animate-pulse px-4">
            Gemini analyzing outbreak data...
          </div>
        )}
        <div ref={chatBottomRef} />
      </main>

      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};