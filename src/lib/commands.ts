// Local (offline) command resolution so launching a site never depends on the AI
// round-trip, and simple device controls the browser actually allows.

export type LocalResult =
  | { kind: "open"; url: string; spoken: string }
  | { kind: "device"; spoken: string; run: () => Promise<void> | void }
  | null;

type Site = {
  keys: string[];
  label: string;
  url: string;
  /** Deep link that runs a search / action inside the site. */
  search?: (q: string) => string;
  /** Deep link that opens a pre-filled message composer. */
  message?: (q: string, phone?: string) => string;
};

const enc = encodeURIComponent;

const SITES: Site[] = [
  {
    keys: ["youtube", "यूट्यूब", "यूटयूब", "you tube"],
    label: "YouTube",
    url: "https://www.youtube.com",
    search: (q) => `https://www.youtube.com/results?search_query=${enc(q)}`,
  },
  {
    keys: ["google", "गूगल"],
    label: "Google",
    url: "https://www.google.com",
    search: (q) => `https://www.google.com/search?q=${enc(q)}`,
  },
  {
    keys: ["whatsapp", "व्हाट्सऐप", "वाट्सएप", "व्हाट्सएप", "whats app"],
    label: "WhatsApp",
    url: "https://web.whatsapp.com",
    search: (q) => `https://wa.me/?text=${enc(q)}`,
    message: (q, phone) =>
      phone
        ? `https://wa.me/${phone}?text=${enc(q)}`
        : `https://wa.me/?text=${enc(q)}`,
  },
  {
    keys: ["gmail", "mail", "जीमेल", "मेल"],
    label: "Gmail",
    url: "https://mail.google.com",
    search: (q) => `https://mail.google.com/mail/u/0/#search/${enc(q)}`,
    message: (q) =>
      `https://mail.google.com/mail/?view=cm&fs=1&body=${enc(q)}`,
  },
  {
    keys: ["maps", "map", "नक्शा", "मैप"],
    label: "Maps",
    url: "https://maps.google.com",
    search: (q) => `https://www.google.com/maps/search/${enc(q)}`,
  },
  {
    keys: ["instagram", "insta", "इंस्टाग्राम", "इंस्टा"],
    label: "Instagram",
    url: "https://www.instagram.com",
    search: (q) => `https://www.instagram.com/explore/tags/${enc(q.replace(/\s+/g, ""))}/`,
  },
  {
    keys: ["facebook", "फेसबुक"],
    label: "Facebook",
    url: "https://www.facebook.com",
    search: (q) => `https://www.facebook.com/search/top?q=${enc(q)}`,
  },
  {
    keys: ["spotify", "स्पॉटिफाई"],
    label: "Spotify",
    url: "https://open.spotify.com",
    search: (q) => `https://open.spotify.com/search/${enc(q)}`,
  },
  {
    keys: ["chatgpt", "chat gpt", "चैट जीपीटी"],
    label: "ChatGPT",
    url: "https://chat.openai.com",
    search: (q) => `https://chat.openai.com/?q=${enc(q)}`,
  },
  {
    keys: ["twitter", " x ", "ट्विटर"],
    label: "X",
    url: "https://x.com",
    search: (q) => `https://x.com/search?q=${enc(q)}`,
  },
  {
    keys: ["netflix", "नेटफ्लिक्स"],
    label: "Netflix",
    url: "https://www.netflix.com",
    search: (q) => `https://www.netflix.com/search?q=${enc(q)}`,
  },
  {
    keys: ["amazon", "अमेज़न", "अमेजन"],
    label: "Amazon",
    url: "https://www.amazon.in",
    search: (q) => `https://www.amazon.in/s?k=${enc(q)}`,
  },
  {
    keys: ["flipkart", "फ्लिपकार्ट"],
    label: "Flipkart",
    url: "https://www.flipkart.com",
    search: (q) => `https://www.flipkart.com/search?q=${enc(q)}`,
  },
  {
    keys: ["linkedin", "लिंक्डइन"],
    label: "LinkedIn",
    url: "https://www.linkedin.com",
    search: (q) => `https://www.linkedin.com/search/results/all/?keywords=${enc(q)}`,
  },
  {
    keys: ["telegram", "टेलीग्राम"],
    label: "Telegram",
    url: "https://web.telegram.org",
    message: (q, phone) =>
      phone ? `https://t.me/+${phone}?text=${enc(q)}` : `https://web.telegram.org`,
  },
  {
    keys: ["github", "गिटहब"],
    label: "GitHub",
    url: "https://github.com",
    search: (q) => `https://github.com/search?q=${enc(q)}`,
  },
];

const OPEN_WORDS = /\b(open|launch|start|play|go to|visit)\b|खोल|चला|लगा|दिखा/i;
const SEARCH_WORDS = /\b(search|google|find|look up|lookup|dhundo|dhund)\b|खोज|ढूंढ|ढूँढ|सर्च/i;
const PLAY_WORDS = /\b(play)\b|चला|बजा/i;
const MESSAGE_WORDS =
  /\b(message|msg|text|send|write|type|bhej|likh)\b|मैसेज|संदेश|भेज|लिख|टाइप/i;

const FILLER = [
  "hey",
  "jarvis",
  "please",
  "kindly",
  "on",
  "in",
  "at",
  "to",
  "for",
  "about",
  "me",
  "mein",
  "main",
  "pe",
  "par",
  "pr",
  "ko",
  "kar",
  "karo",
  "kro",
  "kar do",
  "kr",
  "de",
  "do",
  "dena",
  "dijiye",
  "jao",
  "ja",
  "जा",
  "जाकर",
  "में",
  "पर",
  "को",
  "कर",
  "करो",
  "दे",
  "दो",
  "देना",
  "जार्विस",
  "जारविस",
];

const ACTIONS = [
  "open",
  "launch",
  "start",
  "play",
  "go to",
  "visit",
  "search",
  "find",
  "look up",
  "lookup",
  "dhundo",
  "dhund",
  "message",
  "msg",
  "text",
  "send",
  "write",
  "type",
  "bhej",
  "likh",
  "खोल",
  "चला",
  "बजा",
  "लगा",
  "दिखा",
  "खोज",
  "ढूंढ",
  "ढूँढ",
  "सर्च",
  "मैसेज",
  "संदेश",
  "भेज",
  "लिख",
  "टाइप",
];

function clean(raw: string) {
  return ` ${raw.toLowerCase().trim()} `;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Remove site names, action verbs and filler words to get the actual query. */
function extractQuery(raw: string, siteKeys: string[]) {
  let out = ` ${raw} `;
  for (const w of [...siteKeys, ...ACTIONS, ...FILLER]) {
    const t = w.trim();
    if (!t) continue;
    const re = /[a-z]/i.test(t)
      ? new RegExp(`\\b${escapeRe(t)}\\b`, "gi")
      : new RegExp(escapeRe(t), "g");
    out = out.replace(re, " ");
  }
  return out.replace(/\s+/g, " ").replace(/^[,.\-–—:|]+|[,.\-–—:|]+$/g, "").trim();
}

function findPhone(raw: string) {
  const m = raw.replace(/[\s-]/g, "").match(/(\+?\d{10,13})/);
  if (!m?.[1]) return undefined;
  const digits = m[1].replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export function resolveLocalCommand(raw: string): LocalResult {
  const text = clean(raw);

  // direct url
  const urlMatch = raw.match(/https?:\/\/\S+/i);
  if (urlMatch?.[0]) return { kind: "open", url: urlMatch[0], spoken: "Opening it now, sir." };

  // phone call → opens the device dialer with the number filled in
  if (/\b(call|dial|phone)\b|कॉल|काल|फ़ोन|फोन|डायल/i.test(text)) {
    const digits = raw
      .replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)))
      .replace(/[^\d+]/g, "");
    const num = digits.match(/\+?\d{3,13}/)?.[0];
    if (num) {
      return {
        kind: "device",
        spoken: `Calling ${num.split("").join(" ")}, sir.`,
        run: async () => {
          window.location.href = `tel:${num}`;
        },
      };
    }
  }

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

  // known sites — search / message inside them, or just open them
  const site = SITES.find((s) => s.keys.some((k) => text.includes(k.trim())));
  if (site) {
    const query = extractQuery(raw, site.keys);
    const wantsMessage = MESSAGE_WORDS.test(text);
    const wantsSearch = SEARCH_WORDS.test(text) || PLAY_WORDS.test(text);

    // "whatsapp par 98xxxx ko message bhej: hello"
    if (wantsMessage && site.message) {
      const phone = findPhone(raw);
      const body = query.replace(/\+?\d[\d\s-]{8,}/g, "").trim();
      return {
        kind: "open",
        url: site.message(body, phone),
        spoken: body
          ? `${site.label} पर मैसेज तैयार सै, सर।`
          : `${site.label} खोल रहा सूं, सर।`,
      };
    }

    if (query && site.search && (wantsSearch || wantsMessage || OPEN_WORDS.test(text))) {
      const verb = PLAY_WORDS.test(text) && /youtube|spotify/i.test(site.label) ? "Playing" : "Searching";
      return {
        kind: "open",
        url: site.search(query),
        spoken: `${verb} ${query} on ${site.label}, sir.`,
      };
    }

    if (OPEN_WORDS.test(text) || text.trim().split(/\s+/).length <= 3) {
      return { kind: "open", url: site.url, spoken: `Opening ${site.label}, sir.` };
    }
  }

  // "open <something>.com"
  const domain = raw.match(/([a-z0-9-]+\.(com|in|org|net|io|co|dev|app))\b/i);
  if (domain?.[1] && OPEN_WORDS.test(text)) {
    return { kind: "open", url: `https://${domain[1]}`, spoken: `Opening ${domain[1]}, sir.` };
  }

  // generic search
  if (SEARCH_WORDS.test(text) && OPEN_WORDS.test(text) === false) {
    const q = extractQuery(raw, []);
    if (q.length > 1) {
      return {
        kind: "open",
        url: `https://www.google.com/search?q=${enc(q)}`,
        spoken: "Searching the web, sir.",
      };
    }
  }

  return null;
}

function speakOnce(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(u);
}
