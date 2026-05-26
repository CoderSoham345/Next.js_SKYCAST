import { 
  LayoutDashboard, 
  CalendarDays, 
  Wind, 
  Map as MapIcon, 
  AlertTriangle, 
  Newspaper, 
  Settings,
  CloudLightning,
  GitCompareArrows,
  Building2
} from "lucide-react";
import { motion } from "framer-motion";

export type Section = "dashboard" | "forecast" | "aqi" | "map" | "alerts" | "news" | "compare" | "mumbai" | "settings";

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const menuItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { id: "forecast", label: "Forecast", icon: <CalendarDays size={20} /> },
    { id: "aqi", label: "Air Quality", icon: <Wind size={20} /> },
    { id: "map", label: "Interactive Map", icon: <MapIcon size={20} /> },
    { id: "alerts", label: "Alerts", icon: <AlertTriangle size={20} /> },
    { id: "news", label: "Weather News", icon: <Newspaper size={20} /> },
    { id: "compare", label: "Compare Cities", icon: <GitCompareArrows size={20} /> },
    { id: "mumbai", label: "Mumbai Live Zone", icon: <Building2 size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-64 border-r border-border/40 bg-sidebar/95 backdrop-blur-xl flex flex-col h-screen overflow-hidden">
      <div className="p-6 flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <CloudLightning className="text-primary relative z-10" size={28} />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          SkyCast AI
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative group ${
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-lg shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className={`relative z-10 transition-transform duration-300 ${isActive ? "scale-110 text-primary" : "group-hover:scale-110"}`}>
                {item.icon}
              </span>
              <span className="relative z-10 font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border/40">
        <div className="bg-card/50 border border-border/50 rounded-xl p-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h4 className="text-sm font-semibold mb-1 relative z-10">Pro Version</h4>
          <p className="text-xs text-muted-foreground mb-3 relative z-10">Access advanced AI insights</p>
          <button className="w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold rounded border border-primary/30 transition-all">
            UPGRADE NOW
          </button>
        </div>
      </div>
    </aside>
  );
}
