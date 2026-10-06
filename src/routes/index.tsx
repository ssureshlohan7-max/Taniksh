import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/jarvis/SiteFooter";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArcReactor } from "@/components/jarvis/ArcReactor";
import { HudPanel, Meter } from "@/components/jarvis/HudPanel";
import { PhotoLab } from "@/components/jarvis/PhotoLab";
import { SettingsPanel } from "@/components/jarvis/SettingsPanel";
import { Button } from "@/components/ui/button";
import { resolveLocalCommand } from "@/lib/commands";
import {
  DEFAULT_SETTINGS,
  applyTheme,
  loadSettings,
  matchShortcut,
  saveSettings,
  type JarvisSettings,
} from "@/lib/settings";
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
      text: 'SYSTEM ONLINE. PRESS LIVE TALK TO SPEAK HANDS-FREE, OR WAKE TO USE "HEY JARVIS".',
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [wakeOn, setWakeOn] = useState(false);
  const [liveOn, setLiveOn] = useState(false);
  const [status, setStatus] = useState("STANDBY");
  const [speechLocale, setSpeechLocale] = useState<SpeechLocale>("en-IN");
  const [settings, setSettings] = useState<JarvisSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clock, setClock] = useState("--:--:--");
  const logRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  const { speak, stopSpeaking, speaking, muted, setMuted } = useSpeechOutput(speechLocale, {
    voiceURI: settings.voiceURI,
    rate: settings.rate,
    pitch: settings.pitch,
  });

  useEffect(() => {
    const saved = loadSettings();
    setSettings(saved);
    applyTheme(saved.theme);
  }, []);

  const updateSettings = useCallback((next: JarvisSettings) => {
    setSettings(next);
    saveSettings(next);
    applyTheme(next.theme);
  }, []);

  const resetSettings = useCallback(() => {
    updateSettings(DEFAULT_SETTINGS);
  }, [updateSettings]);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const launch = useCallback((url: string) => {
    try {
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (win) return true;
      // Fallback: synthetic anchor click (allowed inside user-gesture handlers)
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    } catch {
      return false;
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const query = text.trim();
      if (!query || thinking) return;

      stopSpeaking();
      setEntries((prev) => [...prev, { id: entryId++, role: "user", text: query }]);
      historyRef.current = [...historyRef.current, { role: "user", content: query }];
      setInput("");

      // Handle launches and device controls locally — instant and never fails
      // because of an AI hiccup.
      const shortcut = matchShortcut(query, settings.shortcuts);
      const local = shortcut
        ? { kind: "open" as const, url: shortcut.url, spoken: `Opening ${shortcut.phrase}.` }
        : resolveLocalCommand(query);
      if (local) {
        if (local.kind === "open") {
          const opened = launch(local.url);
          setEntries((prev) => [
            ...prev,
            {
              id: entryId++,
              role: "assistant",
              text: local.spoken,
              link: opened ? undefined : local.url,
            },
          ]);
          if (!opened) {
            setEntries((prev) => [
              ...prev,
              { id: entryId++, role: "system", text: "TAP THE LINK BELOW TO LAUNCH." },
            ]);
          }
        } else {
          await local.run();
          setEntries((prev) => [
            ...prev,
            { id: entryId++, role: "assistant", text: local.spoken },
          ]);
        }
        historyRef.current = [
          ...historyRef.current,
          { role: "assistant", content: local.spoken },
        ];
        speak(local.spoken);
        setStatus("READY");
        return;
      }

      setThinking(true);
      setStatus("PROCESSING");


      try {
        const res = await fetch("/api/jarvis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyRef.current,
            locale: speechLocale,
            personality: settings.personality,
          }),
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
    [launch, settings.personality, settings.shortcuts, speak, speechLocale, stopSpeaking, thinking],
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
        speak("Yes, sir?");
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
  const onLive = useCallback(
    (text: string) => {
      void send(text);
    },
    [send],
  );
  const { armed: liveArmed } = useWakeWord(
    liveOn && !speaking && !thinking && !listening,
    onLive,
    speechLocale,
    false,
  );

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [entries, interim, thinking]);

  useEffect(() => {
    if (listening) setStatus("LISTENING");
    else if (speaking) setStatus("SPEAKING");
    else if (!thinking)
      setStatus((s) => (s === "ERROR" ? s : liveArmed ? "LIVE — JUST SPEAK" : wakeArmed ? "AWAITING WAKE WORD" : "STANDBY"));
  }, [listening, speaking, thinking, wakeArmed, liveArmed]);

  const active = listening || thinking || speaking;
  const today = new Date();

  return (
    <main className="hud-bg hud-shell relative min-h-screen overflow-hidden px-3 py-4 sm:px-6 sm:py-5">
      {settings.bgImage && (
        <img
          src={settings.bgImage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 h-full w-full object-cover"
          style={{ opacity: Math.max(0, Math.min(1, (100 - settings.bgDim) / 100)) }}
        />
      )}
      <div aria-hidden="true" className="telemetry-sweep" />
      <div className="relative mx-auto max-w-[120rem]">
        {/* top bar */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-primary/25 pb-3">
          <div className="flex items-center gap-4">
            <span className="text-lg tracking-[0.5em] text-primary hud-glow sm:text-2xl">
              {settings.name}
            </span>
            <span className="hidden text-[0.6rem] tracking-[0.35em] text-hud-dim sm:inline">
              JUST A RATHER VERY INTELLIGENT SYSTEM
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 text-[0.65rem] tracking-[0.3em] text-muted-foreground">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="rounded-none border-primary/60 px-3 text-[0.6rem] tracking-[0.22em] text-primary"
            >
              SETTINGS
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-none border-accent bg-accent/10 px-3 text-[0.6rem] tracking-[0.22em] text-accent"
            >
              <Link to="/forge">WEBSITE BANAO</Link>
            </Button>
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
                  HARYANVI
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
                  onClick={() => {
                    setLiveOn(false);
                    setWakeOn((v) => !v);
                  }}
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
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setWakeOn(false);
                    setLiveOn((v) => !v);
                  }}
                  disabled={!wakeSupported}
                  className={`flex-1 rounded-none px-5 text-xs tracking-[0.25em] sm:flex-none ${
                    liveOn
                      ? "live-pulse border-accent bg-accent/20 text-accent"
                      : "border-primary/60 text-primary"
                  }`}
                >
                  {liveOn ? "● LIVE ON" : "LIVE TALK"}
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
                            className="mt-2 inline-block border border-accent bg-accent/15 px-4 py-2 text-[0.7rem] tracking-[0.25em] text-accent hover:bg-accent hover:text-background"
                          >
                            ▶ TAP TO OPEN
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
      <section className="relative z-10 mx-auto mt-10 max-w-4xl px-4 font-sans text-[0.92rem] leading-relaxed text-foreground/85">
        <h2 className="mb-3 text-xl tracking-[0.2em] text-primary">YOUR FREE AI VOICE ASSISTANT IN THE BROWSER</h2>
        <p className="mb-4">
          J.A.R.V.I.S. is a voice assistant that runs right in your web browser — no app to install.
          Ask questions and hear spoken answers, open and search websites like YouTube, Google, Maps
          and Amazon by voice, draft WhatsApp messages, edit photos with AI, and build complete
          websites just by describing them.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="hud-panel p-4">
            <h3 className="mb-1 text-primary">Hands-free Live Talk</h3>
            <p className="text-[0.85rem]">Press Live Talk once and just speak. Works in English and Haryanvi/Hindi.</p>
          </div>
          <div className="hud-panel p-4">
            <h3 className="mb-1 text-primary">AI Photo Lab</h3>
            <p className="text-[0.85rem]">Upload a photo and describe the change, or generate a new image from text.</p>
          </div>
          <div className="hud-panel p-4">
            <h3 className="mb-1 text-primary">Site Forge</h3>
            <p className="text-[0.85rem]">Describe a business and get a full website you can edit, publish and share.</p>
          </div>
        </div>
        <p className="mt-4">
          New here? Read our{" "}
          <Link to="/guides" className="text-primary underline">step-by-step guides</Link> or learn{" "}
          <Link to="/about" className="text-primary underline">about the project</Link>.
        </p>
      </section>
      <SiteFooter />
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={updateSettings}
          onClose={() => setSettingsOpen(false)}
          onReset={resetSettings}
        />
      )}
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
