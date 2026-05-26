import React from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  Tornado,
  Wind
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
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
};

export const getAqiInfo = (aqi: number) => {
  switch (aqi) {
    case 1: return { label: "Good", color: "text-green-400", bg: "bg-green-400", message: "Air quality is considered satisfactory, and air pollution poses little or no risk." };
    case 2: return { label: "Fair", color: "text-yellow-400", bg: "bg-yellow-400", message: "Air quality is acceptable; however, there may be a moderate health concern for a very small number of people." };
    case 3: return { label: "Moderate", color: "text-orange-400", bg: "bg-orange-400", message: "Members of sensitive groups may experience health effects. The general public is not likely to be affected." };
    case 4: return { label: "Poor", color: "text-red-500", bg: "bg-red-500", message: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects." };
    case 5: return { label: "Very Poor", color: "text-purple-500", bg: "bg-purple-500", message: "Health warnings of emergency conditions. The entire population is more likely to be affected." };
    default: return { label: "Unknown", color: "text-gray-400", bg: "bg-gray-400", message: "Data unavailable." };
  }
};
