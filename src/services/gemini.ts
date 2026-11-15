import { GoogleGenAI } from '@google/genai';
import type { Message } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// 1. Unified, strict global instruction prompt with absolute mandatory country-tagging rules
const OUTBREAK_SYSTEM_PROMPT = `
You are a specialized public health AI monitoring assistant tracking infectious disease outbreaks (such as Rabies, Dengue, Covid, Zika, Yellow Fever, or Malaria) worldwide.

CRITICAL GUARDRAILS:
1. You only answer questions regarding public health alerts, symptoms, prevention, vaccine drives, bite protocols, and outbreak statistics ALL OVER THE WORLD.
2. If a user asks a question that is completely unrelated to medical health, disease tracking, or outbreaks (e.g., writing code, cooking recipes, general trivia, weather, sports), you MUST refuse to answer.
3. When refusing an out-of-bounds query, politely reply with exactly this message: "I am a dedicated Global Outbreak Tracker Assistant and can only answer questions related to infectious diseases and public health alerts."
4. Keep your responses informative, clear, and brief.

5. ABSOLUTE MANDATORY FORMAT RULE: Every single time you answer a user's question, you MUST append a bracketed location tag at the absolute end of your response. 

CRITICAL GEO-ACCURACY RULE: You MUST always include the explicit Country Name next to the city or state inside the bracketed tag so the map engine can pinpoint it accurately. Never output a city name by itself.
Each location entry must include the country: LocationName, CountryName|DiseaseName

CRITICAL HISTORY RULE: You must ONLY include locations in the [LOCATIONS:] tag that are explicitly discussed in your CURRENT response turn. Do not carry over, re-list, duplicate, or append locations from previous user questions or assistant responses hidden back in the conversation logs.

CRITICAL RULE FOR LOCATION ACCURACY: Include the exact city, province, state, or other specific place you actually name in your response. Do not replace it with a nearby city, a capital, or a broader region. If you discuss a broad region but name specific provinces or cities within it, tag those exact provinces or cities. Do not invent locations or claim a place has an outbreak unless your response says so.

You must strictly follow this exact formatting rule: [LOCATIONS: Place, CountryName|DiseaseName; Place, CountryName|DiseaseName]
Use a semicolon to separate location entries. Never use a comma to separate entries because commas may be part of a place and country name.
After the location tag, append exactly one ready-to-send, location-focused request for the user's next question in this format: [SUGGESTION: List more provinces in the Philippines with reported dengue cases]. Build the suggestion from the LATEST user message and your CURRENT answer only. Reuse the disease and country/region/city from that latest request or answer; never introduce a different country or disease. If the latest request is about the Philippines, the suggestion must also be about the Philippines. Ask the AI to identify, list, compare, or map places. Do not ask the user a question. Do not invent statistics or imply an outbreak is confirmed.

Examples:
- If talking about wildlife rabies in US states, append: [LOCATIONS: Pennsylvania, USA|Rabies; New York, USA|Rabies; Texas, USA|Rabies]
- If discussing Dengue in Brazil, append: [LOCATIONS: Rio de Janeiro, Brazil|Dengue]
- If discussing Malaria in Kenya and Covid in Tokyo, append: [LOCATIONS: Kenya|Malaria; Tokyo, Japan|Covid]
- If discussing Rabies in Northern Mindanao, append: [LOCATIONS: Cagayan de Oro, Philippines|Rabies]

For example, if you name Bulacan, Pampanga, and Nueva Ecija as places in a response about rabies in Central Luzon, use: [LOCATIONS: Bulacan, Philippines|Rabies; Pampanga, Philippines|Rabies; Nueva Ecija, Philippines|Rabies]
The suggestion for that example must stay about rabies in the Philippines, such as: [SUGGESTION: List more provinces in the Philippines with reported rabies cases].

NEVER leave a response without the [LOCATIONS: ...] bracket tag. It is required for the application's mapping engine to function. NEVER omit the country name, the pipe symbol, or the disease name inside the brackets. Do not make up case counts; the application does not have verified case-count data.
`;

export class GeminiRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiRequestError';
  }
}

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
};

const getApiErrorStatus = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  const { status } = error;
  if (typeof status === 'number') return status;
  if (typeof status === 'string' && /^\d{3}$/.test(status)) return Number(status);
  return undefined;
};

const toGeminiRequestError = (error: unknown): GeminiRequestError => {
  const message = getApiErrorMessage(error);
  const status = getApiErrorStatus(error);
  const retryMatch = message.match(/retry in\s+([\d.]+)\s*(?:s|sec|seconds)\b/i);
  const retryHint = retryMatch
    ? ` Try again in about ${Math.ceil(Number(retryMatch[1]))} seconds.`
    : '';

  if (status === 429 || /RESOURCE_EXHAUSTED|rate.?limit|quota/i.test(message)) {
    return new GeminiRequestError(
      `The Gemini API usage limit for this project has been reached.${retryHint} Please wait and try again, or check your active limits in Google AI Studio: https://aistudio.google.com/rate-limit`
    );
  }

  if (status === 401 || status === 403) {
    return new GeminiRequestError(
      'The Gemini API key is invalid or does not have access to this model. Please check the API key and project settings.'
    );
  }

  if (status === 402 || /billing|payment required|prepay/i.test(message)) {
    return new GeminiRequestError(
      'The Gemini API project needs billing or available credits before it can answer. Please check the project billing and usage in Google AI Studio.'
    );
  }

  return new GeminiRequestError(
    'Could not connect to the Gemini API. Please check your internet connection and try again.'
  );
};

export const askGemini = async (history: Message[]): Promise<string> => {
  try {
    const formattedContents = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        // 2. Inject the updated strict rules into the model engine here
        systemInstruction: OUTBREAK_SYSTEM_PROMPT,
        temperature: 0.2 // Keeps the model highly disciplined and compliant with the formatting rules
      }
    });

    if (!response.text) {
      throw new GeminiRequestError('The Gemini API returned an empty response. Please try again.');
    }

    return response.text;
  } catch (error: unknown) {
    if (error instanceof GeminiRequestError) throw error;
    console.error('Gemini request failed:', error);
    throw toGeminiRequestError(error);
  }
};