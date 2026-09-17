import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArcReactor } from "@/components/jarvis/ArcReactor";
import { HudPanel, Meter } from "@/components/jarvis/HudPanel";
import { useSpeechInput, useSpeechOutput } from "@/hooks/use-speech";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "J.A.R.V.I.S. — Voice AI Terminal" },
      {
        name: "description",
        content:
          "A JARVIS-style voice assistant HUD: speak a question, get a searched, spoken answer on a holographic interface.",
      },
      { property: "og:title", content: "J.A.R.V.I.S. — Voice AI Terminal" },
      {
        property: "og:description",
        content:
          "Speak to JARVIS: live web-grounded answers delivered on a holographic heads-up display.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Jarvis,
});

type Entry = {
  id: number;
  role: "user" | "assistant" | "system";
  text: string;
  trace?: string[];
};

let entryId = 0;

function Jarvis() {
  const [entries, setEntries] = useState<Entry[]>([
    {
      id: entryId++,
      role: "system",
      text: "SYSTEM ONLINE. AWAITING INSTRUCTION. PRESS TALK OR TYPE BELOW.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [status, setStatus] = useState("STANDBY");
  const [clock, setClock] = useState("--:--:--");
  const logRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  const { speak, stopSpeaking, speaking, muted, setMuted } = useSpeechOutput();

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const query = text.trim();
      if (!query || thinking) return;

      stopSpeaking();
      setEntries((prev) => [...prev, { id: entryId++, role: "user", text: query }]);
      historyRef.current = [...historyRef.current, { role: "user", content: query }];
      setInput("");
      setThinking(true);
      setStatus("PROCESSING");

      try {
        const res = await fetch("/api/jarvis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: historyRef.current }),
        });
        const data = await res.json();

        if (!res.ok) {
          setEntries((prev) => [
            ...prev,
            { id: entryId++, role: "system", text: data?.error ?? "LINK FAILURE." },
          ]);
          setStatus("ERROR");
          return;
        }

        const trace: string[] = [];
        if (data.usedSearch) {
          trace.push("Searching the web...");
          for (const q of data.queries ?? []) trace.push(`query: ${q}`);
          for (const s of data.sources ?? []) trace.push(s);
        }

        setEntries((prev) => [
          ...prev,
          { id: entryId++, role: "assistant", text: data.text, trace },
        ]);
        historyRef.current = [
          ...historyRef.current,
          { role: "assistant", content: data.text },
        ];
        setStatus("READY");
        speak(data.text);
      } catch {
        setEntries((prev) => [
          ...prev,
          { id: entryId++, role: "system", text: "CONNECTION LOST. TRY AGAIN." },
        ]);
        setStatus("ERROR");
      } finally {
        setThinking(false);
      }
    },
    [speak, stopSpeaking, thinking],
  );

  const { listening, interim, supported, start, stop } = useSpeechInput(send);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [entries, interim, thinking]);

  useEffect(() => {
    if (listening) setStatus("LISTENING");
    else if (speaking) setStatus("SPEAKING");
    else if (!thinking) setStatus((s) => (s === "ERROR" ? s : "STANDBY"));
  }, [listening, speaking, thinking]);

  const active = listening || thinking || speaking;
  const today = new Date();

  return (
    <main className="hud-bg min-h-screen px-3 py-4 sm:px-6 sm:py-6">
      <div className="scanlines mx-auto max-w-[110rem]">
        {/* top bar */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-4">
            <span className="text-lg tracking-[0.5em] text-primary hud-glow sm:text-2xl">
              J.A.R.V.I.S
            </span>
            <span className="hidden text-[0.6rem] tracking-[0.35em] text-hud-dim sm:inline">
              JUST A RATHER VERY INTELLIGENT SYSTEM
            </span>
          </div>
          <div className="flex items-center gap-4 text-[0.65rem] tracking-[0.3em] text-muted-foreground">
            <span>{today.toDateString().toUpperCase()}</span>
            <span className="text-primary hud-glow">{clock}</span>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)_20rem]">
          {/* left column */}
          <div className="order-2 space-y-4 lg:order-1">
            <HudPanel title="DATE">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl text-primary hud-glow">{today.getDate()}</span>
                <div className="text-[0.6rem] tracking-[0.25em] text-muted-foreground">
                  <p>{today.toLocaleString([], { month: "long" }).toUpperCase()}</p>
                  <p>{today.toLocaleString([], { weekday: "long" }).toUpperCase()}</p>
                </div>
              </div>
            </HudPanel>

            <HudPanel title="SYSTEM">
              <Meter label="CORE" value={active ? 82 : 36} />
              <Meter label="MEMORY" value={54} />
              <Meter label="UPLINK" value={thinking ? 93 : 61} />
            </HudPanel>

            <HudPanel title="MODULES">
              <ul className="space-y-1 text-[0.65rem] tracking-[0.2em] text-muted-foreground">
                <Module label="MIC" on={listening} />
                <Module label="WEB" on={thinking} />
                <Module label="AI CORE" on={thinking || speaking} />
                <Module label="VOICE" on={!muted} />
              </ul>
            </HudPanel>
          </div>

          {/* center */}
          <div className="order-1 space-y-4 lg:order-2">
            <div className="hud-panel px-4 py-6">
              <ArcReactor active={active} />
              <p className="mt-4 text-center text-xs tracking-[0.4em] text-accent sm:text-sm">
                [ {thinking ? "PROCESSING" : status} ]
              </p>
            </div>

            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <div className="hud-panel flex flex-1 items-center gap-2 px-3 py-2">
                <span className="text-hud-dim">&gt;</span>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="hey jarvis..."
                  aria-label="Message JARVIS"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={listening ? stop : start}
                  disabled={!supported}
                  className="flex-1 border border-primary/60 px-5 py-2 text-xs tracking-[0.25em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40 sm:flex-none"
                >
                  {listening ? "STOP" : "TALK"}
                </button>
                <button
                  type="submit"
                  disabled={thinking}
                  className="flex-1 border border-border px-5 py-2 text-xs tracking-[0.25em] text-foreground transition-colors hover:bg-secondary disabled:opacity-40 sm:flex-none"
                >
                  SEND
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!muted) stopSpeaking();
                    setMuted(!muted);
                  }}
                  className="border border-border px-4 py-2 text-xs tracking-[0.25em] text-muted-foreground hover:text-primary"
                >
                  {muted ? "MUTED" : "VOICE"}
                </button>
              </div>
            </form>

            {!supported && (
              <p className="text-[0.7rem] text-muted-foreground">
                Voice input needs Chrome or Edge. Typing works everywhere.
              </p>
            )}
          </div>

          {/* right: transcript */}
          <div className="order-3 lg:order-3">
            <HudPanel title="TRANSMISSION LOG" className="h-full">
              <div
                ref={logRef}
                className="h-[26rem] overflow-y-auto pr-1 text-[0.78rem] leading-relaxed lg:h-[34rem]"
              >
                {entries.map((entry) => (
                  <div key={entry.id} className="mb-4">
                    {entry.role === "system" ? (
                      <p className="text-muted-foreground">:: {entry.text}</p>
                    ) : entry.role === "user" ? (
                      <p className="text-foreground">
                        <span className="text-hud-dim">YOU:</span> {entry.text}
                      </p>
                    ) : (
                      <div>
                        {entry.trace && entry.trace.length > 0 && (
                          <div className="mb-1 text-hud-dim">
                            <p>JARVIS: Searching the web...</p>
                            {entry.trace.slice(1).map((line, i, arr) => (
                              <p key={line + i} className="pl-6">
                                {i === arr.length - 1 ? "└─ " : "├─ "}
                                {line}
                              </p>
                            ))}
                          </div>
                        )}
                        <p className="text-primary hud-glow">
                          <span className="text-hud-dim">JARVIS:</span> {entry.text}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {interim && <p className="text-hud-dim">YOU: {interim}</p>}
                {thinking && (
                  <p className="text-accent">
                    JARVIS: thinking<span className="caret">_</span>
                  </p>
                )}
              </div>
            </HudPanel>
          </div>
        </div>
      </div>
    </main>
  );
}

function Module({ label, on }: { label: string; on: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span className={on ? "text-signal" : "text-hud-dim"}>{on ? "● ACTIVE" : "○ IDLE"}</span>
    </li>
  );
}
