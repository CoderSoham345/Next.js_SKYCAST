import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, BrainCircuit, Plane, Shirt, Heart, Wheat, ChevronRight } from "lucide-react";
import { CurrentWeather, AirPollution } from "../../types/weather";

interface AIInsightsProps {
  data: CurrentWeather | null;
  aqi: AirPollution | null;
  unit: "C" | "F";
}

function useTypewriter(text: string, speed = 22) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  useEffect(() => {
    let i = 0;
    setIsTyping(true);
    setDisplayedText("");
    const timer = setInterval(() => {
      if (i < text.length) { setDisplayedText(prev => prev + text.charAt(i)); i++; }
      else { setIsTyping(false); clearInterval(timer); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return { displayedText, isTyping };
}

function InsightItem({ text, delayIndex }: { text: string; delayIndex: number }) {
  const [start, setStart] = useState(false);
  const { displayedText, isTyping } = useTypewriter(start ? text : "", 18);
  useEffect(() => {
    const t = setTimeout(() => setStart(true), delayIndex * 1200);
    return () => clearTimeout(t);
  }, [delayIndex]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: start ? 1 : 0 }} className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">
        {!start || isTyping
          ? <Sparkles size={14} className="text-primary animate-pulse" />
          : <Check size={14} className="text-green-400" />}
      </div>
      <p className="text-sm font-medium leading-relaxed">
        {displayedText}
        {isTyping && <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse align-middle" />}
      </p>
    </motion.div>
  );
}

// ── Insight generators ────────────────────────────────────────────────────────

function genWeather(data: CurrentWeather | null, aqi: AirPollution | null, unit: "C" | "F") {
  const temp = data ? (unit === "F" ? (data.main.temp * 9/5 + 32) : data.main.temp) : 22;
  const hum = data?.main.humidity ?? 60, wind = data?.wind.speed ?? 4;
  const desc = data?.weather[0].main?.toLowerCase() ?? "clear";
  const aqiVal = aqi?.list[0]?.main.aqi ?? 1;
  const ins: string[] = [];
  if (desc.includes("rain") || desc.includes("drizzle")) ins.push("Rain expected today — carry an umbrella and allow extra travel time.");
  else if (desc.includes("thunder")) ins.push("Thunderstorms developing — avoid open areas and stay indoors if possible.");
  else if (desc.includes("clear")) ins.push("Clear skies ahead! Great day for outdoor activities.");
  else ins.push("Partly cloudy conditions — comfortable for most activities.");
  if (temp > 35) ins.push(`Extreme heat at ${Math.round(temp)}°${unit}. Stay hydrated, use sunscreen, avoid peak sun 11am–4pm.`);
  else if (temp < 5) ins.push(`Near-freezing at ${Math.round(temp)}°${unit}. Dress in warm layers and watch for ice on roads.`);
  else ins.push(`Comfortable ${Math.round(temp)}°${unit}. Feels like ${data ? Math.round(unit==="F"?(data.main.feels_like*9/5+32):data.main.feels_like) : Math.round(temp)}°.`);
  if (hum > 80) ins.push(`Very high humidity (${hum}%) — muggy and uncomfortable. Light breathable fabrics recommended.`);
  if (wind > 10) ins.push(`Strong winds at ${wind.toFixed(0)} m/s — secure loose items. Avoid cycling in exposed areas.`);
  if (aqiVal >= 4) ins.push("Poor air quality — limit outdoor exercise. Vulnerable groups should stay indoors.");
  else if (aqiVal <= 2) ins.push("Excellent air quality — perfect for outdoor runs, cycling, or picnics.");
  return ins.slice(0, 4);
}

function genTravel(data: CurrentWeather | null, unit: "C" | "F") {
  const temp = data ? (unit === "F" ? (data.main.temp * 9/5 + 32) : data.main.temp) : 22;
  const desc = data?.weather[0].main?.toLowerCase() ?? "clear";
  const vis = data?.visibility ?? 8000;
  const ins: string[] = [];
  if (desc.includes("rain") || desc.includes("drizzle")) {
    ins.push("Road travel: Reduce speed, increase following distance. Wet roads reduce traction significantly.");
    ins.push("Flight delays possible due to precipitation. Check airline status before heading to the airport.");
  } else if (desc.includes("thunder")) {
    ins.push("Avoid travel during active thunderstorms. Wait for the storm to pass — typically 30–60 minutes.");
    ins.push("Flight cancellations likely. Contact your airline for rebooking options.");
  } else if (vis < 2000) {
    ins.push(`Low visibility (${(vis/1000).toFixed(1)} km) — drive with fog lights on. Delay non-essential travel.`);
  } else {
    ins.push("Good travel conditions overall. Roads and visibility are clear.");
    ins.push("Great time for a road trip or outdoor excursion — enjoy the weather!");
  }
  if (temp > 38) ins.push("Extreme heat advisory: Ensure vehicle AC is working. Carry extra water on long drives.");
  if (temp < 2) ins.push("Risk of black ice on roads. Allow extra braking distance. Consider delaying travel.");
  ins.push(`Best travel window today: ${new Date().getHours() < 12 ? "early morning (6–9 AM)" : "late afternoon (4–7 PM)"} to avoid traffic and heat peaks.`);
  return ins.slice(0, 4);
}

function genClothing(data: CurrentWeather | null, unit: "C" | "F") {
  const temp = data ? (unit === "F" ? (data.main.temp * 9/5 + 32) : data.main.temp) : 22;
  const hum = data?.main.humidity ?? 60;
  const desc = data?.weather[0].main?.toLowerCase() ?? "clear";
  const ins: string[] = [];
  if (temp > 35) ins.push("🌡️ Wear light, loose-fitting cotton or linen clothing. Bright or white colors reflect heat.");
  else if (temp > 25) ins.push("👕 Light t-shirt and breathable trousers. Cotton or moisture-wicking fabrics are best.");
  else if (temp > 15) ins.push("🧥 A light jacket or long-sleeve shirt should be comfortable. Layer up for evenings.");
  else if (temp > 5)  ins.push("🧣 Warm jacket, scarf, and layering recommended. Thermal base layers if being outdoors long.");
  else ins.push("🧤 Heavy coat, gloves, warm hat, and thermal layers essential. Limit skin exposure.");
  if (hum > 80) ins.push("💧 High humidity — avoid tight synthetic fabrics that trap sweat. Breathable, moisture-wicking is key.");
  if (desc.includes("rain") || desc.includes("drizzle")) ins.push("☂️ Waterproof jacket or raincoat advised. Waterproof shoes recommended to keep feet dry.");
  if (desc.includes("thunder")) ins.push("⛈️ Avoid metal accessories. Rubber-soled footwear provides better insulation.");
  if (desc.includes("clear") && temp > 20) ins.push("😎 Don't forget sunglasses and a hat — UV levels can be high on clear days.");
  return ins.slice(0, 4);
}

function genHealth(data: CurrentWeather | null, aqi: AirPollution | null, unit: "C" | "F") {
  const temp = data ? (unit === "F" ? (data.main.temp * 9/5 + 32) : data.main.temp) : 22;
  const hum = data?.main.humidity ?? 60;
  const aqiVal = aqi?.list[0]?.main.aqi ?? 1;
  const pm25 = aqi?.list[0]?.components.pm2_5 ?? 10;
  const ins: string[] = [];
  if (aqiVal >= 4) ins.push(`🚨 Air quality is Poor (AQI ${aqiVal}/5, PM2.5: ${pm25.toFixed(1)} µg/m³). Wear an N95 mask and minimize outdoor exposure.`);
  else if (aqiVal === 3) ins.push(`⚠️ Moderate air quality. Sensitive individuals (asthma, COPD) should limit outdoor time and carry inhalers.`);
  else ins.push(`✅ Air quality is ${aqiVal === 1 ? "Good" : "Fair"}. Generally safe for outdoor activity for most people.`);
  if (temp > 35) ins.push("🌡️ Heat stress risk. Drink at least 3–4L of water. Avoid strenuous activity between 11am–4pm.");
  if (temp < 5)  ins.push("❄️ Cold weather can trigger cardiovascular strain. Warm up gradually before outdoor exercise.");
  if (hum > 85)  ins.push(`💧 Very high humidity (${hum}%) makes heat feel worse. High risk of heat exhaustion — rest frequently.`);
  if (hum < 25)  ins.push(`🏜️ Very dry air (${hum}% RH). Use a humidifier indoors, moisturize skin, and drink extra fluids.`);
  ins.push("💊 Take any prescribed respiratory or cardiovascular medications as scheduled. Consult a doctor if symptoms worsen.");
  return ins.slice(0, 4);
}

function genAgriculture(data: CurrentWeather | null, aqi: AirPollution | null) {
  const temp = data?.main.temp ?? 25;
  const hum = data?.main.humidity ?? 60;
  const desc = data?.weather[0].main?.toLowerCase() ?? "clear";
  const wind = data?.wind.speed ?? 4;
  const ins: string[] = [];
  if (desc.includes("rain") || desc.includes("drizzle")) {
    ins.push("🌧️ Rain today — delay fertilizer and pesticide application. Wait 24 hours after rainfall for field access.");
    ins.push("💧 Natural irrigation underway — reduce or pause irrigation schedules to prevent waterlogging.");
  } else if (hum < 30) {
    ins.push("🌵 Very low humidity — high evapotranspiration rates. Increase irrigation frequency for sensitive crops.");
  } else {
    ins.push("☀️ No precipitation expected. Maintain regular irrigation schedule based on crop water requirements.");
  }
  if (temp > 38) ins.push("🔥 Extreme heat stress risk for crops. Apply mulch to retain soil moisture. Irrigate in early morning or evening.");
  else if (temp < 5) ins.push("🌡️ Frost risk overnight. Cover frost-sensitive crops. Delay transplanting seedlings.");
  if (wind > 8)  ins.push(`🌬️ Strong winds (${wind.toFixed(0)} m/s) — avoid spraying operations. Check young crops for wind damage.`);
  if (hum > 85)  ins.push("🍄 High humidity favors fungal diseases (blight, mildew). Scout fields and apply preventive fungicides.");
  return ins.slice(0, 4);
}

// ── Tab config ────────────────────────────────────────────────────────────────

type TabId = "weather" | "travel" | "clothing" | "health" | "agriculture";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "weather",     label: "Weather",     icon: <BrainCircuit size={13} /> },
  { id: "travel",      label: "Travel",      icon: <Plane size={13} />        },
  { id: "clothing",    label: "Clothing",    icon: <Shirt size={13} />        },
  { id: "health",      label: "Health",      icon: <Heart size={13} />        },
  { id: "agriculture", label: "Farming",     icon: <Wheat size={13} />        },
];

export function AIInsights({ data, aqi, unit }: AIInsightsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("weather");
  const [key, setKey] = useState(0);

  const handleTab = (tab: TabId) => { setActiveTab(tab); setKey(k => k + 1); };

  const insightMap: Record<TabId, string[]> = {
    weather:     genWeather(data, aqi, unit),
    travel:      genTravel(data, unit),
    clothing:    genClothing(data, unit),
    health:      genHealth(data, aqi, unit),
    agriculture: genAgriculture(data, aqi),
  };
  const insights = insightMap[activeTab];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-6 group">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl opacity-50 z-[-1]" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-primary" size={22} />
          <h3 className="font-bold text-lg">AI Insights</h3>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-full border border-border/50">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">LIVE</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => handleTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border ${
              activeTab === t.id
                ? "bg-primary/20 border-primary/40 text-primary"
                : "border-border/30 text-muted-foreground hover:text-foreground hover:border-border"
            }`}>
            {t.icon}{t.label}
            {activeTab === t.id && <ChevronRight size={10} />}
          </button>
        ))}
      </div>

      {/* Insights */}
      <AnimatePresence mode="wait">
        <motion.div key={`${activeTab}-${key}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="space-y-4 min-h-[160px] mb-4">
          {insights.map((insight, i) => (
            <InsightItem key={i} text={insight} delayIndex={i} />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Model: SkyCast-v3.1</span>
        <div className="text-xs text-muted-foreground font-medium flex gap-3">
          <span>Acc: 94.2%</span>
          <span>Auto-refreshes every 5 min</span>
        </div>
      </div>
    </div>
  );
}
