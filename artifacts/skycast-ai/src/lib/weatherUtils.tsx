import React from "react";
import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning,
  CloudMoon, CloudRain, CloudSnow, CloudSun, Moon, Sun, Tornado, Wind
} from "lucide-react";

export const getWeatherIcon = (code: string, size = 24, className = ""): React.ReactNode => {
  const props = { size, className };
  switch (code) {
    case "01d": return <Sun {...props} className={`text-yellow-400 ${className}`} />;
    case "01n": return <Moon {...props} className={`text-blue-200 ${className}`} />;
    case "02d": return <CloudSun {...props} className={`text-gray-300 ${className}`} />;
    case "02n": return <CloudMoon {...props} className={`text-gray-400 ${className}`} />;
    case "03d":
    case "03n": return <Cloud {...props} className={`text-gray-400 ${className}`} />;
    case "04d":
    case "04n": return <CloudFog {...props} className={`text-gray-500 ${className}`} />;
    case "09d":
    case "09n": return <CloudDrizzle {...props} className={`text-blue-400 ${className}`} />;
    case "10d":
    case "10n": return <CloudRain {...props} className={`text-blue-500 ${className}`} />;
    case "11d":
    case "11n": return <CloudLightning {...props} className={`text-purple-400 ${className}`} />;
    case "13d":
    case "13n": return <CloudSnow {...props} className={`text-white ${className}`} />;
    case "50d":
    case "50n": return <Wind {...props} className={`text-gray-300 ${className}`} />;
    default: return <Sun {...props} className={`text-yellow-400 ${className}`} />;
  }
};

export const convertTemp = (celsius: number, unit: "C" | "F"): number => {
  if (unit === "F") return (celsius * 9) / 5 + 32;
  return celsius;
};

export const formatTime = (timestamp: number, timezoneOffset: number): string => {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
};

// Convert PM2.5 µg/m³ → traditional 0-500 AQI scale (US EPA breakpoints)
export const pm25ToAqi = (pm25: number): number => {
  const breakpoints = [
    { pm_lo: 0,     pm_hi: 12.0,  aqi_lo: 0,   aqi_hi: 50  },
    { pm_lo: 12.1,  pm_hi: 35.4,  aqi_lo: 51,  aqi_hi: 100 },
    { pm_lo: 35.5,  pm_hi: 55.4,  aqi_lo: 101, aqi_hi: 150 },
    { pm_lo: 55.5,  pm_hi: 150.4, aqi_lo: 151, aqi_hi: 200 },
    { pm_lo: 150.5, pm_hi: 250.4, aqi_lo: 201, aqi_hi: 300 },
    { pm_lo: 250.5, pm_hi: 500.4, aqi_lo: 301, aqi_hi: 500 },
  ];
  const p = Math.min(Math.max(pm25, 0), 500.4);
  const bp = breakpoints.find(b => p >= b.pm_lo && p <= b.pm_hi) ?? breakpoints[5];
  return Math.round(
    ((bp.aqi_hi - bp.aqi_lo) / (bp.pm_hi - bp.pm_lo)) * (p - bp.pm_lo) + bp.aqi_lo
  );
};

// Format AQI as zero-padded 3-digit string
export const formatAqi3 = (aqi: number): string => String(Math.min(aqi, 999)).padStart(3, "0");

export const getAqiInfo = (aqi: number) => {
  switch (aqi) {
    case 1: return {
      label: "Good", color: "text-green-400", bg: "bg-green-400", hex: "#22c55e",
      message: "Air quality is considered satisfactory, and air pollution poses little or no risk.",
      health: "Ideal for outdoor activities. No precautions needed.",
      recommendation: "Enjoy outdoor exercise freely.",
    };
    case 2: return {
      label: "Fair", color: "text-yellow-400", bg: "bg-yellow-400", hex: "#eab308",
      message: "Air quality is acceptable; however, there may be a moderate health concern for a very small number of people.",
      health: "Unusually sensitive people should consider reducing prolonged outdoor exertion.",
      recommendation: "Sensitive groups should limit outdoor time.",
    };
    case 3: return {
      label: "Moderate", color: "text-orange-400", bg: "bg-orange-400", hex: "#f97316",
      message: "Members of sensitive groups may experience health effects. The general public is not likely to be affected.",
      health: "People with respiratory or heart disease, elderly, and children should limit prolonged outdoor exertion.",
      recommendation: "Wear a mask if spending extended time outdoors.",
    };
    case 4: return {
      label: "Poor", color: "text-red-500", bg: "bg-red-500", hex: "#ef4444",
      message: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.",
      health: "Everyone should reduce prolonged outdoor exertion. Sensitive groups should avoid outdoor activity.",
      recommendation: "Stay indoors. Wear N95 mask if going outside.",
    };
    case 5: return {
      label: "Very Poor", color: "text-purple-500", bg: "bg-purple-500", hex: "#a855f7",
      message: "Health warnings of emergency conditions. The entire population is more likely to be affected.",
      health: "Everyone should avoid all outdoor exertion. Sensitive groups should remain indoors.",
      recommendation: "Stay indoors. Use air purifiers. Emergency conditions.",
    };
    default: return {
      label: "Unknown", color: "text-gray-400", bg: "bg-gray-400", hex: "#9ca3af",
      message: "Data unavailable.",
      health: "No data available.",
      recommendation: "No recommendation available.",
    };
  }
};

export const getWindDirection = (deg: number): string => {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
};
