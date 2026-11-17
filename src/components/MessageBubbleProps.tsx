
import { useState } from 'react';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubbleProps = ({ message }: MessageBubbleProps) => {
  const isUser = message.sender === 'user';
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(message.text);
          setCopyStatus('copied');
          return;
        } catch (error: unknown) {
          console.warn('Clipboard API unavailable; trying the compatibility copy method.', error);
        }
      }

      const textArea = document.createElement('textarea');
      textArea.value = message.text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);

      let copied = false;
      try {
        textArea.select();
        copied = document.execCommand('copy');
      } finally {
        textArea.remove();
      }

      if (!copied) throw new Error('The browser did not copy the message.');
      setCopyStatus('copied');
    } catch (error: unknown) {
      console.error('Failed to copy the message:', error);
      setCopyStatus('error');
    }
  };

  return (
    <>
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} py-2`}>
        <div
          className={isUser
            ? 'max-w-[85%] select-text rounded-2xl rounded-br-md bg-slate-800 px-4 py-3 text-slate-100'
            : 'w-full px-1 py-1 text-slate-200'}
          onContextMenu={isUser ? (event) => {
            event.preventDefault();
            setCopyStatus('idle');
            setIsCopyDialogOpen(true);
          } : undefined}
        >
          {isUser && (
            <div className="mb-1 text-xs font-medium text-slate-400">You</div>
          )}
          <p className="select-text whitespace-pre-wrap text-[15px] font-normal leading-7">{message.text}</p>
        </div>
      </div>
      {isCopyDialogOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5"
          onClick={() => setIsCopyDialogOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="copy-message-title"
            className="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="copy-message-title" className="mb-4 text-base font-semibold">Copy message</h2>
            <button
              type="button"
              onClick={handleCopy}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              {copyStatus === 'copied' ? 'Copied' : 'Copy text'}
            </button>
            {copyStatus === 'error' && (
              <p role="alert" className="mt-3 text-sm text-rose-300">
                Could not copy the message. Please select and copy the text manually.
              </p>
            )}
            <button
              type="button"
              onClick={() => setIsCopyDialogOpen(false)}
              className="mt-3 w-full rounded-xl px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageBubbleProps;
