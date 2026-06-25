import { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup, type MapRef } from 'react-map-gl/mapbox';
import { type MapIncident } from '../data/mapLocation'; 
import 'mapbox-gl/dist/mapbox-gl.css'; 

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export const DiseaseMap = ({ pinsToShow }: { pinsToShow: MapIncident[] }) => {
  const [hoveredPin, setHoveredPin] = useState<MapIncident | null>(null);
  const mapRef = useRef<MapRef>(null);

  // A state tracker to remember if the camera has zoomed down from space yet
  const [hasZoomedIn, setHasZoomedIn] = useState(false);

  // THE GLOBAL VIEW: Keeps the map way back out in space when the app launches
  const [initialViewport] = useState({
    latitude: 0.0,
    longitude: 0.0,
    zoom: 1.5 // Zoom 1.5 shows the planet sphere cleanly
  });

  // THE GLOBAL TRIGGER WATCHER: Dynamically flies to the pins wherever they are in the world
  useEffect(() => {
    if (!mapRef.current || pinsToShow.length === 0) return;

    // SCENARIO A: Only ONE single pin is present (e.g. User asked for just "Toronto")
    if (pinsToShow.length === 1) {
      const singleTarget = pinsToShow[0];
      
      mapRef.current.flyTo({
        center: [singleTarget.longitude, singleTarget.latitude],
        zoom: 9,          // Zoom way in close to see the city layout
        duration: hasZoomedIn ? 2000 : 3500, // Longer animation if flying straight from space
        essential: true
      });

      setHasZoomedIn(true);
    } 
    // SCENARIO B: MULTIPLE pins are present (e.g. "India", "USA", or "Mindanao places")
    else {
      // 1. Calculate the geographic boundaries containing ALL active pins
      let minLng = pinsToShow[0].longitude;
      let maxLng = pinsToShow[0].longitude;
      let minLat = pinsToShow[0].latitude;
      let maxLat = pinsToShow[0].latitude;

      pinsToShow.forEach(pin => {
        if (pin.longitude < minLng) minLng = pin.longitude;
        if (pin.longitude > maxLng) maxLng = pin.longitude;
        if (pin.longitude < minLat) minLat = pin.latitude;
        if (pin.longitude > maxLat) maxLat = pin.latitude;
      });

      // 2. Instruct the camera engine to dynamically focus its view matrix over this boundary box
      mapRef.current.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]], // The bounding box southwest and northeast coordinates
        {
          padding: 80,       // Adds spacing pixel padding around pins so they aren't cut off by the container edges
          duration: hasZoomedIn ? 2000 : 3500, // Cinematic drop from space on first chat response
          essential: true,
          maxZoom: 6         // Prevents zooming in too close if the pins are clustered tightly together
        }
      );

      setHasZoomedIn(true);
    }
  }, [pinsToShow]);

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        initialViewState={initialViewport}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        projection={{ name: 'globe' }} // Keeps the 3D globe profile framework active
      >
        {/* Only map out and show your markers if we have dropped down onto the earth layout */}
        {hasZoomedIn && pinsToShow.map((incident) => (
          <Marker key={incident.id} longitude={incident.longitude} latitude={incident.latitude} anchor="bottom">
            <div 
              className="text-2xl cursor-pointer transform hover:scale-125 transition duration-200"
              onMouseEnter={() => setHoveredPin(incident)}
              onMouseLeave={() => setHoveredPin(null)}
            >
              📍
            </div>
          </Marker>
        ))}

        {hoveredPin && (
          <Popup longitude={hoveredPin.longitude} latitude={hoveredPin.latitude} anchor="top" closeButton={false} offset={10}>
            <div className="p-1 font-sans text-xs text-slate-800">
              <h4 className="font-bold text-slate-900 border-b pb-0.5 mb-1">{hoveredPin.locationName}</h4>
              <p className="font-medium text-blue-600">Disease: <span className="font-bold">{hoveredPin.diseaseType}</span></p>
              <p className="font-medium text-rose-600 mt-0.5">Cases: <span className="font-bold">{hoveredPin.caseCount}</span></p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default DiseaseMap;