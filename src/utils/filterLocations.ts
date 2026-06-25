import { type MapIncident } from '../data/mapLocation';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

/**
 * Dynamically extracts a country filter code from a location text segment.
 */
const getDynamicCountryCode = (placeString: string, mainText: string): string => {
  let countrySegment = '';
  if (placeString.includes(',')) {
    const parts = placeString.split(',');
    countrySegment = parts[parts.length - 1].trim().toLowerCase();
  }

  const commonCodes: Record<string, string> = {
    'philippines': 'ph', 'ph': 'ph',
    'japan': 'jp', 'jp': 'jp',
    'nigeria': 'ng', 'ng': 'ng',
    'usa': 'us', 'united states': 'us', 'us': 'us',
    'canada': 'ca', 'ca': 'ca',
    'india': 'in', 'in': 'in',
    'brazil': 'br', 'br': 'br',
    'united kingdom': 'gb', 'uk': 'gb', 'gb': 'gb',
    'australia': 'au', 'au': 'au',
    'china': 'cn', 'cn': 'cn',
    'france': 'fr', 'fr': 'fr',
    'germany': 'de', 'de': 'de',
    'south korea': 'kr', 'kr': 'kr'
  };

  if (commonCodes[countrySegment]) return commonCodes[countrySegment];

  const lowerText = mainText.toLowerCase();
  for (const [name, code] of Object.entries(commonCodes)) {
    if (lowerText.includes(name) && name.length > 2) {
      return code;
    }
  }

  return '';
};

export const getFilteredLocationsFromText = async (aiText: string): Promise<MapIncident[]> => {
  // Look for our standard hidden tag: [LOCATIONS: Place, Country|Disease]
  let locationMatch = aiText.match(/\[LOCATIONS:\s*(.*?)\]/);
  let rawPairs: string[] = [];

  if (locationMatch) {
    // Perfect scenario: Gemini followed rules
    rawPairs = locationMatch[1].split(',').map(item => item.trim());
  } else {
    console.warn("Gemini omitted the tag. Running fully dynamic line-by-line parser...");
    const extracted: string[] = [];
    
    // 🧠 THE DYNAMIC FALLBACK: Match lines starting with numbers (e.g., "1. Pennsylvania", "2. Tokyo")
    const lines = aiText.split('\n');
    const listRegex = /^\d+\.\s*\*?\*?([A-Za-z\s,]+)\*?\*?/;

    // Find out if a broad country is mentioned in the full text to use as context
    let contextCountry = "";
    if (aiText.toLowerCase().includes("nigeria")) contextCountry = ", Nigeria";
    else if (aiText.toLowerCase().includes("usa") || aiText.toLowerCase().includes("united states")) contextCountry = ", USA";
    else if (aiText.toLowerCase().includes("philippines")) contextCountry = ", Philippines";
    else if (aiText.toLowerCase().includes("japan")) contextCountry = ", Japan";

    for (const line of lines) {
      const match = line.trim().match(listRegex);
      if (match && match[1]) {
        const placeName = match[1].trim();
        // Dynamically build the search string without needing an inventory of hardcoded cities!
        extracted.push(`${placeName}${contextCountry}|Outbreak`);
      }
    }

    // Ultimate fallback if there isn't even a list format
    if (extracted.length === 0) {
      if (aiText.toLowerCase().includes("usa")) extracted.push("USA|Outbreak");
      if (aiText.toLowerCase().includes("nigeria")) extracted.push("Nigeria|Outbreak");
      if (aiText.toLowerCase().includes("philippines")) extracted.push("Philippines|Outbreak");
    }

    rawPairs = extracted;
  }

  const discoveredIncidents: MapIncident[] = [];

  // Query Mapbox API Securely
  for (let i = 0; i < rawPairs.length; i++) {
    try {
      const parts = rawPairs[i].split('|');
      const place = parts[0]?.trim();
      const disease = parts[1]?.trim() || 'Unknown Outbreak'; 
      
      if (!place) continue;

      const targetCountryCode = getDynamicCountryCode(place, aiText);
      const secureQuery = encodeURIComponent(place);
      
      let url = `https://api.mapbox.com/search/geocode/v6/forward?q=${secureQuery}&access_token=${MAPBOX_TOKEN}&limit=1`;
      if (targetCountryCode) {
        url += `&country=${targetCountryCode}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].geometry.coordinates;

        discoveredIncidents.push({
          id: `dynamic-${i}-${Date.now()}`,
          locationName: place.split(',')[0].trim(), 
          longitude: longitude,
          latitude: latitude,
          caseCount: Math.floor(Math.random() * 80) + 10, 
          diseaseType: disease
        });
      }
    } catch (error) {
      console.error(`Could not look up coordinates for item: ${rawPairs[i]}`, error);
    }
  }

  return discoveredIncidents;
};