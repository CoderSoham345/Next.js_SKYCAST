import { useState, useEffect } from "react";
import { CurrentWeather, Forecast, AirPollution, City } from "../types/weather";
import { fetchWeather, fetchForecast, fetchAirQuality } from "../lib/weatherApi";

export const useWeather = (initialCity: string = "London") => {
  const [city, setCity] = useState(initialCity);
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [aqi, setAqi] = useState<AirPollution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const weatherData = await fetchWeather(city);
        setCurrent(weatherData);
        
        const [forecastData, aqiData] = await Promise.all([
          fetchForecast(city),
          fetchAirQuality(weatherData.coord.lat, weatherData.coord.lon)
        ]);
        
        setForecast(forecastData);
        setAqi(aqiData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [city]);

  return {
    city,
    setCity,
    unit,
    setUnit,
    current,
    forecast,
    aqi,
    loading
  };
};
