import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Mic, Command } from "lucide-react";
import { searchCities } from "../../lib/weatherApi";
import { City } from "../../types/weather";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  onSearch: (city: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecent(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (query.length > 2) {
        const res = await searchCities(query);
        setResults(res);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (cityName: string) => {
    onSearch(cityName);
    setQuery("");
    setIsOpen(false);
    
    const newRecent = [cityName, ...recent.filter(c => c !== cityName)].slice(0, 5);
    setRecent(newRecent);
    localStorage.setItem("recentSearches", JSON.stringify(newRecent));
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-center bg-muted/30 border border-border/50 hover:border-primary/50 focus-within:border-primary focus-within:bg-card/80 rounded-full px-4 py-2.5 transition-all duration-300">
          <Search size={18} className="text-muted-foreground mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search any city..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          />
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="hover:text-primary transition-colors">
              <Mic size={16} />
            </button>
            <div className="h-4 w-px bg-border/50" />
            <button className="hover:text-primary transition-colors flex items-center text-xs gap-1">
              <Command size={14} /> K
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (query.length > 0 || recent.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {results.length > 0 ? (
              <div className="p-2">
                <div className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">Results</div>
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(r.name)}
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/50 rounded-lg flex items-center justify-between group transition-colors"
                  >
                    <span className="font-medium group-hover:text-primary transition-colors">{r.name}</span>
                    <span className="text-xs text-muted-foreground">{r.state ? `${r.state}, ` : ""}{r.country}</span>
                  </button>
                ))}
              </div>
            ) : query.length > 2 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
            ) : null}

            {!query && recent.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">Recent Searches</div>
                <div className="flex flex-wrap gap-2 px-3 pb-2">
                  {recent.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(r)}
                      className="text-xs bg-muted/40 hover:bg-primary/20 border border-border/50 hover:border-primary/30 px-3 py-1.5 rounded-full transition-all"
                    >
                      {r}
                    </button>
                  ))}
                </div>
                
                <div className="px-3 pt-2 pb-1 border-t border-border/40 mt-1">
                  <button className="w-full flex items-center justify-center gap-2 text-xs text-primary hover:text-primary-foreground py-2 rounded bg-primary/10 hover:bg-primary/20 transition-colors">
                    <MapPin size={14} /> Use Current Location
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
