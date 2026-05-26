import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Bell, Moon, Sun, Thermometer, Wind, MapPin } from "lucide-react";

interface SettingsPanelProps {
  unit: "C" | "F";
  onUnitChange: (u: "C" | "F") => void;
  onCityChange: (city: string) => void;
}

export function SettingsPanel({ unit, onUnitChange, onCityChange }: SettingsPanelProps) {
  const [defaultCity, setDefaultCity] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [windUnit, setWindUnit] = useState<"ms" | "mph">("ms");
  const [notifications, setNotifications] = useState({ severe: true, daily: false });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const savedCity = localStorage.getItem("defaultCity");
    if (savedCity) setDefaultCity(savedCity);
    
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    const savedWind = localStorage.getItem("windUnit");
    if (savedWind === "mph" || savedWind === "ms") setWindUnit(savedWind);
  }, []);

  const handleSaveCity = () => {
    if (defaultCity.trim()) {
      localStorage.setItem("defaultCity", defaultCity.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const toggleTheme = (t: "dark" | "light") => {
    setTheme(t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", t);
  };

  const handleWindChange = (u: "ms" | "mph") => {
    setWindUnit(u);
    localStorage.setItem("windUnit", u);
  };

  const quickCities = ["London", "New York", "Tokyo", "Paris", "Sydney", "Dubai", "Mumbai", "Berlin"];

  const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Units & Preferences */}
        <motion.div variants={sectionVariants} className="rounded-3xl bg-card border border-border/50 p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border/30">
            <div className="p-2 rounded-xl bg-primary/10 text-primary"><Thermometer size={20} /></div>
            <h3 className="font-bold text-lg">Measurement Units</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Temperature</p>
              <p className="text-sm text-muted-foreground">Celsius or Fahrenheit</p>
            </div>
            <div className="flex bg-muted/50 p-1 rounded-xl border border-border/30">
              <button onClick={() => onUnitChange("C")} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${unit === "C" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>°C</button>
              <button onClick={() => onUnitChange("F")} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${unit === "F" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>°F</button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Wind Speed</p>
              <p className="text-sm text-muted-foreground">Meters/sec or MPH</p>
            </div>
            <div className="flex bg-muted/50 p-1 rounded-xl border border-border/30">
              <button onClick={() => handleWindChange("ms")} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${windUnit === "ms" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>m/s</button>
              <button onClick={() => handleWindChange("mph")} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${windUnit === "mph" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>mph</button>
            </div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div variants={sectionVariants} className="rounded-3xl bg-card border border-border/50 p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border/30">
            <div className="p-2 rounded-xl bg-accent/10 text-accent"><Moon size={20} /></div>
            <h3 className="font-bold text-lg">Appearance</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme Mode</p>
              <p className="text-sm text-muted-foreground">Dark or Light mode</p>
            </div>
            <div className="flex bg-muted/50 p-1 rounded-xl border border-border/30">
              <button onClick={() => toggleTheme("dark")} className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${theme === "dark" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><Moon size={14} /> Dark</button>
              <button onClick={() => toggleTheme("light")} className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${theme === "light" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}><Sun size={14} /> Light</button>
            </div>
          </div>
        </motion.div>

        {/* Location Settings */}
        <motion.div variants={sectionVariants} className="rounded-3xl bg-card border border-border/50 p-6 space-y-6 md:col-span-2">
          <div className="flex items-center gap-3 pb-4 border-b border-border/30">
            <div className="p-2 rounded-xl bg-green-500/10 text-green-500"><MapPin size={20} /></div>
            <h3 className="font-bold text-lg">Location Preferences</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-1">Default City</p>
                <p className="text-sm text-muted-foreground mb-3">Loads automatically when you open the app</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={defaultCity}
                    onChange={(e) => setDefaultCity(e.target.value)}
                    placeholder="Enter city name..."
                    className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-2 outline-none focus:border-primary transition-colors"
                  />
                  <button onClick={handleSaveCity} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors">
                    <Save size={16} /> Save
                  </button>
                </div>
                {saveSuccess && <p className="text-xs text-green-500 mt-2">Saved successfully!</p>}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-3">Quick Load Cities</p>
                <div className="flex flex-wrap gap-2">
                  {quickCities.map(city => (
                    <button
                      key={city}
                      onClick={() => onCityChange(city)}
                      className="text-sm bg-muted/40 hover:bg-primary/20 border border-border/50 hover:border-primary/50 px-3 py-1.5 rounded-full transition-all"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={sectionVariants} className="rounded-3xl bg-card border border-border/50 p-6 space-y-6 md:col-span-2">
          <div className="flex items-center gap-3 pb-4 border-b border-border/30">
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500"><Bell size={20} /></div>
            <h3 className="font-bold text-lg">Notifications</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30">
              <div>
                <p className="font-medium">Severe Weather Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified for storms, heatwaves, etc.</p>
              </div>
              <button 
                onClick={() => setNotifications(p => ({ ...p, severe: !p.severe }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifications.severe ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.severe ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/30">
              <div>
                <p className="font-medium">Daily Summary</p>
                <p className="text-sm text-muted-foreground">Morning brief on today's weather</p>
              </div>
              <button 
                onClick={() => setNotifications(p => ({ ...p, daily: !p.daily }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifications.daily ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.daily ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
