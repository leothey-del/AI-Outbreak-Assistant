import type { ChatConversation } from '../utils/chatHistory';

interface ChatHistoryProps {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  storageError: string | null;
  isBusy: boolean;
  onSelect: (conversationId: string) => void;
  onNewChat: () => void;
  onClose: () => void;
}

const formatUpdatedAt = (value: string): string => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const ChatHistory = ({
  conversations,
  activeConversationId,
  storageError,
  isBusy,
  onSelect,
  onNewChat,
  onClose,
}: ChatHistoryProps) => (
  <section className="flex min-h-0 flex-1 flex-col" aria-label="Saved chat history">
    <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat history"
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 md:hidden"
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="M15 4h5v16h-5M9 8l-4 4 4 4m-4-4h11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
          </svg>
        </button>
        <div>
        <h2 className="text-sm font-semibold text-slate-100">Recent chats</h2>
        <p className="mt-0.5 text-xs text-slate-500">Saved in this browser</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onNewChat}
        disabled={isBusy}
        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 md:hidden"
      >
        New chat
      </button>
    </div>

    {storageError && (
      <p role="alert" className="mx-4 mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
        {storageError}
      </p>
    )}

    {conversations.length === 0 ? (
      <div className="flex flex-1 items-start justify-center px-6 pt-5 text-center">
        <p className="text-sm text-slate-500">Your saved conversations will appear here.</p>
      </div>
    ) : (
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3 custom-scrollbar">
        {[...conversations]
          .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
          .map((conversation) => {
            const lastMessage = conversation.messages[conversation.messages.length - 1];
            const isActive = conversation.id === activeConversationId;

            return (
              <li key={conversation.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  disabled={isBusy}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full rounded-xl px-3 py-3 pr-11 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    isActive ? 'bg-slate-800' : 'hover:bg-slate-800/70'
                  }`}
                >
                  <span className="block truncate text-sm font-medium text-slate-200">
                    {conversation.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {lastMessage?.text
                      .replace(/\[LOCATIONS:\s*.*?\]/i, '')
                      .replace(/\[SUGGESTION:\s*.*?\]/i, '')
                      .trim() || 'No messages'}
                  </span>
                  <time className="mt-2 block text-[10px] text-slate-600" dateTime={conversation.updatedAt}>
                    {formatUpdatedAt(conversation.updatedAt)}
                  </time>
                </button>
              </li>
            );
          })}
      </ul>
    )}
  </section>
);

export default ChatHistory;
