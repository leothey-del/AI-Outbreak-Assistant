import { useState } from 'react';
// 1. Fixed verbatimModuleSyntax by using 'import type'
// 2. Switched from FormEvent to the accurate, modern FormEvent type interface
import type { FormEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [text, setText] = useState('');

  // Explicitly typing the submission element ensures compatibility across modern React engines
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 w-full">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask regarding global disease alerts..."
        className="flex-1 bg-slate-900 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-3 border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-sm px-5 py-3 rounded-xl shadow-lg transition-all duration-150 flex items-center justify-center space-x-1"
      >
        <span>Send</span>
      </button>
    </form>
  );
}