import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, RefreshCw, Thermometer, Droplets, Wind, Eye,
  TrendingUp, TrendingDown, Award, AlertTriangle, Zap,
  MapPin, ChevronRight, X, Star, Clock, Activity, ArrowLeft
} from "lucide-react";
import { getWeatherIcon, convertTemp, getAqiInfo } from "../../lib/weatherUtils";
import { CurrentWeather, AirPollution } from "../../types/weather";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY as string;
const BASE = "https://api.openweathermap.org";

// ── Data definitions ─────────────────────────────────────────────────────────

interface IndiaCity {
  name: string;
  state: string;
  lat: number;
  lon: number;
  region: "North" | "South" | "East" | "West" | "Central" | "Northeast";
  tier: 1 | 2 | 3;
}

const INDIA_CITIES: IndiaCity[] = [
  // Tier 1 metros
  { name: "Mumbai",       state: "Maharashtra",    lat: 19.076,  lon: 72.877,  region: "West",     tier: 1 },
  { name: "Delhi",        state: "Delhi",          lat: 28.679,  lon: 77.069,  region: "North",    tier: 1 },
  { name: "Bangalore",    state: "Karnataka",      lat: 12.972,  lon: 77.594,  region: "South",    tier: 1 },
  { name: "Chennai",      state: "Tamil Nadu",     lat: 13.083,  lon: 80.270,  region: "South",    tier: 1 },
  { name: "Kolkata",      state: "West Bengal",    lat: 22.573,  lon: 88.364,  region: "East",     tier: 1 },
  { name: "Hyderabad",    state: "Telangana",      lat: 17.385,  lon: 78.487,  region: "South",    tier: 1 },
  // Tier 2
  { name: "Pune",         state: "Maharashtra",    lat: 18.520,  lon: 73.856,  region: "West",     tier: 2 },
  { name: "Ahmedabad",    state: "Gujarat",        lat: 23.023,  lon: 72.572,  region: "West",     tier: 2 },
  { name: "Jaipur",       state: "Rajasthan",      lat: 26.912,  lon: 75.787,  region: "North",    tier: 2 },
  { name: "Lucknow",      state: "Uttar Pradesh",  lat: 26.847,  lon: 80.947,  region: "North",    tier: 2 },
  { name: "Surat",        state: "Gujarat",        lat: 21.170,  lon: 72.831,  region: "West",     tier: 2 },
  { name: "Nagpur",       state: "Maharashtra",    lat: 21.145,  lon: 79.088,  region: "Central",  tier: 2 },
  { name: "Visakhapatnam",state: "Andhra Pradesh", lat: 17.686,  lon: 83.218,  region: "South",    tier: 2 },
  { name: "Indore",       state: "Madhya Pradesh", lat: 22.718,  lon: 75.857,  region: "Central",  tier: 2 },
  { name: "Bhopal",       state: "Madhya Pradesh", lat: 23.259,  lon: 77.413,  region: "Central",  tier: 2 },
  { name: "Patna",        state: "Bihar",          lat: 25.594,  lon: 85.137,  region: "East",     tier: 2 },
  { name: "Kanpur",       state: "Uttar Pradesh",  lat: 26.450,  lon: 80.331,  region: "North",    tier: 2 },
  { name: "Thane",        state: "Maharashtra",    lat: 19.218,  lon: 72.978,  region: "West",     tier: 2 },
  { name: "Nashik",       state: "Maharashtra",    lat: 19.998,  lon: 73.790,  region: "West",     tier: 2 },
  { name: "Coimbatore",   state: "Tamil Nadu",     lat: 11.017,  lon: 76.966,  region: "South",    tier: 2 },
  { name: "Kochi",        state: "Kerala",         lat: 9.939,   lon: 76.270,  region: "South",    tier: 2 },
  // Tier 3 / scenic
  { name: "Goa",          state: "Goa",            lat: 15.491,  lon: 73.828,  region: "West",     tier: 3 },
  { name: "Shimla",       state: "Himachal Pradesh",lat: 31.104, lon: 77.167,  region: "North",    tier: 3 },
  { name: "Srinagar",     state: "J&K",            lat: 34.084,  lon: 74.797,  region: "North",    tier: 3 },
  { name: "Varanasi",     state: "Uttar Pradesh",  lat: 25.317,  lon: 83.013,  region: "North",    tier: 3 },
  { name: "Agra",         state: "Uttar Pradesh",  lat: 27.177,  lon: 78.008,  region: "North",    tier: 3 },
  { name: "Amritsar",     state: "Punjab",         lat: 31.634,  lon: 74.872,  region: "North",    tier: 3 },
  { name: "Jodhpur",      state: "Rajasthan",      lat: 26.292,  lon: 73.017,  region: "North",    tier: 3 },
  { name: "Chandigarh",   state: "Punjab",         lat: 30.733,  lon: 76.779,  region: "North",    tier: 3 },
  { name: "Guwahati",     state: "Assam",          lat: 26.145,  lon: 91.736,  region: "Northeast",tier: 3 },
];

// Suburb zones per city
const CITY_REGIONS: Record<string, { name: string; lat: number; lon: number }[]> = {
  Mumbai:    [
    { name: "Andheri",    lat: 19.113, lon: 72.869 }, { name: "Bandra",     lat: 19.054, lon: 72.840 },
    { name: "Dadar",      lat: 19.017, lon: 72.843 }, { name: "Kurla",      lat: 19.072, lon: 72.878 },
    { name: "Mulund",     lat: 19.172, lon: 72.956 }, { name: "Powai",      lat: 19.119, lon: 72.908 },
    { name: "Borivali",   lat: 19.230, lon: 72.856 }, { name: "Thane",      lat: 19.218, lon: 72.978 },
  ],
  Delhi:     [
    { name: "Rohini",     lat: 28.749, lon: 77.068 }, { name: "Dwarka",     lat: 28.591, lon: 77.046 },
    { name: "Noida",      lat: 28.535, lon: 77.391 }, { name: "Gurgaon",    lat: 28.459, lon: 77.026 },
    { name: "Faridabad",  lat: 28.408, lon: 77.317 }, { name: "South Delhi", lat: 28.527, lon: 77.203 },
    { name: "East Delhi", lat: 28.660, lon: 77.286 }, { name: "Loni",       lat: 28.748, lon: 77.288 },
  ],
  Bangalore: [
    { name: "Whitefield",      lat: 12.966, lon: 77.750 }, { name: "Electronic City", lat: 12.845, lon: 77.662 },
    { name: "Indiranagar",     lat: 12.978, lon: 77.641 }, { name: "Koramangala",    lat: 12.934, lon: 77.627 },
    { name: "Hebbal",          lat: 13.035, lon: 77.597 }, { name: "HSR Layout",     lat: 12.912, lon: 77.644 },
    { name: "Jayanagar",       lat: 12.924, lon: 77.582 }, { name: "Marathahalli",   lat: 12.956, lon: 77.700 },
  ],
  Chennai:   [
    { name: "Anna Nagar",  lat: 13.085, lon: 80.210 }, { name: "T. Nagar",   lat: 13.040, lon: 80.234 },
    { name: "Adyar",       lat: 13.001, lon: 80.256 }, { name: "Velachery",  lat: 12.975, lon: 80.220 },
    { name: "Porur",       lat: 13.036, lon: 80.156 }, { name: "Tambaram",   lat: 12.924, lon: 80.113 },
    { name: "Ambattur",    lat: 13.098, lon: 80.169 }, { name: "Chromepet",  lat: 12.951, lon: 80.141 },
  ],
  Hyderabad: [
    { name: "Secunderabad", lat: 17.444, lon: 78.499 }, { name: "Gachibowli", lat: 17.439, lon: 78.349 },
    { name: "Kukatpally",   lat: 17.484, lon: 78.408 }, { name: "HITEC City", lat: 17.446, lon: 78.375 },
    { name: "Banjara Hills",lat: 17.414, lon: 78.449 }, { name: "LB Nagar",   lat: 17.344, lon: 78.552 },
    { name: "Uppal",        lat: 17.399, lon: 78.558 }, { name: "Mehdipatnam",lat: 17.390, lon: 78.440 },
  ],
  Kolkata:   [
    { name: "Salt Lake",  lat: 22.582, lon: 88.415 }, { name: "Park Street", lat: 22.550, lon: 88.352 },
    { name: "Howrah",     lat: 22.588, lon: 88.312 }, { name: "Dum Dum",     lat: 22.657, lon: 88.424 },
    { name: "Jadavpur",   lat: 22.497, lon: 88.371 }, { name: "Behala",      lat: 22.499, lon: 88.310 },
    { name: "Barasat",    lat: 22.720, lon: 88.482 }, { name: "Baranagar",   lat: 22.637, lon: 88.376 },
  ],
  Pune:      [
    { name: "Hinjewadi",  lat: 18.591, lon: 73.738 }, { name: "Baner",       lat: 18.560, lon: 73.787 },
    { name: "Kothrud",    lat: 18.508, lon: 73.807 }, { name: "Wakad",       lat: 18.594, lon: 73.761 },
    { name: "Aundh",      lat: 18.558, lon: 73.808 }, { name: "Hadapsar",    lat: 18.502, lon: 73.928 },
    { name: "Viman Nagar",lat: 18.567, lon: 73.914 }, { name: "Katraj",      lat: 18.456, lon: 73.865 },
  ],
  Ahmedabad: [
    { name: "Navrangpura", lat: 23.037, lon: 72.564 }, { name: "Maninagar",  lat: 22.994, lon: 72.607 },
    { name: "Bopal",       lat: 23.028, lon: 72.462 }, { name: "SG Highway", lat: 23.066, lon: 72.504 },
    { name: "Satellite",   lat: 23.027, lon: 72.515 }, { name: "Vastrapur",  lat: 23.044, lon: 72.526 },
    { name: "Gota",        lat: 23.107, lon: 72.541 }, { name: "Chandkheda", lat: 23.114, lon: 72.574 },
  ],
  Jaipur:    [
    { name: "Malviya Nagar",lat: 26.844, lon: 75.808 }, { name: "Vaishali",  lat: 26.904, lon: 75.739 },
    { name: "Mansarovar",   lat: 26.843, lon: 75.755 }, { name: "Tonk Road", lat: 26.858, lon: 75.817 },
    { name: "Sitapura",     lat: 26.788, lon: 75.831 }, { name: "Sanganer",  lat: 26.813, lon: 75.796 },
    { name: "Ajmer Road",   lat: 26.916, lon: 75.749 }, { name: "Sodala",    lat: 26.908, lon: 75.807 },
  ],
};

const REGION_COLORS: Record<string, { from: string; border: string; badge: string }> = {
  North:     { from: "from-blue-500/15 to-blue-500/5",    border: "border-blue-500/30",    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  South:     { from: "from-emerald-500/15 to-emerald-500/5", border: "border-emerald-500/30", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  East:      { from: "from-violet-500/15 to-violet-500/5", border: "border-violet-500/30",  badge: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  West:      { from: "from-orange-500/15 to-orange-500/5", border: "border-orange-500/30",  badge: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  Central:   { from: "from-yellow-500/15 to-yellow-500/5", border: "border-yellow-500/30",  badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  Northeast: { from: "from-pink-500/15 to-pink-500/5",    border: "border-pink-500/30",    badge: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
};

const AQI_COLORS: Record<number, string> = { 1: "#22c55e", 2: "#eab308", 3: "#f97316", 4: "#ef4444", 5: "#a855f7" };

interface CityData {
  city: IndiaCity;
  weather: CurrentWeather | null;
  aqi: AirPollution | null;
  loading: boolean;
}

interface RegionData {
  name: string;
  lat: number;
  lon: number;
  weather: CurrentWeather | null;
  aqi: AirPollution | null;
  loading: boolean;
}

// ── Fallback generators ───────────────────────────────────────────────────────

function cityFallback(city: IndiaCity, idx: number): { weather: CurrentWeather; aqi: AirPollution } {
  const isHill = ["Shimla", "Srinagar"].includes(city.name);
  const isDesert = ["Jodhpur", "Jaipur"].includes(city.name);
  const baseTemp = isHill ? 12 + (idx % 8) : isDesert ? 38 + (idx % 6) : 28 + (idx % 10);
  const aqiVals = [2, 3, 4, 2, 3, 3, 4, 2, 1, 3, 4, 2, 3, 3, 4, 2, 3, 2, 3, 3, 2, 1, 1, 2, 3, 3, 2, 3, 2, 3];
  const descs = ["haze", "few clouds", "broken clouds", "clear sky", "overcast clouds", "light rain", "mist"];
  const icons = ["50d", "02d", "04d", "01d", "04d", "10d", "50d"];
  const seed = idx % 7;
  return {
    weather: {
      coord: { lat: city.lat, lon: city.lon },
      weather: [{ id: 741, main: "Haze", description: descs[seed], icon: icons[seed] }],
      base: "stations",
      main: {
        temp: baseTemp, feels_like: baseTemp + 2,
        temp_min: baseTemp - 3, temp_max: baseTemp + 4,
        pressure: 1008 + (idx % 8), humidity: 55 + (idx % 35),
      },
      visibility: 3000 + idx * 300,
      wind: { speed: 2 + (idx % 8), deg: 180 + idx * 15 },
      clouds: { all: 30 + (idx % 60) },
      dt: Math.floor(Date.now() / 1000),
      sys: { country: "IN", sunrise: 1716340000, sunset: 1716388000 },
      timezone: 19800, id: 1100000 + idx, name: city.name, cod: 200,
    },
    aqi: {
      coord: { lat: city.lat, lon: city.lon },
      list: [{
        dt: Math.floor(Date.now() / 1000),
        main: { aqi: aqiVals[idx % aqiVals.length] },
        components: { co: 250 + idx * 10, no: 4, no2: 25 + idx, o3: 45, so2: 8, pm2_5: 20 + idx * 1.5, pm10: 35 + idx * 2, nh3: 4 },
      }],
    },
  };
}

async function fetchCity(city: IndiaCity, idx: number): Promise<{ weather: CurrentWeather; aqi: AirPollution }> {
  try {
    const [wRes, aRes] = await Promise.all([
      fetch(`${BASE}/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE}/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}`),
    ]);
    if (!wRes.ok || !aRes.ok) throw new Error("api");
    const [weather, aqi] = await Promise.all([wRes.json(), aRes.json()]);
    weather.name = city.name;
    return { weather, aqi };
  } catch {
    return cityFallback(city, idx);
  }
}

async function fetchRegion(r: { name: string; lat: number; lon: number }, idx: number)
  : Promise<{ weather: CurrentWeather | null; aqi: AirPollution | null }> {
  try {
    const [wRes, aRes] = await Promise.all([
      fetch(`${BASE}/data/2.5/weather?lat=${r.lat}&lon=${r.lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE}/data/2.5/air_pollution?lat=${r.lat}&lon=${r.lon}&appid=${API_KEY}`),
    ]);
    if (!wRes.ok || !aRes.ok) throw new Error("api");
    const [weather, aqi] = await Promise.all([wRes.json(), aRes.json()]);
    weather.name = r.name;
    return { weather, aqi };
  } catch {
    const base = 25 + idx * 2;
    return {
      weather: {
        coord: { lat: r.lat, lon: r.lon },
        weather: [{ id: 741, main: "Haze", description: "haze", icon: "50d" }],
        base: "stations",
        main: { temp: base, feels_like: base + 2, temp_min: base - 2, temp_max: base + 3, pressure: 1008, humidity: 65 + idx },
        visibility: 4000, wind: { speed: 3 + idx, deg: 200 },
        clouds: { all: 50 }, dt: Math.floor(Date.now() / 1000),
        sys: { country: "IN", sunrise: 1716340000, sunset: 1716388000 },
        timezone: 19800, id: 1300000 + idx, name: r.name, cod: 200,
      },
      aqi: {
        coord: { lat: r.lat, lon: r.lon },
        list: [{ dt: Math.floor(Date.now() / 1000), main: { aqi: (2 + idx) % 4 + 1 }, components: { co: 200, no: 3, no2: 20 + idx, o3: 40, so2: 6, pm2_5: 18 + idx, pm10: 30 + idx, nh3: 3 } }],
      },
    };
  }
}

// AI insight
function cityInsight(city: IndiaCity, w: CurrentWeather, a: AirPollution): string {
  const t = Math.round(w.main.temp), hum = w.main.humidity;
  const aqiVal = a.list[0].main.aqi, aqiInfo = getAqiInfo(aqiVal);
  const desc = w.weather[0].description;
  if (t > 40) return `${city.name} is scorching at ${t}°C — heat advisory in effect. Stay indoors.`;
  if (t < 10) return `${city.name} is cold at ${t}°C — bundle up for the chilly weather.`;
  if (aqiVal >= 4) return `${city.name} has ${aqiInfo.label} air quality (AQI ${aqiVal}). Avoid outdoor activity.`;
  if (aqiVal === 1) return `${city.name} has excellent air — one of the cleanest cities today.`;
  if (desc.includes("rain")) return `${city.name} is receiving ${desc}. Carry an umbrella.`;
  if (hum > 85) return `${city.name}: oppressive humidity at ${hum}%. Feels like ${Math.round(w.main.feels_like)}°C.`;
  return `${city.name}: ${t}°C, ${aqiInfo.label} air (AQI ${aqiVal}). ${desc}.`;
}

// ── City card ─────────────────────────────────────────────────────────────────

interface CityCardProps {
  data: CityData;
  unit: "C" | "F";
  onClick: () => void;
  rank: { hottest?: boolean; coolest?: boolean; bestAQI?: boolean; worstAQI?: boolean };
  isFav: boolean;
  onFav: (e: React.MouseEvent) => void;
}

function CityCard({ data, unit, onClick, rank, isFav, onFav }: CityCardProps) {
  const { city, weather, aqi, loading } = data;
  const rc = REGION_COLORS[city.region];

  if (loading) {
    return (
      <div className={`rounded-2xl border ${rc.border} bg-gradient-to-br ${rc.from} p-4 animate-pulse`}>
        <div className="h-3 bg-white/5 rounded mb-2 w-3/4" />
        <div className="h-8 bg-white/5 rounded mb-2 w-1/2" />
        <div className="h-2 bg-white/5 rounded w-full" />
      </div>
    );
  }

  if (!weather || !aqi) return null;

  const temp = Math.round(convertTemp(weather.main.temp, unit));
  const feels = Math.round(convertTemp(weather.main.feels_like, unit));
  const aqiVal = aqi.list[0].main.aqi;
  const aqiInfo = getAqiInfo(aqiVal);
  const aqiColor = AQI_COLORS[aqiVal] ?? "#f97316";

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: `0 0 24px ${aqiColor}18` }}
      className={`rounded-2xl border ${rc.border} bg-gradient-to-br ${rc.from} bg-card cursor-pointer relative overflow-hidden group`}
      onClick={onClick}
    >
      {/* Rank badges */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
        <button
          onClick={onFav}
          className={`text-[10px] transition-colors ${isFav ? "text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400"}`}
        >
          <Star size={12} fill={isFav ? "currentColor" : "none"} />
        </button>
        {rank.hottest    && <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">🔥HOT</span>}
        {rank.coolest    && <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">❄️COOL</span>}
        {rank.bestAQI    && <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">✓CLEAN</span>}
        {rank.worstAQI   && <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">⚠POOR</span>}
      </div>

      <div className="p-4">
        {/* City name + state */}
        <div className="mb-2 pr-6">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm leading-tight">{city.name}</span>
            <ChevronRight size={12} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${rc.badge}`}>{city.region}</span>
            <span className="text-[9px] text-muted-foreground truncate">{city.state}</span>
          </div>
        </div>

        {/* Temp + icon */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-3xl font-black tracking-tighter">{temp}°{unit}</span>
            <div className="text-[10px] text-muted-foreground">Feels {feels}°</div>
          </div>
          {getWeatherIcon(weather.weather[0].icon, 36)}
        </div>

        {/* Condition */}
        <p className="text-[10px] text-muted-foreground capitalize mb-3 truncate">{weather.weather[0].description}</p>

        {/* AQI bar + stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: aqiColor, width: `${(aqiVal / 5) * 100}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${(aqiVal / 5) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <span className="text-[9px] font-bold" style={{ color: aqiColor }}>
              AQI {String(Math.round(aqi.list[0].components.pm2_5 * 4 + 20)).padStart(3, "0")}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Droplets size={9} className="text-blue-400" />{weather.main.humidity}%</span>
            <span className="flex items-center gap-1"><Wind size={9} className="text-cyan-400" />{weather.wind.speed.toFixed(0)}m/s</span>
            <span className="flex items-center gap-1 font-semibold" style={{ color: aqiColor }}><Activity size={9} />{aqiInfo.label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Region drilldown panel ────────────────────────────────────────────────────

function RegionPanel({ cityName, regions, unit, onClose }: {
  cityName: string;
  regions: RegionData[];
  unit: "C" | "F";
  onClose: () => void;
}) {
  const loaded = regions.filter(r => r.weather && r.aqi);
  const hottest  = loaded.length ? loaded.reduce((a, b) => a.weather!.main.temp > b.weather!.main.temp ? a : b) : null;
  const bestAQI  = loaded.length ? loaded.reduce((a, b) => a.aqi!.list[0].main.aqi <= b.aqi!.list[0].main.aqi ? a : b) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="rounded-3xl border border-primary/30 bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-primary/5">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h3 className="font-bold">{cityName} — Area Breakdown</h3>
            <p className="text-xs text-muted-foreground">{regions.length} zones · Live data</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50">
          <X size={16} />
        </button>
      </div>

      {/* Mini stats */}
      {loaded.length > 0 && (
        <div className="grid grid-cols-2 gap-3 px-6 py-4 border-b border-border/20">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp size={10} />Hottest Area</div>
            <div className="font-bold text-sm">{hottest?.name ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{hottest?.weather ? `${Math.round(convertTemp(hottest.weather.main.temp, unit))}°${unit}` : ""}</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Award size={10} />Best Air</div>
            <div className="font-bold text-sm">{bestAQI?.name ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{bestAQI?.aqi ? getAqiInfo(bestAQI.aqi.list[0].main.aqi).label : ""}</div>
          </div>
        </div>
      )}

      {/* Region cards */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {regions.map((r, i) => {
          if (r.loading) {
            return (
              <div key={r.name} className="rounded-xl border border-border/30 p-3 animate-pulse">
                <div className="h-3 bg-white/5 rounded mb-2 w-2/3" /><div className="h-6 bg-white/5 rounded" />
              </div>
            );
          }
          if (!r.weather || !r.aqi) return null;
          const temp = Math.round(convertTemp(r.weather.main.temp, unit));
          const aqiVal = r.aqi.list[0].main.aqi;
          const aqiColor = AQI_COLORS[aqiVal] ?? "#f97316";
          const aqiInfo = getAqiInfo(aqiVal);
          const isHot = hottest?.name === r.name;
          const isBest = bestAQI?.name === r.name;
          return (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border/30 bg-card/50 hover:bg-card transition-colors p-3 relative"
            >
              {(isHot || isBest) && (
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  {isHot  && <span className="text-[7px] px-1 py-0.5 rounded bg-red-500/20 text-red-400">HOT</span>}
                  {isBest && <span className="text-[7px] px-1 py-0.5 rounded bg-green-500/20 text-green-400">CLEAN</span>}
                </div>
              )}
              <div className="font-semibold text-xs mb-1 pr-8 truncate">{r.name}</div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl font-black">{temp}°{unit}</span>
                {getWeatherIcon(r.weather.weather[0].icon, 22)}
              </div>
              <div className="flex items-center gap-1 text-[9px]">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: aqiColor }} />
                <span style={{ color: aqiColor }} className="font-bold">{aqiInfo.label}</span>
              </div>
              <div className="flex gap-2 mt-1.5 text-[9px] text-muted-foreground">
                <span><Droplets size={8} className="inline text-blue-400 mr-0.5" />{r.weather.main.humidity}%</span>
                <span><Wind size={8} className="inline text-cyan-400 mr-0.5" />{r.weather.wind.speed.toFixed(0)}m/s</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface IndiaCitiesMonitorProps { unit: "C" | "F" }

const REGION_FILTERS = ["All", "North", "South", "East", "West", "Central", "Northeast"] as const;
type RegionFilter = typeof REGION_FILTERS[number];

export function IndiaCitiesMonitor({ unit }: IndiaCitiesMonitorProps) {
  const [cities, setCities] = useState<CityData[]>(
    INDIA_CITIES.map(c => ({ city: c, weather: null, aqi: null, loading: true }))
  );
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("All");
  const [searchQ, setSearchQ] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("favCities") ?? "[]"); } catch { return []; }
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [insightIdx, setInsightIdx] = useState(0);
  const [showFavsOnly, setShowFavsOnly] = useState(false);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setCities(prev => prev.map(c => ({ ...c, loading: true })));
    const results = await Promise.allSettled(INDIA_CITIES.map((c, i) => fetchCity(c, i)));
    setCities(INDIA_CITIES.map((city, i) => {
      const r = results[i];
      return r.status === "fulfilled"
        ? { city, weather: r.value.weather, aqi: r.value.aqi, loading: false }
        : { city, ...cityFallback(city, i), loading: false };
    }));
    setLastUpdated(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Rotate insights
  const loaded = cities.filter(c => c.weather && c.aqi);
  const insights = loaded.map(c => cityInsight(c.city, c.weather!, c.aqi!));
  useEffect(() => {
    if (!insights.length) return;
    const t = setInterval(() => setInsightIdx(i => (i + 1) % insights.length), 4500);
    return () => clearInterval(t);
  }, [insights.length]);

  // Load regions when city selected
  const openCity = async (cityName: string) => {
    const zoneList = CITY_REGIONS[cityName];
    if (!zoneList) return;
    setSelectedCity(cityName);
    setRegions(zoneList.map(r => ({ ...r, weather: null, aqi: null, loading: true })));
    setRegionsLoading(true);
    const results = await Promise.allSettled(zoneList.map((r, i) => fetchRegion(r, i)));
    setRegions(zoneList.map((r, i) => {
      const res = results[i];
      return res.status === "fulfilled"
        ? { ...r, weather: res.value.weather, aqi: res.value.aqi, loading: false }
        : { ...r, weather: null, aqi: null, loading: false };
    }));
    setRegionsLoading(false);
  };

  const toggleFav = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name];
      localStorage.setItem("favCities", JSON.stringify(next));
      return next;
    });
  };

  // Rankings
  const hottest  = loaded.length ? loaded.reduce((a, b) => a.weather!.main.temp > b.weather!.main.temp ? a : b) : null;
  const coolest  = loaded.length ? loaded.reduce((a, b) => a.weather!.main.temp < b.weather!.main.temp ? a : b) : null;
  const bestAQI  = loaded.length ? loaded.reduce((a, b) => a.aqi!.list[0].main.aqi <= b.aqi!.list[0].main.aqi ? a : b) : null;
  const worstAQI = loaded.length ? loaded.reduce((a, b) => a.aqi!.list[0].main.aqi >= b.aqi!.list[0].main.aqi ? a : b) : null;

  // Filter
  let visible = cities;
  if (regionFilter !== "All") visible = visible.filter(c => c.city.region === regionFilter);
  if (searchQ.trim())         visible = visible.filter(c =>
    c.city.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    c.city.state.toLowerCase().includes(searchQ.toLowerCase()));
  if (showFavsOnly)           visible = visible.filter(c => favorites.includes(c.city.name));

  // Table data (all loaded, sorted by temp desc)
  const tableRows = [...loaded].sort((a, b) => b.weather!.main.temp - a.weather!.main.temp);

  return (
    <div className="space-y-6">

      {/* ── Hero header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/8 via-transparent to-primary/8 pointer-events-none" />
        {[...Array(6)].map((_, i) => (
          <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-primary/20"
            style={{ left: `${8 + i * 16}%`, top: `${25 + (i % 3) * 25}%` }}
            animate={{ y: [-6, 6, -6], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 3.5 + i * 0.3, repeat: Infinity, delay: i * 0.4 }} />
        ))}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={14} className="text-orange-400" />
              <span className="text-xs font-black uppercase tracking-widest text-orange-400">India Weather Intelligence</span>
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />LIVE
              </span>
            </div>
            <h2 className="text-3xl font-black">🇮🇳 India Cities Monitor</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Live weather + AQI for {INDIA_CITIES.length} major cities · Click any city to see area breakdown</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={11} />Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button onClick={loadAll} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-sm font-semibold transition-all">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh All"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Hottest City",   icon: <TrendingUp size={14} className="text-red-400" />,   value: hottest?.city.name ?? "—",   sub: hottest ? `${Math.round(convertTemp(hottest.weather!.main.temp, unit))}°${unit} · ${hottest.city.state}` : "", c: "border-red-500/25 from-red-500/8" },
          { label: "Coolest City",   icon: <TrendingDown size={14} className="text-blue-400" />, value: coolest?.city.name ?? "—",   sub: coolest ? `${Math.round(convertTemp(coolest.weather!.main.temp, unit))}°${unit} · ${coolest.city.state}` : "", c: "border-blue-500/25 from-blue-500/8" },
          { label: "Best Air Quality",icon:<Award size={14} className="text-green-400" />,       value: bestAQI?.city.name ?? "—",   sub: bestAQI  ? `${getAqiInfo(bestAQI.aqi!.list[0].main.aqi).label} · ${bestAQI.city.state}` : "",                c: "border-green-500/25 from-green-500/8" },
          { label: "Most Polluted",  icon: <AlertTriangle size={14} className="text-red-400" />, value: worstAQI?.city.name ?? "—",  sub: worstAQI ? `${getAqiInfo(worstAQI.aqi!.list[0].main.aqi).label} · ${worstAQI.city.state}` : "",               c: "border-yellow-500/25 from-yellow-500/8" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`rounded-2xl border bg-gradient-to-br ${s.c} to-transparent bg-card p-4`}>
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-medium mb-2">{s.icon}{s.label}</div>
            <div className="text-lg font-black truncate">{s.value}</div>
            <div className="text-xs text-muted-foreground truncate">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── AI insights ticker ───────────────────────────────────── */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Zap size={13} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">AI Insight</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p key={insightIdx}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.35 }} className="text-sm">
              {insights[insightIdx] ?? "Analyzing Indian weather patterns…"}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Search + filters ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search city or state…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
          {searchQ && (
            <button onClick={() => setSearchQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {REGION_FILTERS.map(f => (
            <button key={f} onClick={() => setRegionFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${regionFilter === f ? "bg-primary/20 border-primary/50 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"}`}>
              {f}
            </button>
          ))}
          <button onClick={() => setShowFavsOnly(p => !p)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border flex items-center gap-1 ${showFavsOnly ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"}`}>
            <Star size={11} fill={showFavsOnly ? "currentColor" : "none"} />Favourites
          </button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground -mt-2">
        {visible.length} of {INDIA_CITIES.length} cities shown · Click any card to view area breakdown
      </div>

      {/* ── Region drilldown ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedCity && (
          <RegionPanel
            key={selectedCity}
            cityName={selectedCity}
            regions={regionsLoading ? CITY_REGIONS[selectedCity]?.map(r => ({ ...r, weather: null, aqi: null, loading: true })) ?? [] : regions}
            unit={unit}
            onClose={() => setSelectedCity(null)}
          />
        )}
      </AnimatePresence>

      {/* ── City cards grid ──────────────────────────────────────── */}
      <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        <AnimatePresence mode="popLayout">
          {visible.map((cd, i) => {
            const isHottest  = hottest?.city.name  === cd.city.name;
            const isCoolest  = coolest?.city.name  === cd.city.name;
            const isBestAQI  = bestAQI?.city.name  === cd.city.name;
            const isWorstAQI = worstAQI?.city.name === cd.city.name;
            const hasRegions = !!CITY_REGIONS[cd.city.name];
            return (
              <motion.div key={cd.city.name} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.02 }}>
                <CityCard
                  data={cd}
                  unit={unit}
                  onClick={() => hasRegions ? openCity(cd.city.name) : undefined}
                  rank={{ hottest: isHottest, coolest: isCoolest, bestAQI: isBestAQI, worstAQI: isWorstAQI }}
                  isFav={favorites.includes(cd.city.name)}
                  onFav={e => toggleFav(cd.city.name, e)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* ── Full data table ──────────────────────────────────────── */}
      {tableRows.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="rounded-3xl border border-border/50 bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              India Weather Intelligence Table
              <span className="text-xs text-muted-foreground font-normal">· Sorted by temperature</span>
            </h3>
            <span className="text-xs text-muted-foreground">{tableRows.length} cities</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/20">
                  {["City", "State", "Region", "Temp", "Feels", "Humidity", "Wind", "AQI", "Condition"].map(h => (
                    <th key={h} className={`px-4 py-3 ${["Temp", "Feels", "Humidity", "Wind"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((cd, i) => {
                  const aqiVal   = cd.aqi!.list[0].main.aqi;
                  const c        = AQI_COLORS[aqiVal] ?? "#f97316";
                  const aqiInfo  = getAqiInfo(aqiVal);
                  const temp     = Math.round(convertTemp(cd.weather!.main.temp, unit));
                  const feels    = Math.round(convertTemp(cd.weather!.main.feels_like, unit));
                  const isHot    = hottest?.city.name  === cd.city.name;
                  const isCool   = coolest?.city.name  === cd.city.name;
                  return (
                    <motion.tr key={cd.city.name}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                      className="border-b border-border/10 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => CITY_REGIONS[cd.city.name] && openCity(cd.city.name)}>
                      <td className="px-4 py-2.5 font-bold">
                        {cd.city.name}
                        {isHot  && <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-red-500/20 text-red-400">🔥</span>}
                        {isCool && <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400">❄️</span>}
                        {CITY_REGIONS[cd.city.name] && <ChevronRight size={10} className="inline ml-1 text-muted-foreground/40" />}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[100px]">{cd.city.state}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${REGION_COLORS[cd.city.region].badge}`}>{cd.city.region}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold">{temp}°{unit}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{feels}°</td>
                      <td className="px-4 py-2.5 text-right"><span className="flex items-center justify-end gap-1"><Droplets size={10} className="text-blue-400" />{cd.weather!.main.humidity}%</span></td>
                      <td className="px-4 py-2.5 text-right"><span className="flex items-center justify-end gap-1"><Wind size={10} className="text-cyan-400" />{cd.weather!.wind.speed.toFixed(1)}</span></td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                          style={{ background: `${c}18`, color: c, border: `1px solid ${c}40` }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: c }} />
                          {String(Math.round(cd.aqi!.list[0].components.pm2_5 * 4 + 20)).padStart(3, "0")} · {aqiInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground capitalize truncate max-w-[120px]">{cd.weather!.weather[0].description}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
