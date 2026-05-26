import { useState } from "react";
import { motion } from "framer-motion";
import { Wind, Flame, Waves, Snowflake, CloudRain } from "lucide-react";

export function WeatherNews() {
  const [activeTab, setActiveTab] = useState("All");
  
  const headlines = "BREAKING: Category 4 hurricane approaching Gulf Coast | Severe flooding in Central Europe | Record heatwave hits Spain, 46°C | Heavy monsoon rainfall in Mumbai | Wildfire season begins early in California | ";

  const news = [
    { id:1, category:"Storm", title:"Category 4 Hurricane Approaches Gulf Coast", excerpt:"Forecasters warn of life-threatening storm surge as powerful hurricane intensifies...", time:"2 hours ago", severity:"critical", Icon: Wind },
    { id:2, category:"Heatwave", title:"Europe Faces Record-Breaking Summer Heat", excerpt:"Temperatures across southern Europe are expected to reach 46°C this weekend...", time:"4 hours ago", severity:"warning", Icon: Flame },
    { id:3, category:"Flooding", title:"Severe Floods Displace Thousands in Central Europe", excerpt:"Emergency evacuations underway as rivers burst banks following 72 hours of rain...", time:"6 hours ago", severity:"critical", Icon: Waves },
    { id:4, category:"Climate", title:"Arctic Ice Reaches Record Low for Third Year Running", excerpt:"Scientists warn of accelerating climate feedback loops as polar ice continues...", time:"1 day ago", severity:"info", Icon: Snowflake },
    { id:5, category:"Wildfire", title:"California Wildfire Season Begins Six Weeks Early", excerpt:"Dry conditions and high winds have created dangerous fire weather across...", time:"1 day ago", severity:"warning", Icon: Flame },
    { id:6, category:"Monsoon", title:"Mumbai Records Highest Single-Day Rainfall in Decade", excerpt:"Heavy monsoon rainfall disrupts transportation as the city receives 180mm in 24 hours...", time:"2 days ago", severity:"info", Icon: CloudRain }
  ];

  const tabs = ["All", "Storm", "Heatwave", "Flooding", "Climate", "Wildfire", "Monsoon"];
  const filtered = activeTab === "All" ? news : news.filter(n => n.category === activeTab);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'Storm': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'Heatwave': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Flooding': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'Climate': return 'text-teal-400 bg-teal-400/10 border-teal-400/20';
      case 'Wildfire': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Monsoon': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-red-500/10 border border-red-500/20 rounded-full overflow-hidden flex items-center">
        <div className="bg-red-500 text-white font-bold text-xs px-4 py-2 uppercase tracking-wider whitespace-nowrap z-10">Breaking</div>
        <div className="flex-1 overflow-hidden relative">
           <motion.div 
             animate={{ x: [0, -1000] }} 
             transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
             className="whitespace-nowrap text-sm font-medium text-red-400 px-4"
           >
             {headlines}{headlines}
           </motion.div>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item => (
          <motion.div 
            key={item.id} 
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.01 }}
            className="group rounded-3xl bg-card border border-border/50 p-6 flex flex-col h-full hover:border-primary/50 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)] transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getCategoryColor(item.category)}`}>
                {item.category}
              </span>
              {item.severity === 'critical' && (
                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Breaking</span>
              )}
              {item.severity === 'warning' && (
                <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Warning</span>
              )}
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-muted p-2 rounded-xl">
                <item.Icon size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{item.title}</h3>
            </div>
            
            <p className="text-muted-foreground text-sm flex-1 mb-4">{item.excerpt}</p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30">
              <span className="text-xs text-muted-foreground">{item.time}</span>
              <button className="text-xs font-bold text-primary hover:text-primary-foreground hover:bg-primary px-3 py-1.5 rounded transition-colors">
                Read More
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
