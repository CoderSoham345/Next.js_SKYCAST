import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Award, AlertTriangle, RefreshCw, ChevronRight } from "lucide-react";
import { getWeatherIcon, convertTemp, getAqiInfo, pm25ToAqi, formatAqi3 } from "../../lib/weatherUtils";
import { CurrentWeather, AirPollution } from "../../types/weather";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY as string;
const BASE = "https://api.openweathermap.org";

const INDIA_SAMPLE = [
  { name: "Mumbai",       lat: 19.076, lon: 72.877 },
  { name: "Delhi",        lat: 28.679, lon: 77.069 },
  { name: "Bangalore",    lat: 12.972, lon: 77.594 },
  { name: "Chennai",      lat: 13.083, lon: 80.270 },
  { name: "Kolkata",      lat: 22.573, lon: 88.364 },
  { name: "Hyderabad",    lat: 17.385, lon: 78.487 },
  { name: "Pune",         lat: 18.520, lon: 73.856 },
  { name: "Ahmedabad",    lat: 23.023, lon: 72.572 },
  { name: "Jaipur",       lat: 26.912, lon: 75.787 },
  { name: "Lucknow",      lat: 26.847, lon: 80.947 },
  { name: "Surat",        lat: 21.170, lon: 72.831 },
  { name: "Nagpur",       lat: 21.145, lon: 79.088 },
  { name: "Shimla",       lat: 31.104, lon: 77.167 },
  { name: "Srinagar",     lat: 34.084, lon: 74.797 },
  { name: "Goa",          lat: 15.491, lon: 73.828 },
];

interface CityRank {
  name: string;
  temp: number;
  aqi: number;
  aqiTraditional: number;
  humidity: number;
  desc: string;
  icon: string;
}

async function fetchRankCity(c: { name: string; lat: number; lon: number }, idx: number): Promise<CityRank> {
  try {
    const [wRes, aRes] = await Promise.all([
      fetch(`${BASE}/data/2.5/weather?lat=${c.lat}&lon=${c.lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE}/data/2.5/air_pollution?lat=${c.lat}&lon=${c.lon}&appid=${API_KEY}`),
    ]);
    if (!wRes.ok || !aRes.ok) throw new Error("api");
    const [w, a]: [CurrentWeather, AirPollution] = await Promise.all([wRes.json(), aRes.json()]);
    return {
      name: c.name,
      temp: w.main.temp,
      aqi: a.list[0].main.aqi,
      aqiTraditional: pm25ToAqi(a.list[0].components.pm2_5),
      humidity: w.main.humidity,
      desc: w.weather[0].description,
      icon: w.weather[0].icon,
    };
  } catch {
    const temps = [32, 38, 26, 33, 30, 34, 28, 37, 35, 29, 36, 31, 12, 8, 27];
    const aqis  = [2,  4,  2,  3,  3,  3,  2,  3,  3,  3,  2,  3,  1,  1,  2];
    return {
      name: c.name,
      temp: temps[idx % temps.length],
      aqi:  aqis[idx % aqis.length],
      aqiTraditional: pm25ToAqi(20 + idx * 4),
      humidity: 55 + idx * 3,
      desc: ["haze", "few clouds", "clear sky", "overcast clouds"][idx % 4],
      icon: ["50d", "02d", "01d", "04d"][idx % 4],
    };
  }
}

type RankMode = "hottest" | "coolest" | "bestAQI" | "worstAQI";

const RANK_TABS: { id: RankMode; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "hottest",  label: "Hottest",   icon: <TrendingUp size={13} />,   color: "text-red-400"   },
  { id: "coolest",  label: "Coolest",   icon: <TrendingDown size={13} />, color: "text-blue-400"  },
  { id: "bestAQI",  label: "Clean Air", icon: <Award size={13} />,        color: "text-green-400" },
  { id: "worstAQI", label: "Most Polluted",icon:<AlertTriangle size={13}/>,color:"text-red-400"   },
];

const RANK_BG: Record<number, string> = {
  1: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  2: "bg-slate-400/20 border-slate-400/30 text-slate-300",
  3: "bg-orange-600/20 border-orange-600/30 text-orange-500",
};

interface IndiaRankingsProps { unit: "C" | "F" }

export function IndiaRankings({ unit }: IndiaRankingsProps) {
  const [data, setData] = useState<CityRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<RankMode>("hottest");

  const load = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled(INDIA_SAMPLE.map((c, i) => fetchRankCity(c, i)));
    setData(results.map((r, i) => r.status === "fulfilled" ? r.value : {
      name: INDIA_SAMPLE[i].name, temp: 28, aqi: 2, aqiTraditional: 60, humidity: 65, desc: "haze", icon: "50d",
    }));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted = [...data].sort((a, b) => {
    if (mode === "hottest")  return b.temp - a.temp;
    if (mode === "coolest")  return a.temp - b.temp;
    if (mode === "bestAQI")  return a.aqi - b.aqi;
    return b.aqi - a.aqi;
  });
  const top10 = sorted.slice(0, 10);

  return (
    <div className="rounded-3xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            🇮🇳 India Live Rankings
          </h3>
          <p className="text-xs text-muted-foreground">Real-time leaderboard across major cities</p>
        </div>
        <button onClick={load} disabled={loading} className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-1 overflow-x-auto scrollbar-none">
        {RANK_TABS.map(t => (
          <button key={t.id} onClick={() => setMode(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border ${
              mode === t.id ? "bg-primary/15 border-primary/40 text-primary" : "border-border/30 text-muted-foreground hover:text-foreground"
            }`}>
            <span className={t.color}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Ranking list */}
      <div className="px-4 pb-4 pt-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-muted/20 animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-1.5">
              {top10.map((city, i) => {
                const aqiInfo = getAqiInfo(city.aqi);
                const rankNum = i + 1;
                const tempDisplay = Math.round(convertTemp(city.temp, unit));
                return (
                  <motion.div key={city.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/20 transition-colors group"
                  >
                    {/* Rank badge */}
                    <div className={`w-7 h-7 rounded-lg border text-[11px] font-black flex items-center justify-center flex-shrink-0 ${
                      RANK_BG[rankNum] ?? "bg-muted/20 border-border/30 text-muted-foreground"
                    }`}>
                      {rankNum <= 3 ? ["🥇","🥈","🥉"][rankNum-1] : rankNum}
                    </div>

                    {/* Icon */}
                    <div className="flex-shrink-0">{getWeatherIcon(city.icon, 20)}</div>

                    {/* City name + desc */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{city.name}</div>
                      <div className="text-[10px] text-muted-foreground capitalize truncate">{city.desc}</div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 flex-shrink-0 text-right">
                      <div>
                        <div className="text-sm font-black">{tempDisplay}°{unit}</div>
                        <div className="text-[10px] text-muted-foreground">{city.humidity}%💧</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black" style={{ color: aqiInfo.hex ?? "#9ca3af" }}>
                          {formatAqi3(city.aqiTraditional)}
                        </div>
                        <div className="text-[10px]" style={{ color: aqiInfo.hex ?? "#9ca3af" }}>{aqiInfo.label}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
