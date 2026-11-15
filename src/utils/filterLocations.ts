import { type MapIncident } from '../data/mapLocation';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

/**
 * Dynamically extracts a country filter code from a location text segment.
 */
const getDynamicCountryCode = (placeString: string): string => {
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

  const placeParts = placeString.split(',').map((part) => part.trim().toLowerCase());
  const countrySegment = placeParts.length > 1 ? placeParts[placeParts.length - 1] : placeParts[0];
  return commonCodes[countrySegment] ?? '';
};

const parseLocationEntries = (locationTag: string): Array<{ place: string; disease: string }> => {
  const entries = locationTag.includes(';')
    ? locationTag.split(';')
    : [...locationTag.matchAll(/([^,;|]+(?:,\s*[^,;|]+)?)\|([^,;|]+)/g)]
        .map((match) => `${match[1]}|${match[2]}`);

  return entries.flatMap((entry) => {
    const separatorIndex = entry.indexOf('|');
    if (separatorIndex < 0) return [];

    const place = entry.slice(0, separatorIndex).trim();
    const disease = entry.slice(separatorIndex + 1).trim();
    return place && disease ? [{ place, disease }] : [];
  });
};

export const getFilteredLocationsFromText = async (aiText: string): Promise<MapIncident[]> => {
  const locationMatch = aiText.match(/\[LOCATIONS:\s*(.*?)\]/i);
  if (!locationMatch) {
    console.warn('Gemini omitted the [LOCATIONS:] tag. Skipping map markers rather than guessing locations.');
    return [];
  }

  const locations = parseLocationEntries(locationMatch[1]);
  if (locations.length === 0) {
    console.warn('Gemini returned an invalid [LOCATIONS:] tag. Skipping map markers.');
    return [];
  }

  const discoveredIncidents: MapIncident[] = [];

  for (let i = 0; i < locations.length; i++) {
    const { place, disease } = locations[i];
    try {
      const targetCountryCode = getDynamicCountryCode(place);
      const secureQuery = encodeURIComponent(place);
      
      let url = `https://api.mapbox.com/search/geocode/v6/forward?q=${secureQuery}&access_token=${MAPBOX_TOKEN}&limit=1`;
      if (targetCountryCode) {
        url += `&country=${targetCountryCode}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Mapbox geocoding failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].geometry.coordinates;

        discoveredIncidents.push({
          id: `dynamic-${i}-${Date.now()}`,
          locationName: place,
          longitude: longitude,
          latitude: latitude,
          diseaseType: disease
        });
      }
    } catch (error) {
      console.error(`Could not look up coordinates for ${place}:`, error);
    }
  }

  return discoveredIncidents;
};