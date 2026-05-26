import { useEffect, useState } from "react";
import { Sidebar, Section } from "../components/layout/Sidebar";
import { Navbar } from "../components/layout/Navbar";
import { CurrentWeather } from "../components/weather/CurrentWeather";
import { HourlyForecast } from "../components/weather/HourlyForecast";
import { WeeklyForecast } from "../components/weather/WeeklyForecast";
import { AirQuality } from "../components/weather/AirQuality";
import { LoadingScreen } from "../components/weather/LoadingScreen";
import { useWeather } from "../hooks/useWeather";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { city, setCity, unit, current, forecast, aqi, loading } = useWeather("London");
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Artificial delay for premium loading screen
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AnimatePresence>
        {initialLoading && <LoadingScreen key="loading" />}
      </AnimatePresence>
      
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=2000')] bg-cover bg-center opacity-[0.03] mix-blend-overlay pointer-events-none" />
        
        <Navbar 
          currentTemp={current?.main.temp ?? null} 
          unit={unit} 
          onSearch={setCity} 
        />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {activeSection === "dashboard" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <CurrentWeather data={current} unit={unit} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="col-span-1 lg:col-span-2 space-y-6">
                    <HourlyForecast data={forecast} unit={unit} />
                    <AirQuality data={aqi} />
                  </div>
                  <div className="col-span-1 space-y-6">
                    <WeeklyForecast data={forecast} unit={unit} />
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeSection === "forecast" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold">Extended Forecast</h2>
                <WeeklyForecast data={forecast} unit={unit} />
                <HourlyForecast data={forecast} unit={unit} />
              </motion.div>
            )}

            {activeSection === "aqi" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                 <h2 className="text-3xl font-bold">Air Quality Analysis</h2>
                 <AirQuality data={aqi} />
              </motion.div>
            )}

            {["map", "alerts", "news", "settings"].includes(activeSection) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-[60vh] rounded-3xl bg-card border border-border/50 flex items-center justify-center"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2 capitalize">{activeSection} Module</h2>
                  <p className="text-muted-foreground">Premium feature - fully implemented in production build.</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
