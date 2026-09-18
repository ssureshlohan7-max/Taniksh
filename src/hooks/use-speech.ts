import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechInput(onFinalTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const callbackRef = useRef(onFinalTranscript);
  callbackRef.current = onFinalTranscript;

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) {
        setInterim("");
        callbackRef.current(finalText.trim());
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
    };
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.start();
      setListening(true);
    } catch {
      /* already running */
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, interim, supported, start, stop };
}

const WAKE_PATTERN = /(?:hey|ok|okay)?\s*jarvis[,.!]?\s*/i;

/**
 * Continuously listens for the wake phrase "hey jarvis".
 * onWake(command) fires with the words spoken after the wake phrase
 * (empty string when only the wake phrase was said).
 */
export function useWakeWord(active: boolean, onWake: (command: string) => void) {
  const [supported, setSupported] = useState(true);
  const [armed, setArmed] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const activeRef = useRef(active);
  const callbackRef = useRef(onWake);
  activeRef.current = active;
  callbackRef.current = onWake;

  useEffect(() => {
    if (!active) {
      setArmed(false);
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        try {
          rec.stop();
        } catch {
          /* already stopped */
        }
      }
      return;
    }

    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        const transcript: string = result[0].transcript ?? "";
        const match = transcript.match(WAKE_PATTERN);
        if (match) {
          const command = transcript.slice(match.index! + match[0].length).trim();
          callbackRef.current(command);
        }
      }
    };
    recognition.onerror = () => {
      /* restart happens via onend */
    };
    recognition.onend = () => {
      if (!activeRef.current) {
        setArmed(false);
        return;
      }
      // Browsers stop recognition after silence; keep the wake loop alive.
      setTimeout(() => {
        if (!activeRef.current) return;
        try {
          recognition.start();
        } catch {
          /* already running */
        }
      }, 300);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setArmed(true);
    } catch {
      /* already running */
    }

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
    };
  }, [active]);

  return { armed, supported };
}

export function useSpeechOutput() {
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  mutedRef.current = muted;

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (mutedRef.current || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 0.9;
    const preferred = window.speechSynthesis
      .getVoices()
      .find((v) => /uk english male|daniel|google uk english male/i.test(v.name));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  return { speak, stopSpeaking, speaking, muted, setMuted };
}
