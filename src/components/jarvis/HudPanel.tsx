import type { ReactNode } from "react";

export function HudPanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`hud-panel relative p-3 ${className}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-1 w-1 bg-primary" />
        <h2 className="text-[0.6rem] tracking-[0.3em] text-hud-dim">{title}</h2>
        <span className="h-px flex-1 bg-border" />
      </div>
      {children}
    </section>
  );
}

export function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between text-[0.6rem] tracking-[0.2em] text-muted-foreground">
        <span>{label}</span>
        <span className="text-primary">{Math.round(value)}%</span>
      </div>
      <div className="mt-1 h-1 w-full bg-secondary/60">
        <div
          className="h-full bg-primary/80 transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(2, value))}%` }}
        />
      </div>
    </div>
  );
}
