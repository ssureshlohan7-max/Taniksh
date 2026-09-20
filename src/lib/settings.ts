// User-customizable JARVIS configuration, persisted in the browser.

export type PersonalityId = "classic" | "friendly" | "formal" | "witty" | "hype";
export type ThemeId = "gold" | "cyan" | "crimson" | "emerald" | "violet";

export type Shortcut = { id: string; phrase: string; url: string };

export type JarvisSettings = {
  name: string;
  wakeWord: string;
  personality: PersonalityId;
  theme: ThemeId;
  bgImage: string | null;
  bgDim: number; // 0-100
  voiceURI: string | null;
  rate: number;
  pitch: number;
  shortcuts: Shortcut[];
};

export const PERSONALITIES: Array<{ id: PersonalityId; label: string; hint: string }> = [
  { id: "classic", label: "CLASSIC JARVIS", hint: "Calm, precise, calls you sir." },
  { id: "friendly", label: "FRIENDLY", hint: "Warm, casual, like a buddy." },
  { id: "formal", label: "FORMAL", hint: "Strictly professional and brief." },
  { id: "witty", label: "WITTY", hint: "Dry humour with every answer." },
  { id: "hype", label: "HYPE", hint: "High energy, motivating." },
];

export const THEMES: Array<{ id: ThemeId; label: string; swatch: string; vars: Record<string, string> }> = [
  {
    id: "gold",
    label: "MK-VII GOLD",
    swatch: "oklch(0.85 0.17 88)",
    vars: {
      "--background": "oklch(0.13 0.018 70)",
      "--foreground": "oklch(0.92 0.09 92)",
      "--card": "oklch(0.18 0.03 72)",
      "--popover": "oklch(0.18 0.03 72)",
      "--primary": "oklch(0.85 0.17 88)",
      "--primary-foreground": "oklch(0.13 0.018 70)",
      "--accent": "oklch(0.63 0.21 32)",
      "--muted-foreground": "oklch(0.66 0.07 82)",
      "--border": "oklch(0.55 0.12 88 / 40%)",
      "--input": "oklch(0.55 0.12 88 / 40%)",
      "--ring": "oklch(0.85 0.17 88)",
      "--hud": "oklch(0.86 0.17 88)",
      "--hud-dim": "oklch(0.58 0.08 80)",
      "--signal": "oklch(0.85 0.18 95)",
      "--alert": "oklch(0.65 0.21 32)",
      "--panel-edge": "oklch(0.76 0.15 83 / 72%)",
    },
  },
  {
    id: "cyan",
    label: "ARC CYAN",
    swatch: "oklch(0.83 0.14 205)",
    vars: {
      "--background": "oklch(0.12 0.02 230)",
      "--foreground": "oklch(0.92 0.07 210)",
      "--card": "oklch(0.17 0.03 225)",
      "--popover": "oklch(0.17 0.03 225)",
      "--primary": "oklch(0.83 0.14 205)",
      "--primary-foreground": "oklch(0.12 0.02 230)",
      "--accent": "oklch(0.72 0.17 250)",
      "--muted-foreground": "oklch(0.68 0.06 210)",
      "--border": "oklch(0.6 0.1 205 / 40%)",
      "--input": "oklch(0.6 0.1 205 / 40%)",
      "--ring": "oklch(0.83 0.14 205)",
      "--hud": "oklch(0.86 0.14 205)",
      "--hud-dim": "oklch(0.56 0.07 215)",
      "--signal": "oklch(0.86 0.17 190)",
      "--alert": "oklch(0.7 0.19 30)",
      "--panel-edge": "oklch(0.74 0.12 205 / 72%)",
    },
  },
  {
    id: "crimson",
    label: "CRIMSON MK-42",
    swatch: "oklch(0.68 0.2 25)",
    vars: {
      "--background": "oklch(0.12 0.02 20)",
      "--foreground": "oklch(0.92 0.06 30)",
      "--card": "oklch(0.17 0.035 22)",
      "--popover": "oklch(0.17 0.035 22)",
      "--primary": "oklch(0.7 0.2 27)",
      "--primary-foreground": "oklch(0.12 0.02 20)",
      "--accent": "oklch(0.82 0.16 72)",
      "--muted-foreground": "oklch(0.68 0.06 28)",
      "--border": "oklch(0.55 0.15 27 / 42%)",
      "--input": "oklch(0.55 0.15 27 / 42%)",
      "--ring": "oklch(0.7 0.2 27)",
      "--hud": "oklch(0.74 0.2 30)",
      "--hud-dim": "oklch(0.55 0.09 25)",
      "--signal": "oklch(0.82 0.17 55)",
      "--alert": "oklch(0.72 0.21 40)",
      "--panel-edge": "oklch(0.66 0.18 28 / 72%)",
    },
  },
  {
    id: "emerald",
    label: "STEALTH GREEN",
    swatch: "oklch(0.82 0.16 155)",
    vars: {
      "--background": "oklch(0.11 0.02 160)",
      "--foreground": "oklch(0.92 0.07 160)",
      "--card": "oklch(0.16 0.03 160)",
      "--popover": "oklch(0.16 0.03 160)",
      "--primary": "oklch(0.82 0.16 155)",
      "--primary-foreground": "oklch(0.11 0.02 160)",
      "--accent": "oklch(0.78 0.16 190)",
      "--muted-foreground": "oklch(0.67 0.06 160)",
      "--border": "oklch(0.58 0.12 155 / 40%)",
      "--input": "oklch(0.58 0.12 155 / 40%)",
      "--ring": "oklch(0.82 0.16 155)",
      "--hud": "oklch(0.85 0.16 155)",
      "--hud-dim": "oklch(0.56 0.07 160)",
      "--signal": "oklch(0.86 0.18 150)",
      "--alert": "oklch(0.7 0.19 40)",
      "--panel-edge": "oklch(0.72 0.14 155 / 72%)",
    },
  },
  {
    id: "violet",
    label: "PLASMA VIOLET",
    swatch: "oklch(0.78 0.16 300)",
    vars: {
      "--background": "oklch(0.12 0.025 300)",
      "--foreground": "oklch(0.92 0.06 300)",
      "--card": "oklch(0.17 0.04 300)",
      "--popover": "oklch(0.17 0.04 300)",
      "--primary": "oklch(0.78 0.16 300)",
      "--primary-foreground": "oklch(0.12 0.025 300)",
      "--accent": "oklch(0.72 0.19 330)",
      "--muted-foreground": "oklch(0.68 0.06 300)",
      "--border": "oklch(0.6 0.13 300 / 40%)",
      "--input": "oklch(0.6 0.13 300 / 40%)",
      "--ring": "oklch(0.78 0.16 300)",
      "--hud": "oklch(0.82 0.16 300)",
      "--hud-dim": "oklch(0.56 0.08 300)",
      "--signal": "oklch(0.83 0.17 310)",
      "--alert": "oklch(0.7 0.2 20)",
      "--panel-edge": "oklch(0.7 0.15 300 / 72%)",
    },
  },
];

export const DEFAULT_SETTINGS: JarvisSettings = {
  name: "J.A.R.V.I.S",
  wakeWord: "jarvis",
  personality: "classic",
  theme: "gold",
  bgImage: null,
  bgDim: 70,
  voiceURI: null,
  rate: 0.92,
  pitch: 0.88,
  shortcuts: [],
};

const KEY = "jarvis.settings.v1";

export function loadSettings(): JarvisSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<JarvisSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed, shortcuts: parsed.shortcuts ?? [] };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: JarvisSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage full — keep running with in-memory settings */
  }
}

export function applyTheme(themeId: ThemeId) {
  if (typeof document === "undefined") return;
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
}

/** Downscale an uploaded image so it fits comfortably in localStorage. */
export function fileToCompressedDataUrl(file: File, maxWidth = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function matchShortcut(raw: string, shortcuts: Shortcut[]): Shortcut | null {
  const text = raw.toLowerCase().trim();
  if (!text) return null;
  for (const s of shortcuts) {
    const phrase = s.phrase.toLowerCase().trim();
    if (phrase.length > 1 && text.includes(phrase)) return s;
  }
  return null;
}
