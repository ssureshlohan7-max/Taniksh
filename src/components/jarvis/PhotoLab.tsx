import { useRef, useState } from "react";
import { HudPanel } from "./HudPanel";
import { Button } from "@/components/ui/button";

export function PhotoLab() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pick = (f: File | null) => {
    setFile(f);
    setResult(null);
    setError(null);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const run = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("prompt", prompt.trim());
      if (file) form.append("image", file);
      const res = await fetch("/api/photo", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) setError(data?.error ?? "IMAGE CORE FAILURE.");
      else setResult(data.image as string);
    } catch {
      setError("CONNECTION LOST.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <HudPanel title="PHOTO LAB / AI EDIT">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="flex-1 rounded-none border-primary/50 px-2 text-[0.6rem] tracking-[0.2em] text-primary hover:bg-primary hover:text-primary-foreground"
        >
          {file ? "CHANGE PHOTO" : "CAPTURE / UPLOAD"}
        </Button>
        {file && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => pick(null)}
            className="rounded-none border-border px-2 text-[0.6rem] tracking-[0.2em] text-muted-foreground hover:text-accent"
          >
            CLEAR
          </Button>
        )}
      </div>

      {(result || preview) && (
        <img
          src={result ?? preview ?? ""}
          alt={result ? "AI edited result" : "Selected photo"}
          className="mt-2 w-full border border-primary/30 object-cover hud-drop"
        />
      )}

      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={file ? "make it a Mark 42 suit shot" : "generate: gold arc reactor"}
        aria-label="Photo edit instruction"
        className="mt-2 w-full border border-border bg-transparent px-2 py-1 text-[0.7rem] text-foreground outline-none placeholder:text-muted-foreground"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void run()}
        disabled={busy}
        className="mt-2 w-full rounded-none border-accent/70 bg-accent/10 px-2 text-[0.6rem] tracking-[0.25em] text-accent hover:bg-accent hover:text-accent-foreground"
      >
        {busy ? "RENDERING..." : file ? "EDIT PHOTO" : "GENERATE"}
      </Button>

      {error && <p className="mt-2 text-[0.6rem] tracking-[0.15em] text-destructive">:: {error}</p>}

      {result && (
        <a
          href={result}
          download="jarvis-render.png"
          className="mt-2 block text-[0.6rem] tracking-[0.2em] text-primary underline underline-offset-4"
        >
          └─ DOWNLOAD RENDER
        </a>
      )}
    </HudPanel>
  );
}
