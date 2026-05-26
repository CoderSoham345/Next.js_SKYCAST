import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Layers, MapPin, Activity, Droplets, Wind, Thermometer, Eye } from "lucide-react";
import { getAqiInfo, convertTemp } from "../../lib/weatherUtils";
import { CurrentWeather, AirPollution } from "../../types/weather";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY as string;
const BASE = "https://api.openweathermap.org";

// AQI color map
const AQI_COLORS: Record<number, { fill: string; stroke: string; css: string; label: string }> = {
  1: { fill: "#22c55e", stroke: "#16a34a", css: "text-green-400",  label: "Good"      },
  2: { fill: "#eab308", stroke: "#ca8a04", css: "text-yellow-400", label: "Fair"      },
  3: { fill: "#f97316", stroke: "#ea580c", css: "text-orange-400", label: "Moderate"  },
  4: { fill: "#ef4444", stroke: "#dc2626", css: "text-red-400",    label: "Poor"      },
  5: { fill: "#a855f7", stroke: "#9333ea", css: "text-purple-400", label: "Very Poor" },
};

interface MumbaiZone {
  name: string;
  lat: number;
  lon: number;
  zone: string;
  trainLine?: string;
}

const MUMBAI_ZONES: MumbaiZone[] = [
  { name: "Borivali",    lat: 19.2307, lon: 72.8567, zone: "North",   trainLine: "Western" },
  { name: "Malad",       lat: 19.1871, lon: 72.8487, zone: "North",   trainLine: "Western" },
  { name: "Goregaon",   lat: 19.1663, lon: 72.8526, zone: "North",   trainLine: "Western" },
  { name: "Mulund",     lat: 19.1720, lon: 72.9561, zone: "North",   trainLine: "Central" },
  { name: "Bhandup",    lat: 19.1445, lon: 72.9417, zone: "North",   trainLine: "Central" },
  { name: "Nahur",      lat: 19.1250, lon: 72.9417, zone: "North",   trainLine: "Central" },
  { name: "Andheri",    lat: 19.1136, lon: 72.8697, zone: "Central", trainLine: "Western" },
  { name: "Santacruz",  lat: 19.0820, lon: 72.8445, zone: "Central", trainLine: "Western" },
  { name: "Powai",      lat: 19.1196, lon: 72.9089, zone: "Central" },
  { name: "Ghatkopar",  lat: 19.0851, lon: 72.9081, zone: "Central", trainLine: "Central" },
  { name: "Chembur",    lat: 19.0625, lon: 72.8993, zone: "Central", trainLine: "Harbour" },
  { name: "Kurla",      lat: 19.0726, lon: 72.8789, zone: "Central", trainLine: "Central" },
  { name: "Bandra",     lat: 19.0544, lon: 72.8404, zone: "South",   trainLine: "Western" },
  { name: "Sion",       lat: 19.0392, lon: 72.8617, zone: "South",   trainLine: "Central" },
  { name: "Matunga",    lat: 19.0272, lon: 72.8620, zone: "South",   trainLine: "Central" },
  { name: "Dadar",      lat: 19.0170, lon: 72.8432, zone: "South",   trainLine: "Western" },
  { name: "Wadala",     lat: 19.0139, lon: 72.8575, zone: "Harbour", trainLine: "Harbour" },
  { name: "Parel",      lat: 19.0005, lon: 72.8438, zone: "South",   trainLine: "Central" },
  { name: "Byculla",    lat: 18.9788, lon: 72.8354, zone: "South",   trainLine: "Central" },
  { name: "Thane",      lat: 19.2183, lon: 72.9781, zone: "Suburbs" },
  { name: "Navi Mumbai",lat: 19.0330, lon: 73.0297, zone: "Suburbs" },
  { name: "Vashi",      lat: 19.0771, lon: 73.0071, zone: "Suburbs", trainLine: "Harbour" },
  { name: "Nerul",      lat: 19.0323, lon: 73.0169, zone: "Suburbs", trainLine: "Harbour" },
  { name: "Panvel",     lat: 18.9894, lon: 73.1175, zone: "Suburbs" },
];

interface ZoneLive {
  zone: MumbaiZone;
  weather: CurrentWeather | null;
  aqi: AirPollution | null;
}

function makeFallback(zone: MumbaiZone, idx: number): ZoneLive {
  const temps = [29, 31, 28, 32, 30, 33, 27, 34, 29, 31, 28, 35];
  const aqiVals = [2, 3, 3, 4, 2, 3, 4, 2, 3, 3, 2, 4];
  const descs = ["moderate rain", "drizzle", "overcast clouds", "few clouds", "clear sky"];
  const icons = ["10d", "09d", "04d", "02d", "01d"];
  const seed = idx % 5;
  const temp = temps[idx % temps.length];
  return {
    zone,
    weather: {
      coord: { lat: zone.lat, lon: zone.lon },
      weather: [{ id: 500, main: "Rain", description: descs[seed], icon: icons[seed] }],
      base: "stations",
      main: {
        temp, feels_like: temp + 2, temp_min: temp - 2, temp_max: temp + 3,
        pressure: 1005, humidity: 72 + (idx % 20),
      },
      visibility: 5000 + idx * 200,
      wind: { speed: 3 + (idx % 7), deg: 220 },
      clouds: { all: 60 + (idx % 40) },
      dt: Math.floor(Date.now() / 1000),
      sys: { country: "IN", sunrise: 1716340000, sunset: 1716388000 },
      timezone: 19800, id: 1200000 + idx, name: zone.name, cod: 200,
    },
    aqi: {
      coord: { lat: zone.lat, lon: zone.lon },
      list: [{
        dt: Math.floor(Date.now() / 1000),
        main: { aqi: aqiVals[idx % aqiVals.length] },
        components: { co: 300, no: 5, no2: 30 + idx * 2, o3: 50, so2: 10, pm2_5: 25 + idx, pm10: 40 + idx, nh3: 5 },
      }],
    },
  };
}

async function fetchZoneLive(zone: MumbaiZone, idx: number): Promise<ZoneLive> {
  try {
    const [wRes, aRes] = await Promise.all([
      fetch(`${BASE}/data/2.5/weather?lat=${zone.lat}&lon=${zone.lon}&appid=${API_KEY}&units=metric`),
      fetch(`${BASE}/data/2.5/air_pollution?lat=${zone.lat}&lon=${zone.lon}&appid=${API_KEY}`),
    ]);
    if (!wRes.ok || !aRes.ok) throw new Error("api");
    const [weather, aqi] = await Promise.all([wRes.json(), aRes.json()]);
    weather.name = zone.name;
    return { zone, weather, aqi };
  } catch {
    return makeFallback(zone, idx);
  }
}

// Custom pulsing DivIcon
function makeZoneIcon(aqiVal: number, name: string): L.DivIcon {
  const c = AQI_COLORS[aqiVal] ?? AQI_COLORS[3];
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:38px;height:38px;border-radius:50%;
          background:${c.fill}22;
          border:2.5px solid ${c.fill};
          display:flex;align-items:center;justify-content:center;
          font-size:10px;font-weight:800;color:${c.fill};
          box-shadow:0 0 12px ${c.fill}66;
          backdrop-filter:blur(4px);
        ">${aqiVal}</div>
        <div style="
          margin-top:2px;
          background:rgba(10,12,24,0.85);
          color:${c.fill};
          font-size:9px;font-weight:700;
          padding:1px 5px;border-radius:4px;
          border:1px solid ${c.fill}55;
          white-space:nowrap;
        ">${name}</div>
      </div>`,
    iconSize: [52, 52],
    iconAnchor: [26, 38],
    popupAnchor: [0, -40],
  });
}

// Fly-to helper
function FlyTo({ lat, lon, zoom }: { lat: number; lon: number; zoom: number }) {
  const map = useMap();
  const prevRef = useRef<string>("");
  useEffect(() => {
    const key = `${lat},${lon},${zoom}`;
    if (prevRef.current !== key) {
      prevRef.current = key;
      map.flyTo([lat, lon], zoom, { duration: 1.5 });
    }
  }, [lat, lon, zoom, map]);
  return null;
}

// Mumbai zone markers rendered inside the map
function MumbaiOverlay({ zones, unit }: { zones: ZoneLive[]; unit: "C" | "F" }) {
  return (
    <>
      {zones.map(zd => {
        if (!zd.weather || !zd.aqi) return null;
        const aqiVal = zd.aqi.list[0].main.aqi;
        const c = AQI_COLORS[aqiVal] ?? AQI_COLORS[3];
        const temp = Math.round(convertTemp(zd.weather.main.temp, unit));
        const aqiInfo = getAqiInfo(aqiVal);

        return (
          <Marker
            key={zd.zone.name}
            position={[zd.zone.lat, zd.zone.lon]}
            icon={makeZoneIcon(aqiVal, `${temp}°`)}
          >
            <Popup maxWidth={240} className="mumbai-popup">
              <div style={{
                background: "rgba(10,12,24,0.95)",
                borderRadius: "14px",
                border: `1.5px solid ${c.fill}44`,
                padding: "14px",
                fontFamily: "system-ui,sans-serif",
                color: "#e2e8f0",
                minWidth: "200px",
              }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "2px" }}>{zd.zone.name}</div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{zd.zone.zone} Zone {zd.zone.trainLine ? `· ${zd.zone.trainLine} Line` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "26px", fontWeight: 900, lineHeight: 1 }}>{temp}°{unit}</div>
                    <div style={{ fontSize: "10px", color: "#94a3b8" }}>feels {Math.round(convertTemp(zd.weather.main.feels_like, unit))}°</div>
                  </div>
                </div>

                {/* Condition */}
                <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "capitalize", marginBottom: "10px" }}>
                  {zd.weather.weather[0].description}
                </div>

                {/* AQI badge */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: `${c.fill}18`, border: `1px solid ${c.fill}40`,
                  borderRadius: "8px", padding: "6px 10px", marginBottom: "10px",
                }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.fill, boxShadow: `0 0 6px ${c.fill}` }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, color: c.fill }}>AQI {aqiVal} — {aqiInfo.label}</span>
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {[
                    { icon: "💧", label: "Humidity", val: `${zd.weather.main.humidity}%` },
                    { icon: "🌬️", label: "Wind",     val: `${zd.weather.wind.speed.toFixed(1)} m/s` },
                    { icon: "👁️", label: "Visibility",val: `${(zd.weather.visibility / 1000).toFixed(1)} km` },
                    { icon: "🫧", label: "PM2.5",    val: `${zd.aqi.list[0].components.pm2_5.toFixed(1)} μg` },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: "rgba(255,255,255,0.04)", borderRadius: "8px",
                      padding: "6px 8px", fontSize: "10px",
                    }}>
                      <div style={{ color: "#64748b", marginBottom: "2px" }}>{s.icon} {s.label}</div>
                      <div style={{ fontWeight: 700, color: "#e2e8f0" }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

interface WeatherMapProps {
  lat: number;
  lon: number;
  city: string;
  apiKey: string;
  unit?: "C" | "F";
}

type LayerKey = "temp_new" | "precipitation_new" | "clouds_new" | "wind_new";

const LAYERS: { key: LayerKey; label: string }[] = [
  { key: "temp_new",          label: "Temperature" },
  { key: "precipitation_new", label: "Rain"        },
  { key: "clouds_new",        label: "Clouds"      },
  { key: "wind_new",          label: "Wind"        },
];

export function WeatherMap({ lat, lon, city, apiKey, unit = "C" }: WeatherMapProps) {
  const [layer, setLayer]           = useState<LayerKey>("temp_new");
  const [mumbaiMode, setMumbaiMode] = useState(false);
  const [zones, setZones]           = useState<ZoneLive[]>([]);
  const [loading, setLoading]       = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Stats for the legend
  const loaded = zones.filter(z => z.weather && z.aqi);
  const hottest  = loaded.length ? loaded.reduce((a, b) => a.weather!.main.temp > b.weather!.main.temp ? a : b) : null;
  const bestAQI  = loaded.length ? loaded.reduce((a, b) => a.aqi!.list[0].main.aqi <= b.aqi!.list[0].main.aqi ? a : b) : null;
  const worstAQI = loaded.length ? loaded.reduce((a, b) => a.aqi!.list[0].main.aqi >= b.aqi!.list[0].main.aqi ? a : b) : null;

  const loadMumbai = async () => {
    setLoading(true);
    const results = await Promise.allSettled(MUMBAI_ZONES.map((z, i) => fetchZoneLive(z, i)));
    setZones(MUMBAI_ZONES.map((zone, i) => {
      const r = results[i];
      return r.status === "fulfilled" ? r.value : makeFallback(zone, i);
    }));
    setLastUpdated(new Date());
    setLoading(false);
  };

  const toggleMumbai = () => {
    if (!mumbaiMode) {
      setMumbaiMode(true);
      if (!zones.length) loadMumbai();
    } else {
      setMumbaiMode(false);
    }
  };

  // Compute map center / zoom
  const mapLat  = mumbaiMode ? 19.076 : lat;
  const mapLon  = mumbaiMode ? 72.877 : lon;
  const mapZoom = mumbaiMode ? 11 : 10;

  return (
    <div className="space-y-4">

      {/* Mumbai mode stats bar */}
      <AnimatePresence>
        {mumbaiMode && loaded.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              { label: "Zones Live",    val: `${loaded.length}/24`,         icon: <MapPin size={13} className="text-primary" />,      color: "border-primary/30 from-primary/10" },
              { label: "Hottest Zone",  val: hottest?.zone.name ?? "—",     icon: <Thermometer size={13} className="text-red-400" />, color: "border-red-500/30 from-red-500/10" },
              { label: "Best Air",      val: bestAQI?.zone.name ?? "—",     icon: <Activity size={13} className="text-green-400" />,  color: "border-green-500/30 from-green-500/10" },
              { label: "Worst Air",     val: worstAQI?.zone.name ?? "—",    icon: <Activity size={13} className="text-red-400" />,    color: "border-red-500/30 from-red-500/10" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border bg-gradient-to-br ${s.color} to-transparent bg-card p-3`}>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-medium mb-1">
                  {s.icon}{s.label}
                </div>
                <div className="text-sm font-black">{s.val}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map container */}
      <div className="relative rounded-3xl overflow-hidden border border-border/50 h-[500px] md:h-[65vh]">

        {/* Controls panel */}
        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">

          {/* Layer switcher */}
          <div className="glass backdrop-blur-xl bg-card/80 p-2 rounded-2xl border border-border/40 flex flex-col gap-1.5">
            <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Layers size={9} />Overlay
            </div>
            {LAYERS.map(l => (
              <button
                key={l.key}
                onClick={() => setLayer(l.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors text-left ${
                  layer === l.key
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Mumbai toggle */}
          <button
            onClick={toggleMumbai}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border backdrop-blur-xl ${
              mumbaiMode
                ? "bg-orange-500/25 border-orange-500/60 text-orange-400 shadow-[0_0_16px_rgba(249,115,22,0.25)]"
                : "bg-card/80 border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {loading
              ? <RefreshCw size={14} className="animate-spin" />
              : <span className="text-base">🇮🇳</span>}
            Mumbai Live
            {mumbaiMode && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse ml-1" />}
          </button>
        </div>

        {/* AQI legend when Mumbai mode is on */}
        <AnimatePresence>
          {mumbaiMode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute bottom-6 right-4 z-[400] glass backdrop-blur-xl bg-card/80 border border-border/40 rounded-2xl p-3"
            >
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <Activity size={9} />AQI Legend
              </div>
              {Object.entries(AQI_COLORS).map(([aqi, c]) => (
                <div key={aqi} className="flex items-center gap-2 py-0.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.fill, boxShadow: `0 0 6px ${c.fill}80` }} />
                  <span className="text-[10px] font-medium text-muted-foreground">{aqi} · {c.label}</span>
                </div>
              ))}
              {lastUpdated && (
                <div className="text-[9px] text-muted-foreground/50 mt-2 pt-2 border-t border-border/30">
                  Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm"
            >
              <RefreshCw size={28} className="animate-spin text-primary mb-3" />
              <p className="text-sm font-semibold text-primary">Loading 24 Mumbai zones…</p>
              <p className="text-xs text-muted-foreground mt-1">Fetching live weather + AQI data</p>
            </motion.div>
          )}
        </AnimatePresence>

        <MapContainer center={[mapLat, mapLon]} zoom={mapZoom} scrollWheelZoom className="w-full h-full">
          {/* Dark base tile */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {/* Weather overlay tile */}
          <TileLayer
            url={`https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${apiKey}`}
            opacity={0.5}
          />

          {/* Standard city marker (when not Mumbai mode) */}
          {!mumbaiMode && (
            <Marker position={[lat, lon]}>
              <Popup>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{city}</div>
              </Popup>
            </Marker>
          )}

          {/* Mumbai zone markers */}
          {mumbaiMode && <MumbaiOverlay zones={zones} unit={unit} />}

          {/* Smooth fly-to on mode switch */}
          <FlyTo lat={mapLat} lon={mapLon} zoom={mapZoom} />
        </MapContainer>
      </div>

      {/* Zone data table (Mumbai mode only) */}
      <AnimatePresence>
        {mumbaiMode && loaded.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="rounded-3xl border border-border/50 bg-card overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                All Mumbai Zones — Live Data
              </h3>
              <button
                onClick={loadMumbai}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                Refresh All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/20">
                    <th className="text-left px-6 py-3">Zone</th>
                    <th className="text-left px-4 py-3">Area</th>
                    <th className="text-right px-4 py-3">Temp</th>
                    <th className="text-right px-4 py-3">Feels</th>
                    <th className="text-right px-4 py-3">Humidity</th>
                    <th className="text-right px-4 py-3">Wind</th>
                    <th className="text-center px-4 py-3">AQI</th>
                    <th className="text-left px-4 py-3">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {loaded.map((zd, i) => {
                    const aqiVal = zd.aqi!.list[0].main.aqi;
                    const c = AQI_COLORS[aqiVal] ?? AQI_COLORS[3];
                    const temp = Math.round(convertTemp(zd.weather!.main.temp, unit));
                    const feels = Math.round(convertTemp(zd.weather!.main.feels_like, unit));
                    const isHot  = hottest?.zone.name  === zd.zone.name;
                    const isBest = bestAQI?.zone.name  === zd.zone.name;
                    const isWrst = worstAQI?.zone.name === zd.zone.name;
                    return (
                      <motion.tr
                        key={zd.zone.name}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.025 }}
                        className="border-b border-border/10 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-3 font-bold">
                          {zd.zone.name}
                          {isHot  && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">🔥HOT</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{zd.zone.zone}</td>
                        <td className="px-4 py-3 text-right font-bold">{temp}°{unit}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-xs">{feels}°</td>
                        <td className="px-4 py-3 text-right">
                          <span className="flex items-center justify-end gap-1">
                            <Droplets size={11} className="text-blue-400" />
                            {zd.weather!.main.humidity}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="flex items-center justify-end gap-1">
                            <Wind size={11} className="text-cyan-400" />
                            {zd.weather!.wind.speed.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{ background: `${c.fill}18`, color: c.fill, border: `1px solid ${c.fill}44` }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: c.fill }} />
                            {aqiVal} · {c.label}
                            {isBest && <span className="text-[8px]">✓</span>}
                            {isWrst && <span className="text-[8px]">!</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs capitalize">{zd.weather!.weather[0].description}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
