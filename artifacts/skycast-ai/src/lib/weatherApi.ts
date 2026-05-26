import { CurrentWeather, Forecast, AirPollution, City } from "../types/weather";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org";

export const fetchWeather = async (city: string): Promise<CurrentWeather> => {
  try {
    const res = await fetch(`${BASE_URL}/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
    if (!res.ok) throw new Error("Weather fetch failed");
    return await res.json();
  } catch (e) {
    console.error("Using fallback current weather", e);
    return fallbackCurrentWeather;
  }
};

export const fetchForecast = async (city: string): Promise<Forecast> => {
  try {
    const res = await fetch(`${BASE_URL}/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
    if (!res.ok) throw new Error("Forecast fetch failed");
    return await res.json();
  } catch (e) {
    console.error("Using fallback forecast", e);
    return fallbackForecast;
  }
};

export const fetchAirQuality = async (lat: number, lon: number): Promise<AirPollution> => {
  try {
    const res = await fetch(`${BASE_URL}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    if (!res.ok) throw new Error("AQI fetch failed");
    return await res.json();
  } catch (e) {
    console.error("Using fallback AQI", e);
    return fallbackAirPollution;
  }
};

export const searchCities = async (query: string): Promise<City[]> => {
  if (!query) return [];
  try {
    const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
    if (!res.ok) throw new Error("Geocoding failed");
    return await res.json();
  } catch (e) {
    console.error("Using fallback cities", e);
    return fallbackCities;
  }
};

// --- Fallback Data ---
const fallbackCurrentWeather: CurrentWeather = {
  coord: { lat: 51.5074, lon: -0.1278 },
  weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }],
  base: "stations",
  main: {
    temp: 22.5,
    feels_like: 23,
    temp_min: 20,
    temp_max: 25,
    pressure: 1012,
    humidity: 45
  },
  visibility: 10000,
  wind: { speed: 4.1, deg: 180 },
  clouds: { all: 0 },
  dt: Math.floor(Date.now() / 1000),
  sys: { country: "GB", sunrise: 1716350000, sunset: 1716410000 },
  timezone: 3600,
  id: 2643743,
  name: "London",
  cod: 200
};

const fallbackForecast: Forecast = {
  cod: "200",
  message: 0,
  cnt: 40,
  list: Array.from({ length: 40 }).map((_, i) => ({
    dt: Math.floor(Date.now() / 1000) + i * 10800,
    main: { temp: 20 + Math.sin(i) * 5, feels_like: 20, temp_min: 15, temp_max: 25, pressure: 1010, sea_level: 1010, grnd_level: 1000, humidity: 50, temp_kf: 0 },
    weather: [{ id: 800, main: "Clear", description: "clear", icon: "01d" }],
    clouds: { all: 10 },
    wind: { speed: 3, deg: 180, gust: 4 },
    visibility: 10000,
    pop: 0.1,
    sys: { pod: "d" },
    dt_txt: new Date(Date.now() + i * 10800000).toISOString()
  })),
  city: { id: 2643743, name: "London", coord: { lat: 51.5, lon: -0.1 }, country: "GB", population: 8000000, timezone: 3600, sunrise: 1716350000, sunset: 1716410000 }
};

const fallbackAirPollution: AirPollution = {
  coord: { lat: 51.5, lon: -0.1 },
  list: [{
    dt: Math.floor(Date.now() / 1000),
    main: { aqi: 2 },
    components: { co: 200, no: 0, no2: 20, o3: 60, so2: 5, pm2_5: 10, pm10: 15, nh3: 1 }
  }]
};

const fallbackCities: City[] = [
  { name: "London", lat: 51.5074, lon: -0.1278, country: "GB" },
  { name: "New York", lat: 40.7128, lon: -74.006, country: "US" },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, country: "JP" }
];
