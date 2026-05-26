import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface WeatherMapProps {
  lat: number;
  lon: number;
  city: string;
  apiKey: string;
}

function FlyToCity({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 10, { duration: 1.5 });
  }, [lat, lon, map]);
  return null;
}

export function WeatherMap({ lat, lon, city, apiKey }: WeatherMapProps) {
  const [layer, setLayer] = useState<"temp_new" | "precipitation_new" | "clouds_new">("temp_new");

  return (
    <div className="relative rounded-3xl overflow-hidden border border-border/50 h-[500px] md:h-[60vh]">
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 glass backdrop-blur-xl bg-card/60 p-2 rounded-2xl border border-border/40">
        <button
          onClick={() => setLayer("temp_new")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${layer === "temp_new" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"}`}
        >
          Temperature
        </button>
        <button
          onClick={() => setLayer("precipitation_new")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${layer === "precipitation_new" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"}`}
        >
          Rain
        </button>
        <button
          onClick={() => setLayer("clouds_new")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${layer === "clouds_new" ? "bg-primary text-primary-foreground" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"}`}
        >
          Clouds
        </button>
      </div>

      <MapContainer center={[lat, lon]} zoom={10} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <TileLayer
          url={`https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${apiKey}`}
        />
        <Marker position={[lat, lon]}>
          <Popup className="font-bold text-lg">{city}</Popup>
        </Marker>
        <FlyToCity lat={lat} lon={lon} />
      </MapContainer>
    </div>
  );
}
