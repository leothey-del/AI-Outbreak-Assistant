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

interface MapViewSnapshot {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

export const DiseaseMap = ({ pinsToShow, activeTab }: DiseaseMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const viewHistoryRef = useRef<MapViewSnapshot[]>([]);
  const backButtonRef = useRef<HTMLButtonElement | null>(null);

  // 1. INITIALIZE MAP ENGINE WITH STABLE DEFAULT VIEWPORT
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [12.0, 20.0], // Default coordinates (Centered globally to look clean)
        zoom: 1.8, // Default overview zoom depth
        pitch: 0,
      });

      // Add zoom and rotation navigation controls
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

      let backControlContainer: HTMLElement | null = null;
      let backControlHandler: (() => void) | null = null;
      mapRef.current.addControl({
        onAdd: (map) => {
          const container = document.createElement('div');
          container.className = 'mapboxgl-ctrl map-history-control';

          const button = document.createElement('button');
          button.className = 'map-history-back';
          button.type = 'button';
          button.title = 'Go back to previous map view';
          button.setAttribute('aria-label', 'Go back to previous map view');
          button.disabled = true;
          button.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;

          const goBack = () => {
            const previousView = viewHistoryRef.current.pop();
            if (!previousView) return;

            map.stop();
            button.disabled = viewHistoryRef.current.length === 0;
            map.flyTo({ ...previousView, duration: 1200, essential: true });
          };

          button.addEventListener('click', goBack);
          container.appendChild(button);
          backControlContainer = container;
          backControlHandler = goBack;
          backButtonRef.current = button;

          return container;
        },
        onRemove: () => {
          if (backButtonRef.current && backControlHandler) {
            backButtonRef.current.removeEventListener('click', backControlHandler);
          }
          backControlContainer?.remove();
          backControlContainer = null;
          backControlHandler = null;
          backButtonRef.current = null;
        },
      }, 'top-right');
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
    viewHistoryRef.current = [];
    if (backButtonRef.current) backButtonRef.current.disabled = true;

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

      // Build popup content with text nodes so location data is not parsed as HTML.
      const popupContent = document.createElement('div');
      popupContent.style.cssText = 'color: #1e293b; font-family: sans-serif; padding: 4px;';

      const locationName = document.createElement('h4');
      locationName.textContent = pin.locationName;
      locationName.style.cssText = 'margin: 0 0 4px; font-size: 14px; font-weight: 700;';
      popupContent.appendChild(locationName);

      const diseaseType = document.createElement('p');
      diseaseType.textContent = `⚠️ ${pin.diseaseType}`;
      diseaseType.style.cssText = 'margin: 0 0 2px; color: #ef4444; font-size: 11px; font-weight: 600;';
      popupContent.appendChild(diseaseType);

      if (pin.caseCount !== undefined) {
        const caseCount = document.createElement('p');
        caseCount.style.cssText = 'margin: 0 0 8px; color: #64748b; font-size: 11px;';
        caseCount.append('Cases: ');
        const count = document.createElement('strong');
        count.textContent = String(pin.caseCount);
        caseCount.appendChild(count);
        popupContent.appendChild(caseCount);
      }

      const flyToButton = document.createElement('button');
      flyToButton.className = 'map-location-zoom';
      flyToButton.type = 'button';
      flyToButton.title = `Zoom to location: ${pin.locationName}`;
      flyToButton.setAttribute('aria-label', `Zoom to location: ${pin.locationName}`);
      flyToButton.style.cssText = [
        'display: flex',
        'width: 30px',
        'height: 30px',
        'margin-top: 6px',
        'align-items: center',
        'justify-content: center',
        'border: 1px solid #e2e8f0',
        'border-radius: 50%',
        'background: transparent',
        'color: #475569',
        'cursor: pointer',
      ].join(';');
      flyToButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" stroke-width="1.8"/>
          <path d="M15 15 20 20M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `;
      flyToButton.addEventListener('click', () => {
        map.stop();
        const center = map.getCenter();
        viewHistoryRef.current.push({
          center: [center.lng, center.lat],
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch(),
        });
        if (viewHistoryRef.current.length > 20) viewHistoryRef.current.shift();
        if (backButtonRef.current) backButtonRef.current.disabled = false;

        map.flyTo({
          center: [pin.longitude, pin.latitude],
          zoom: 10,
          duration: 1800,
          essential: true,
        });
      });
      popupContent.appendChild(flyToButton);

      const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent);

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