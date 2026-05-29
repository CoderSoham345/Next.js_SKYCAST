import { useState, useEffect, useCallback } from "react";
import { CurrentWeather, Forecast, AirPollution } from "../types/weather";
import { fetchWeather, fetchForecast, fetchAirQuality } from "../lib/weatherApi";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export const useWeather = (initialCity: string = "London") => {
  const [city, setCity] = useState(initialCity);
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [aqi, setAqi] = useState<AirPollution | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const weatherData = await fetchWeather(city);
      setCurrent(weatherData);
      const [forecastData, aqiData] = await Promise.all([
        fetchForecast(city),
        fetchAirQuality(weatherData.coord.lat, weatherData.coord.lon),
      ]);
      setForecast(forecastData);
      setAqi(aqiData);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [city]);

  // Load on city change
  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 5 minutes (silent — no loading spinner)
  useEffect(() => {
    const interval = setInterval(() => loadData(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  return { city, setCity, unit, setUnit, current, forecast, aqi, loading, lastRefreshed };
};
