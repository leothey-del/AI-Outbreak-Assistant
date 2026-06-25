import { useState } from 'react';
import { DiseaseMap } from './components/DiseaseMap';
import { ChatInterface } from './components/ChatInterface';
import { type MapIncident } from './data/mapLocation';

function App() {
  const [pinsToShow, setPinsToShow] = useState<MapIncident[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'map'>('chat');

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col md:flex-row overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased select-none">
      
      {/* 📱 MOBILE NAVIGATION BAR */}
      <div className="flex md:hidden bg-slate-950 border-b border-slate-800/80 h-14 w-full shrink-0 items-center justify-center z-50 px-2">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 h-10 rounded-lg font-bold text-xs tracking-wider uppercase transition-all duration-150 ${
            activeTab === 'chat' 
              ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          💬 AI Assistant
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`flex-1 h-10 rounded-lg font-bold text-xs tracking-wider uppercase transition-all duration-150 ml-2 ${
            activeTab === 'map' 
              ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 shadow-md' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🗺️ Live Tracker
        </button>
      </div>

      {/* 💬 CHAT HUD PANEL */}
      <div className={`w-full md:w-[420px] lg:w-[460px] flex-1 md:h-full min-h-0 shrink-0 ${
        activeTab === 'chat' ? 'flex flex-col' : 'hidden md:flex md:flex-col'
      }`}>
        <ChatInterface 
          onFilterLocations={setPinsToShow} 
       
        />
      </div>

      {/* 🗺️ MAP ENGINE AREA (Now passing activeTab down) */}
      <div className={`flex-1 min-h-0 h-full relative bg-slate-900 ${
        activeTab === 'map' ? 'block w-full h-full' : 'hidden md:block'
      }`}>
        <DiseaseMap pinsToShow={pinsToShow} activeTab={activeTab} />
        
        {/* Floating Metrics Overlay (Hidden on Mobile) */}
        <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center space-x-2 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-2xl">
          <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-slate-300 font-medium">Map Matrix Bounds: Active</span>
        </div>
      </div>

    </div>
  );
}

export default App;