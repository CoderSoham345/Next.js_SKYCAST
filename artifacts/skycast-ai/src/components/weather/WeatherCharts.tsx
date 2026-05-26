import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, ComposedChart, Area, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Forecast } from "../../types/weather";
import { convertTemp } from "../../lib/weatherUtils";

interface WeatherChartsProps {
  data: Forecast | null;
  unit: "C" | "F";
}

export function WeatherCharts({ data, unit }: WeatherChartsProps) {
  const [activeTab, setActiveTab] = useState<"temp" | "wind">("temp");

  if (!data) return null;

  const chartData = data.list.slice(0, 12).map(item => {
    const date = new Date(item.dt * 1000);
    return {
      time: date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      temp: Math.round(convertTemp(item.main.temp, unit)),
      precip: Math.round(item.pop * 100),
      wind: Math.round(item.wind.speed * 10) / 10
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 p-3 rounded-xl shadow-xl">
          <p className="font-bold text-sm mb-2">{label}</p>
          {payload.map((p: any, i: number) => (
             <div key={i} className="flex items-center gap-2 text-sm font-medium">
               <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
               <span className="text-muted-foreground">{p.name}:</span>
               <span>{p.value}{p.name === 'Precipitation' ? '%' : p.name === 'Wind' ? ' m/s' : '°'}</span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-3xl bg-card border border-border/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-xl">Forecast Trends</h3>
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border/30">
          <button
            onClick={() => setActiveTab("temp")}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === "temp" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Temperature
          </button>
          <button
            onClick={() => setActiveTab("wind")}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === "wind" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Wind
          </button>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <AnimatePresence mode="wait">
          {activeTab === "temp" ? (
            <motion.div key="temp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.2)" }} />
                  <Bar yAxisId="right" dataKey="precip" name="Precipitation" fill="hsl(var(--accent)/0.3)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Area yAxisId="left" type="monotone" dataKey="temp" name="Temperature" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div key="wind" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.2)" }} />
                  <Line type="monotone" dataKey="wind" name="Wind" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
