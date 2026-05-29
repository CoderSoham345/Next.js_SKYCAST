import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AirPollution } from "../../types/weather";
import { getAqiInfo, pm25ToAqi, formatAqi3 } from "../../lib/weatherUtils";
import { TrendingUp, TrendingDown, Minus, Heart, Wind, Activity, Shield, Radio, AlertCircle } from "lucide-react";
import { DataSource } from "../../lib/weatherApi";

interface AirQualityProps {
  data: AirPollution | null;
  dataSource?: DataSource;
  lastRefreshed?: Date | null;
}

const POLLUTANTS = [
  { key: "pm2_5",  label: "PM2.5", unit: "µg/m³", safe: 12,  warn: 35,  desc: "Fine particles" },
  { key: "pm10",   label: "PM10",  unit: "µg/m³", safe: 54,  warn: 154, desc: "Coarse particles" },
  { key: "no2",    label: "NO₂",   unit: "µg/m³", safe: 40,  warn: 80,  desc: "Nitrogen dioxide" },
  { key: "o3",     label: "O₃",    unit: "µg/m³", safe: 100, warn: 160, desc: "Ozone" },
  { key: "so2",    label: "SO₂",   unit: "µg/m³", safe: 20,  warn: 80,  desc: "Sulphur dioxide" },
  { key: "co",     label: "CO",    unit: "µg/m³", safe: 4400,warn: 9400,desc: "Carbon monoxide" },
] as const;

type PollutantKey = typeof POLLUTANTS[number]["key"];

function getPollutantLevel(val: number, safe: number, warn: number) {
  if (val <= safe) return { label: "Safe",    color: "#22c55e", pct: (val / safe) * 33 };
  if (val <= warn) return { label: "Moderate",color: "#f97316", pct: 33 + ((val - safe) / (warn - safe)) * 33 };
  return { label: "High", color: "#ef4444", pct: Math.min(99, 66 + ((val - warn) / warn) * 33) };
}

// Simulate trend from hour-of-day (dawn=improving, midday=worsening, evening=stable)
function getTrend(): { icon: React.ReactNode; label: string; color: string } {
  const h = new Date().getHours();
  if (h >= 6  && h < 11) return { icon: <TrendingDown size={14} />, label: "Improving", color: "text-green-400" };
  if (h >= 11 && h < 18) return { icon: <TrendingUp   size={14} />, label: "Worsening", color: "text-red-400"   };
  return                         { icon: <Minus        size={14} />, label: "Stable",    color: "text-yellow-400"};
}

const HEALTH_ACTIVITIES = [
  { icon: "🏃", label: "Running",    aqiOk: 3 },
  { icon: "🚴", label: "Cycling",    aqiOk: 2 },
  { icon: "🧘", label: "Yoga",       aqiOk: 4 },
  { icon: "👶", label: "Kids Outdoors", aqiOk: 2 },
  { icon: "🧓", label: "Seniors",    aqiOk: 2 },
  { icon: "🏥", label: "Asthma Risk",aqiOk: 2 },
];

export function AirQuality({ data, dataSource = "unavailable", lastRefreshed }: AirQualityProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "pollutants" | "health">("overview");

  if (!data || !data.list.length) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card border border-border/50 rounded-3xl p-6 h-full flex flex-col items-center justify-center gap-2 min-h-[160px]">
        <AlertCircle size={28} className="text-muted-foreground" />
        <p className="font-semibold text-sm text-muted-foreground">AQI data unavailable</p>
        <p className="text-[10px] text-muted-foreground/50">Live air quality data could not be retrieved</p>
      </motion.div>
    );
  }

  const aqiValue    = data.list[0].main.aqi;
  const components  = data.list[0].components;
  const info        = getAqiInfo(aqiValue);
  const traditionalAqi = pm25ToAqi(components.pm2_5);
  const trend       = getTrend();
  const percentage  = (aqiValue / 5) * 100;

  const tabs = [
    { id: "overview"   as const, label: "Overview"   },
    { id: "pollutants" as const, label: "Pollutants"  },
    { id: "health"     as const, label: "Health Tips" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card border border-border/50 rounded-3xl p-6 h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold">Air Quality Index</h3>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend.color}`}>
            {trend.icon}{trend.label}
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border"
            style={{ background: `${info.hex}18`, color: info.hex, borderColor: `${info.hex}40` }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: info.hex }} />
            {info.label}
          </span>
        </div>
      </div>
      {/* Source + last updated */}
      <div className="flex items-center gap-3 mb-4 text-[10px] text-muted-foreground/60">
        <span className={`flex items-center gap-1 font-semibold ${
          dataSource === "owm" ? "text-green-400" : dataSource === "open-meteo" ? "text-yellow-400" : "text-red-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            dataSource === "owm" ? "bg-green-400" : dataSource === "open-meteo" ? "bg-yellow-400" : "bg-red-400"
          }`} />
          <Radio size={8} />
          {dataSource === "owm" ? "OpenWeatherMap" : dataSource === "open-meteo" ? "Open-Meteo" : "Live data unavailable"}
        </span>
        <span>·</span>
        <span>PM2.5 → US EPA AQI formula</span>
        {lastRefreshed && <><span>·</span><span>Updated {lastRefreshed.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span></>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted/30 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Overview tab ──────────────────────────────────────── */}
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Circular meter */}
              <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                  <motion.circle cx="50" cy="50" r="40" fill="transparent" strokeWidth="8"
                    strokeDasharray="251.2"
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * percentage) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    stroke={info.hex} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black">{formatAqi3(traditionalAqi)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: info.hex }}>{info.label}</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">US AQI</span>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                {/* OWM scale 1-5 + traditional AQI */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/20 rounded-xl p-3 border border-border/30">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">OWM Scale</div>
                    <div className="text-2xl font-black" style={{ color: info.hex }}>{aqiValue}/5</div>
                    <div className="text-xs text-muted-foreground">{info.label}</div>
                  </div>
                  <div className="bg-muted/20 rounded-xl p-3 border border-border/30">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">US AQI</div>
                    <div className="text-2xl font-black" style={{ color: info.hex }}>{formatAqi3(traditionalAqi)}</div>
                    <div className="text-xs text-muted-foreground">Based on PM2.5</div>
                  </div>
                </div>

                {/* Message */}
                <p className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border/30 leading-relaxed">
                  {info.message}
                </p>

                {/* AQI scale bar */}
                <div>
                  <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
                    <span>0</span><span>50</span><span>100</span><span>150</span><span>200</span><span>300+</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden flex">
                    {["#22c55e","#84cc16","#eab308","#f97316","#ef4444","#a855f7"].map((c, i) => (
                      <div key={i} className="flex-1" style={{ background: c }} />
                    ))}
                  </div>
                  <motion.div className="relative -mt-4 ml-0.5"
                    animate={{ left: `${Math.min((traditionalAqi / 400) * 100, 98)}%` }}
                    style={{ position: "relative" }}>
                    <div className="w-2 h-4 bg-white rounded-sm shadow-lg mx-auto" style={{ marginLeft: `${Math.min((traditionalAqi / 400) * 100, 96)}%` }} />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Quick pollutant summary */}
            <div className="grid grid-cols-4 gap-3 mt-5">
              {(["pm2_5","pm10","no2","o3"] as PollutantKey[]).map(k => {
                const p = POLLUTANTS.find(p => p.key === k)!;
                const v = components[k];
                const level = getPollutantLevel(v, p.safe, p.warn);
                return (
                  <div key={k} className="text-center">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">{p.label}</div>
                    <div className="text-lg font-black">{v.toFixed(0)}</div>
                    <div className="text-[9px]" style={{ color: level.color }}>{level.label}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Pollutants tab ─────────────────────────────────────── */}
        {activeTab === "pollutants" && (
          <motion.div key="pollutants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {POLLUTANTS.map(p => {
              const v = components[p.key];
              const level = getPollutantLevel(v, p.safe, p.warn);
              return (
                <div key={p.key} className="bg-muted/10 border border-border/30 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-sm font-bold">{p.label}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{p.desc}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black">{v.toFixed(1)}</span>
                      <span className="text-[10px] text-muted-foreground">{p.unit}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${level.color}20`, color: level.color }}>
                        {level.label}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: level.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(level.pct, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }} />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
                    <span>Safe: ≤{p.safe}</span>
                    <span>Warn: ≤{p.warn}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── Health tab ─────────────────────────────────────────── */}
        {activeTab === "health" && (
          <motion.div key="health" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Health message */}
            <div className="flex items-start gap-3 p-4 rounded-2xl border"
              style={{ background: `${info.hex}10`, borderColor: `${info.hex}30` }}>
              <Shield size={18} style={{ color: info.hex }} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm mb-1" style={{ color: info.hex }}>Health Advisory — {info.label}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{info.health}</p>
              </div>
            </div>

            {/* Recommendation */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
              <Heart size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{info.recommendation}</p>
            </div>

            {/* Activity safety grid */}
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Activity size={11} />Activity Safety
              </div>
              <div className="grid grid-cols-3 gap-2">
                {HEALTH_ACTIVITIES.map(a => {
                  const safe = aqiValue <= a.aqiOk;
                  return (
                    <div key={a.label} className={`rounded-xl p-2.5 border text-center ${safe ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                      <div className="text-lg mb-1">{a.icon}</div>
                      <div className="text-[10px] font-semibold truncate">{a.label}</div>
                      <div className={`text-[9px] font-bold mt-0.5 ${safe ? "text-green-400" : "text-red-400"}`}>
                        {safe ? "✓ Safe" : "✗ Avoid"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mask recommendation */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/30">
              <span className="text-2xl">😷</span>
              <div>
                <div className="text-xs font-bold">
                  {aqiValue <= 2 ? "No mask needed" : aqiValue === 3 ? "Surgical mask recommended" : "N95 mask strongly advised"}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {aqiValue <= 2 ? "Air is clean enough for breathing freely." : "Protect yourself from airborne pollutants."}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
