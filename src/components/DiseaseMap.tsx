import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { type MapIncident } from '../data/mapLocation';
import 'mapbox-gl/dist/mapbox-gl.css';

// Inject token globally
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface DiseaseMapProps {
  pinsToShow: MapIncident[];
  activeTab?: 'chat' | 'map';
}

export const DiseaseMap = ({ pinsToShow, activeTab }: DiseaseMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // 1. INITIALIZE MAP ENGINE WITH STABLE DEFAULT VIEWPORT
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12', // High-end dark baseline map
        center: [12.0, 20.0], // Default coordinates (Centered globally to look clean)
        zoom: 1.8, // Default overview zoom depth
        pitch: 0,
      });

      // Add zoom and rotation navigation controls
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    } catch (error) {
      console.error("Failed to initialize Mapbox Core Instance:", error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. THE HALF-MAP GLITCH FIX: Handle mobile tab resizing triggers safely
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.resize();
      }, 150); // Small layout buffer timeout
    }
  }, [activeTab]);

  // 3. GENERATE DYNAMIC MARKERS & AUTO-FIT BOUNDARIES
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // A. Wipe all old map pins clean from the viewport canvas layout
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!pinsToShow || pinsToShow.length === 0) {
      // If no locations are queried, gently pan back to our stable global look
      map.flyTo({ center: [12.0, 20.0], zoom: 1.8, duration: 1200 });
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    // B. Build fresh tactical markers loop
    pinsToShow.forEach((pin) => {
      if (isNaN(pin.longitude) || isNaN(pin.latitude)) return;

      // Create a custom styled red pin node element natively
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.backgroundColor = '#ef4444'; // Crisp red theme accent matching dark UI
      el.style.borderRadius = '50%';
      el.style.border = '2px solid #ffffff';
      el.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.6)';
      el.style.cursor = 'pointer';

      // Attach description popup text nodes 
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="color: #1e293b; font-family: sans-serif; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700;">${pin.locationName}</h4>
          <p style="margin: 0 0 2px 0; font-size: 11px; color: #ef4444; font-weight: 600;">⚠️ ${pin.diseaseType}</p>
          <p style="margin: 0; font-size: 11px; color: #64748b;">Est. Cases: <strong>${pin.caseCount}</strong></p>
        </div>
      `);

      // Spawn marker instance on the map matrix tracking layer
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([pin.longitude, pin.latitude]);
    });

    // C. Frame active pinpoint bounding clusters automatically
    if (pinsToShow.length > 0) {
      map.fitBounds(bounds, {
        padding: pinsToShow.length === 1 ? 120 : 60, // Cushion zoom depth wrapper limits
        maxZoom: pinsToShow.length === 1 ? 6 : 8, // Avoid zooming way too deep into a single street layout
        duration: 1500
      });
    }
  }, [pinsToShow]);

  return (
    <div className="w-full h-full relative flex-1">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};