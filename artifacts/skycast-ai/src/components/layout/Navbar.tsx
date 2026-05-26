import { Moon, Sun, User, Bell } from "lucide-react";
import { SearchBar } from "../weather/SearchBar";
import { motion } from "framer-motion";

interface NavbarProps {
  currentTemp: number | null;
  unit: "C" | "F";
  onSearch: (city: string) => void;
}

export function Navbar({ currentTemp, unit, onSearch }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-background/80 border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6 gap-4">
        <div className="flex-1 flex items-center justify-between">
          <div className="w-full max-w-xl">
            <SearchBar onSearch={onSearch} />
          </div>
          
          <div className="flex items-center gap-6">
            {currentTemp !== null && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:flex items-center gap-2 bg-muted/40 border border-border/50 px-3 py-1.5 rounded-full"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium">LIVE</span>
                <span className="text-sm text-muted-foreground border-l border-border/50 pl-2 ml-1">
                  {Math.round(currentTemp)}°{unit}
                </span>
              </motion.div>
            )}
            
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              </button>
              
              <button className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Sun size={20} className="hidden dark:block" />
                <Moon size={20} className="block dark:hidden" />
              </button>
              
              <button className="ml-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center border border-border/50 overflow-hidden shadow-[0_0_10px_rgba(0,212,255,0.3)]">
                <User size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
