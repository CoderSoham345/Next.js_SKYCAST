import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getWeatherIcon } from "../../lib/weatherUtils";

interface WorldWeatherProps {
  unit: "C" | "F";
}

const regions = {
  "Asia": [
    { city: "Tokyo", temp: 28, icon: "01d", desc: "Clear" },
    { city: "Mumbai", temp: 32, icon: "10d", desc: "Rainy" },
    { city: "Beijing", temp: 24, icon: "03d", desc: "Cloudy" },
  ],
  "Europe": [
    { city: "London", temp: 18, icon: "02d", desc: "Partly Cloudy" },
    { city: "Paris", temp: 22, icon: "01d", desc: "Sunny" },
    { city: "Berlin", temp: 16, icon: "09d", desc: "Drizzle" },
  ],
  "North America": [
    { city: "New York", temp: 25, icon: "01d", desc: "Clear" },
    { city: "Los Angeles", temp: 29, icon: "01d", desc: "Sunny" },
    { city: "Toronto", temp: 20, icon: "04d", desc: "Overcast" },
  ],
  "South America": [
    { city: "São Paulo", temp: 27, icon: "10d", desc: "Rainy" },
    { city: "Buenos Aires", temp: 19, icon: "01d", desc: "Clear" },
    { city: "Lima", temp: 22, icon: "03d", desc: "Foggy" },
  ],
  "Africa": [
    { city: "Cairo", temp: 38, icon: "01d", desc: "Hot & Sunny" },
    { city: "Lagos", temp: 31, icon: "10d", desc: "Rainy" },
    { city: "Nairobi", temp: 24, icon: "02d", desc: "Pleasant" },
  ],
  "Australia": [
    { city: "Sydney", temp: 22, icon: "01d", desc: "Clear" },
    { city: "Melbourne", temp: 17, icon: "04d", desc: "Cloudy" },
    { city: "Perth", temp: 26, icon: "01d", desc: "Sunny" },
  ]
};

export function WorldWeather({ unit }: WorldWeatherProps) {
  const [activeRegion, setActiveRegion] = useState<keyof typeof regions>("Europe");

  return (
    <div className="rounded-3xl bg-card border border-border/50 p-6">
      <h3 className="font-bold text-xl mb-4">World Weather</h3>
      
      <div className="flex overflow-x-auto pb-2 mb-4 gap-2 scrollbar-none">
        {(Object.keys(regions) as Array<keyof typeof regions>).map((region) => (
          <button
            key={region}
            onClick={() => setActiveRegion(region)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeRegion === region ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            {region}
          </button>
        ))}
      </div>

      <div className="relative min-h-[220px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRegion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 absolute inset-0 w-full"
          >
            {regions[activeRegion].map((city, i) => (
              <motion.div
                key={city.city}
                whileHover={{ scale: 1.02, x: 4 }}
                className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/30 hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-background rounded-full shadow-sm">
                    {getWeatherIcon(city.icon, 24)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{city.city}</h4>
                    <p className="text-xs text-muted-foreground">{city.desc}</p>
                  </div>
                </div>
                <div className="font-bold text-lg">
                  {Math.round(unit === "F" ? city.temp * 9/5 + 32 : city.temp)}°
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
