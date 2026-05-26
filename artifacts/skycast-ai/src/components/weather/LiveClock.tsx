import { useState, useEffect } from "react";

export function LiveClock({ timezone }: { timezone: number }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const localTime = new Date(time.getTime() + time.getTimezoneOffset() * 60000 + timezone * 1000);

  return (
    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/30">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
      {localTime.toLocaleTimeString('en-US', { hour12: false })}
    </div>
  );
}
