import { CurrentWeather, Forecast, AirPollution, City } from "../types/weather";

export type DataSource = "owm" | "open-meteo" | "unavailable";

export interface FetchResult<T> {
  data: T | null;
  source: DataSource;
  error?: string;
  fetchedAt: Date;
}

const API_KEY  = import.meta.env.VITE_WEATHER_API_KEY as string;
const OWM_BASE = "https://api.openweathermap.org";
const OM_BASE  = "https://api.open-meteo.com/v1";

// ── WMO weather-code → OWM-style description/icon ────────────────────────────
const WMO: Record<number, { description: string; icon: string; main: string; id: number }> = {
  0:  { description: "clear sky",             icon: "01d", main: "Clear",        id: 800 },
  1:  { description: "mainly clear",          icon: "02d", main: "Clear",        id: 801 },
  2:  { description: "partly cloudy",         icon: "03d", main: "Clouds",       id: 802 },
  3:  { description: "overcast clouds",       icon: "04d", main: "Clouds",       id: 804 },
  45: { description: "fog",                   icon: "50d", main: "Fog",          id: 741 },
  48: { description: "icy fog",               icon: "50d", main: "Fog",          id: 741 },
  51: { description: "light drizzle",         icon: "09d", main: "Drizzle",      id: 300 },
  53: { description: "moderate drizzle",      icon: "09d", main: "Drizzle",      id: 301 },
  55: { description: "heavy drizzle",         icon: "09d", main: "Drizzle",      id: 302 },
  61: { description: "light rain",            icon: "10d", main: "Rain",         id: 500 },
  63: { description: "moderate rain",         icon: "10d", main: "Rain",         id: 501 },
  65: { description: "heavy rain",            icon: "10d", main: "Rain",         id: 502 },
  71: { description: "light snow",            icon: "13d", main: "Snow",         id: 600 },
  73: { description: "moderate snow",         icon: "13d", main: "Snow",         id: 601 },
  75: { description: "heavy snow",            icon: "13d", main: "Snow",         id: 602 },
  77: { description: "snow grains",           icon: "13d", main: "Snow",         id: 611 },
  80: { description: "light rain showers",    icon: "09d", main: "Rain",         id: 520 },
  81: { description: "rain showers",          icon: "09d", main: "Rain",         id: 521 },
  82: { description: "heavy rain showers",    icon: "09d", main: "Rain",         id: 522 },
  85: { description: "snow showers",          icon: "13d", main: "Snow",         id: 620 },
  86: { description: "heavy snow showers",    icon: "13d", main: "Snow",         id: 621 },
  95: { description: "thunderstorm",          icon: "11d", main: "Thunderstorm", id: 200 },
  96: { description: "thunderstorm w/ hail",  icon: "11d", main: "Thunderstorm", id: 202 },
  99: { description: "severe thunderstorm",   icon: "11d", main: "Thunderstorm", id: 212 },
};

function wmoToWeather(code: number) {
  return WMO[code] ?? { description: "unknown", icon: "01d", main: "Unknown", id: 800 };
}

// ── Open-Meteo current weather → CurrentWeather ───────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function openMeteoToCurrentWeather(json: any, cityName: string, lat: number, lon: number): CurrentWeather {
  const c   = json.current;
  const wmo = wmoToWeather(c.weather_code);
  const now = Math.floor(Date.now() / 1000);
  // Rough sunrise/sunset from lat (±6h from solar noon)
  const noon = new Date(); noon.setHours(12, 0, 0, 0);
  return {
    coord: { lat, lon },
    weather: [{ id: wmo.id, main: wmo.main, description: wmo.description, icon: wmo.icon }],
    base: "open-meteo",
    main: {
      temp:       c.temperature_2m,
      feels_like: c.apparent_temperature,
      temp_min:   c.temperature_2m - 2,
      temp_max:   c.temperature_2m + 2,
      pressure:   c.surface_pressure,
      humidity:   c.relative_humidity_2m,
    },
    visibility: c.visibility ?? 10000,
    wind: { speed: c.wind_speed_10m, deg: c.wind_direction_10m ?? 0 },
    clouds: { all: c.cloud_cover ?? 0 },
    dt: now,
    sys: {
      country: "",
      sunrise: Math.floor(noon.getTime() / 1000) - 6 * 3600,
      sunset:  Math.floor(noon.getTime() / 1000) + 6 * 3600,
    },
    timezone: json.utc_offset_seconds ?? 0,
    id: 0,
    name: cityName,
    cod: 200,
  };
}

// ── Open-Meteo forecast → Forecast ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function openMeteoToForecast(json: any, cityName: string, lat: number, lon: number): Forecast {
  const times: string[]  = json.hourly.time;
  const temps: number[]  = json.hourly.temperature_2m;
  const hum:   number[]  = json.hourly.relative_humidity_2m;
  const wind:  number[]  = json.hourly.wind_speed_10m;
  const wdir:  number[]  = json.hourly.wind_direction_10m;
  const pres:  number[]  = json.hourly.surface_pressure;
  const codes: number[]  = json.hourly.weather_code;
  const precip:number[]  = json.hourly.precipitation_probability ?? [];
  const cloud: number[]  = json.hourly.cloud_cover ?? [];

  const list = times.slice(0, 40).map((t, i) => {
    const wmo = wmoToWeather(codes[i] ?? 0);
    return {
      dt: Math.floor(new Date(t).getTime() / 1000),
      main: {
        temp:      temps[i] ?? 20,
        feels_like:temps[i] ?? 20,
        temp_min:  (temps[i] ?? 20) - 2,
        temp_max:  (temps[i] ?? 20) + 2,
        pressure:  pres[i]  ?? 1013,
        sea_level: pres[i]  ?? 1013,
        grnd_level:pres[i]  ?? 1013,
        humidity:  hum[i]   ?? 50,
        temp_kf:   0,
      },
      weather: [{ id: wmo.id, main: wmo.main, description: wmo.description, icon: wmo.icon }],
      clouds:  { all: cloud[i] ?? 0 },
      wind:    { speed: wind[i] ?? 0, deg: wdir[i] ?? 0, gust: (wind[i] ?? 0) * 1.3 },
      visibility: 10000,
      pop: (precip[i] ?? 0) / 100,
      sys: { pod: new Date(t).getHours() >= 6 && new Date(t).getHours() < 20 ? "d" : "n" },
      dt_txt: t.replace("T", " "),
    };
  });

  return {
    cod: "200", message: 0, cnt: list.length, list,
    city: { id: 0, name: cityName, coord: { lat, lon }, country: "", population: 0, timezone: 0, sunrise: 0, sunset: 0 },
  };
}

// ── Reverse geocode lat/lon → city name ───────────────────────────────────────
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`${OWM_BASE}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return "Your Location";
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0].local_names?.en ?? data[0].name ?? "Your Location";
    }
    return "Your Location";
  } catch {
    return "Your Location";
  }
}

// ── Current weather (OWM primary → Open-Meteo fallback) ──────────────────────
export async function fetchWeatherByCoords(lat: number, lon: number, cityName = ""): Promise<FetchResult<CurrentWeather>> {
  const fetchedAt = new Date();
  // Try OWM first
  try {
    const res = await fetch(
      `${OWM_BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data: CurrentWeather = await res.json();
      if (cityName) data.name = cityName;
      return { data, source: "owm", fetchedAt };
    }
  } catch { /* fall through */ }

  // Try Open-Meteo fallback
  try {
    const res = await fetch(
      `${OM_BASE}/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
      `weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover,visibility` +
      `&wind_speed_unit=ms&timezone=auto`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const json = await res.json();
      const name = cityName || "Your Location";
      return { data: openMeteoToCurrentWeather(json, name, lat, lon), source: "open-meteo", fetchedAt };
    }
  } catch { /* fall through */ }

  return { data: null, source: "unavailable", error: "Both OWM and Open-Meteo unavailable", fetchedAt };
}

// ── Current weather by city name (OWM only; Open-Meteo needs coords) ──────────
export async function fetchWeatherByCity(city: string): Promise<FetchResult<CurrentWeather>> {
  const fetchedAt = new Date();
  try {
    const res = await fetch(
      `${OWM_BASE}/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data: CurrentWeather = await res.json();
      // Now we have coords, delegate to coord-based fetch for fallback chain if needed
      return { data, source: "owm", fetchedAt };
    }
    // If OWM city lookup failed, try geocoding first then Open-Meteo
    const geoRes = await fetch(
      `${OWM_BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (geoRes.ok) {
      const geo = await geoRes.json();
      if (Array.isArray(geo) && geo.length > 0) {
        const { lat, lon } = geo[0];
        return fetchWeatherByCoords(lat, lon, city);
      }
    }
  } catch { /* fall through to Open-Meteo not possible without coords */ }
  return { data: null, source: "unavailable", error: "City not found and no fallback available", fetchedAt };
}

// ── Forecast (OWM primary → Open-Meteo fallback) ─────────────────────────────
export async function fetchForecastByCoords(lat: number, lon: number, cityName = ""): Promise<FetchResult<Forecast>> {
  const fetchedAt = new Date();
  try {
    const res = await fetch(
      `${OWM_BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data: Forecast = await res.json();
      return { data, source: "owm", fetchedAt };
    }
  } catch { /* fall through */ }

  try {
    const res = await fetch(
      `${OM_BASE}/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,` +
      `surface_pressure,cloud_cover,weather_code,precipitation_probability` +
      `&wind_speed_unit=ms&timezone=auto&forecast_days=7`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const json = await res.json();
      const name = cityName || "Location";
      return { data: openMeteoToForecast(json, name, lat, lon), source: "open-meteo", fetchedAt };
    }
  } catch { /* fall through */ }

  return { data: null, source: "unavailable", error: "Forecast unavailable", fetchedAt };
}

export async function fetchForecastByCity(city: string): Promise<FetchResult<Forecast>> {
  const fetchedAt = new Date();
  try {
    const res = await fetch(
      `${OWM_BASE}/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data: Forecast = await res.json();
      return { data, source: "owm", fetchedAt };
    }
  } catch { /* fall through */ }
  return { data: null, source: "unavailable", error: "Forecast unavailable", fetchedAt };
}

// ── AQI (OWM only — no free open alternative with pollutant detail) ───────────
export async function fetchAirQualityByCoords(lat: number, lon: number): Promise<FetchResult<AirPollution>> {
  const fetchedAt = new Date();
  try {
    const res = await fetch(
      `${OWM_BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data: AirPollution = await res.json();
      return { data, source: "owm", fetchedAt };
    }
    const status = res.status;
    return { data: null, source: "unavailable", error: `AQI API error ${status}`, fetchedAt };
  } catch (e) {
    return { data: null, source: "unavailable", error: String(e), fetchedAt };
  }
}

// ── City search ───────────────────────────────────────────────────────────────
export async function searchCities(query: string): Promise<City[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `${OWM_BASE}/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=7&appid=${API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) return await res.json();
  } catch { /* ignore */ }
  return [];
}

// ── Convenience wrappers (keep old names for backward-compat in components) ───
export const fetchWeather    = async (city: string): Promise<CurrentWeather | null> =>
  (await fetchWeatherByCity(city)).data;

export const fetchForecast   = async (city: string): Promise<Forecast | null> =>
  (await fetchForecastByCity(city)).data;

export const fetchAirQuality = async (lat: number, lon: number): Promise<AirPollution | null> =>
  (await fetchAirQualityByCoords(lat, lon)).data;
