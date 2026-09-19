import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArcReactor } from "@/components/jarvis/ArcReactor";
import { HudPanel, Meter } from "@/components/jarvis/HudPanel";
import { PhotoLab } from "@/components/jarvis/PhotoLab";
import { Button } from "@/components/ui/button";
import {
  useSpeechInput,
  useSpeechOutput,
  useWakeWord,
  type SpeechLocale,
} from "@/hooks/use-speech";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "J.A.R.V.I.S. — Voice AI Command HUD" },
      {
        name: "description",
        content:
          "A JARVIS-style voice assistant HUD: speak a command, get spoken answers and launch any website hands-free.",
      },
      { property: "og:title", content: "J.A.R.V.I.S. — Voice AI Command HUD" },
      {
        property: "og:description",
        content:
          "Speak to JARVIS: spoken answers and voice-launched websites on a holographic heads-up display.",
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
  trace?: string[] | undefined;
  link?: string | undefined;
};

let entryId = 0;

const QUICK_LINKS = [
  { label: "GOOGLE", url: "https://www.google.com" },
  { label: "YOUTUBE", url: "https://www.youtube.com" },
  { label: "WHATSAPP", url: "https://web.whatsapp.com" },
  { label: "GMAIL", url: "https://mail.google.com" },
  { label: "MAPS", url: "https://maps.google.com" },
  { label: "INSTAGRAM", url: "https://www.instagram.com" },
  { label: "SPOTIFY", url: "https://open.spotify.com" },
  { label: "CHATGPT", url: "https://chat.openai.com" },
];

function Jarvis() {
  const [entries, setEntries] = useState<Entry[]>([
    {
      id: entryId++,
      role: "system",
      text: 'SYSTEM ONLINE. PRESS WAKE, THEN SAY "HEY JARVIS" FOLLOWED BY A COMMAND.',
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [wakeOn, setWakeOn] = useState(false);
  const [status, setStatus] = useState("STANDBY");
  const [speechLocale, setSpeechLocale] = useState<SpeechLocale>("hi-IN");
  const [clock, setClock] = useState("--:--:--");
  const logRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  const { speak, stopSpeaking, speaking, muted, setMuted } = useSpeechOutput(speechLocale);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const launch = useCallback((url: string) => {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    return Boolean(win);
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
          body: JSON.stringify({ messages: historyRef.current, locale: speechLocale }),
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

        let link: string | undefined;
        if (data.action?.type === "open" && typeof data.action.url === "string") {
          const opened = launch(data.action.url);
          link = data.action.url;
          if (!opened) {
            setEntries((prev) => [
              ...prev,
              {
                id: entryId++,
                role: "system",
                text: "POPUP BLOCKED — TAP THE LINK BELOW TO LAUNCH.",
              },
            ]);
          }
        }

        setEntries((prev) => [
          ...prev,
          { id: entryId++, role: "assistant", text: data.text, trace, link },
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
    [launch, speak, speechLocale, stopSpeaking, thinking],
  );

  const { listening, interim, supported, start, stop } = useSpeechInput(send, speechLocale);

  const onWake = useCallback(
    (command: string) => {
      stopSpeaking();
      if (command) {
        void send(command);
      } else {
        setEntries((prev) => [
          ...prev,
          { id: entryId++, role: "system", text: 'WAKE WORD DETECTED — LISTENING.' },
        ]);
        speak(speechLocale === "hi-IN" ? "हाँ जी, बताओ।" : "Yes, sir?");
        start();
      }
    },
    [send, speak, speechLocale, start, stopSpeaking],
  );
  const { armed: wakeArmed, supported: wakeSupported } = useWakeWord(
    wakeOn,
    onWake,
    speechLocale,
  );

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [entries, interim, thinking]);

  useEffect(() => {
    if (listening) setStatus("LISTENING");
    else if (speaking) setStatus("SPEAKING");
    else if (!thinking)
      setStatus((s) => (s === "ERROR" ? s : wakeArmed ? "AWAITING WAKE WORD" : "STANDBY"));
  }, [listening, speaking, thinking, wakeArmed]);

  const active = listening || thinking || speaking;
  const today = new Date();

  return (
    <main className="hud-bg hud-shell min-h-screen overflow-hidden px-3 py-4 sm:px-6 sm:py-5">
      <div aria-hidden="true" className="telemetry-sweep" />
      <div className="mx-auto max-w-[120rem]">
        {/* top bar */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-primary/25 pb-3">
          <div className="flex items-center gap-4">
            <span className="text-lg tracking-[0.5em] text-primary hud-glow sm:text-2xl">
              J.A.R.V.I.S
            </span>
            <span className="hidden text-[0.6rem] tracking-[0.35em] text-hud-dim sm:inline">
              JUST A RATHER VERY INTELLIGENT SYSTEM
            </span>
          </div>
          <div className="flex items-center gap-4 text-[0.65rem] tracking-[0.3em] text-muted-foreground">
            <span className="hidden text-signal md:inline">MK.VII // ONLINE</span>
            <span>67.220.189.193</span>
            <span>{today.toDateString().toUpperCase()}</span>
            <span className="text-primary hud-glow">{clock}</span>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)_19rem]">
          {/* left column */}
          <div className="order-2 space-y-4 lg:order-1">
            <HudPanel title="DATE">
              <div className="flex items-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/40 hud-drop">
                  <span className="absolute inset-1 rounded-full border border-dashed border-primary/25 spin-slow" />
                  <span className="text-2xl text-primary hud-glow">{today.getDate()}</span>
                </div>
                <div className="text-[0.6rem] tracking-[0.25em] text-muted-foreground">
                  <p className="text-primary">
                    {today.toLocaleString([], { weekday: "long" }).toUpperCase()}
                  </p>
                  <p>{today.toLocaleString([], { month: "long" }).toUpperCase()}</p>
                  <p>{today.getFullYear()}</p>
                </div>
              </div>
            </HudPanel>

            <HudPanel title="SYSTEM">
              <Meter label="CORE" value={active ? 82 : 36} />
              <Meter label="MEMORY" value={54} />
              <Meter label="UPLINK" value={thinking ? 93 : 61} />
              <Meter label="POWER" value={99} />
            </HudPanel>

            <HudPanel title="MODULES">
              <ul className="space-y-1 text-[0.65rem] tracking-[0.2em] text-muted-foreground">
                <Module label="MIC" on={listening} />
                <Module label="WAKE WORD" on={wakeArmed} />
                <Module label="WEB" on={thinking} />
                <Module label="AI CORE" on={thinking || speaking} />
                <Module label="VOICE" on={!muted} />
              </ul>
            </HudPanel>

            <div className="command-deck px-3 py-3">
              <div className="mb-2 flex items-center justify-between text-[0.6rem] tracking-[0.2em]">
                <span className="text-hud-dim">VOICE DIALECT</span>
                <span className="text-signal">● LINKED</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  type="button"
                  variant={speechLocale === "hi-IN" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSpeechLocale("hi-IN")}
                  className="rounded-none text-[0.6rem] tracking-[0.15em]"
                >
                  हरियाणवी
                </Button>
                <Button
                  type="button"
                  variant={speechLocale === "en-IN" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSpeechLocale("en-IN")}
                  className="rounded-none text-[0.6rem] tracking-[0.15em]"
                >
                  ENGLISH
                </Button>
              </div>
            </div>
          </div>

          {/* center */}
          <div className="order-1 space-y-4 lg:order-2">
            <div className="hud-panel relative overflow-hidden px-4 py-8">
              <div className="absolute left-4 top-4 text-[0.55rem] tracking-[0.22em] text-hud-dim">
                TARGET // VOICE CORE
              </div>
              <div className="absolute right-4 top-4 text-right text-[0.55rem] leading-relaxed tracking-[0.18em] text-hud-dim">
                <p>SYNC 99.8%</p>
                <p className="text-signal">DIALECT {speechLocale === "hi-IN" ? "HR-IN" : "EN-IN"}</p>
              </div>
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
                  placeholder="hey jarvis, open youtube..."
                  aria-label="Message JARVIS"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={listening ? stop : start}
                  disabled={!supported}
                  className="flex-1 rounded-none border-primary/60 px-5 text-xs tracking-[0.25em] text-primary sm:flex-none"
                >
                  {listening ? "STOP" : "TALK"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWakeOn((v) => !v)}
                  disabled={!wakeSupported}
                  className={`flex-1 rounded-none px-5 text-xs tracking-[0.25em] sm:flex-none ${
                    wakeOn
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-muted-foreground hover:text-primary"
                  }`}
                >
                  {wakeOn ? "WAKE ON" : "WAKE"}
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={thinking}
                  className="flex-1 rounded-none border-border px-5 text-xs tracking-[0.25em] text-foreground sm:flex-none"
                >
                  SEND
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!muted) stopSpeaking();
                    setMuted(!muted);
                  }}
                  className="rounded-none border-border px-4 text-xs tracking-[0.25em] text-muted-foreground hover:text-primary"
                >
                  {muted ? "MUTED" : "VOICE"}
                </Button>
              </div>
            </form>

            <HudPanel title="TRANSMISSION LOG">
              <div
                ref={logRef}
                className="h-[18rem] overflow-y-auto pr-1 text-[0.78rem] leading-relaxed lg:h-[22rem]"
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
                        {entry.link && (
                          <a
                            href={entry.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pl-6 text-[0.7rem] text-accent underline underline-offset-4"
                          >
                            └─ LAUNCH {entry.link}
                          </a>
                        )}
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

          {/* right column */}
          <div className="order-3 space-y-4 lg:order-3">
            <HudPanel title="QUICK LAUNCH">
              <ul className="grid grid-cols-2 gap-1 text-[0.65rem] tracking-[0.2em]">
                {QUICK_LINKS.map((l) => (
                  <li key={l.label}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => launch(l.url)}
                      className="h-7 w-full justify-start rounded-none border-primary/25 px-2 text-[0.6rem] text-primary/80 hover:bg-primary hover:text-primary-foreground"
                    >
                      {l.label}
                    </Button>
                  </li>
                ))}
              </ul>
            </HudPanel>

            <PhotoLab />

            <HudPanel title="VOICE COMMANDS">
              <ul className="space-y-1 text-[0.65rem] tracking-[0.15em] text-muted-foreground">
                <li>&gt; यूट्यूब खोल दे</li>
                <li>&gt; गाना चला दे</li>
                <li>&gt; आज मौसम के सै</li>
                <li>&gt; व्हाट्सऐप खोल</li>
                <li>&gt; तू के कर सके सै</li>
              </ul>
            </HudPanel>

            <HudPanel title="UPLINK">
              <div className="flex items-center justify-between text-[0.65rem] tracking-[0.2em] text-muted-foreground">
                <span>NETWORK</span>
                <span className="text-signal">● SECURE</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[0.65rem] tracking-[0.2em] text-muted-foreground">
                <span>LATENCY</span>
                <span className="text-primary">{thinking ? "142 MS" : "28 MS"}</span>
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
