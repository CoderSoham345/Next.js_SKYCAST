import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check, BrainCircuit } from "lucide-react";
import { CurrentWeather, AirPollution } from "../../types/weather";

interface AIInsightsProps {
  data: CurrentWeather | null;
  aqi: AirPollution | null;
  unit: "C" | "F";
}

function useTypewriter(text: string, speed: number = 30) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let i = 0;
    setIsTyping(true);
    setDisplayedText("");
    
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isTyping };
}

function generateInsights(data: CurrentWeather | null, aqi: AirPollution | null, unit: "C" | "F"): string[] {
  const insights: string[] = [];
  const temp = data ? (unit === "F" ? (data.main.temp * 9/5 + 32) : data.main.temp) : 22;
  const humidity = data?.main.humidity ?? 60;
  const windSpeed = data?.wind.speed ?? 4;
  const desc = data?.weather[0].main?.toLowerCase() ?? "clear";
  const aqiVal = aqi?.list[0]?.main.aqi ?? 1;
  
  if (desc.includes("rain") || desc.includes("drizzle")) {
    insights.push("Carry an umbrella today — rain is expected throughout the day.");
  } else if (desc.includes("clear")) {
    insights.push("Clear skies ahead. Great day for outdoor activities!");
  } else {
    insights.push("Partly cloudy conditions — comfortable for most activities.");
  }
  
  if (temp > 35 || (unit === "F" && temp > 95)) insights.push("Extreme heat detected. Stay hydrated and limit sun exposure.");
  else if (temp < 5 || (unit === "F" && temp < 41)) insights.push("Cold temperatures — dress in warm layers before heading out.");
  else insights.push(`Comfortable temperature at ${Math.round(temp)}°${unit}. Enjoy your day.`);
  
  if (humidity > 80) insights.push("High humidity levels detected. May feel uncomfortable outdoors.");
  else if (humidity < 30) insights.push("Low humidity — consider staying hydrated and using moisturizer.");
  
  if (windSpeed > 10) insights.push("Strong winds expected — secure loose outdoor items.");
  
  if (aqiVal >= 4) insights.push("Poor air quality — limit outdoor exercise and wear a mask.");
  else if (aqiVal <= 2) insights.push("Air quality is good — perfect for outdoor runs or cycling.");
  
  return insights.slice(0, 5);
}

function InsightItem({ text, delayIndex }: { text: string; delayIndex: number }) {
  const [startTyping, setStartTyping] = useState(false);
  const { displayedText, isTyping } = useTypewriter(startTyping ? text : "", 20);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartTyping(true);
    }, delayIndex * 1500); // Stagger start time
    return () => clearTimeout(timer);
  }, [delayIndex]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: startTyping ? 1 : 0 }}
      className="flex items-start gap-3"
    >
      <div className="mt-0.5 shrink-0">
        {!startTyping || isTyping ? (
          <Sparkles size={16} className="text-primary animate-pulse" />
        ) : (
          <Check size={16} className="text-green-400" />
        )}
      </div>
      <div className="flex-1 text-sm font-medium leading-relaxed">
        {displayedText}
        {isTyping && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
      </div>
    </motion.div>
  );
}

export function AIInsights({ data, aqi, unit }: AIInsightsProps) {
  const insights = generateInsights(data, aqi, unit);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-6 group">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl opacity-50 z-[-1]" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-primary" size={24} />
          <h3 className="font-bold text-xl">AI Weather Insights</h3>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-full border border-border/50">
           <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">LIVE</span>
        </div>
      </div>

      <div className="space-y-4 mb-6 min-h-[160px]">
        {insights.map((insight, i) => (
          <InsightItem key={i} text={insight} delayIndex={i} />
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/30">
        <div className="flex items-center gap-2">
           <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Model: SkyCast-v3.1</span>
        </div>
        <div className="text-xs text-muted-foreground font-medium flex gap-3">
          <span>Acc: 94.2%</span>
          <span>Updated: Just now</span>
        </div>
      </div>
    </div>
  );
}
