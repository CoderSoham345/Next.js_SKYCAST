import { motion } from "framer-motion";
import { AirPollution } from "../../types/weather";
import { getAqiInfo } from "../../lib/weatherUtils";

interface AirQualityProps {
  data: AirPollution | null;
}

export function AirQuality({ data }: AirQualityProps) {
  if (!data || !data.list.length) return null;

  const aqiValue = data.list[0].main.aqi;
  const components = data.list[0].components;
  const info = getAqiInfo(aqiValue);

  // Map 1-5 to percentage for circular progress
  const percentage = (aqiValue / 5) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card border border-border/50 rounded-3xl p-6 h-full"
    >
      <h3 className="text-xl font-bold mb-6">Air Quality Index</h3>
      
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Circular AQI Indicator */}
        <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray="251.2"
              initial={{ strokeDashoffset: 251.2 }}
              animate={{ strokeDashoffset: 251.2 - (251.2 * percentage) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={info.color}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-black">{aqiValue}</span>
            <span className={`text-sm font-bold tracking-wider uppercase ${info.color}`}>
              {info.label}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-6 bg-muted/20 p-4 rounded-2xl border border-border/40">
            {info.message}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase">PM2.5</span>
              <span className="text-lg font-bold">{components.pm2_5.toFixed(1)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase">PM10</span>
              <span className="text-lg font-bold">{components.pm10.toFixed(1)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase">NO2</span>
              <span className="text-lg font-bold">{components.no2.toFixed(1)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase">O3</span>
              <span className="text-lg font-bold">{components.o3.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
