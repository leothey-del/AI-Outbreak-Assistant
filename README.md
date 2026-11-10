# AI Outbreak Assistant

An interactive public-health assistant for exploring infectious-disease outbreak information. Ask questions about diseases such as dengue, rabies, COVID-19, malaria, and Zika, and view location-tagged responses alongside an interactive map.

**Live app:** [ai-outbreak-assistant.vercel.app](https://ai-outbreak-assistant.vercel.app)

> **Important:** This project is for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Outbreak information may be incomplete or out of date; consult local public-health authorities and qualified healthcare professionals for current guidance.

## Features

- AI-powered outbreak and public-health Q&A using Google Gemini.
- Interactive disease map powered by Mapbox.
- Location tags in assistant responses to connect mentioned places with the map.
- Responsive chat and map views for desktop and mobile.

## Tech stack

- React 19 and TypeScript
- Vite
- Google Gemini API (`@google/genai`)
- Mapbox GL and `react-map-gl`
- Tailwind CSS

## Getting started

### Prerequisites

- Node.js and npm
- A Google Gemini API key
- A Mapbox access token

### Install and run

```bash
git clone https://github.com/leothey-del/AI-Outbreak-Assistant.git
cd AI-Outbreak-Assistant
npm install
```

Create a `.env` file in the project root and add your API credentials:

```dotenv
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
VITE_GEMINI_API_KEY=your_gemini_key_here
```

Start the local development server:

```bash
npm run dev
```

Vite will print the local URL in your terminal.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Type-check and build the production app. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |

## Configuration and data notes

The app uses the Gemini API for assistant responses and Mapbox for the map. Keep API keys private and do not commit your `.env` file. The repository includes `.env.example` as a template.

The map currently includes sample incident entries in `src/data/mapLocation.ts`; do not treat these as verified or real-time surveillance data. Check authoritative public-health sources for current outbreak reports.

## License

No license is currently specified for this repository.
