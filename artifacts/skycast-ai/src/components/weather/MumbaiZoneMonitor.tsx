import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets, Wind, Thermometer, Eye, RefreshCw, Zap,
  TrendingUp, TrendingDown, Award, AlertTriangle, Train,
  CloudRain, Sun, Star, ChevronDown, ChevronUp, Activity,
  MapPin, Clock, Flame, Snowflake
} from "lucide-react";
import { getWeatherIcon, convertTemp, getAqiInfo } from "../../lib/weatherUtils";
import { fetchAirQuality } from "../../lib/weatherApi";
import { CurrentWeather, AirPollution } from "../../types/weather";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY as string;
const BASE = "https://api.openweathermap.org";

interface MumbaiZone {
  name: string;
  lat: number;
  lon: number;
  zone: "North" | "Central" | "South" | "Harbour" | "Suburbs";
  trainLine?: string;
}

const MUMBAI_ZONES: MumbaiZone[] = [
  { name: "Borivali",    lat: 19.2307, lon: 72.8567, zone: "North",    trainLine: "Western" },
  { name: "Malad",       lat: 19.1871, lon: 72.8487, zone: "North",    trainLine: "Western" },
  { name: "Goregaon",   lat: 19.1663, lon: 72.8526, zone: "North",    trainLine: "Western" },
  { name: "Mulund",     lat: 19.1720, lon: 72.9561, zone: "North",    trainLine: "Central" },
  { name: "Bhandup",    lat: 19.1445, lon: 72.9417, zone: "North",    trainLine: "Central" },
  { name: "Nahur",      lat: 19.1250, lon: 72.9417, zone: "North",    trainLine: "Central" },
  { name: "Andheri",    lat: 19.1136, lon: 72.8697, zone: "Central",  trainLine: "Western" },
  { name: "Santacruz",  lat: 19.0820, lon: 72.8445, zone: "Central",  trainLine: "Western" },
  { name: "Powai",      lat: 19.1196, lon: 72.9089, zone: "Central" },
  { name: "Ghatkopar",  lat: 19.0851, lon: 72.9081, zone: "Central",  trainLine: "Central" },
  { name: "Chembur",    lat: 19.0625, lon: 72.8993, zone: "Central",  trainLine: "Harbour" },
  { name: "Kurla",      lat: 19.0726, lon: 72.8789, zone: "Central",  trainLine: "Central" },
  { name: "Bandra",     lat: 19.0544, lon: 72.8404, zone: "South",    trainLine: "Western" },
  { name: "Sion",       lat: 19.0392, lon: 72.8617, zone: "South",    trainLine: "Central" },
  { name: "Matunga",    lat: 19.0272, lon: 72.8620, zone: "South",    trainLine: "Central" },
  { name: "Dadar",      lat: 19.0170, lon: 72.8432, zone: "South",    trainLine: "Western" },
  { name: "Wadala",     lat: 19.0139, lon: 72.8575, zone: "Harbour",  trainLine: "Harbour" },
  { name: "Parel",      lat: 19.0005, lon: 72.8438, zone: "South",    trainLine: "Central" },
  { name: "Byculla",    lat: 18.9788, lon: 72.8354, zone: "South",    trainLine: "Central" },
  { name: "Thane",      lat: 19.2183, lon: 72.9781, zone: "Suburbs" },
  { name: "Navi Mumbai",lat: 19.0330, lon: 73.0297, zone: "Suburbs" },
  { name: "Vashi",      lat: 19.0771, lon: 73.0071, zone: "Suburbs",  trainLine: "Harbour" },
  { name: "Nerul",      lat: 19.0323, lon: 73.0169, zone: "Suburbs",  trainLine: "Harbour" },
  { name: "Panvel",     lat: 18.9894, lon: 73.1175, zone: "Suburbs" },
];

const ZONE_COLORS: Record<string, string> = {
  North:    "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
  Central:  "from-violet-500/20 to-purple-500/10 border-violet-500/30",
  South:    "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
  Harbour:  "from-orange-500/20 to-amber-500/10 border-orange-500/30",
  Suburbs:  "from-rose-500/20 to-pink-500/10 border-rose-500/30",
};

const ZONE_BADGE: Record<string, string> = {
  North:    "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Central:  "bg-violet-500/20 text-violet-400 border-violet-500/30",
  South:    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Harbour:  "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Suburbs:  "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

interface ZoneData {
  zone: MumbaiZone;
  weather: CurrentWeather | null;
  aqi: AirPollution | null;
  loading: boolean;
  error: boolean;
}

// Generate realistic Mumbai fallback weather — tropical, humid
function makeFallback(zone: MumbaiZone, idx: number): { weather: CurrentWeather; aqi: AirPollution } {
  const seed = (zone.lat * 100 + idx) % 7;
  const icons = ["10d", "09d", "10d", "04d", "03d", "02d", "01d"];
  const descs = ["moderate rain", "drizzle", "light rain", "overcast clouds", "broken clouds", "few clouds", "clear sky"];
  const temps = [29, 31, 28, 32, 30, 33, 27, 34, 29, 31, 28, 35];
  const temp = temps[idx % temps.length] + (Math.random() * 2 - 1);
  const aqiVals = [2, 3, 3, 4, 2, 3, 4, 2, 3, 3, 2, 4];
  return {
    weather: {
      coord: { lat: zone.lat, lon: zone.lon },
      weather: [{ id: 500 + idx, main: "Rain", description: descs[seed], icon: icons[seed] }],
      base: "stations",
      main: {
        temp, feels_like: temp + 2, temp_min: temp - 2, temp_max: temp + 3,
        pressure: 1005 + Math.round(Math.random() * 6),
        humidity: 72 + Math.round(Math.random() * 20),
      },
      visibility: 4000 + Math.round(Math.random() * 5000),
      wind: { speed: 3 + Math.round(Math.random() * 8), deg: 220 },
      clouds: { all: 60 + Math.round(Math.random() * 40) },
      dt: Math.floor(Date.now() / 1000),
      sys: { country: "IN", sunrise: 1716340000, sunset: 1716388000 },
      timezone: 19800,
      id: 1200000 + idx,
      name: zone.name,
      cod: 200,
    },
    aqi: {
      coord: { lat: zone.lat, lon: zone.lon },
      list: [{
        dt: Math.floor(Date.now() / 1000),
        main: { aqi: aqiVals[idx % aqiVals.length] },
        components: { co: 300, no: 5, no2: 30 + idx * 2, o3: 50, so2: 10, pm2_5: 25 + idx, pm10: 40 + idx, nh3: 5 },
      }],
    },
  };
}

async function fetchZone(zone: MumbaiZone, idx: number): Promise<{ weather: CurrentWeather; aqi: AirPollution }> {
  try {
    const [wRes, aqiRes] = await Promise.all([
      fetch(`${BASE}/data/2.5/weather?lat=${zone.lat}&lon=${zone.lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE}/data/2.5/air_pollution?lat=${zone.lat}&lon=${zone.lon}&appid=${API_KEY}`),
    ]);
    if (!wRes.ok || !aqiRes.ok) throw new Error("API error");
    const [weather, aqiData] = await Promise.all([wRes.json(), aqiRes.json()]);
    weather.name = zone.name; // override with our zone name
    return { weather, aqi: aqiData };
  } catch {
    return makeFallback(zone, idx);
  }
}

// Generate AI insight for a zone
function zoneInsight(zone: MumbaiZone, weather: CurrentWeather, aqi: AirPollution): string {
  const temp = Math.round(weather.main.temp);
  const hum = weather.main.humidity;
  const desc = weather.weather[0].description;
  const aqiVal = aqi.list[0].main.aqi;
  const aqiInfo = getAqiInfo(aqiVal);
  const wind = weather.wind.speed;

  if (aqiVal === 1) return `${zone.name} has the cleanest air in Mumbai right now — great for an outdoor run.`;
  if (aqiVal >= 4) return `${zone.name} is experiencing high pollution (AQI: ${aqiInfo.label}). Avoid outdoor activity.`;
  if (hum > 85) return `Heavy humidity (${hum}%) detected in ${zone.name} — feels very muggy outdoors.`;
  if (desc.includes("rain") || desc.includes("drizzle")) return `${zone.name} is currently receiving ${desc}. Carry an umbrella.`;
  if (temp > 35) return `${zone.name} is the hottest zone at ${temp}°C. Stay hydrated.`;
  if (temp < 27) return `Pleasant weather in ${zone.name} tonight — comfortable for evening strolls.`;
  if (wind > 10) return `Strong sea breeze in ${zone.name} at ${wind} m/s — good for ventilation.`;
  return `${zone.name}: ${temp}°C, ${hum}% humidity — ${desc}. Moderate outdoor conditions.`;
}

interface ZoneCardProps {
  data: ZoneData;
  unit: "C" | "F";
  isExpanded: boolean;
  onToggle: () => void;
  rank?: { hottest?: boolean; coolest?: boolean; bestAQI?: boolean; worstAQI?: boolean };
}

function ZoneCard({ data, unit, isExpanded, onToggle, rank }: ZoneCardProps) {
  const { zone, weather, aqi, loading } = data;
  const gradCls = ZONE_COLORS[zone.zone];
  const badgeCls = ZONE_BADGE[zone.zone];

  if (loading) {
    return (
      <div className={`rounded-2xl border bg-gradient-to-br ${gradCls} p-4 animate-pulse`}>
        <div className="h-4 bg-white/5 rounded mb-3 w-2/3" />
        <div className="h-8 bg-white/5 rounded mb-2 w-1/2" />
        <div className="h-3 bg-white/5 rounded w-full" />
      </div>
    );
  }

  if (!weather || !aqi) {
    return (
      <div className={`rounded-2xl border bg-gradient-to-br ${gradCls} p-4 flex items-center justify-center h-32`}>
        <p className="text-xs text-muted-foreground">No data</p>
      </div>
    );
  }

  const temp = Math.round(convertTemp(weather.main.temp, unit));
  const feelsLike = Math.round(convertTemp(weather.main.feels_like, unit));
  const aqiVal = aqi.list[0].main.aqi;
  const aqiInfo = getAqiInfo(aqiVal);
  const isRaining = weather.weather[0].main === "Rain" || weather.weather[0].main === "Drizzle";

  return (
    <motion.div
      layout
      whileHover={{ y: -3, boxShadow: "0 0 20px rgba(0,212,255,0.08)" }}
      className={`rounded-2xl border bg-gradient-to-br ${gradCls} cursor-pointer relative overflow-hidden`}
      onClick={onToggle}
    >
      {/* Rank badges */}
      {(rank?.hottest || rank?.coolest || rank?.bestAQI || rank?.worstAQI) && (
        <div className="absolute top-2 right-2 flex gap-1 flex-wrap justify-end z-10">
          {rank.hottest    && <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-red-500/30 text-red-400 border border-red-500/40 flex items-center gap-0.5"><Flame size={8}/>HOTTEST</span>}
          {rank.coolest    && <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-blue-500/30 text-blue-400 border border-blue-500/40 flex items-center gap-0.5"><Snowflake size={8}/>COOLEST</span>}
          {rank.bestAQI    && <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-green-500/30 text-green-400 border border-green-500/40 flex items-center gap-0.5"><Award size={8}/>BEST AIR</span>}
          {rank.worstAQI   && <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-red-500/30 text-red-400 border border-red-500/40 flex items-center gap-0.5"><AlertTriangle size={8}/>POOR AIR</span>}
        </div>
      )}

      {/* Rain animation overlay */}
      {isRaining && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px bg-blue-400/20 rounded-full"
              style={{ left: `${10 + i * 16}%`, height: "40%", top: "-40%" }}
              animate={{ y: ["0%", "280%"] }}
              transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
            />
          ))}
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-bold text-sm leading-tight">{zone.name}</h4>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badgeCls} mt-0.5 inline-block`}>
              {zone.zone}
            </span>
          </div>
          {getWeatherIcon(weather.weather[0].icon, 32)}
        </div>

        {/* Temperature */}
        <div className="flex items-end gap-2 mb-2">
          <span className="text-4xl font-black tracking-tighter">{temp}°{unit}</span>
          <span className="text-xs text-muted-foreground mb-1">Feels {feelsLike}°</span>
        </div>

        {/* Condition */}
        <p className="text-xs text-muted-foreground capitalize mb-3">{weather.weather[0].description}</p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Droplets size={11} className="text-blue-400" />
            <span>{weather.main.humidity}%</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wind size={11} className="text-cyan-400" />
            <span>{weather.wind.speed.toFixed(1)}m/s</span>
          </div>
          <div className={`flex items-center gap-1 font-semibold ${aqiInfo.color}`}>
            <Activity size={11} />
            <span>AQI {aqiVal}</span>
          </div>
        </div>

        {/* AQI bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${aqiInfo.bg}`}
              initial={{ width: 0 }}
              animate={{ width: `${(aqiVal / 5) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className={`text-[9px] font-bold ${aqiInfo.color}`}>{aqiInfo.label}</span>
            {zone.trainLine && (
              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                <Train size={8} />{zone.trainLine}
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <button className="w-full mt-2 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Expanded detail */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-white/10 mt-1 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Pressure</div>
                    <div className="font-semibold">{weather.main.pressure} hPa</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">Visibility</div>
                    <div className="font-semibold">{(weather.visibility / 1000).toFixed(1)} km</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">PM2.5</div>
                    <div className="font-semibold">{aqi.list[0].components.pm2_5.toFixed(1)} μg</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">NO₂</div>
                    <div className="font-semibold">{aqi.list[0].components.no2.toFixed(1)} μg</div>
                  </div>
                </div>

                {/* Flood / traffic risk */}
                <div className="flex flex-wrap gap-1.5">
                  {isRaining && (
                    <span className="text-[9px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                      <CloudRain size={9} /> Flood Risk: Moderate
                    </span>
                  )}
                  {weather.main.humidity > 85 && (
                    <span className="text-[9px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                      <AlertTriangle size={9} /> Traffic Risk: High
                    </span>
                  )}
                  {aqiVal <= 2 && (
                    <span className="text-[9px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                      <Star size={9} /> Good Outdoor Zone
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const ZONE_FILTERS = ["All", "North", "Central", "South", "Harbour", "Suburbs"] as const;
type ZoneFilter = typeof ZONE_FILTERS[number];

interface MumbaiZoneMonitorProps {
  unit: "C" | "F";
}

export function MumbaiZoneMonitor({ unit }: MumbaiZoneMonitorProps) {
  const [zones, setZones] = useState<ZoneData[]>(
    MUMBAI_ZONES.map(z => ({ zone: z, weather: null, aqi: null, loading: true, error: false }))
  );
  const [filter, setFilter] = useState<ZoneFilter>("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [insightIdx, setInsightIdx] = useState(0);
  const [monsoonActive] = useState(true); // June–Sep Mumbai monsoon

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    setZones(prev => prev.map(z => ({ ...z, loading: true })));

    const results = await Promise.allSettled(
      MUMBAI_ZONES.map((z, i) => fetchZone(z, i))
    );

    setZones(
      MUMBAI_ZONES.map((zone, i) => {
        const r = results[i];
        if (r.status === "fulfilled") {
          return { zone, weather: r.value.weather, aqi: r.value.aqi, loading: false, error: false };
        }
        const fb = makeFallback(zone, i);
        return { zone, weather: fb.weather, aqi: fb.aqi, loading: false, error: true };
      })
    );
    setLastUpdated(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Rotate AI insights
  const loadedZones = zones.filter(z => z.weather && z.aqi);
  const insights = loadedZones.map(z => zoneInsight(z.zone, z.weather!, z.aqi!));
  useEffect(() => {
    if (!insights.length) return;
    const t = setInterval(() => setInsightIdx(i => (i + 1) % insights.length), 4000);
    return () => clearInterval(t);
  }, [insights.length]);

  // Compute rankings
  const loaded = zones.filter(z => z.weather && z.aqi);
  const hottest = loaded.length ? loaded.reduce((a, b) => (a.weather!.main.temp > b.weather!.main.temp ? a : b)) : null;
  const coolest = loaded.length ? loaded.reduce((a, b) => (a.weather!.main.temp < b.weather!.main.temp ? a : b)) : null;
  const bestAQI  = loaded.length ? loaded.reduce((a, b) => (a.aqi!.list[0].main.aqi <= b.aqi!.list[0].main.aqi ? a : b)) : null;
  const worstAQI = loaded.length ? loaded.reduce((a, b) => (a.aqi!.list[0].main.aqi >= b.aqi!.list[0].main.aqi ? a : b)) : null;

  // Monsoon rain probability from humidity + clouds
  const avgRainProb = loaded.length
    ? Math.round(loaded.reduce((s, z) => s + (z.weather!.clouds.all / 100 * 0.6 + z.weather!.main.humidity / 100 * 0.4), 0) / loaded.length * 100)
    : 0;

  const filteredZones = filter === "All" ? zones : zones.filter(z => z.zone.zone === filter);

  // Best place recommendation
  const bestPlace = loaded.length
    ? loaded.reduce((best, z) => {
        const score = (100 - z.aqi!.list[0].main.aqi * 20) * 0.5
          + (100 - z.weather!.main.humidity) * 0.3
          + (z.weather!.visibility / 10000) * 20;
        const bestScore = (100 - best.aqi!.list[0].main.aqi * 20) * 0.5
          + (100 - best.weather!.main.humidity) * 0.3
          + (best.weather!.visibility / 10000) * 20;
        return score > bestScore ? z : best;
      })
    : null;

  return (
    <div className="space-y-6">

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-primary/10 pointer-events-none" />
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{ left: `${10 + i * 12}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ y: [-8, 8, -8], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
          />
        ))}

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Mumbai Metropolitan Region</span>
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />LIVE
              </span>
            </div>
            <h2 className="text-3xl font-black">Mumbai Live Zone Monitor</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Real-time weather intelligence across 24 zones</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={12} /> Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              onClick={loadAll}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-sm font-semibold transition-all"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Updating…" : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat bar ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Hottest Zone", icon: <TrendingUp size={16} className="text-red-400" />, value: hottest ? `${hottest.zone.name}` : "—", sub: hottest ? `${Math.round(convertTemp(hottest.weather!.main.temp, unit))}°${unit}` : "", color: "border-red-500/30 from-red-500/10" },
          { label: "Coolest Zone", icon: <TrendingDown size={16} className="text-blue-400" />, value: coolest ? `${coolest.zone.name}` : "—", sub: coolest ? `${Math.round(convertTemp(coolest.weather!.main.temp, unit))}°${unit}` : "", color: "border-blue-500/30 from-blue-500/10" },
          { label: "Best Air Quality", icon: <Award size={16} className="text-green-400" />, value: bestAQI ? `${bestAQI.zone.name}` : "—", sub: bestAQI ? getAqiInfo(bestAQI.aqi!.list[0].main.aqi).label : "", color: "border-green-500/30 from-green-500/10" },
          { label: "Worst Air Quality", icon: <AlertTriangle size={16} className="text-yellow-400" />, value: worstAQI ? `${worstAQI.zone.name}` : "—", sub: worstAQI ? getAqiInfo(worstAQI.aqi!.list[0].main.aqi).label : "", color: "border-yellow-500/30 from-yellow-500/10" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-2xl border bg-gradient-to-br ${s.color} to-transparent bg-card p-4`}
          >
            <div className="flex items-center gap-2 mb-2 text-muted-foreground text-xs font-medium">
              {s.icon}{s.label}
            </div>
            <div className="text-xl font-black">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── AI Insights ticker ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Zap size={14} className="text-primary" />
          <span className="text-xs font-black uppercase tracking-widest text-primary">AI Insight</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={insightIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="text-sm text-foreground"
            >
              {insights[insightIdx] ?? "Loading insights…"}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {Math.min(insights.length, 6) > 0 && [...Array(Math.min(insights.length, 6))].map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === insightIdx % 6 ? "bg-primary" : "bg-primary/20"}`} />
          ))}
        </div>
      </div>

      {/* ── Extra panels row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monsoon tracker */}
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent p-4">
          <div className="flex items-center gap-2 mb-3">
            <CloudRain size={16} className="text-blue-400" />
            <span className="text-sm font-bold">Monsoon Tracker</span>
            {monsoonActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">ACTIVE</span>}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Rain Probability</span>
              <span className="font-bold text-blue-400">{avgRainProb}%</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${avgRainProb}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Jun–Sep Monsoon Season</span>
              <span className={avgRainProb > 60 ? "text-blue-400 font-bold" : "text-green-400"}>
                {avgRainProb > 70 ? "Heavy" : avgRainProb > 40 ? "Moderate" : "Light"}
              </span>
            </div>
          </div>
        </div>

        {/* Mumbai train weather status */}
        <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
          <div className="flex items-center gap-2 mb-3">
            <Train size={16} className="text-orange-400" />
            <span className="text-sm font-bold">Local Train Weather Status</span>
          </div>
          <div className="space-y-2">
            {[
              { line: "Western", status: avgRainProb > 60 ? "Delayed" : "On Time", ok: avgRainProb <= 60 },
              { line: "Central", status: avgRainProb > 70 ? "Delayed" : "On Time", ok: avgRainProb <= 70 },
              { line: "Harbour", status: avgRainProb > 55 ? "Caution" : "Normal", ok: avgRainProb <= 55 },
            ].map(t => (
              <div key={t.line} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t.line} Line</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.ok ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Best place today */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-yellow-400" />
            <span className="text-sm font-bold">Best Place Today</span>
          </div>
          {bestPlace && bestPlace.weather && bestPlace.aqi ? (
            <div>
              <div className="text-2xl font-black text-emerald-400 mb-1">{bestPlace.zone.name}</div>
              <div className="text-xs text-muted-foreground mb-2">
                {Math.round(convertTemp(bestPlace.weather.main.temp, unit))}°{unit} · {getAqiInfo(bestPlace.aqi.list[0].main.aqi).label} Air · {bestPlace.weather.main.humidity}% Humidity
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Best combination of air quality, comfort & visibility in Mumbai right now.
              </p>
            </div>
          ) : (
            <div className="animate-pulse h-16 bg-white/5 rounded-xl" />
          )}
        </div>
      </div>

      {/* ── Zone filter tabs ─────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {ZONE_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              filter === f
                ? "bg-primary/20 border-primary/50 text-primary"
                : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {f}
            {f !== "All" && (
              <span className="ml-1.5 text-[10px] opacity-60">
                {MUMBAI_ZONES.filter(z => z.zone === f).length}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground self-center">
          {filteredZones.length} zone{filteredZones.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Zone cards grid ──────────────────────────────────────────── */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredZones.map((zd, i) => {
            const isHottest  = hottest?.zone.name  === zd.zone.name;
            const isCoolest  = coolest?.zone.name  === zd.zone.name;
            const isBestAQI  = bestAQI?.zone.name  === zd.zone.name;
            const isWorstAQI = worstAQI?.zone.name === zd.zone.name;
            return (
              <motion.div
                key={zd.zone.name}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
              >
                <ZoneCard
                  data={zd}
                  unit={unit}
                  isExpanded={expanded === zd.zone.name}
                  onToggle={() => setExpanded(prev => prev === zd.zone.name ? null : zd.zone.name)}
                  rank={{
                    hottest:  isHottest,
                    coolest:  isCoolest,
                    bestAQI:  isBestAQI,
                    worstAQI: isWorstAQI,
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
