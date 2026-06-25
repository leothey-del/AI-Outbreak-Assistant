

import type {Message} from '../types';

interface MessageBubbleProps{
    message:Message
}

const MessageBubbleProps = ({message}: MessageBubbleProps) => {
    const isUser= message.sender ==='user';
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} my-2`}>
<div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
          isUser
            ? 'bg-slate-900 text-white rounded-br-none'
            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
        }`}
      >
        <div className="font-semibold mb-1 text-xs opacity-75">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
      </div>
    </div>
  )
}

export default MessageBubbleProps
