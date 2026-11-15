// 1. Fixed verbatimModuleSyntax by using 'import type'
// 2. Switched from FormEvent to the accurate, modern FormEvent type interface
import type { FormEvent } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSendMessage, disabled = false }: ChatInputProps) {
  // Explicitly typing the submission element ensures compatibility across modern React engines
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSendMessage(value);
    onChange('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 w-full">
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask regarding global disease alerts..."
        className="flex-1 bg-slate-900 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-3 border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-sm px-5 py-3 rounded-xl shadow-lg transition-all duration-150 flex items-center justify-center space-x-1"
      >
        <span>Send</span>
      </button>
    </form>
  );
}