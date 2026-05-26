import { motion } from "framer-motion";
import { Forecast } from "../../types/weather";
import { getWeatherIcon, convertTemp } from "../../lib/weatherUtils";

interface HourlyForecastProps {
  data: Forecast | null;
  unit: "C" | "F";
}

export function HourlyForecast({ data, unit }: HourlyForecastProps) {
  if (!data) return null;

  // Get next 8 items (24 hours)
  const hourlyData = data.list.slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border/50 rounded-3xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">24-Hour Forecast</h3>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {hourlyData.map((item, index) => {
          const temp = convertTemp(item.main.temp, unit);
          const time = new Date(item.dt * 1000).toLocaleTimeString("en-US", {
            hour: "numeric",
            hour12: true,
          });
          
          return (
            <div 
              key={index}
              className="flex-shrink-0 snap-center w-24 bg-muted/20 border border-border/40 hover:border-primary/40 rounded-2xl p-4 flex flex-col items-center justify-between transition-colors gap-3"
            >
              <span className="text-sm font-medium text-muted-foreground">{index === 0 ? "Now" : time}</span>
              {getWeatherIcon(item.weather[0].icon, 32)}
              <span className="text-lg font-bold">{Math.round(temp)}°</span>
              
              <div className="flex items-center gap-1 text-xs text-blue-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {Math.round(item.pop * 100)}%
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
