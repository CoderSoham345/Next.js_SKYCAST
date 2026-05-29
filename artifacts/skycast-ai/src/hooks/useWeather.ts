import { useState, useEffect, useCallback, useRef } from "react";
import { CurrentWeather, Forecast, AirPollution } from "../types/weather";
import {
  fetchWeatherByCoords, fetchWeatherByCity,
  fetchForecastByCoords, fetchForecastByCity,
  fetchAirQualityByCoords,
  reverseGeocode,
  DataSource,
} from "../lib/weatherApi";

const REFRESH_MS = 10 * 60 * 1000; // 10 minutes

export interface ApiStatus {
  weather: "loading" | "ok" | "error";
  forecast: "loading" | "ok" | "error";
  aqi:      "loading" | "ok" | "error";
}

export const useWeather = (initialCity = "Mumbai") => {
  const [city,          setCity]         = useState(initialCity);
  const [unit,          setUnit]         = useState<"C" | "F">("C");
  const [current,       setCurrent]      = useState<CurrentWeather | null>(null);
  const [forecast,      setForecast]     = useState<Forecast | null>(null);
  const [aqi,           setAqi]          = useState<AirPollution | null>(null);
  const [loading,       setLoading]      = useState(true);
  const [lastRefreshed, setLastRefreshed]= useState<Date | null>(null);
  const [dataSource,    setDataSource]   = useState<DataSource>("unavailable");
  const [apiStatus,     setApiStatus]    = useState<ApiStatus>({ weather: "loading", forecast: "loading", aqi: "loading" });

  // Track coords so re-renders on city string don't double-fetch
  const coordsRef = useRef<{ lat: number; lon: number } | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setApiStatus({ weather: "loading", forecast: "loading", aqi: "loading" });

    // Try geolocation for current-position city
    let coords = coordsRef.current;

    // --- Weather ---
    let weatherResult;
    if (coords) {
      weatherResult = await fetchWeatherByCoords(coords.lat, coords.lon, city);
    } else {
      weatherResult = await fetchWeatherByCity(city);
    }

    if (weatherResult.data) {
      setCurrent(weatherResult.data);
      setDataSource(weatherResult.source);
      setApiStatus(s => ({ ...s, weather: "ok" }));
      // Use returned coords for AQI/forecast
      coords = { lat: weatherResult.data.coord.lat, lon: weatherResult.data.coord.lon };
      coordsRef.current = coords;
    } else {
      setCurrent(null);
      setDataSource("unavailable");
      setApiStatus(s => ({ ...s, weather: "error" }));
    }

    // --- Forecast + AQI (parallel) ---
    const lat = coords?.lat ?? 0;
    const lon = coords?.lon ?? 0;

    const [forecastResult, aqiResult] = await Promise.all([
      coords
        ? fetchForecastByCoords(lat, lon, city)
        : fetchForecastByCity(city),
      coords
        ? fetchAirQualityByCoords(lat, lon)
        : Promise.resolve({ data: null, source: "unavailable" as DataSource, fetchedAt: new Date() }),
    ]);

    setForecast(forecastResult.data);
    setApiStatus(s => ({ ...s, forecast: forecastResult.data ? "ok" : "error" }));

    setAqi(aqiResult.data);
    setApiStatus(s => ({ ...s, aqi: aqiResult.data ? "ok" : "error" }));

    setLastRefreshed(new Date());
    if (!silent) setLoading(false);
  }, [city]);

  // Trigger on city change
  useEffect(() => {
    coordsRef.current = null; // reset coords on city change
    loadData();
  }, [loadData]);

  // 10-minute auto-refresh
  useEffect(() => {
    const id = setInterval(() => loadData(true), REFRESH_MS);
    return () => clearInterval(id);
  }, [loadData]);

  // Geolocation — attempt once on mount; sets city to GPS coords
  const locateUser = useCallback(async () => {
    if (!navigator.geolocation) return;
    return new Promise<void>(resolve => {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const { latitude: lat, longitude: lon } = pos.coords;
          coordsRef.current = { lat, lon };
          const name = await reverseGeocode(lat, lon);
          setCity(name);   // triggers loadData via useEffect
          resolve();
        },
        () => resolve(),
        { timeout: 8000, maximumAge: 60000 }
      );
    });
  }, []);

  return {
    city, setCity,
    unit, setUnit,
    current, forecast, aqi,
    loading, lastRefreshed,
    dataSource, apiStatus,
    locateUser,
  };
};
