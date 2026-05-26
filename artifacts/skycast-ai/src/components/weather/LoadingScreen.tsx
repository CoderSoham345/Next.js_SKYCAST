import { motion } from "framer-motion";
import { CloudLightning } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-foreground">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            filter: ["drop-shadow(0 0 10px rgba(0,212,255,0.3))", "drop-shadow(0 0 25px rgba(0,212,255,0.7))", "drop-shadow(0 0 10px rgba(0,212,255,0.3))"]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <CloudLightning size={80} className="text-primary mb-6" />
        </motion.div>
        
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          SkyCast <span className="text-primary">AI</span>
        </h1>
        <p className="text-muted-foreground text-sm tracking-widest uppercase mb-8">
          Initializing Weather Intelligence
        </p>

        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden relative">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
