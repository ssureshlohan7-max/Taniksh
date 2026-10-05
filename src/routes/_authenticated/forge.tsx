import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { HudPanel } from "@/components/jarvis/HudPanel";
import { useSpeechInput } from "@/hooks/use-speech";
import {
  deleteSite,
  generateSite,
  getMySite,
  listMySites,
  saveSite,
  setSlug,
  setPublished,
} from "@/lib/forge.functions";

export const Route = createFileRoute("/_authenticated/forge")({
  head: () => ({
    meta: [
      { title: "SITE FORGE — Build & publish websites with J.A.R.V.I.S." },
      {
        name: "description",
        content:
          "Describe a website by voice or text and J.A.R.V.I.S. builds it, previews it and publishes it on a live link.",
      },
      { property: "og:title", content: "SITE FORGE — Build & publish with J.A.R.V.I.S." },
      {
        property: "og:description",
        content: "Speak a website into existence and publish it on a live link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Forge,
});

type ChatMsg = { role: "you" | "jarvis"; text: string };

type SiteRow = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  updated_at: string;
  prompt: string;
};

const LIVE_ORIGIN = "https://taniksh.lovable.app";
const liveUrl = (slug: string) => `${LIVE_ORIGIN}/s/${slug}`;

function Forge() {
  const renameSlug = useServerFn(setSlug);
  const [slugDraft, setSlugDraft] = useState("");
  const [copied, setCopied] = useState(false);
  async function copyLink(slug: string) {
    try {
      await navigator.clipboard.writeText(liveUrl(slug));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNote(liveUrl(slug));
    }
  }
  async function shareLink(slug: string, name: string) {
    const url = liveUrl(slug);
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copyLink(slug);
  }
  const navigate = useNavigate();
  const generate = useServerFn(generateSite);
  const list = useServerFn(listMySites);
  const load = useServerFn(getMySite);
  const save = useServerFn(saveSite);
  const publish = useServerFn(setPublished);
  const remove = useServerFn(deleteSite);

  const [prompt, setPrompt] = useState("");
  const [html, setHtml] = useState("");
  const [title, setTitle] = useState("");
  const [current, setCurrent] = useState<{ id: string; slug: string; published: boolean } | null>(
    null,
  );
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSites((await list()) as SiteRow[]);
    } catch {
      /* ignore */
    }
  }, [list]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const [chat, setChat] = useState<ChatMsg[]>([
    {
      role: "jarvis",
      text: "Tell me what kind of website you need — a shop, portfolio, gym, anything. I'll build it and show it here. Afterwards you can ask for changes like 'change the colours' or 'add a pricing section'.",
    },
  ]);
  const [tab, setTab] = useState<"chat" | "preview">("chat");
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat, busy]);

  const onVoice = useCallback((text: string) => setPrompt(text), []);
  const { listening, interim, supported, start, stop } = useSpeechInput(onVoice, "en-IN");

  async function build() {
    const ask = prompt.trim();
    if (!ask || busy) return;
    const editing = !!html;
    setChat((c) => [...c, { role: "you", text: ask }]);
    setPrompt("");
    setBusy(editing ? "UPDATING DESIGN..." : "FORGING SITE...");
    setNote(null);
    try {
      const res = await generate({
        data: editing ? { prompt: ask, currentHtml: html } : { prompt: ask },
      });
      setHtml(res.html);
      setTitle((t) => t || res.title);
      setChat((c) => [
        ...c,
        {
          role: "jarvis",
          text: `${editing ? "Changes applied" : `"${res.title}" is ready`}. Check the preview — tell me anything else to change, or press SAVE / PUBLISH.`,
        },
      ]);
      if (typeof window !== "undefined" && window.innerWidth < 1024) setTab("preview");
    } catch (err) {
      setChat((c) => [
        ...c,
        { role: "jarvis", text: err instanceof Error ? err.message : "Forge failed." },
      ]);
    } finally {
      setBusy(null);
    }
  }

  async function store(published: boolean) {
    if (!html) return;
    setBusy(published ? "PUBLISHING..." : "SAVING...");
    setNote(null);
    try {
      const row = await save({
        data: {
          ...(current ? { id: current.id } : {}),
          title: title || "Untitled site",
          html,
          prompt,
          published,
        },
      });
      setCurrent(row as { id: string; slug: string; published: boolean });
      setSlugDraft((row as { slug: string }).slug);
      setNote(
        published
          ? `LIVE: ${liveUrl((row as { slug: string }).slug)}`
          : "Saved to your vault.",
      );
      await refresh();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(null);
    }
  }

  async function openSite(id: string) {
    setBusy("LOADING...");
    try {
      const row = (await load({ data: { id } })) as {
        id: string;
        slug: string;
        title: string;
        html: string;
        prompt: string;
        published: boolean;
      } | null;
      if (!row) return;
      setCurrent({ id: row.id, slug: row.slug, published: row.published });
      setTitle(row.title);
      setHtml(row.html);
      setPrompt("");
      setSlugDraft(row.slug);
      setNote(null);
      setChat((c) => [
        ...c,
        {
          role: "jarvis",
          text: `"${row.title}" is open. Tell me what to change and I'll update it, then press SAVE or PUBLISH.`,
        },
      ]);
    } finally {
      setBusy(null);
    }
  }

  async function togglePublish(site: SiteRow) {
    await publish({ data: { id: site.id, published: !site.published } });
    await refresh();
    if (current?.id === site.id) setCurrent({ ...current, published: !site.published });
  }

  async function drop(site: SiteRow) {
    await remove({ data: { id: site.id } });
    if (current?.id === site.id) {
      setCurrent(null);
      setHtml("");
      setTitle("");
    }
    await refresh();
  }

  function newSite() {
    setCurrent(null);
    setHtml("");
    setTitle("");
    setPrompt("");
    setSlugDraft("");
    setNote(null);
  }

  function download() {
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title || "site"}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  }

  return (
    <main className="hud-bg hud-shell min-h-screen px-3 py-4 sm:px-6">
      <div aria-hidden="true" className="telemetry-sweep" />
      <header className="relative mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-primary/25 pb-3">
        <div>
          <span className="text-lg tracking-[0.45em] text-primary hud-glow">SITE FORGE</span>
          <p className="text-[0.55rem] tracking-[0.3em] text-hud-dim">
            DESCRIBE // FORGE // PUBLISH
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            size="sm"
            className="rounded-none text-[0.65rem] tracking-[0.2em]"
          >
            <Link to="/">← BACK TO AI ASSISTANT</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={newSite}
            className="rounded-none border-border text-[0.6rem] tracking-[0.25em]"
          >
            NEW
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={signOut}
            className="rounded-none border-border text-[0.6rem] tracking-[0.25em]"
          >
            SIGN OUT
          </Button>
        </div>
      </header>

      <div className="relative mb-3 grid grid-cols-2 gap-2 lg:hidden">
        {(["chat", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border px-3 py-2 text-[0.62rem] tracking-[0.3em] ${tab === t ? "border-accent bg-accent/15 text-accent" : "border-primary/30 text-hud-dim"}`}
          >
            {t === "chat" ? "CHAT" : "PREVIEW"}
          </button>
        ))}
      </div>

      <div className="relative grid gap-4 lg:grid-cols-[24rem_minmax(0,1fr)]">
        <div className={`space-y-4 ${tab === "chat" ? "" : "hidden lg:block"}`}>
          <HudPanel title="FORGE CHAT">
            <div className="max-h-[22rem] min-h-[12rem] space-y-2 overflow-y-auto pr-1">
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={`text-[0.74rem] leading-relaxed ${m.role === "you" ? "ml-6 border border-accent/40 bg-accent/10 px-2 py-1.5 text-foreground" : "mr-4 text-primary"}`}
                >
                  <span className="mr-1 text-[0.55rem] tracking-[0.25em] text-hud-dim">
                    {m.role === "you" ? "YOU:" : "JARVIS:"}
                  </span>
                  {m.text}
                </div>
              ))}
              {busy && (
                <p className="animate-pulse text-[0.65rem] tracking-[0.25em] text-accent">{busy}</p>
              )}
              <div ref={chatEnd} />
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void build();
                }
              }}
              rows={3}
              placeholder={
                html ? "describe a change — e.g. 'make the background black'" : "build a gym website — pricing, trainers, contact"
              }
              aria-label="Message the forge"
              className="mt-2 w-full resize-none border border-primary/25 bg-transparent px-2 py-2 text-[0.78rem] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            {interim && <p className="mt-1 text-[0.65rem] text-hud-dim">{interim}</p>}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!supported}
                onClick={listening ? stop : start}
                className="rounded-none border-primary/50 text-[0.6rem] tracking-[0.2em] text-primary"
              >
                {listening ? "STOP" : "SPEAK"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!!busy}
                onClick={build}
                className="rounded-none border-accent text-[0.6rem] tracking-[0.2em] text-accent"
              >
                SEND ▶
              </Button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="site name"
              aria-label="Site name"
              className="mt-2 w-full border border-primary/25 bg-transparent px-2 py-1.5 text-[0.75rem] outline-none focus:border-primary"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!html || !!busy}
                onClick={() => store(false)}
                className="rounded-none border-border text-[0.6rem] tracking-[0.2em]"
              >
                SAVE
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!html || !!busy}
                onClick={() => store(true)}
                className="rounded-none border-accent bg-accent/10 text-[0.6rem] tracking-[0.2em] text-accent"
              >
                PUBLISH
              </Button>
            </div>
            {html && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={download}
                className="mt-2 w-full rounded-none border-border text-[0.6rem] tracking-[0.2em]"
              >
                DOWNLOAD HTML
              </Button>
            )}
            {busy && <p className="mt-2 text-[0.65rem] tracking-[0.2em] text-accent">{busy}</p>}
            {note && <p className="mt-2 break-all text-[0.68rem] text-primary">{note}</p>}
            {current && (
              <div className="mt-3 space-y-2 border border-primary/25 p-2">
                <p className="text-[0.55rem] tracking-[0.25em] text-hud-dim">WEBSITE ADDRESS</p>
                <div className="flex items-center text-[0.68rem]">
                  <span className="shrink-0 text-muted-foreground">taniksh.lovable.app/s/</span>
                  <input
                    value={slugDraft}
                    onChange={(e) => setSlugDraft(e.target.value)}
                    aria-label="Website address"
                    className="min-w-0 flex-1 border-b border-primary/40 bg-transparent px-1 text-primary outline-none focus:border-primary"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!!busy || !slugDraft || slugDraft === current.slug}
                  onClick={async () => {
                    setNote(null);
                    try {
                      const row = await renameSlug({ data: { id: current.id, slug: slugDraft } });
                      setCurrent(row);
                      setSlugDraft(row.slug);
                      setNote(`Address updated: ${liveUrl(row.slug)}`);
                      await refresh();
                    } catch (err) {
                      setNote(err instanceof Error ? err.message : "Could not change address.");
                    }
                  }}
                  className="w-full rounded-none border-primary/50 text-[0.6rem] tracking-[0.2em] text-primary"
                >
                  SAVE ADDRESS
                </Button>
                {current.published ? (
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={liveUrl(current.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-accent bg-accent/15 px-2 py-1.5 text-center text-[0.6rem] tracking-[0.2em] text-accent"
                    >
                      ▶ OPEN LIVE
                    </a>
                    <button
                      type="button"
                      onClick={() => copyLink(current.slug)}
                      className="border border-primary/50 px-2 py-1.5 text-[0.6rem] tracking-[0.2em] text-primary"
                    >
                      {copied ? "✓ COPIED" : "COPY LINK"}
                    </button>
                    <button
                      type="button"
                      onClick={() => shareLink(current.slug, title || "My website")}
                      className="border border-primary/50 px-2 py-1.5 text-[0.6rem] tracking-[0.2em] text-primary"
                    >
                      SHARE
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${title || "My website"} — ${liveUrl(current.slug)}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-primary/50 px-2 py-1.5 text-center text-[0.6rem] tracking-[0.2em] text-primary"
                    >
                      WHATSAPP
                    </a>
                  </div>
                ) : (
                  <p className="text-[0.6rem] text-muted-foreground">Publish to get a shareable public link.</p>
                )}
              </div>
            )}
          </HudPanel>

          <HudPanel title="MY SITES">
            {sites.length === 0 ? (
              <p className="text-[0.65rem] tracking-[0.2em] text-muted-foreground">NO SITES YET</p>
            ) : (
              <ul className="space-y-2">
                {sites.map((s) => (
                  <li key={s.id} className="border border-primary/20 px-2 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openSite(s.id)}
                        className="truncate text-left text-[0.7rem] text-primary"
                      >
                        {s.title}
                      </button>
                      <span
                        className={`text-[0.55rem] tracking-[0.2em] ${s.published ? "text-signal" : "text-hud-dim"}`}
                      >
                        {s.published ? "● LIVE" : "○ DRAFT"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[0.55rem] tracking-[0.2em]">
                      <button
                        type="button"
                        onClick={() => togglePublish(s)}
                        className="text-accent"
                      >
                        {s.published ? "UNPUBLISH" : "PUBLISH"}
                      </button>
                      {s.published && (
                        <a
                          href={liveUrl(s.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          VIEW
                        </a>
                      )}
                      {s.published && (
                        <button
                          type="button"
                          onClick={() => shareLink(s.slug, s.title)}
                          className="text-primary"
                        >
                          SHARE
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => drop(s)}
                        className="text-muted-foreground"
                      >
                        DELETE
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </HudPanel>
        </div>

        <div className={tab === "preview" ? "" : "hidden lg:block"}>
        <HudPanel title="LIVE PREVIEW">
          {html ? (
            <iframe
              title="Site preview"
              srcDoc={html}
              sandbox="allow-scripts allow-popups allow-forms"
              className="h-[34rem] w-full border border-primary/20 bg-white lg:h-[46rem]"
            />
          ) : (
            <div className="flex h-[34rem] items-center justify-center text-center text-[0.7rem] tracking-[0.25em] text-hud-dim lg:h-[46rem]">
              CHAT MEIN WEBSITE BATAO — YAHAN DIKHEGI
            </div>
          )}
        </HudPanel>
        </div>
      </div>
    </main>
  );
}
