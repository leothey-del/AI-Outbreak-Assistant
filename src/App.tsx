import { useState } from 'react';
import { DiseaseMap } from './components/DiseaseMap';
import { ChatInterface } from './components/ChatInterface';
import { type MapIncident } from './data/mapLocation';



// 🛠️ Open src/App.tsx and look at the main wrapper div at the top:

function App() {
  const [pinsToShow, setPinsToShow] = useState<MapIncident[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'map'>('chat');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatSessionKey, setChatSessionKey] = useState(0);
  const hasMapResults = pinsToShow.length > 0;

  /* Change h-screen to h-[100dvh] and adjust the positioning rules */
  return (
    <div className="fixed top-0 left-0 w-full h-[100dvh] flex flex-col md:flex-row overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased select-none">
      
      {/* 📱 MOBILE NAVIGATION BAR */}
      <div className="z-50 flex h-14 w-full shrink-0 items-center gap-2 border-b border-slate-800/80 bg-slate-950 px-2 md:hidden">
        <button
          type="button"
          onClick={() => {
            setActiveTab('chat');
            setIsHistoryOpen((open) => !open);
          }}
          aria-label={isHistoryOpen ? 'Close chat history' : 'Open chat history'}
          aria-pressed={isHistoryOpen}
          title="Chat history"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
            isHistoryOpen ? 'bg-indigo-500/10 text-indigo-300' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M9 4v16" stroke="currentColor" strokeWidth="1.7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('chat');
            setIsHistoryOpen(false);
          }}
          className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-left text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'chat' && !isHistoryOpen
              ? 'text-indigo-300'
              : activeTab === 'map'
                ? 'text-indigo-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className={`inline-flex rounded-md px-2 py-1 ${
            activeTab === 'map' ? 'bg-indigo-500/10 hover:bg-indigo-500/20' : ''
          }`}>
            AI Assistant
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('map');
            setIsHistoryOpen(false);
          }}
          aria-label={hasMapResults ? 'Live Tracker has results' : 'Live Tracker'}
          title={hasMapResults ? 'Map results available' : 'Live Tracker'}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
            hasMapResults
              ? 'bg-indigo-500/20 text-indigo-300 shadow-[0_0_14px_rgba(99,102,241,0.65)] ring-1 ring-indigo-400/50'
              : activeTab === 'map'
                ? 'bg-indigo-500/10 text-indigo-300'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('chat');
            setIsHistoryOpen(false);
            setPinsToShow([]);
            setChatSessionKey((key) => key + 1);
          }}
          aria-label="Start a new chat"
          title="New chat"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
        </button>
      </div>

      {/* 💬 CHAT HUD PANEL */}
      <div className={`w-full flex-1 md:h-full min-h-0 shrink-0 overflow-hidden transition-[width] duration-300 ease-out motion-reduce:transition-none ${
        isHistoryOpen ? 'md:w-[calc(50%+18rem)] md:flex-none' : 'md:w-1/2 md:flex-1'
      } ${
        activeTab === 'chat' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
      }`}>
        <ChatInterface
          key={chatSessionKey}
          onFilterLocations={setPinsToShow}
          isHistoryOpen={isHistoryOpen}
          onHistoryOpenChange={setIsHistoryOpen}
        />
      </div>

      {/* 🗺️ MAP ENGINE AREA */}
      <div className={`relative min-w-0 min-h-0 h-full flex-1 bg-slate-900 ${
        activeTab === 'map' ? 'block w-full h-full' : 'hidden md:block'
      }`}>
        <DiseaseMap pinsToShow={pinsToShow} activeTab={activeTab} />
      </div>

    </div>
  );
}

export default App;
