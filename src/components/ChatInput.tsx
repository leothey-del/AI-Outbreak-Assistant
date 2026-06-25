import React, { useState } from 'react'

interface ChatInputProps{
    onSendMessage: (text: string) => void;

}

const ChatInput = ({onSendMessage}: ChatInputProps) => {
    const [input, setInput] = useState('');
    const handleSubmit = (e: React.FormEvent) =>{
        e.preventDefault();
        if(!input.trim()) return;
        onSendMessage(input);
        setInput('');

    }
  return (
    <div>
      <form onSubmit={handleSubmit} className='border-t bodder-slate-200 bg-white p-4' >
        <div className='flex gap-4 max-w-4xl mx-auto'>
<input 
type='text'
value={input}
onChange={(e) => setInput(e.target.value)}
placeholder='type your message..'
className='flex-1 px-4 py-2 border broder-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500'
/>
       
<p><button type='submit' className='bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-medium transition-colors'>
    Send
    </button></p>
     </div>
      </form>
    </div>
  )
}

export default ChatInput
