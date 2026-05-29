import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Layers, MapPin, Activity, Droplets, Wind, Thermometer,
  Eye, Maximize2, Minimize2, Navigation, AlertTriangle, Zap, Sun,
  CloudRain, Gauge, BrainCircuit, X, ChevronRight
} from "lucide-react";
import { getAqiInfo, convertTemp, pm25ToAqi, formatAqi3, getWindDirection } from "../../lib/weatherUtils";
import { CurrentWeather, AirPollution } from "../../types/weather";

// ── Leaflet icon fix ──────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY as string;
const BASE    = "https://api.openweathermap.org";

// ── India cities ──────────────────────────────────────────────────────────────
const INDIA_CITIES = [
  { name: "Mumbai",        lat: 19.076, lon: 72.877 },
  { name: "Delhi",         lat: 28.679, lon: 77.069 },
  { name: "Bangalore",     lat: 12.972, lon: 77.594 },
  { name: "Chennai",       lat: 13.083, lon: 80.270 },
  { name: "Kolkata",       lat: 22.573, lon: 88.364 },
  { name: "Hyderabad",     lat: 17.385, lon: 78.487 },
  { name: "Pune",          lat: 18.520, lon: 73.856 },
  { name: "Ahmedabad",     lat: 23.023, lon: 72.572 },
  { name: "Jaipur",        lat: 26.912, lon: 75.787 },
  { name: "Lucknow",       lat: 26.847, lon: 80.947 },
  { name: "Srinagar",      lat: 34.084, lon: 74.797 },
  { name: "Goa",           lat: 15.491, lon: 73.828 },
];

// Simulated India weather alerts
const INDIA_ALERTS = [
  { type: "cyclone",  icon: "🌀", label: "Cyclone Watch — Bay of Bengal", detail: "Cyclone system developing. Coastal areas of Andhra Pradesh and Odisha on alert.", color: "#a855f7", blink: true  },
  { type: "heatwave", icon: "🌡️", label: "Heatwave Alert — Rajasthan, MP",detail: "Temperatures exceeding 46°C. IMD Red Alert in effect. Avoid outdoor activity.", color: "#ef4444", blink: false },
  { type: "flood",    icon: "🌊", label: "Flood Warning — Kerala, Karnataka",detail:"Extremely heavy rainfall forecast. Orange alert for coastal districts.",color: "#3b82f6", blink: false },
  { type: "aqi",      icon: "😷", label: "AQI Emergency — Delhi NCR",      detail: "PM2.5 exceeds 300 µg/m³. Schools and outdoor gatherings restricted.",  color: "#f97316", blink: false },
  { type: "rain",     icon: "🌧️", label: "Heavy Rainfall — Mumbai",        detail: "IMD: 100–120 mm rainfall in 24 hours. Train disruptions possible.",     color: "#06b6d4", blink: false },
];

// Mumbai zones (keep existing)
const MUMBAI_ZONES = [
  { name: "Borivali", lat: 19.2307, lon: 72.8567 }, { name: "Malad",    lat: 19.1871, lon: 72.8487 },
  { name: "Andheri",  lat: 19.1136, lon: 72.8697 }, { name: "Bandra",   lat: 19.0544, lon: 72.8404 },
  { name: "Powai",    lat: 19.1196, lon: 72.9089 }, { name: "Ghatkopar",lat: 19.0851, lon: 72.9081 },
  { name: "Kurla",    lat: 19.0726, lon: 72.8789 }, { name: "Dadar",    lat: 19.0170, lon: 72.8432 },
  { name: "Thane",    lat: 19.2183, lon: 72.9781 }, { name: "Navi Mumbai", lat: 19.0330, lon: 73.0297 },
];

interface CityLive {
  name: string; lat: number; lon: number;
  weather: CurrentWeather | null;
  aqi: AirPollution | null;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchCityLive(c: { name: string; lat: number; lon: number }, idx: number): Promise<CityLive> {
  try {
    const [wRes, aRes] = await Promise.all([
      fetch(`${BASE}/data/2.5/weather?lat=${c.lat}&lon=${c.lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE}/data/2.5/air_pollution?lat=${c.lat}&lon=${c.lon}&appid=${API_KEY}`),
    ]);
    if (!wRes.ok || !aRes.ok) throw new Error("api");
    const [weather, aqi] = await Promise.all([wRes.json(), aRes.json()]);
    weather.name = c.name;
    return { ...c, weather, aqi };
  } catch {
    const temps = [30, 35, 26, 32, 28, 33, 29, 37, 34, 30, 10, 27];
    const aqis  = [2,  4,  2,  3,  3,  3,  2,  3,  3,  3,  1,  2];
    const t = temps[idx % temps.length];
    return {
      ...c,
      weather: {
        coord: { lat: c.lat, lon: c.lon },
        weather: [{ id: 741, main: "Haze", description: "haze", icon: "50d" }],
        base: "stations",
        main: { temp: t, feels_like: t+2, temp_min: t-3, temp_max: t+4, pressure: 1008, humidity: 65+idx },
        visibility: 4000+idx*300, wind: { speed: 3+idx%6, deg: 180+idx*20 },
        clouds: { all: 40+idx*5 }, dt: Math.floor(Date.now()/1000),
        sys: { country: "IN", sunrise: 1716340000, sunset: 1716388000 },
        timezone: 19800, id: 1100000+idx, name: c.name, cod: 200,
      },
      aqi: {
        coord: { lat: c.lat, lon: c.lon },
        list: [{ dt: Math.floor(Date.now()/1000), main: { aqi: aqis[idx%aqis.length] }, components: { co: 200, no: 3, no2: 20+idx*3, o3: 45, so2: 7, pm2_5: 15+idx*3, pm10: 28+idx*3, nh3: 4 } }],
      },
    };
  }
}

// ── DivIcon factories ─────────────────────────────────────────────────────────
const AQI_HEX: Record<number, string> = { 1:"#22c55e", 2:"#eab308", 3:"#f97316", 4:"#ef4444", 5:"#a855f7" };

function makeCityIcon(temp: number, aqiVal: number, unit: string): L.DivIcon {
  const c = AQI_HEX[aqiVal] ?? "#f97316";
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="background:rgba(10,12,24,0.9);border:2px solid ${c};border-radius:10px;padding:4px 8px;
        font-size:11px;font-weight:800;color:#fff;box-shadow:0 0 14px ${c}55;backdrop-filter:blur(6px);
        white-space:nowrap;line-height:1.4;">
        ${temp}°${unit} <span style="color:${c}">●</span>
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;
        border-top:6px solid ${c};margin-top:-1px;"></div>
    </div>`,
    iconSize: [70, 36], iconAnchor: [35, 36], popupAnchor: [0, -38],
  });
}

function makeMumbaiIcon(temp: number, aqiVal: number, name: string): L.DivIcon {
  const c = AQI_HEX[aqiVal] ?? "#f97316";
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="width:32px;height:32px;border-radius:50%;background:${c}22;border:2px solid ${c};
        display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:${c};
        box-shadow:0 0 10px ${c}55;">
        ${temp}°
      </div>
      <div style="margin-top:2px;background:rgba(10,12,24,0.9);color:${c};font-size:8px;font-weight:700;
        padding:1px 4px;border-radius:3px;border:1px solid ${c}44;white-space:nowrap;">${name}</div>
    </div>`,
    iconSize: [40, 44], iconAnchor: [20, 44], popupAnchor: [0, -46],
  });
}

function makeCycloneIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:70px;height:70px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:70px;height:70px;border-radius:50%;border:2.5px solid #a855f7;
        opacity:0.3;animation:pulse 2s ease-out infinite;"></div>
      <div style="position:absolute;width:50px;height:50px;border-radius:50%;border:2px solid #a855f7;
        opacity:0.5;animation:pulse 2s ease-out infinite 0.5s;"></div>
      <div style="width:36px;height:36px;background:rgba(168,85,247,0.25);border:2px solid #a855f7;
        border-radius:50%;display:flex;align-items:center;justify-content:center;
        font-size:18px;box-shadow:0 0 20px #a855f788;animation:spin 4s linear infinite;">🌀</div>
    </div>
    <style>
      @keyframes pulse{0%{transform:scale(1);opacity:0.4}100%{transform:scale(1.6);opacity:0}}
      @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    </style>`,
    iconSize: [70, 70], iconAnchor: [35, 35], popupAnchor: [0, -38],
  });
}

// ── Popup builder ─────────────────────────────────────────────────────────────
function buildCityPopup(city: CityLive, unit: "C" | "F"): string {
  if (!city.weather || !city.aqi) return `<b>${city.name}</b>`;
  const w   = city.weather, a = city.aqi.list[0];
  const t   = Math.round(convertTemp(w.main.temp, unit));
  const fl  = Math.round(convertTemp(w.main.feels_like, unit));
  const aqi = a.main.aqi;
  const c   = AQI_HEX[aqi] ?? "#f97316";
  const aqiLabel = getAqiInfo(aqi).label;
  const trad = formatAqi3(pm25ToAqi(a.components.pm2_5));
  const vis  = (w.visibility / 1000).toFixed(1);
  const wDir = getWindDirection(w.wind.deg);
  const sunrise = new Date(w.sys.sunrise * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const sunset  = new Date(w.sys.sunset  * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  // Estimate UV from clouds + hour
  const h = new Date().getHours();
  const uvEst = w.clouds.all > 80 ? 1 : w.clouds.all > 40 ? 3 : (h >= 10 && h <= 15) ? 8 : 4;
  // Rain prob from humidity + clouds
  const rainProb = Math.round((w.main.humidity / 100 * 0.5 + w.clouds.all / 100 * 0.5) * 100);

  return `<div style="background:rgba(10,12,24,0.97);border-radius:16px;border:1.5px solid ${c}44;
    padding:16px;font-family:system-ui,sans-serif;color:#e2e8f0;width:240px;min-width:240px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
      <div>
        <div style="font-size:17px;font-weight:900;margin-bottom:2px;">${city.name}</div>
        <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">India · ${w.weather[0].description}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:30px;font-weight:900;line-height:1;">${t}°${unit}</div>
        <div style="font-size:10px;color:#94a3b8;">feels ${fl}°</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;background:${c}18;border:1px solid ${c}40;
      border-radius:8px;padding:7px 10px;margin-bottom:10px;">
      <div style="width:8px;height:8px;border-radius:50%;background:${c};box-shadow:0 0 6px ${c};"></div>
      <span style="font-size:12px;font-weight:800;color:${c};">AQI ${trad} — ${aqiLabel}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px;">
      ${[
        ["💧", "Humidity",  `${w.main.humidity}%`],
        ["🌬️", "Wind",      `${w.wind.speed.toFixed(0)} m/s ${wDir}`],
        ["👁️", "Visibility",`${vis} km`],
        ["📊", "Pressure",  `${w.main.pressure} hPa`],
        ["☀️", "UV Index",  `${uvEst} / 10`],
        ["🌧️", "Rain Prob", `${rainProb}%`],
      ].map(([icon,label,val]) =>
        `<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:6px 7px;font-size:10px;">
          <div style="color:#64748b;margin-bottom:2px;">${icon} ${label}</div>
          <div style="font-weight:700;color:#e2e8f0;">${val}</div>
        </div>`
      ).join("")}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
      <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:6px 8px;font-size:10px;">
        <div style="color:#64748b;margin-bottom:2px;">🌅 Sunrise</div>
        <div style="font-weight:700;">${sunrise}</div>
      </div>
      <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:6px 8px;font-size:10px;">
        <div style="color:#64748b;margin-bottom:2px;">🌇 Sunset</div>
        <div style="font-weight:700;">${sunset}</div>
      </div>
    </div>
  </div>`;
}

// ── Fly-to helper ─────────────────────────────────────────────────────────────
function FlyTo({ lat, lon, zoom }: { lat: number; lon: number; zoom: number }) {
  const map = useMap();
  const prev = useRef("");
  useEffect(() => {
    const k = `${lat},${lon},${zoom}`;
    if (prev.current !== k) { prev.current = k; map.flyTo([lat, lon], zoom, { duration: 1.5 }); }
  }, [lat, lon, zoom, map]);
  return null;
}

// ── Wind canvas component ─────────────────────────────────────────────────────
interface WindCanvasProps { windDeg: number; windSpeed: number; visible: boolean; }

function WindCanvas({ windDeg, windSpeed, visible }: WindCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();

    const rad = ((windDeg + 180) % 360) * Math.PI / 180;
    const spd = Math.max(0.6, Math.min(windSpeed / 8, 3));
    const N   = 140;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      age: Math.random() * 80,
      maxAge: 50 + Math.random() * 60,
      spd: spd * (0.6 + Math.random() * 0.8),
    }));

    let id: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dx = Math.sin(rad), dy = -Math.cos(rad);

      for (const p of particles) {
        p.age++;
        if (p.age > p.maxAge) { p.x = Math.random() * canvas.width; p.y = Math.random() * canvas.height; p.age = 0; }
        const t = p.age / p.maxAge;
        const alpha = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
        const tail = 18 * p.spd;
        const gx0 = p.x - dx * tail, gy0 = p.y - dy * tail;
        const g = ctx.createLinearGradient(gx0, gy0, p.x, p.y);
        g.addColorStop(0, `rgba(56,189,248,0)`);
        g.addColorStop(1, `rgba(56,189,248,${alpha * 0.55})`);
        ctx.beginPath(); ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.lineCap = "round";
        ctx.moveTo(gx0, gy0); ctx.lineTo(p.x, p.y); ctx.stroke();
        p.x += dx * p.spd; p.y += dy * p.spd;
        if (p.x > canvas.width + 20) p.x = -20; if (p.x < -20) p.x = canvas.width + 20;
        if (p.y > canvas.height + 20) p.y = -20; if (p.y < -20) p.y = canvas.height + 20;
      }
      id = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, [windDeg, windSpeed, visible]);

  if (!visible) return null;
  return (
    <canvas ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[300]"
      style={{ mixBlendMode: "screen" }} />
  );
}

// ── Main WeatherMap props ─────────────────────────────────────────────────────
interface WeatherMapProps {
  lat: number; lon: number; city: string; apiKey: string;
  unit?: "C" | "F";
  windDeg?: number; windSpeed?: number;
}

type LayerKey = "temp_new" | "precipitation_new" | "clouds_new" | "wind_new" | "pressure_new";

interface LayerDef { key: LayerKey; label: string; icon: React.ReactNode; color: string }
const LAYERS: LayerDef[] = [
  { key: "temp_new",          label: "Temperature", icon: <Thermometer size={12}/>, color: "#ef4444" },
  { key: "precipitation_new", label: "Rain Radar",  icon: <CloudRain    size={12}/>, color: "#3b82f6" },
  { key: "clouds_new",        label: "Clouds",      icon: <Layers       size={12}/>, color: "#94a3b8" },
  { key: "wind_new",          label: "Wind Speed",  icon: <Wind         size={12}/>, color: "#06b6d4" },
  { key: "pressure_new",      label: "Pressure",    icon: <Gauge        size={12}/>, color: "#a855f7" },
];

// ── Main component ────────────────────────────────────────────────────────────
export function WeatherMap({
  lat, lon, city, apiKey,
  unit       = "C",
  windDeg    = 220,
  windSpeed  = 5,
}: WeatherMapProps) {

  const [layer,          setLayer]         = useState<LayerKey>("temp_new");
  const [indiaCities,    setIndiaCities]   = useState<CityLive[]>([]);
  const [citiesLoading,  setCitiesLoading] = useState(false);
  const [showIndia,      setShowIndia]     = useState(true);
  const [mumbaiMode,     setMumbaiMode]    = useState(false);
  const [mumZones,       setMumZones]      = useState<CityLive[]>([]);
  const [mumLoading,     setMumLoading]    = useState(false);
  const [windAnim,       setWindAnim]      = useState(true);
  const [fullscreen,     setFullscreen]    = useState(false);
  const [alertIdx,       setAlertIdx]      = useState(0);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [userPos,        setUserPos]       = useState<[number,number]|null>(null);
  const [locating,       setLocating]      = useState(false);
  const [selectedCity,   setSelectedCity]  = useState<CityLive|null>(null);
  const [lastUpdated,    setLastUpdated]   = useState<Date|null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Cycle alerts
  useEffect(() => {
    const t = setInterval(() => setAlertIdx(i => (i + 1) % INDIA_ALERTS.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Load India cities on mount
  const loadIndia = useCallback(async () => {
    setCitiesLoading(true);
    const res = await Promise.allSettled(INDIA_CITIES.map((c, i) => fetchCityLive(c, i)));
    setIndiaCities(INDIA_CITIES.map((c, i) => {
      const r = res[i];
      return r.status === "fulfilled" ? r.value : { ...c, weather: null, aqi: null };
    }));
    setLastUpdated(new Date());
    setCitiesLoading(false);
  }, []);

  useEffect(() => { loadIndia(); }, [loadIndia]);

  // Load Mumbai zones
  const loadMumbai = useCallback(async () => {
    setMumLoading(true);
    const res = await Promise.allSettled(MUMBAI_ZONES.map((z, i) => fetchCityLive(z, i)));
    setMumZones(MUMBAI_ZONES.map((z, i) => {
      const r = res[i]; return r.status === "fulfilled" ? r.value : { ...z, weather: null, aqi: null };
    }));
    setMumLoading(false);
  }, []);

  const toggleMumbai = () => {
    if (!mumbaiMode) { setMumbaiMode(true); if (!mumZones.length) loadMumbai(); }
    else setMumbaiMode(false);
  };

  // Geolocation
  const locateMe = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserPos([pos.coords.latitude, pos.coords.longitude]); setLocating(false); },
      ()  => setLocating(false),
      { timeout: 8000 }
    );
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!fullscreen && mapContainerRef.current?.requestFullscreen) {
      mapContainerRef.current.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    setFullscreen(f => !f);
  };

  // Map center
  const mapLat  = mumbaiMode ? 19.076 : 20.5;
  const mapLon  = mumbaiMode ? 72.877 : 78.9;
  const mapZoom = mumbaiMode ? 11 : 5;

  const alert = INDIA_ALERTS[alertIdx];

  return (
    <div className="space-y-3">
      {/* ── Alert ticker ───────────────────────────────────────────── */}
      <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-border/40 h-10">
        <button
          onClick={() => setShowAlertPanel(p => !p)}
          className="h-full flex items-center gap-2 px-3 font-black text-[10px] uppercase tracking-widest flex-shrink-0 transition-colors"
          style={{ background: `${alert.color}22`, color: alert.color, borderRight: `1px solid ${alert.color}33` }}>
          <AlertTriangle size={12} />ALERTS
        </button>
        <div className="flex-1 h-full bg-card/80 overflow-hidden flex items-center px-4">
          <AnimatePresence mode="wait">
            <motion.div key={alertIdx}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2 text-sm">
              <span>{alert.icon}</span>
              <span className="font-bold" style={{ color: alert.color }}>{alert.label}</span>
              <span className="text-muted-foreground hidden md:inline">— {alert.detail}</span>
              {alert.blink && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: alert.color }} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex gap-1 px-3 flex-shrink-0">
          {INDIA_ALERTS.map((_, i) => (
            <button key={i} onClick={() => setAlertIdx(i)}
              className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{ background: i === alertIdx ? INDIA_ALERTS[i].color : "#475569" }} />
          ))}
        </div>
      </div>

      {/* ── Alert detail panel ─────────────────────────────────────── */}
      <AnimatePresence>
        {showAlertPanel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
              <h4 className="font-bold text-sm flex items-center gap-2"><AlertTriangle size={14} className="text-red-400" />Active India Weather Alerts</h4>
              <button onClick={() => setShowAlertPanel(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {INDIA_ALERTS.map((a, i) => (
                <div key={i} className="rounded-xl p-3 border" style={{ background: `${a.color}10`, borderColor: `${a.color}30` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{a.icon}</span>
                    <span className="font-bold text-xs" style={{ color: a.color }}>{a.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{a.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats strip ────────────────────────────────────────────── */}
      {indiaCities.length > 0 && !citiesLoading && (() => {
        const loaded = indiaCities.filter(c => c.weather && c.aqi);
        const hot  = loaded.reduce((a, b) => a.weather!.main.temp > b.weather!.main.temp ? a : b, loaded[0]);
        const cool = loaded.reduce((a, b) => a.weather!.main.temp < b.weather!.main.temp ? a : b, loaded[0]);
        const best = loaded.reduce((a, b) => a.aqi!.list[0].main.aqi <= b.aqi!.list[0].main.aqi ? a : b, loaded[0]);
        const wrst = loaded.reduce((a, b) => a.aqi!.list[0].main.aqi >= b.aqi!.list[0].main.aqi ? a : b, loaded[0]);
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:"Hottest City",  val: hot.name,  sub:`${Math.round(convertTemp(hot.weather!.main.temp, unit))}°${unit}`,  c:"border-red-500/25 from-red-500/8"  },
              { label:"Coolest City",  val: cool.name, sub:`${Math.round(convertTemp(cool.weather!.main.temp,unit))}°${unit}`,  c:"border-blue-500/25 from-blue-500/8" },
              { label:"Best Air",      val: best.name, sub: getAqiInfo(best.aqi!.list[0].main.aqi).label,  c:"border-green-500/25 from-green-500/8" },
              { label:"Worst Air",     val: wrst.name, sub: getAqiInfo(wrst.aqi!.list[0].main.aqi).label,  c:"border-yellow-500/25 from-yellow-500/8" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border bg-gradient-to-br ${s.c} to-transparent bg-card p-3`}>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</div>
                <div className="font-black text-sm">{s.val}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Map container ──────────────────────────────────────────── */}
      <div ref={mapContainerRef} className="relative rounded-3xl overflow-hidden border border-border/50"
        style={{ height: fullscreen ? "100vh" : "65vh", minHeight: "480px" }}>

        {/* Wind particles canvas */}
        <WindCanvas windDeg={windDeg} windSpeed={windSpeed} visible={windAnim} />

        {/* ── Left controls ───────────────────── */}
        <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2">
          {/* Layer panel */}
          <div className="glass backdrop-blur-xl bg-card/85 rounded-2xl border border-border/40 p-2 flex flex-col gap-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1 pb-1 flex items-center gap-1">
              <Layers size={9} />Layers
            </div>
            {LAYERS.map(l => (
              <button key={l.key} onClick={() => setLayer(l.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-left ${
                  layer === l.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                style={layer === l.key ? { background: `${l.color}20`, border: `1px solid ${l.color}50`, color: l.color } : { border: "1px solid transparent" }}>
                <span style={{ color: l.color }}>{l.icon}</span>{l.label}
              </button>
            ))}
          </div>

          {/* India toggle */}
          <button onClick={() => setShowIndia(p => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold backdrop-blur-xl border transition-all ${
              showIndia ? "bg-orange-500/20 border-orange-500/50 text-orange-400" : "bg-card/85 border-border/40 text-muted-foreground"
            }`}>
            🇮🇳 India Cities
          </button>

          {/* Mumbai toggle */}
          <button onClick={toggleMumbai} disabled={mumLoading}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold backdrop-blur-xl border transition-all ${
              mumbaiMode ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" : "bg-card/85 border-border/40 text-muted-foreground"
            }`}>
            {mumLoading ? <RefreshCw size={11} className="animate-spin" /> : "📍"}
            Mumbai Zones
          </button>

          {/* Wind animation toggle */}
          <button onClick={() => setWindAnim(p => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold backdrop-blur-xl border transition-all ${
              windAnim ? "bg-sky-500/20 border-sky-500/50 text-sky-400" : "bg-card/85 border-border/40 text-muted-foreground"
            }`}>
            <Wind size={11} />Wind Anim
          </button>
        </div>

        {/* ── Top-right controls ─────────────── */}
        <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
          {/* Fullscreen */}
          <button onClick={toggleFullscreen}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card/85 border border-border/40 backdrop-blur-xl text-muted-foreground hover:text-foreground transition-colors">
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          {/* Locate me */}
          <button onClick={locateMe} disabled={locating}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card/85 border border-border/40 backdrop-blur-xl text-muted-foreground hover:text-primary transition-colors">
            {locating ? <RefreshCw size={14} className="animate-spin" /> : <Navigation size={14} />}
          </button>
          {/* Refresh */}
          <button onClick={loadIndia} disabled={citiesLoading}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-card/85 border border-border/40 backdrop-blur-xl text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={14} className={citiesLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ── AQI legend ─────────────────────── */}
        <div className="absolute bottom-4 left-3 z-[400] glass backdrop-blur-xl bg-card/85 border border-border/40 rounded-xl p-2.5">
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
            <Activity size={9} />AQI Scale
          </div>
          {Object.entries({ 1:"#22c55e",2:"#eab308",3:"#f97316",4:"#ef4444",5:"#a855f7" }).map(([k,c]) => (
            <div key={k} className="flex items-center gap-1.5 py-0.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c, boxShadow: `0 0 4px ${c}88` }} />
              <span className="text-[9px] text-muted-foreground">
                {k} · {["","Good","Fair","Moderate","Poor","Very Poor"][+k]}
              </span>
            </div>
          ))}
          {lastUpdated && (
            <div className="text-[9px] text-muted-foreground/40 mt-1.5 pt-1.5 border-t border-border/20">
              {lastUpdated.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
            </div>
          )}
        </div>

        {/* ── City detail panel (bottom-right) ── */}
        <AnimatePresence>
          {selectedCity?.weather && selectedCity?.aqi && (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="absolute bottom-4 right-3 z-[400] w-64 rounded-2xl border border-border/40 overflow-hidden backdrop-blur-xl"
              style={{ background: "rgba(10,12,24,0.92)" }}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <MapPin size={11} className="text-primary" />
                  <span className="font-bold text-sm">{selectedCity.name}</span>
                </div>
                <button onClick={() => setSelectedCity(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              </div>
              {(() => {
                const w  = selectedCity.weather!;
                const a  = selectedCity.aqi!.list[0];
                const t  = Math.round(convertTemp(w.main.temp, unit));
                const aqiVal = a.main.aqi;
                const c  = AQI_HEX[aqiVal] ?? "#f97316";
                const trad = formatAqi3(pm25ToAqi(a.components.pm2_5));
                return (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black">{t}°{unit}</span>
                      <span className="text-sm text-muted-foreground capitalize">{w.weather[0].description}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ background: `${c}15`, border: `1px solid ${c}35` }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: c }} />
                      <span className="text-xs font-bold" style={{ color: c }}>AQI {trad} — {getAqiInfo(aqiVal).label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        ["💧", `${w.main.humidity}%`, "Humidity"],
                        ["🌬️", `${w.wind.speed.toFixed(1)} m/s`, "Wind"],
                        ["👁️", `${(w.visibility/1000).toFixed(1)} km`, "Visibility"],
                        ["📊", `${w.main.pressure} hPa`, "Pressure"],
                      ].map(([icon, val, label]) => (
                        <div key={label} className="bg-white/5 rounded-lg p-2">
                          <div className="text-muted-foreground text-[9px]">{icon} {label}</div>
                          <div className="font-bold">{val}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                      <BrainCircuit size={9} className="text-primary" />
                      <span>{getAqiInfo(aqiVal).recommendation}</span>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading overlay ─────────────────── */}
        <AnimatePresence>
          {(citiesLoading || mumLoading) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-none">
              <RefreshCw size={24} className="animate-spin text-primary mb-2" />
              <p className="text-xs text-primary font-semibold">{mumLoading ? "Loading Mumbai zones…" : "Fetching live city data…"}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Leaflet map ─────────────────────── */}
        <MapContainer center={[mapLat, mapLon]} zoom={mapZoom} scrollWheelZoom className="w-full h-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <TileLayer
            url={`https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${apiKey}`}
            opacity={0.55} />

          {/* India city markers */}
          {showIndia && indiaCities.map(c => {
            if (!c.weather || !c.aqi) return null;
            const t   = Math.round(convertTemp(c.weather.main.temp, unit));
            const aqi = c.aqi.list[0].main.aqi;
            return (
              <Marker key={c.name} position={[c.lat, c.lon]} icon={makeCityIcon(t, aqi, unit)}
                eventHandlers={{ click: () => setSelectedCity(c) }}>
                <Popup maxWidth={260}>
                  <div dangerouslySetInnerHTML={{ __html: buildCityPopup(c, unit) }} />
                </Popup>
              </Marker>
            );
          })}

          {/* Mumbai zone markers */}
          {mumbaiMode && mumZones.map(z => {
            if (!z.weather || !z.aqi) return null;
            const t = Math.round(convertTemp(z.weather.main.temp, unit));
            const aqi = z.aqi.list[0].main.aqi;
            return (
              <Marker key={z.name} position={[z.lat, z.lon]} icon={makeMumbaiIcon(t, aqi, z.name)}>
                <Popup maxWidth={220}>
                  <div dangerouslySetInnerHTML={{ __html: buildCityPopup(z, unit) }} />
                </Popup>
              </Marker>
            );
          })}

          {/* User location marker */}
          {userPos && (
            <Marker position={userPos} icon={L.divIcon({
              className: "",
              html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 12px #3b82f688;animation:pulse 1.5s ease-out infinite;"></div>`,
              iconSize: [16, 16], iconAnchor: [8, 8],
            })}>
              <Popup><b>Your Location</b></Popup>
            </Marker>
          )}

          {/* Cyclone marker — Bay of Bengal */}
          <Marker position={[13.5, 85.5]} icon={makeCycloneIcon()}>
            <Popup maxWidth={220}>
              <div style={{ background:"rgba(10,12,24,0.96)",borderRadius:"12px",padding:"12px",color:"#e2e8f0",fontFamily:"system-ui",border:"1.5px solid #a855f744",minWidth:"180px" }}>
                <div style={{ fontSize:"14px",fontWeight:900,color:"#a855f7",marginBottom:"6px" }}>🌀 Cyclone Watch</div>
                <div style={{ fontSize:"11px",color:"#94a3b8",marginBottom:"8px" }}>Bay of Bengal — Active System</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",fontSize:"10px" }}>
                  <div style={{ background:"rgba(255,255,255,0.04)",borderRadius:"6px",padding:"5px 7px" }}>
                    <div style={{ color:"#64748b" }}>Category</div><div style={{ fontWeight:700 }}>Cat 2</div>
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.04)",borderRadius:"6px",padding:"5px 7px" }}>
                    <div style={{ color:"#64748b" }}>Wind</div><div style={{ fontWeight:700 }}>95 km/h</div>
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.04)",borderRadius:"6px",padding:"5px 7px" }}>
                    <div style={{ color:"#64748b" }}>Movement</div><div style={{ fontWeight:700 }}>NW @ 14 km/h</div>
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.04)",borderRadius:"6px",padding:"5px 7px" }}>
                    <div style={{ color:"#64748b" }}>Landfall</div><div style={{ fontWeight:700,color:"#ef4444" }}>~48h</div>
                  </div>
                </div>
                <div style={{ fontSize:"10px",color:"#a855f7",marginTop:"8px",background:"rgba(168,85,247,0.1)",borderRadius:"6px",padding:"6px 8px" }}>
                  ⚠️ Coastal Andhra Pradesh and Odisha on High Alert
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Cyclone marker — Arabian Sea */}
          <Marker position={[17.0, 64.0]} icon={L.divIcon({
            className: "",
            html: `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:rgba(249,115,22,0.15);border:2px solid #f97316;border-radius:50%;box-shadow:0 0 14px #f9731688;font-size:20px;">⛈️</div>`,
            iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -24],
          })}>
            <Popup maxWidth={180}>
              <div style={{ background:"rgba(10,12,24,0.96)",borderRadius:"10px",padding:"10px",color:"#e2e8f0",fontFamily:"system-ui",border:"1.5px solid #f9731644" }}>
                <div style={{ fontWeight:900,color:"#f97316",marginBottom:"4px" }}>⛈️ Storm System</div>
                <div style={{ fontSize:"11px",color:"#94a3b8" }}>Arabian Sea — Low Pressure<br/>Wind: 70 km/h · Pressure: 990 hPa</div>
              </div>
            </Popup>
          </Marker>

          <FlyTo lat={mapLat} lon={mapLon} zoom={mapZoom} />
        </MapContainer>
      </div>

      {/* ── City data table ─────────────────────────────────────────── */}
      {indiaCities.filter(c => c.weather && c.aqi).length > 0 && (
        <div className="rounded-3xl border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              India Major Cities — Live Intelligence
            </h3>
            <button onClick={loadIndia} disabled={citiesLoading} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              <RefreshCw size={11} className={citiesLoading ? "animate-spin" : ""} />Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/20">
                  {["City","Temp","Feels","Humidity","Wind","AQI","Condition","Visibility"].map(h => (
                    <th key={h} className={`px-4 py-3 ${["Temp","Feels","Humidity","Wind","Visibility"].includes(h)?"text-right":"text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {indiaCities.filter(c => c.weather && c.aqi).map((c, i) => {
                  const w   = c.weather!;
                  const aqi = c.aqi!.list[0].main.aqi;
                  const col = AQI_HEX[aqi] ?? "#f97316";
                  const t   = Math.round(convertTemp(w.main.temp, unit));
                  const fl  = Math.round(convertTemp(w.main.feels_like, unit));
                  const trad = formatAqi3(pm25ToAqi(c.aqi!.list[0].components.pm2_5));
                  return (
                    <motion.tr key={c.name}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedCity(c)}
                      className="border-b border-border/10 hover:bg-muted/20 transition-colors cursor-pointer">
                      <td className="px-4 py-2.5 font-bold flex items-center gap-1.5">
                        <MapPin size={10} className="text-primary" />{c.name}<ChevronRight size={10} className="text-muted-foreground/30" />
                      </td>
                      <td className="px-4 py-2.5 text-right font-black">{t}°{unit}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{fl}°</td>
                      <td className="px-4 py-2.5 text-right"><span className="flex items-center justify-end gap-1"><Droplets size={10} className="text-blue-400" />{w.main.humidity}%</span></td>
                      <td className="px-4 py-2.5 text-right"><span className="flex items-center justify-end gap-1"><Wind size={10} className="text-cyan-400" />{w.wind.speed.toFixed(1)}</span></td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold"
                          style={{ background:`${col}18`, color:col, border:`1px solid ${col}40` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background:col }} />{trad} · {getAqiInfo(aqi).label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground capitalize">{w.weather[0].description}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        <span className="flex items-center justify-end gap-1"><Eye size={10} />{(w.visibility/1000).toFixed(1)} km</span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
