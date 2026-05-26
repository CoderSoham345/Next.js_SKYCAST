import { motion } from "framer-motion";
import { Droplets, Wind, Eye, Sun, Sunrise, Sunset } from "lucide-react";
import { CurrentWeather as CurrentWeatherType } from "../../types/weather";
import { getWeatherIcon, convertTemp, formatTime } from "../../lib/weatherUtils";
import { LiveClock } from "./LiveClock";

interface CurrentWeatherProps {
  data: CurrentWeatherType | null;
  unit: "C" | "F";
}

export function CurrentWeather({ data, unit }: CurrentWeatherProps) {
  if (!data) return null;

  const temp = convertTemp(data.main.temp, unit);
  const feelsLike = convertTemp(data.main.feels_like, unit);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-6 md:p-8"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  {data.name}, {data.sys.country}
                </h2>
                <div className="flex items-center gap-4">
                  <p className="text-muted-foreground font-medium">
                    {new Date(data.dt * 1000).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <LiveClock timezone={data.timezone} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex items-end gap-6">
            <div className="text-8xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              {Math.round(temp)}°
            </div>
            <div className="mb-4 flex flex-col items-center">
              {getWeatherIcon(data.weather[0].icon, 64, "mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]")}
              <span className="text-lg font-medium capitalize text-muted-foreground">
                {data.weather[0].description}
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-2xl p-4 flex flex-col justify-center border border-border/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Droplets size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Humidity</span>
            </div>
            <div className="text-2xl font-bold">{data.main.humidity}%</div>
          </div>
          
          <div className="bg-muted/30 rounded-2xl p-4 flex flex-col justify-center border border-border/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wind size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Wind</span>
            </div>
            <div className="text-2xl font-bold">{data.wind.speed} <span className="text-sm font-normal text-muted-foreground">m/s</span></div>
          </div>
          
          <div className="bg-muted/30 rounded-2xl p-4 flex flex-col justify-center border border-border/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Sun size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Feels Like</span>
            </div>
            <div className="text-2xl font-bold">{Math.round(feelsLike)}°</div>
          </div>
          
          <div className="bg-muted/30 rounded-2xl p-4 flex flex-col justify-center border border-border/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Eye size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Visibility</span>
            </div>
            <div className="text-2xl font-bold">{(data.visibility / 1000).toFixed(1)} <span className="text-sm font-normal text-muted-foreground">km</span></div>
          </div>
          
          <div className="col-span-2 bg-muted/30 rounded-2xl p-4 flex items-center justify-between border border-border/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-2 rounded-full">
                <Sunrise size={20} className="text-primary" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sunrise</div>
                <div className="font-bold">{formatTime(data.sys.sunrise, data.timezone)}</div>
              </div>
            </div>
            
            <div className="h-8 w-px bg-border/50" />
            
            <div className="flex items-center gap-4">
              <div className="bg-accent/20 p-2 rounded-full">
                <Sunset size={20} className="text-accent" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sunset</div>
                <div className="font-bold">{formatTime(data.sys.sunset, data.timezone)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
