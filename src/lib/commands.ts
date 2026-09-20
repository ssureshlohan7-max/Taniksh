// Local (offline) command resolution so launching a site never depends on the AI
// round-trip, and simple device controls the browser actually allows.

export type LocalResult =
  | { kind: "open"; url: string; spoken: string }
  | { kind: "device"; spoken: string; run: () => Promise<void> | void }
  | null;

const SITES: Array<{ keys: string[]; label: string; url: string }> = [
  { keys: ["youtube", "यूट्यूब", "यूटयूब", "you tube"], label: "YouTube", url: "https://www.youtube.com" },
  { keys: ["google", "गूगल"], label: "Google", url: "https://www.google.com" },
  { keys: ["whatsapp", "व्हाट्सऐप", "वाट्सएप", "whats app"], label: "WhatsApp", url: "https://web.whatsapp.com" },
  { keys: ["gmail", "mail", "जीमेल", "मेल"], label: "Gmail", url: "https://mail.google.com" },
  { keys: ["maps", "map", "नक्शा", "मैप"], label: "Maps", url: "https://maps.google.com" },
  { keys: ["instagram", "insta", "इंस्टाग्राम", "इंस्टा"], label: "Instagram", url: "https://www.instagram.com" },
  { keys: ["facebook", "फेसबुक"], label: "Facebook", url: "https://www.facebook.com" },
  { keys: ["spotify", "स्पॉटिफाई"], label: "Spotify", url: "https://open.spotify.com" },
  { keys: ["chatgpt", "chat gpt", "चैट जीपीटी"], label: "ChatGPT", url: "https://chat.openai.com" },
  { keys: ["twitter", " x ", "ट्विटर"], label: "X", url: "https://x.com" },
  { keys: ["netflix", "नेटफ्लिक्स"], label: "Netflix", url: "https://www.netflix.com" },
  { keys: ["amazon", "अमेज़न", "अमेजन"], label: "Amazon", url: "https://www.amazon.in" },
  { keys: ["flipkart", "फ्लिपकार्ट"], label: "Flipkart", url: "https://www.flipkart.com" },
  { keys: ["linkedin", "लिंक्डइन"], label: "LinkedIn", url: "https://www.linkedin.com" },
  { keys: ["telegram", "टेलीग्राम"], label: "Telegram", url: "https://web.telegram.org" },
  { keys: ["github", "गिटहब"], label: "GitHub", url: "https://github.com" },
];

const OPEN_WORDS = /\b(open|launch|start|play|go to|visit)\b|खोल|चला|लगा|दिखा/i;
const SEARCH_WORDS = /\b(search|google|find|look up)\b|खोज|ढूंढ|सर्च/i;
const PLAY_WORDS = /\b(play)\b|चला|बजा/i;

function clean(raw: string) {
  return ` ${raw.toLowerCase().trim()} `;
}

export function resolveLocalCommand(raw: string): LocalResult {
  const text = clean(raw);

  // direct url
  const urlMatch = raw.match(/https?:\/\/\S+/i);
  if (urlMatch?.[0]) return { kind: "open", url: urlMatch[0], spoken: "Opening it now, sir." };

  // device controls
  if (/full ?screen|फुल ?स्क्रीन|पूरी स्क्रीन/i.test(text)) {
    return {
      kind: "device",
      spoken: "Fullscreen engaged, sir.",
      run: () => void document.documentElement.requestFullscreen?.().catch(() => {}),
    };
  }
  if (/exit full ?screen|फुल ?स्क्रीन बंद/i.test(text)) {
    return {
      kind: "device",
      spoken: "Exiting fullscreen, sir.",
      run: () => void document.exitFullscreen?.().catch(() => {}),
    };
  }
  if (/vibrate|buzz|वाइब्रेट|थरथरा/i.test(text)) {
    return {
      kind: "device",
      spoken: "Vibrating, sir.",
      run: () => void navigator.vibrate?.([120, 60, 120]),
    };
  }
  if (/battery|बैटरी/i.test(text)) {
    return {
      kind: "device",
      spoken: "Checking power cell, sir.",
      run: async () => {
        const nav = navigator as any;
        const b = await nav.getBattery?.();
        const pct = b ? Math.round(b.level * 100) : null;
        if (pct !== null) speakOnce(`Power cell at ${pct} percent${b.charging ? ", charging" : ""}.`);
      },
    };
  }
  if (/copy (this|log)|क्लिपबोर्ड/i.test(text)) {
    return {
      kind: "device",
      spoken: "Copied, sir.",
      run: () => void navigator.clipboard?.writeText(document.body.innerText.slice(0, 4000)),
    };
  }
  if (/keep (screen|display) (on|awake)|स्क्रीन चालू रख/i.test(text)) {
    return {
      kind: "device",
      spoken: "Holding the display awake, sir.",
      run: async () => {
        try {
          await (navigator as any).wakeLock?.request("screen");
        } catch {
          /* unsupported */
        }
      },
    };
  }
  if (/reload|refresh|रिफ्रेश|दुबारा लोड/i.test(text)) {
    return { kind: "device", spoken: "Reloading, sir.", run: () => window.location.reload() };
  }

  // known sites
  const site = SITES.find((s) => s.keys.some((k) => text.includes(k.trim())));
  if (site && (OPEN_WORDS.test(text) || text.trim().split(/\s+/).length <= 3)) {
    if (site.url.includes("youtube") && PLAY_WORDS.test(text)) {
      const q = stripWords(raw, site.keys);
      if (q) {
        return {
          kind: "open",
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
          spoken: `Playing ${q}, sir.`,
        };
      }
    }
    return { kind: "open", url: site.url, spoken: `Opening ${site.label}, sir.` };
  }

  // "open <something>.com"
  const domain = raw.match(/([a-z0-9-]+\.(com|in|org|net|io|co|dev|app))\b/i);
  if (domain?.[1] && OPEN_WORDS.test(text)) {
    return { kind: "open", url: `https://${domain[1]}`, spoken: `Opening ${domain[1]}, sir.` };
  }

  // generic search
  if (SEARCH_WORDS.test(text) && OPEN_WORDS.test(text) === false) {
    const q = stripWords(raw, ["search", "google", "find", "look up", "खोज", "ढूंढ", "सर्च", "for", "पर"]);
    if (q.length > 1) {
      return {
        kind: "open",
        url: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
        spoken: "Searching the web, sir.",
      };
    }
  }

  return null;
}

function stripWords(raw: string, words: string[]) {
  let out = raw;
  const base = ["open", "launch", "start", "play", "go to", "visit", "खोल", "दे", "चला", "जार्विस", "jarvis", "hey"];
  for (const w of [...words, ...base]) {
    out = out.replace(new RegExp(w.trim(), "gi"), " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

function speakOnce(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(u);
}
