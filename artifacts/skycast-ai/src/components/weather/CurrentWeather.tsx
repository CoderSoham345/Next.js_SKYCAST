import { motion } from "framer-motion";
import { Droplets, Wind, Eye, Sun, Sunrise, Sunset, RefreshCw, Radio, AlertCircle } from "lucide-react";
import { CurrentWeather as CurrentWeatherType } from "../../types/weather";
import { getWeatherIcon, convertTemp, formatTime } from "../../lib/weatherUtils";
import { LiveClock } from "./LiveClock";
import { DataSource } from "../../lib/weatherApi";
import { ApiStatus } from "../../hooks/useWeather";

interface CurrentWeatherProps {
  data: CurrentWeatherType | null;
  unit: "C" | "F";
  dataSource?: DataSource;
  apiStatus?: ApiStatus;
  lastRefreshed?: Date | null;
  onRefresh?: () => void;
}

const SOURCE_LABELS: Record<DataSource, { label: string; color: string; dot: string }> = {
  "owm":         { label: "OpenWeatherMap",  color: "text-green-400",  dot: "bg-green-400"  },
  "open-meteo":  { label: "Open-Meteo",      color: "text-yellow-400", dot: "bg-yellow-400" },
  "unavailable": { label: "Live data unavailable", color: "text-red-400", dot: "bg-red-400"  },
};

export function CurrentWeather({
  data, unit,
  dataSource = "unavailable",
  apiStatus,
  lastRefreshed,
  onRefresh,
}: CurrentWeatherProps) {
  if (!data) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <AlertCircle size={32} className="text-muted-foreground" />
        <p className="font-semibold text-muted-foreground">Live weather data unavailable</p>
        <p className="text-xs text-muted-foreground/60">Check your API key or network connection</p>
        {onRefresh && (
          <button onClick={onRefresh} className="mt-2 px-4 py-1.5 rounded-xl bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-colors">
            Try Again
          </button>
        )}
      </motion.div>
    );
  }

  const temp      = convertTemp(data.main.temp, unit);
  const feelsLike = convertTemp(data.main.feels_like, unit);
  const srcInfo   = SOURCE_LABELS[dataSource];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-card border border-border/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  {data.name}{data.sys.country ? `, ${data.sys.country}` : ""}
                </h2>
                <div className="flex items-center gap-4">
                  <p className="text-muted-foreground font-medium">
                    {new Date(data.dt * 1000).toLocaleDateString("en-US", {
                      weekday: "long", month: "long", day: "numeric",
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
            <div className="text-2xl font-bold">{data.wind.speed.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">m/s</span></div>
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

      {/* ── Transparency footer ─────────────────────────────────────── */}
      <div className="relative z-10 border-t border-border/20 px-6 md:px-8 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 bg-muted/10">
        {/* Source */}
        <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${srcInfo.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${srcInfo.dot}`} />
          <Radio size={9} />
          {srcInfo.label}
        </div>

        {/* API status badges */}
        {apiStatus && (
          <div className="flex items-center gap-2">
            {(["weather","forecast","aqi"] as const).map(key => (
              <span key={key} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                apiStatus[key] === "ok"      ? "bg-green-500/15 text-green-400" :
                apiStatus[key] === "error"   ? "bg-red-500/15 text-red-400"    :
                                               "bg-yellow-500/15 text-yellow-400"
              }`}>
                {key} {apiStatus[key] === "loading" ? "…" : apiStatus[key]}
              </span>
            ))}
          </div>
        )}

        {/* Last updated */}
        {lastRefreshed && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 ml-auto">
            <RefreshCw size={8} />
            Updated {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            {" · "}Auto-refresh every 10 min
          </div>
        )}

        {/* Refresh button */}
        {onRefresh && (
          <button onClick={onRefresh}
            className="ml-1 text-[10px] text-primary font-bold hover:underline flex items-center gap-1">
            <RefreshCw size={8} />Refresh now
          </button>
        )}

        {/* Coordinates */}
        <div className="text-[9px] text-muted-foreground/40">
          {data.coord.lat.toFixed(4)}°N, {data.coord.lon.toFixed(4)}°E
        </div>
      </div>
    </motion.div>
  );
}
