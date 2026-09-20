import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PERSONALITIES,
  THEMES,
  fileToCompressedDataUrl,
  type JarvisSettings,
  type Shortcut,
} from "@/lib/settings";

type Props = {
  settings: JarvisSettings;
  onChange: (next: JarvisSettings) => void;
  onClose: () => void;
  onReset: () => void;
};

export function SettingsPanel({ settings, onChange, onClose, onReset }: Props) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [phrase, setPhrase] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [bgPrompt, setBgPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const set = <K extends keyof JarvisSettings>(key: K, value: JarvisSettings[K]) =>
    onChange({ ...settings, [key]: value });

  const testVoice = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      `${settings.name} online. All systems ready.`,
    );
    u.rate = settings.rate;
    u.pitch = settings.pitch;
    const v = voices.find((x) => x.voiceURI === settings.voiceURI);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    }
    window.speechSynthesis.speak(u);
  };

  const addShortcut = () => {
    const p = phrase.trim();
    let u = url.trim();
    if (!p || !u) return;
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    const next: Shortcut = { id: String(Date.now()), phrase: p, url: u };
    onChange({ ...settings, shortcuts: [...settings.shortcuts, next] });
    setPhrase("");
    setUrl("");
  };

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      set("bgImage", await fileToCompressedDataUrl(file));
    } catch {
      setError("That image could not be loaded.");
    }
  };

  const generateBg = async () => {
    const prompt = bgPrompt.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${prompt}. Dark cinematic wallpaper, wide 16:9, high detail, no text.`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.image) {
        setError(data?.error ?? "Image core unavailable.");
      } else {
        set("bgImage", data.image);
      }
    } catch {
      setError("Connection lost while rendering.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/85 p-3 backdrop-blur-sm sm:p-6">
      <div className="hud-panel w-full max-w-3xl px-4 py-4">
        <div className="mb-4 flex items-center justify-between border-b border-primary/25 pb-2">
          <span className="text-sm tracking-[0.35em] text-primary hud-glow">
            CUSTOMIZATION CORE
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-none text-[0.6rem] tracking-[0.25em]"
          >
            CLOSE
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* identity */}
          <section className="space-y-2">
            <Label>IDENTITY</Label>
            <Field label="NAME">
              <input
                value={settings.name}
                onChange={(e) => set("name", e.target.value)}
                className="input-hud"
                aria-label="Assistant name"
              />
            </Field>
            <Field label="WAKE WORD">
              <input
                value={settings.wakeWord}
                onChange={(e) => set("wakeWord", e.target.value)}
                className="input-hud"
                aria-label="Wake word"
              />
            </Field>
            <div className="grid grid-cols-2 gap-1 pt-1">
              {PERSONALITIES.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  variant={settings.personality === p.id ? "default" : "outline"}
                  size="sm"
                  title={p.hint}
                  onClick={() => set("personality", p.id)}
                  className="rounded-none text-[0.55rem] tracking-[0.15em]"
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </section>

          {/* theme */}
          <section className="space-y-2">
            <Label>THEME</Label>
            <div className="grid grid-cols-2 gap-1">
              {THEMES.map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  variant={settings.theme === t.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => set("theme", t.id)}
                  className="justify-start gap-2 rounded-none text-[0.55rem] tracking-[0.15em]"
                >
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 border border-border"
                    style={{ background: t.swatch }}
                  />
                  {t.label}
                </Button>
              ))}
            </div>

            <Label>BACKGROUND PHOTO</Label>
            <div className="flex flex-wrap gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => void onUpload(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="rounded-none text-[0.55rem] tracking-[0.2em]"
              >
                UPLOAD
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set("bgImage", null)}
                className="rounded-none text-[0.55rem] tracking-[0.2em]"
              >
                CLEAR
              </Button>
            </div>
            <div className="flex gap-1">
              <input
                value={bgPrompt}
                onChange={(e) => setBgPrompt(e.target.value)}
                placeholder="describe a wallpaper..."
                aria-label="Background prompt"
                className="input-hud flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void generateBg()}
                className="rounded-none text-[0.55rem] tracking-[0.2em]"
              >
                {busy ? "RENDERING" : "GENERATE"}
              </Button>
            </div>
            <Slider
              label={`DIM ${settings.bgDim}%`}
              min={0}
              max={95}
              step={5}
              value={settings.bgDim}
              onChange={(v) => set("bgDim", v)}
            />
            {settings.bgImage && (
              <img
                src={settings.bgImage}
                alt="Selected HUD background"
                className="h-20 w-full border border-border object-cover"
              />
            )}
          </section>

          {/* voice */}
          <section className="space-y-2">
            <Label>VOICE</Label>
            <select
              value={settings.voiceURI ?? ""}
              onChange={(e) => set("voiceURI", e.target.value || null)}
              aria-label="Voice"
              className="input-hud w-full"
            >
              <option value="">AUTO (best match)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} — {v.lang}
                </option>
              ))}
            </select>
            <Slider
              label={`SPEED ${settings.rate.toFixed(2)}`}
              min={0.6}
              max={1.4}
              step={0.02}
              value={settings.rate}
              onChange={(v) => set("rate", v)}
            />
            <Slider
              label={`PITCH ${settings.pitch.toFixed(2)}`}
              min={0.5}
              max={1.5}
              step={0.02}
              value={settings.pitch}
              onChange={(v) => set("pitch", v)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={testVoice}
              className="rounded-none text-[0.55rem] tracking-[0.2em]"
            >
              TEST VOICE
            </Button>
          </section>

          {/* shortcuts */}
          <section className="space-y-2">
            <Label>MY SHORTCUTS</Label>
            <div className="flex gap-1">
              <input
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder="office kholo"
                aria-label="Shortcut phrase"
                className="input-hud flex-1"
              />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="notion.so"
                aria-label="Shortcut URL"
                className="input-hud flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addShortcut}
                className="rounded-none text-[0.55rem] tracking-[0.2em]"
              >
                ADD
              </Button>
            </div>
            <ul className="space-y-1 text-[0.65rem] tracking-[0.12em] text-muted-foreground">
              {settings.shortcuts.length === 0 && <li>No custom commands yet.</li>}
              {settings.shortcuts.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    <span className="text-primary">{s.phrase}</span> → {s.url}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...settings,
                        shortcuts: settings.shortcuts.filter((x) => x.id !== s.id),
                      })
                    }
                    className="text-alert"
                    aria-label={`Remove ${s.phrase}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {error && <p className="mt-3 text-[0.65rem] text-alert">{error}</p>}

        <div className="mt-4 flex justify-between border-t border-primary/25 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="rounded-none text-[0.55rem] tracking-[0.2em] text-muted-foreground"
          >
            RESET DEFAULTS
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="rounded-none text-[0.55rem] tracking-[0.2em]"
          >
            DONE
          </Button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.6rem] tracking-[0.3em] text-hud-dim">{children}</p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[0.6rem] tracking-[0.2em] text-muted-foreground">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-[0.6rem] tracking-[0.2em] text-muted-foreground">
      <span className="mb-1 block">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--primary)]"
      />
    </label>
  );
}
