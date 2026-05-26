import { motion } from "framer-motion";
import { Forecast } from "../../types/weather";
import { getWeatherIcon, convertTemp } from "../../lib/weatherUtils";

interface WeeklyForecastProps {
  data: Forecast | null;
  unit: "C" | "F";
}

export function WeeklyForecast({ data, unit }: WeeklyForecastProps) {
  if (!data) return null;

  // Group forecast by day
  const dailyData: Record<string, any> = {};
  
  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString("en-US", { weekday: "short" });
    if (!dailyData[date]) {
      dailyData[date] = {
        min: item.main.temp_min,
        max: item.main.temp_max,
        icon: item.weather[0].icon,
        pop: item.pop
      };
    } else {
      dailyData[date].min = Math.min(dailyData[date].min, item.main.temp_min);
      dailyData[date].max = Math.max(dailyData[date].max, item.main.temp_max);
      if (item.weather[0].icon.includes("d")) { // Prefer day icons
        dailyData[date].icon = item.weather[0].icon;
      }
      dailyData[date].pop = Math.max(dailyData[date].pop, item.pop);
    }
  });

  const days = Object.keys(dailyData).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border/50 rounded-3xl p-6"
    >
      <h3 className="text-xl font-bold mb-6">5-Day Forecast</h3>
      
      <div className="space-y-4">
        {days.map((day, index) => {
          const item = dailyData[day];
          const min = convertTemp(item.min, unit);
          const max = convertTemp(item.max, unit);
          
          return (
            <div 
              key={day} 
              className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/30 transition-colors group"
            >
              <span className="w-12 font-medium">{index === 0 ? "Today" : day}</span>
              
              <div className="flex items-center gap-4 w-24">
                {getWeatherIcon(item.icon, 24)}
                <span className="text-xs text-blue-400 font-medium w-8">
                  {item.pop > 0 ? `${Math.round(item.pop * 100)}%` : ""}
                </span>
              </div>
              
              <div className="flex items-center gap-3 flex-1 justify-end">
                <span className="text-muted-foreground font-medium w-8 text-right">{Math.round(min)}°</span>
                
                {/* Visual temp bar */}
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden relative hidden sm:block">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-blue-400 to-red-400 rounded-full"
                    style={{ 
                      left: '20%', // simplified for mockup
                      right: '20%' 
                    }}
                  />
                </div>
                
                <span className="font-bold w-8 text-right">{Math.round(max)}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
