import { useEffect, useState } from "react";
import { Sidebar, Section } from "../components/layout/Sidebar";
import { Navbar } from "../components/layout/Navbar";
import { CurrentWeather } from "../components/weather/CurrentWeather";
import { HourlyForecast } from "../components/weather/HourlyForecast";
import { WeeklyForecast } from "../components/weather/WeeklyForecast";
import { AirQuality } from "../components/weather/AirQuality";
import { LoadingScreen } from "../components/weather/LoadingScreen";
import { WeatherMap } from "../components/weather/WeatherMap";
import { WeatherAlerts } from "../components/weather/WeatherAlerts";
import { WeatherNews } from "../components/weather/WeatherNews";
import { AIInsights } from "../components/weather/AIInsights";
import { WeatherCharts } from "../components/weather/WeatherCharts";
import { WorldWeather } from "../components/weather/WorldWeather";
import { SettingsPanel } from "../components/weather/SettingsPanel";
import { WeatherComparison } from "../components/weather/WeatherComparison";
import { MumbaiZoneMonitor } from "../components/weather/MumbaiZoneMonitor";
import { IndiaCitiesMonitor } from "../components/weather/IndiaCitiesMonitor";
import { IndiaRankings } from "../components/weather/IndiaRankings";
import { useWeather } from "../hooks/useWeather";
import { motion, AnimatePresence, type Variants } from "framer-motion";

export default function Dashboard() {
  const { city, setCity, unit, setUnit, current, forecast, aqi, loading, dataSource, apiStatus, lastRefreshed, locateUser } = useWeather("Mumbai");
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("defaultCity");
    if (saved) setCity(saved);
    const timer = setTimeout(() => setInitialLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const apiKey = import.meta.env.VITE_WEATHER_API_KEY as string;

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AnimatePresence>{initialLoading && <LoadingScreen key="loading" />}</AnimatePresence>

      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=2000')] bg-cover bg-center opacity-[0.03] mix-blend-overlay pointer-events-none" />

        <Navbar currentTemp={current?.main.temp ?? null} unit={unit} onSearch={setCity} />

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <AnimatePresence mode="wait">
              {activeSection === "dashboard" && (
                <motion.div key="dashboard" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <CurrentWeather data={current} unit={unit} dataSource={dataSource} apiStatus={apiStatus} lastRefreshed={lastRefreshed} onRefresh={() => locateUser()} />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="col-span-1 lg:col-span-2 space-y-6">
                      <HourlyForecast data={forecast} unit={unit} />
                      <WeatherCharts data={forecast} unit={unit} />
                      <AirQuality data={aqi} dataSource={dataSource} lastRefreshed={lastRefreshed} />
                    </div>
                    <div className="col-span-1 space-y-6">
                      <WeeklyForecast data={forecast} unit={unit} />
                      <AIInsights data={current} aqi={aqi} unit={unit} />
                      <IndiaRankings unit={unit} />
                      <WorldWeather unit={unit} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === "forecast" && (
                <motion.div key="forecast" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">Extended Forecast</h2>
                  <CurrentWeather data={current} unit={unit} dataSource={dataSource} apiStatus={apiStatus} lastRefreshed={lastRefreshed} />
                  <HourlyForecast data={forecast} unit={unit} />
                  <WeeklyForecast data={forecast} unit={unit} />
                  <WeatherCharts data={forecast} unit={unit} />
                </motion.div>
              )}

              {activeSection === "aqi" && (
                <motion.div key="aqi" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">Air Quality Analysis</h2>
                  <AirQuality data={aqi} />
                </motion.div>
              )}

              {activeSection === "map" && (
                <motion.div key="map" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">Interactive Weather Map</h2>
                  <WeatherMap
                    lat={current?.coord.lat ?? 20.5}
                    lon={current?.coord.lon ?? 78.9}
                    city={current?.name ?? "India"}
                    apiKey={apiKey}
                    unit={unit}
                    windDeg={current?.wind.deg ?? 220}
                    windSpeed={current?.wind.speed ?? 5}
                  />
                </motion.div>
              )}

              {activeSection === "alerts" && (
                <motion.div key="alerts" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">Weather Alerts</h2>
                  <WeatherAlerts />
                </motion.div>
              )}

              {activeSection === "news" && (
                <motion.div key="news" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">Weather Intelligence News</h2>
                  <WeatherNews />
                </motion.div>
              )}

              {activeSection === "compare" && (
                <motion.div key="compare" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">Compare Cities</h2>
                    <p className="text-muted-foreground mt-1">Side-by-side weather intelligence across any two cities</p>
                  </div>
                  <WeatherComparison unit={unit} />
                </motion.div>
              )}

              {activeSection === "mumbai" && (
                <motion.div key="mumbai" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                  <MumbaiZoneMonitor unit={unit} />
                </motion.div>
              )}

              {activeSection === "india" && (
                <motion.div key="india" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                  <IndiaCitiesMonitor unit={unit} />
                </motion.div>
              )}

              {activeSection === "settings" && (
                <motion.div key="settings" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">Settings</h2>
                  <SettingsPanel unit={unit} onUnitChange={setUnit} onCityChange={setCity} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
