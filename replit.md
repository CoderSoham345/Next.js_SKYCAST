# SkyCast AI

An ultra-premium, futuristic AI-powered Weather Intelligence Platform with live OpenWeatherMap data, animated dashboard, AQI monitoring, hourly/weekly forecasts, and AI insights.

## Run & Operate

- `pnpm --filter @workspace/skycast-ai run dev` — run the frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `VITE_WEATHER_API_KEY` — OpenWeatherMap API key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Recharts, Leaflet
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/skycast-ai/src/` — React frontend (all UI components)
- `artifacts/skycast-ai/src/components/weather/` — weather-specific components
- `artifacts/skycast-ai/src/components/layout/` — Sidebar, Navbar
- `artifacts/skycast-ai/src/hooks/useWeather.ts` — central weather state hook
- `artifacts/skycast-ai/src/lib/weatherApi.ts` — OpenWeatherMap API calls + fallback data
- `artifacts/skycast-ai/src/lib/weatherUtils.tsx` — icon mapping, temp conversion, AQI labels
- `artifacts/skycast-ai/src/types/weather.ts` — TypeScript interfaces for API responses
- `lib/api-spec/openapi.yaml` — API contract source of truth

## Architecture decisions

- Frontend-only app — all weather data fetched client-side via OpenWeatherMap API directly
- Robust fallback data everywhere — no section ever shows blank if API fails
- Dark-first design — deep navy + electric cyan + aurora violet palette
- `VITE_WEATHER_API_KEY` is the env var prefix (Vite requires `VITE_` for client exposure)
- Leaflet + react-leaflet for interactive weather map with tile overlays

## Product

SkyCast AI provides: current weather conditions, hourly forecast strip, 7-day forecast, air quality index with pollutant breakdown, interactive weather map with radar overlays, weather alerts panel, news feed, and AI-generated weather insights. All data comes from OpenWeatherMap API with realistic fallbacks.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always use `import.meta.env.VITE_WEATHER_API_KEY` (not `process.env`) in frontend code
- Leaflet marker icons need manual fix: `L.Icon.Default.mergeOptions({...})` to fix broken markers
- Loading screen uses AnimatePresence — the `exit` prop on child component controls fade-out
- Screenshot tools always reload the page, so loading screen always appears in captures

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
