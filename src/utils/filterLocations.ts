import { type MapIncident } from '../data/mapLocation';

// Pull your Mapbox token securely from your environment variables
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

/**
 * Takes the AI text, extracts location/disease pairs, and queries Mapbox 
 * in the background to get real-time coordinate locations globally.
 */
export const getFilteredLocationsFromText = async (aiText: string): Promise<MapIncident[]> => {
  // 1. Look for our hidden bracketed tag at the end of the AI string
  const locationMatch = aiText.match(/\[LOCATIONS:\s*(.*?)\]/);
  
  if (!locationMatch) {
    return []; // Return an empty map view if no locations were targeted
  }

  // 2. Turns "Toronto|Flu, Manila|Dengue" into an array: ["Toronto|Flu", "Manila|Dengue"]
  const rawPairs = locationMatch[1].split(',').map(item => item.trim());
  const discoveredIncidents: MapIncident[] = [];

  // 3. Loop through each item and break down the tokens
  for (let i = 0; i < rawPairs.length; i++) {
    try {
      // Print out the raw pair to your browser inspect console to debug live!
      console.log("Raw location pair from Gemini:", rawPairs[i]);

      // Split the token into its constituent city/country and illness strings
      const parts = rawPairs[i].split('|');
      const place = parts[0]?.trim();
      const disease = parts[1]?.trim(); 
      
      // Safety guard: if there is no place name parsed, skip this iteration
      if (!place) continue;

      // 4. GLOBAL UPGRADE: Pass just the raw 'place' string to Mapbox. 
      // Removed the hardcoded ", Philippines" restriction so it can find Toronto, London, Brazil, etc.
      const secureQuery = encodeURIComponent(place);
      
      const response = await fetch(
        `https://api.mapbox.com/search/geocode/v6/forward?q=${secureQuery}&access_token=${MAPBOX_TOKEN}&limit=1`
      );
      
      const data = await response.json();

      // 5. Extract geometry data safely if the location match is successful
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].geometry.coordinates;

        discoveredIncidents.push({
          id: `dynamic-${i}-${Date.now()}`,
          locationName: place,
          longitude: longitude,
          latitude: latitude,
          caseCount: Math.floor(Math.random() * 80) + 10, // Generate dummy sample metric
          diseaseType: disease || 'Unknown Outbreak' // Use parsed value or fallback cleanly
        });
      }
    } catch (error) {
      console.error(`Could not look up coordinates for item: ${rawPairs[i]}`, error);
    }
  }

  return discoveredIncidents;
};