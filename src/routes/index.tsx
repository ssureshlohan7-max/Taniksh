import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArcReactor } from "@/components/jarvis/ArcReactor";
import { useSpeechInput, useSpeechOutput } from "@/hooks/use-speech";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "J.A.R.V.I.S. — Voice AI Terminal" },
      {
        name: "description",
        content:
          "A JARVIS-style voice assistant terminal: speak a question, get a searched, spoken answer in a retro ASCII HUD.",
      },
      { property: "og:title", content: "J.A.R.V.I.S. — Voice AI Terminal" },
      {
        property: "og:description",
        content:
          "Speak to JARVIS: live web-grounded answers delivered in a retro ASCII heads-up display.",
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
  const logRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  const { speak, stopSpeaking, speaking, muted, setMuted } = useSpeechOutput();

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

  return (
    <main className="min-h-screen bg-background px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl hud-frame">
        <div className="scanlines px-4 py-6 sm:px-8 sm:py-8">
          <header className="text-center">
            <h1 className="text-2xl tracking-[0.5em] text-primary hud-glow sm:text-4xl">
              J.A.R.V.I.S
            </h1>
            <p className="mt-2 text-[0.65rem] tracking-[0.35em] text-muted-foreground sm:text-xs">
              ARTIFICIAL INTELLIGENCE
            </p>
          </header>

          <div className="mt-6">
            <ArcReactor active={listening || thinking || speaking} />
            <p className="mt-4 text-center text-xs tracking-[0.3em] text-accent sm:text-sm">
              [ {thinking ? "PROCESSING" : status} ]
            </p>
          </div>

          <div
            ref={logRef}
            className="mt-6 h-[19rem] overflow-y-auto border-y border-border py-4 pr-1 text-[0.8rem] leading-relaxed sm:text-sm"
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
                          <p key={line + i} className="pl-10">
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

          <form
            className="mt-5 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <div className="flex flex-1 items-center gap-2 border border-border bg-secondary/40 px-3 py-2">
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
                className="flex-1 border border-primary/60 px-4 py-2 text-xs tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40 sm:flex-none"
              >
                {listening ? "STOP" : "TALK"}
              </button>
              <button
                type="submit"
                disabled={thinking}
                className="flex-1 border border-border px-4 py-2 text-xs tracking-[0.2em] text-foreground transition-colors hover:bg-secondary disabled:opacity-40 sm:flex-none"
              >
                SEND
              </button>
            </div>
          </form>

          {!supported && (
            <p className="mt-2 text-[0.7rem] text-muted-foreground">
              Voice input needs Chrome or Edge. Typing works everywhere.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-[0.65rem] tracking-[0.25em] sm:text-xs">
            <StatusDot label="MIC" on={listening} />
            <StatusDot label="WEB" on={thinking} />
            <StatusDot label="AI" on={thinking || speaking} />
            <button
              type="button"
              onClick={() => {
                if (!muted) stopSpeaking();
                setMuted(!muted);
              }}
              className="flex items-center gap-2 tracking-[0.25em] text-muted-foreground hover:text-primary"
            >
              VOICE
              <span className={muted ? "text-destructive" : "text-signal"}>
                {muted ? "○" : "●"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatusDot({ label, on }: { label: string; on: boolean }) {
  return (
    <span className="flex items-center gap-2 text-muted-foreground">
      {label}
      <span className={on ? "text-signal" : "text-hud-dim"}>●</span>
    </span>
  );
}
