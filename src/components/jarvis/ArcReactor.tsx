const REACTOR = String.raw`      ╱──────╲
    ╱    ◉     ╲
   │   ◉ ◉ ◉    │
    ╲    ◉     ╱
      ╲──────╱`;

export function ArcReactor({ active }: { active: boolean }) {
  return (
    <pre
      aria-hidden="true"
      className={`select-none text-center text-[0.7rem] leading-[1.15] text-primary hud-glow sm:text-sm ${
        active ? "reactor" : "opacity-70"
      }`}
    >
      {REACTOR}
    </pre>
  );
}
