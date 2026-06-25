import { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import  DiseaseMap  from './components/DiseaseMap';
import  { philippinesIncidents, type MapIncident } from './data/mapLocation';

const App = () => {
  // This state holds the array of pins currently visible on the map
  // By default, we show all locations
  const [visiblePins, setVisiblePins] = useState<MapIncident[]>(philippinesIncidents);

  return (
    // 1. Changed "flex-col" to "flex" to line them up horizontally side-by-side
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      
      {/* LEFT SIDE: 50% screen width for the Mapbox Map */}
      {/* 2. Changed "h-1/2 w-full" to "h-full w-1/2" and added a right border */}
      <div className="h-full w-1/2 relative border-r border-slate-200">
        <DiseaseMap pinsToShow={visiblePins} />
      </div>

      {/* RIGHT SIDE: 50% screen width for the Isolated Chatbot */}
      {/* 3. Changed "h-1/2 w-full" to "h-full w-1/2" */}
      <div className="h-full w-1/2 overflow-hidden">
        <ChatInterface onFilterLocations={setVisiblePins} />
      </div>

    </div>
  );
};

export default App;