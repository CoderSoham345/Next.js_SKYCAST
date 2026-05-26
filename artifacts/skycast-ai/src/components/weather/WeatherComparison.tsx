import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Droplets, Wind, Eye, Gauge, Thermometer,
  ArrowUp, ArrowDown, Minus, Trophy, RefreshCw, MapPin, X
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from "recharts";
import { fetchWeather, fetchForecast, fetchAirQuality, searchCities } from "../../lib/weatherApi";
import { getWeatherIcon, convertTemp, getAqiInfo } from "../../lib/weatherUtils";
import { CurrentWeather, Forecast, AirPollution, City } from "../../types/weather";

interface CityData {
  name: string;
  current: CurrentWeather | null;
  forecast: Forecast | null;
  aqi: AirPollution | null;
  loading: boolean;
  error: string | null;
}

interface CitySearchProps {
  label: string;
  color: "cyan" | "violet";
  onSelect: (city: string) => void;
  current: string;
  loading: boolean;
}

function CitySearch({ label, color, onSelect, current, loading }: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [open, setOpen] = useState(false);

  const accent = color === "cyan"
    ? { border: "border-primary/50", glow: "shadow-[0_0_20px_rgba(0,212,255,0.15)]", text: "text-primary", bg: "bg-primary/10" }
    : { border: "border-accent/50", glow: "shadow-[0_0_20px_rgba(124,58,237,0.15)]", text: "text-accent", bg: "bg-accent/10" };

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.length > 2) {
        const r = await searchCities(query);
        setResults(r);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = (city: string) => {
    onSelect(city);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${accent.text}`}>{label}</div>
      <div className={`relative rounded-2xl border ${accent.border} bg-card/60 backdrop-blur-xl overflow-visible ${open ? accent.glow : ""} transition-shadow`}>
        <div className="flex items-center gap-3 px-4 py-3">
          {loading
            ? <RefreshCw size={16} className={`${accent.text} animate-spin`} />
            : <Search size={16} className="text-muted-foreground" />}
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={current ? current : "Search a city…"}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
          />
          {current && !loading && (
            <button onClick={() => onSelect("")} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {open && (results.length > 0 || query.length > 2) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden z-50"
            >
              {results.length > 0
                ? results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(r.name)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 text-left transition-colors group"
                    >
                      <span className={`font-medium group-hover:${accent.text} transition-colors`}>{r.name}</span>
                      <span className="text-xs text-muted-foreground">{r.state ? `${r.state}, ` : ""}{r.country}</span>
                    </button>
                  ))
                : <p className="text-center text-xs text-muted-foreground py-3">No results found</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type CompareDir = "a" | "b" | "tie";

function compareVal(a: number, b: number, higherIsBetter: boolean): CompareDir {
  if (Math.abs(a - b) < 0.5) return "tie";
  if (higherIsBetter) return a > b ? "a" : "b";
  return a < b ? "a" : "b";
}

function WinnerBadge({ winner, side }: { winner: CompareDir; side: "a" | "b" }) {
  if (winner === "tie") return <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">TIE</span>;
  if (winner === side) return <Trophy size={14} className="text-yellow-400" />;
  return <Minus size={12} className="text-muted-foreground/40" />;
}

function Arrow({ winner, side }: { winner: CompareDir; side: "a" | "b" }) {
  if (winner === side) return <ArrowUp size={12} className="text-green-400" />;
  if (winner !== "tie") return <ArrowDown size={12} className="text-red-400/60" />;
  return <Minus size={12} className="text-muted-foreground/40" />;
}

interface StatRowProps {
  label: string;
  valA: number;
  valB: number;
  unit: string;
  higherIsBetter: boolean;
  decimals?: number;
  icon: React.ReactNode;
}

function StatRow({ label, valA, valB, unit, higherIsBetter, decimals = 0, icon }: StatRowProps) {
  const winner = compareVal(valA, valB, higherIsBetter);
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-3 border-b border-border/20 last:border-0">
      <div className={`flex items-center justify-end gap-2 ${winner === "a" ? "text-foreground" : "text-muted-foreground"}`}>
        <Arrow winner={winner} side="a" />
        <span className="font-semibold">{valA.toFixed(decimals)}{unit}</span>
        <WinnerBadge winner={winner} side="a" />
      </div>
      <div className="flex flex-col items-center gap-0.5 px-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 whitespace-nowrap">{label}</span>
        <span className="text-muted-foreground/40">{icon}</span>
      </div>
      <div className={`flex items-center gap-2 ${winner === "b" ? "text-foreground" : "text-muted-foreground"}`}>
        <WinnerBadge winner={winner} side="b" />
        <span className="font-semibold">{valB.toFixed(decimals)}{unit}</span>
        <Arrow winner={winner} side="b" />
      </div>
    </div>
  );
}

const QUICK_PAIRS = [
  { a: "London", b: "Paris" },
  { a: "New York", b: "Los Angeles" },
  { a: "Tokyo", b: "Mumbai" },
  { a: "Sydney", b: "Melbourne" },
  { a: "Dubai", b: "Singapore" },
];

interface WeatherComparisonProps {
  unit: "C" | "F";
}

export function WeatherComparison({ unit }: WeatherComparisonProps) {
  const [cityA, setCityA] = useState<CityData>({ name: "", current: null, forecast: null, aqi: null, loading: false, error: null });
  const [cityB, setCityB] = useState<CityData>({ name: "", current: null, forecast: null, aqi: null, loading: false, error: null });
  const [chartTab, setChartTab] = useState<"temp" | "radar">("temp");

  const loadCity = async (side: "a" | "b", name: string) => {
    if (!name) {
      if (side === "a") setCityA({ name: "", current: null, forecast: null, aqi: null, loading: false, error: null });
      else setCityB({ name: "", current: null, forecast: null, aqi: null, loading: false, error: null });
      return;
    }
    const setter = side === "a" ? setCityA : setCityB;
    setter(prev => ({ ...prev, name, loading: true, error: null }));
    try {
      const current = await fetchWeather(name);
      const [forecast, aqi] = await Promise.all([
        fetchForecast(name),
        fetchAirQuality(current.coord.lat, current.coord.lon),
      ]);
      setter({ name: current.name, current, forecast, aqi, loading: false, error: null });
    } catch {
      setter(prev => ({ ...prev, loading: false, error: "Failed to load" }));
    }
  };

  const loadPair = (pair: { a: string; b: string }) => {
    loadCity("a", pair.a);
    loadCity("b", pair.b);
  };

  const bothLoaded = cityA.current && cityB.current;

  const tempA = cityA.current ? convertTemp(cityA.current.main.temp, unit) : 0;
  const tempB = cityB.current ? convertTemp(cityB.current.main.temp, unit) : 0;

  // Build 5-day bar chart data
  const buildDailyTemps = (forecast: Forecast | null): Record<string, { min: number; max: number }> => {
    const daily: Record<string, { min: number; max: number }> = {};
    forecast?.list.forEach(item => {
      const day = new Date(item.dt * 1000).toLocaleDateString("en-US", { weekday: "short" });
      const mn = convertTemp(item.main.temp_min, unit);
      const mx = convertTemp(item.main.temp_max, unit);
      if (!daily[day]) daily[day] = { min: mn, max: mx };
      else { daily[day].min = Math.min(daily[day].min, mn); daily[day].max = Math.max(daily[day].max, mx); }
    });
    return daily;
  };

  const daysA = buildDailyTemps(cityA.forecast);
  const daysB = buildDailyTemps(cityB.forecast);
  const allDays = [...new Set([...Object.keys(daysA), ...Object.keys(daysB)])].slice(0, 5);

  const barChartData = allDays.map(day => ({
    day,
    [`${cityA.name || "A"} High`]: daysA[day]?.max ?? null,
    [`${cityA.name || "A"} Low`]: daysA[day]?.min ?? null,
    [`${cityB.name || "B"} High`]: daysB[day]?.max ?? null,
    [`${cityB.name || "B"} Low`]: daysB[day]?.min ?? null,
  }));

  // Radar chart — normalise 5 dimensions: temp (0-50°C), humidity, wind (0-30), visibility (0-10), AQI inverted
  const normalise = (v: number, min: number, max: number) => Math.round(((v - min) / (max - min)) * 100);
  const radarData = [
    {
      stat: "Temperature",
      A: cityA.current ? normalise(Math.min(Math.max(cityA.current.main.temp, -10), 50), -10, 50) : 0,
      B: cityB.current ? normalise(Math.min(Math.max(cityB.current.main.temp, -10), 50), -10, 50) : 0,
    },
    {
      stat: "Humidity",
      A: cityA.current ? 100 - cityA.current.main.humidity : 0,
      B: cityB.current ? 100 - cityB.current.main.humidity : 0,
    },
    {
      stat: "Wind",
      A: cityA.current ? Math.max(0, 100 - normalise(cityA.current.wind.speed, 0, 20)) : 0,
      B: cityB.current ? Math.max(0, 100 - normalise(cityB.current.wind.speed, 0, 20)) : 0,
    },
    {
      stat: "Visibility",
      A: cityA.current ? normalise(Math.min(cityA.current.visibility / 1000, 10), 0, 10) : 0,
      B: cityB.current ? normalise(Math.min(cityB.current.visibility / 1000, 10), 0, 10) : 0,
    },
    {
      stat: "Air Quality",
      A: cityA.aqi ? (6 - cityA.aqi.list[0].main.aqi) * 20 : 0,
      B: cityB.aqi ? (6 - cityB.aqi.list[0].main.aqi) * 20 : 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* City search row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CitySearch label="City A" color="cyan" onSelect={n => loadCity("a", n)} current={cityA.name} loading={cityA.loading} />
        <CitySearch label="City B" color="violet" onSelect={n => loadCity("b", n)} current={cityB.name} loading={cityB.loading} />
      </div>

      {/* Quick pair pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold mr-1">Quick pairs:</span>
        {QUICK_PAIRS.map((pair, i) => (
          <button
            key={i}
            onClick={() => loadPair(pair)}
            className="px-3 py-1.5 text-xs font-medium rounded-full border border-border/50 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all"
          >
            {pair.a} vs {pair.b}
          </button>
        ))}
      </div>

      {/* Placeholder when nothing loaded */}
      {!cityA.current && !cityB.current && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border/40 bg-card/40 h-64 flex flex-col items-center justify-center gap-4 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MapPin size={28} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-lg">Pick two cities to compare</p>
            <p className="text-sm text-muted-foreground mt-1">Search above or tap a quick pair to get started</p>
          </div>
        </motion.div>
      )}

      {/* Main comparison panel */}
      <AnimatePresence>
        {bothLoaded && cityA.current && cityB.current && (
          <motion.div
            key="comparison"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Hero cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { data: cityA, side: "a" as const, accentCls: "from-primary/20 to-transparent border-primary/30", badge: "text-primary" },
                { data: cityB, side: "b" as const, accentCls: "from-accent/20 to-transparent border-accent/30", badge: "text-accent" },
              ].map(({ data, accentCls, badge }) => (
                <motion.div
                  key={data.name}
                  whileHover={{ y: -4 }}
                  className={`relative overflow-hidden rounded-3xl bg-card border ${accentCls.split(" ")[2]} p-6`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${accentCls.split(" ").slice(0, 2).join(" ")} pointer-events-none`} />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`text-2xl font-black ${badge}`}>{data.current!.name}</h3>
                        <p className="text-muted-foreground text-sm">{data.current!.sys.country}</p>
                      </div>
                      {getWeatherIcon(data.current!.weather[0].icon, 44)}
                    </div>
                    <div className="text-6xl font-black tracking-tighter mb-1">
                      {Math.round(convertTemp(data.current!.main.temp, unit))}°{unit}
                    </div>
                    <p className="text-muted-foreground text-sm capitalize">{data.current!.weather[0].description}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <span className="text-muted-foreground">Feels like <span className="text-foreground font-semibold">{Math.round(convertTemp(data.current!.main.feels_like, unit))}°</span></span>
                      <span className="text-muted-foreground">Humidity <span className="text-foreground font-semibold">{data.current!.main.humidity}%</span></span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stat-by-stat comparison */}
            <div className="rounded-3xl bg-card border border-border/50 p-6">
              <h3 className="text-lg font-bold mb-1">Head-to-Head Stats</h3>
              <p className="text-xs text-muted-foreground mb-5">
                <span className="text-primary font-semibold">{cityA.current!.name}</span> vs <span className="text-accent font-semibold">{cityB.current!.name}</span>
                &nbsp;·&nbsp;<Trophy size={10} className="inline text-yellow-400 mb-0.5" /> indicates the better value
              </p>

              <StatRow label="Temp" valA={tempA} valB={tempB} unit={`°${unit}`} higherIsBetter={false} icon={<Thermometer size={12} />} />
              <StatRow label="Humidity" valA={cityA.current!.main.humidity} valB={cityB.current!.main.humidity} unit="%" higherIsBetter={false} icon={<Droplets size={12} />} />
              <StatRow label="Wind" valA={cityA.current!.wind.speed} valB={cityB.current!.wind.speed} unit=" m/s" higherIsBetter={false} decimals={1} icon={<Wind size={12} />} />
              <StatRow label="Pressure" valA={cityA.current!.main.pressure} valB={cityB.current!.main.pressure} unit=" hPa" higherIsBetter={false} icon={<Gauge size={12} />} />
              <StatRow label="Visibility" valA={cityA.current!.visibility / 1000} valB={cityB.current!.visibility / 1000} unit=" km" higherIsBetter decimals={1} icon={<Eye size={12} />} />
              {cityA.aqi && cityB.aqi && (
                <StatRow
                  label="AQI"
                  valA={cityA.aqi.list[0].main.aqi}
                  valB={cityB.aqi.list[0].main.aqi}
                  unit=""
                  higherIsBetter={false}
                  icon={<Wind size={12} />}
                />
              )}
            </div>

            {/* AQI comparison pills */}
            {cityA.aqi && cityB.aqi && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { data: cityA, aqi: cityA.aqi, accentBorder: "border-primary/30", accentText: "text-primary" },
                  { data: cityB, aqi: cityB.aqi, accentBorder: "border-accent/30", accentText: "text-accent" },
                ].map(({ data, aqi, accentBorder, accentText }) => {
                  const info = getAqiInfo(aqi.list[0].main.aqi);
                  const pct = (aqi.list[0].main.aqi / 5) * 100;
                  return (
                    <div key={data.name} className={`rounded-2xl bg-card border ${accentBorder} p-5`}>
                      <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${accentText}`}>{data.name} Air Quality</div>
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                            <circle cx="30" cy="30" r="24" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/20" />
                            <motion.circle
                              cx="30" cy="30" r="24" fill="none" stroke="currentColor" strokeWidth="6"
                              strokeDasharray="150.8"
                              initial={{ strokeDashoffset: 150.8 }}
                              animate={{ strokeDashoffset: 150.8 - (150.8 * pct) / 100 }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              className={info.color}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-black">{aqi.list[0].main.aqi}</span>
                          </div>
                        </div>
                        <div>
                          <div className={`text-lg font-black ${info.color}`}>{info.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{info.message}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Charts */}
            <div className="rounded-3xl bg-card border border-border/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Visual Comparison</h3>
                <div className="flex gap-1 bg-muted/40 p-1 rounded-xl">
                  {(["temp", "radar"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setChartTab(tab)}
                      className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${chartTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {chartTab === tab && (
                        <motion.div layoutId="chart-tab" className="absolute inset-0 bg-card border border-border/50 rounded-lg shadow-sm" />
                      )}
                      <span className="relative z-10">{tab === "temp" ? "5-Day Forecast" : "Radar Profile"}</span>
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {chartTab === "temp" ? (
                  <motion.div key="bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={barChartData} barCategoryGap="25%" barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" tick={{ fill: "hsl(215 20% 65%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "hsl(215 20% 65%)", fontSize: 11 }} axisLine={false} tickLine={false} unit={`°${unit}`} />
                        <Tooltip
                          contentStyle={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 20% 20%)", borderRadius: 12, fontSize: 12 }}
                          labelStyle={{ color: "hsl(210 40% 95%)", fontWeight: 700 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, color: "hsl(215 20% 65%)" }} />
                        <Bar dataKey={`${cityA.name} High`} fill="hsl(199 95% 50%)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        <Bar dataKey={`${cityA.name} Low`} fill="hsl(199 95% 50% / 0.4)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        <Bar dataKey={`${cityB.name} High`} fill="hsl(262 80% 60%)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                        <Bar dataKey={`${cityB.name} Low`} fill="hsl(262 80% 60% / 0.4)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                ) : (
                  <motion.div key="radar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-xs text-muted-foreground mb-4 text-center">Higher score = better condition (inverted for humidity, wind & AQI)</p>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="stat" tick={{ fill: "hsl(215 20% 65%)", fontSize: 12 }} />
                        <Radar name={cityA.name} dataKey="A" stroke="hsl(199 95% 50%)" fill="hsl(199 95% 50%)" fillOpacity={0.2} strokeWidth={2} />
                        <Radar name={cityB.name} dataKey="B" stroke="hsl(262 80% 60%)" fill="hsl(262 80% 60%)" fillOpacity={0.2} strokeWidth={2} />
                        <Legend wrapperStyle={{ fontSize: 12, color: "hsl(215 20% 65%)" }} />
                        <Tooltip
                          contentStyle={{ background: "hsl(220 22% 11%)", border: "1px solid hsl(220 20% 20%)", borderRadius: 12, fontSize: 12 }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5-day forecast comparison */}
            {cityA.forecast && cityB.forecast && (
              <div className="rounded-3xl bg-card border border-border/50 p-6">
                <h3 className="text-lg font-bold mb-5">5-Day Forecast Comparison</h3>
                <div className="space-y-3">
                  {allDays.map(day => {
                    const a = daysA[day];
                    const b = daysB[day];
                    const aTempMax = a ? Math.round(a.max) : null;
                    const bTempMax = b ? Math.round(b.max) : null;
                    return (
                      <div key={day} className="grid grid-cols-[1fr_3rem_1fr] items-center gap-3">
                        {/* City A */}
                        <div className="flex items-center justify-end gap-3">
                          <div className="text-right">
                            {aTempMax !== null && <span className="font-bold">{aTempMax}°</span>}
                            {a && <span className="text-xs text-muted-foreground ml-1">{Math.round(a.min)}°</span>}
                          </div>
                          <div className="w-24 h-2 rounded-full bg-muted/30 overflow-hidden">
                            {aTempMax !== null && bTempMax !== null && (
                              <div
                                className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                                style={{ width: `${aTempMax > bTempMax ? 100 : Math.round((aTempMax / bTempMax) * 100)}%` }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Day label */}
                        <div className="text-center text-xs font-bold text-muted-foreground uppercase">{day}</div>

                        {/* City B */}
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 rounded-full bg-muted/30 overflow-hidden">
                            {aTempMax !== null && bTempMax !== null && (
                              <div
                                className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full"
                                style={{ width: `${bTempMax > aTempMax ? 100 : Math.round((bTempMax / aTempMax) * 100)}%` }}
                              />
                            )}
                          </div>
                          <div>
                            {bTempMax !== null && <span className="font-bold">{bTempMax}°</span>}
                            {b && <span className="text-xs text-muted-foreground ml-1">{Math.round(b.min)}°</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border/30 text-xs">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span className="text-muted-foreground">{cityA.name}</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent" /><span className="text-muted-foreground">{cityB.name}</span></div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* One city loaded, waiting for second */}
      {(cityA.current || cityB.current) && !bothLoaded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl border border-dashed border-border/40 h-32 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Now search a second city to compare</p>
        </motion.div>
      )}
    </div>
  );
}
