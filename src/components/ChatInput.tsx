// 1. Fixed verbatimModuleSyntax by using 'import type'
// 2. Switched from FormEvent to the accurate, modern FormEvent type interface
import type { FormEvent, RefObject } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSendMessage: (text: string) => void;
  onFocusChange: (focused: boolean) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSendMessage, onFocusChange, inputRef, disabled = false }: ChatInputProps) {
  // Explicitly typing the submission element ensures compatibility across modern React engines
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSendMessage(value);
    onChange('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="text"
        ref={inputRef}
        value={value}
        disabled={disabled}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask regarding global disease alerts..."
        className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm rounded-xl py-3 pl-4 pr-14 border border-slate-700/80 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        title="Send message"
        className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg bg-indigo-600 text-white transition-colors duration-150 hover:bg-indigo-500 disabled:bg-transparent disabled:text-slate-500 flex items-center justify-center"
      >
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 19V5m0 0-6 6m6-6 6 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>
    </form>
  );
}