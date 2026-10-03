import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Access Core — J.A.R.V.I.S. Site Forge" },
      {
        name: "description",
        content:
          "Sign in to the J.A.R.V.I.S. Site Forge to build, save and publish your own websites by voice or text.",
      },
      { property: "og:title", content: "Access Core — J.A.R.V.I.S. Site Forge" },
      {
        property: "og:description",
        content: "Sign in to build and publish websites from the J.A.R.V.I.S. command system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/forge` },
        });
        if (error) throw error;
        setNote("Account created — check your email for the confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        void navigate({ to: "/forge" });
      }
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Access denied.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setNote(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setNote("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/forge" });
  }

  return (
    <main className="hud-bg hud-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="hud-panel w-full max-w-md px-6 py-7">
        <p className="text-[0.6rem] tracking-[0.35em] text-hud-dim">J.A.R.V.I.S. // ACCESS CORE</p>
        <h1 className="mt-2 text-xl tracking-[0.3em] text-primary hud-glow">
          {mode === "in" ? "SIGN IN" : "CREATE ACCESS"}
        </h1>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            aria-label="Email"
            className="w-full border border-primary/30 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            aria-label="Password"
            className="w-full border border-primary/30 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <Button
            type="submit"
            disabled={busy}
            variant="outline"
            className="w-full rounded-none border-primary/60 text-xs tracking-[0.3em] text-primary"
          >
            {busy ? "LINKING..." : mode === "in" ? "ENTER" : "REGISTER"}
          </Button>
        </form>

        <Button
          type="button"
          onClick={google}
          variant="outline"
          className="mt-3 w-full rounded-none border-border text-xs tracking-[0.25em]"
        >
          CONTINUE WITH GOOGLE
        </Button>

        {note && <p className="mt-4 text-[0.7rem] text-accent">{note}</p>}

        <div className="mt-5 flex items-center justify-between text-[0.65rem] tracking-[0.2em] text-muted-foreground">
          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "NEW USER? REGISTER" : "HAVE ACCESS? SIGN IN"}
          </button>
          <Link to="/" className="text-primary">
            ← HUD
          </Link>
        </div>
      </div>
    </main>
  );
}
