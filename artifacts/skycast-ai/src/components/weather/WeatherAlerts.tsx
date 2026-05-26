import { motion } from "framer-motion";
import { AlertTriangle, Waves, Wind, Flame } from "lucide-react";

export function WeatherAlerts() {
  const alerts = [
    { type: "Thunderstorm", severity: "warning", area: "London Metro", time: "Next 2 hours", description: "Severe thunderstorm with lightning and heavy rainfall expected.", color: "yellow", Icon: AlertTriangle },
    { type: "Flood Watch", severity: "watch", area: "Thames Valley", time: "Next 6 hours", description: "Potential for rapid river rise. Coastal flooding possible.", color: "orange", Icon: Waves },
    { type: "High Winds", severity: "advisory", area: "Open Coasts", time: "Tonight", description: "Wind gusts up to 65 mph in exposed coastal areas.", color: "blue", Icon: Wind },
    { type: "Heat Wave", severity: "watch", area: "Southeast UK", time: "This weekend", description: "Maximum temperatures of 36°C expected Saturday-Sunday.", color: "red", Icon: Flame },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className="absolute w-4 h-4 rounded-full bg-red-500 animate-ping opacity-75"></span>
          <span className="relative w-2 h-2 rounded-full bg-red-500"></span>
        </div>
        <span className="font-bold text-sm text-red-500 tracking-widest uppercase">ACTIVE ALERTS</span>
        <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-xs font-bold">{alerts.length}</span>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert, idx) => (
          <motion.div key={idx} variants={itemVariants} className={`relative overflow-hidden rounded-3xl bg-card border border-border/50 p-6 flex flex-col justify-between ${alert.color === 'yellow' ? 'border-l-4 border-l-yellow-500' : alert.color === 'orange' ? 'border-l-4 border-l-orange-500' : alert.color === 'blue' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-red-500'}`}>
             <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${alert.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-500' : alert.color === 'orange' ? 'bg-orange-500/20 text-orange-500' : alert.color === 'blue' ? 'bg-blue-500/20 text-blue-500' : 'bg-red-500/20 text-red-500'}`}>
                   <alert.Icon size={20} />
                 </div>
                 <div>
                   <h3 className="font-bold text-lg">{alert.type}</h3>
                   <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{alert.severity}</span>
                 </div>
               </div>
               <span className="text-xs font-medium bg-muted/50 px-2 py-1 rounded-md">{alert.time}</span>
             </div>
             
             <div>
               <p className="text-sm font-medium text-foreground mb-1">{alert.area}</p>
               <p className="text-sm text-muted-foreground">{alert.description}</p>
             </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
