import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const SYSTEM_PROMPT = `You are FORGE, an elite web designer inside the J.A.R.V.I.S. command system.
You output ONE complete, production-ready HTML document for the site the user describes.

RULES
- Return ONLY raw HTML. No markdown fences, no commentary.
- Single self-contained file: <!doctype html>, <html>, <head> with <meta charset> + viewport + <title> + <meta name="description">, and all CSS inside one <style> tag.
- No external scripts, no CDNs, no frameworks, no tracking. Small inline vanilla JS is allowed only for menus/smooth scroll.
- Use only images from https://images.unsplash.com or CSS gradients. Never link to files that may not exist.
- Fully responsive, accessible (semantic landmarks, alt text, good contrast), fast.
- Sharp, modern, distinctive design. Real copy in the language the user used — never lorem ipsum.
- Include the sections the user asks for, plus a header nav with in-page anchors and a footer.`;

function slugify(input: string) {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40)
    .replace(/^-+|-+$/g, "");
  return base || "site";
}

function stripFences(text: string) {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1] ?? text;
  return body.trim();
}

function extractTitle(html: string, fallback: string) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  const t = m?.[1]?.trim();
  return t && t.length > 0 ? t.slice(0, 120) : fallback;
}

export const generateSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { prompt: string; currentHtml?: string }) => {
    const prompt = (data?.prompt ?? "").trim();
    if (prompt.length < 3) throw new Error("Describe the site in a few words.");
    if (prompt.length > 2000) throw new Error("Description is too long.");
    const currentHtml =
      typeof data.currentHtml === "string" ? data.currentHtml.slice(0, 120000) : undefined;
    return { prompt, currentHtml };
  })
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI core offline.");

    const { data: left } = await context.supabase.rpc("forge_credits_left");
    if ((left ?? 0) <= 0) {
      throw new Error("Aaj ke 5 credits khatam. Kal subah naye credits milenge.");
    }

    const messages: { role: string; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];
    if (data.currentHtml) {
      messages.push({
        role: "user",
        content: `Here is the current site HTML:\n\n${data.currentHtml}\n\nApply this change and return the full updated document: ${data.prompt}`,
      });
    } else {
      messages.push({ role: "user", content: `Build this website: ${data.prompt}` });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "google/gemini-3.8-flash", messages }),
    });

    if (res.status === 429) throw new Error("Forge is busy. Try again in a moment, sir.");
    if (res.status === 402) throw new Error("Out of AI credits.");
    if (!res.ok) throw new Error("Forge could not build that. Try rephrasing.");

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const html = stripFences(raw);
    if (!/<html[\s>]/i.test(html)) throw new Error("Forge returned an invalid page. Try again.");

    // only charge a credit when a site was actually delivered
    const { data: remaining } = await context.supabase.rpc("consume_forge_credit");

    return {
      html,
      title: extractTitle(html, data.prompt.slice(0, 60)),
      credits: Math.max(0, remaining ?? 0),
    };
  });

export const getForgeCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("forge_credits_left");
    return { credits: Math.max(0, data ?? 5), max: 5 };
  });

export const listMySites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sites")
      .select("id, slug, title, published, updated_at, prompt")
      .eq("owner_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMySite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("sites")
      .select("*")
      .eq("id", data.id)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const saveSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { id?: string; title: string; html: string; prompt: string; published?: boolean }) => {
      const title = (data.title ?? "Untitled site").trim().slice(0, 120) || "Untitled site";
      const html = String(data.html ?? "").slice(0, 400000);
      if (!html) throw new Error("Nothing to save yet.");
      return {
        id: data.id ? String(data.id) : undefined,
        title,
        html,
        prompt: String(data.prompt ?? "").slice(0, 2000),
        published: Boolean(data.published),
      };
    },
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    if (data.id) {
      const { data: row, error } = await supabase
        .from("sites")
        .update({
          title: data.title,
          html: data.html,
          prompt: data.prompt,
          published: data.published,
        })
        .eq("id", data.id)
        .eq("owner_id", context.userId)
        .select("id, slug, published")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("Site not found.");
      return row;
    }

    const base = slugify(data.title);
    for (let attempt = 0; attempt < 6; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 7)}`;
      const { data: row, error } = await supabase
        .from("sites")
        .insert({
          owner_id: context.userId,
          slug,
          title: data.title,
          html: data.html,
          prompt: data.prompt,
          published: data.published,
        })
        .select("id, slug, published")
        .maybeSingle();
      if (!error && row) return row;
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    }
    throw new Error("Could not pick a free address for this site.");
  });

export const setPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; published: boolean }) => ({
    id: String(data.id),
    published: Boolean(data.published),
  }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("sites")
      .update({ published: data.published })
      .eq("id", data.id)
      .eq("owner_id", context.userId)
      .select("id, slug, published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Site not found.");
    return row;
  });

export const deleteSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sites")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPublicSite = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug).slice(0, 80) }))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabasePublic = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: row } = await supabasePublic
      .from("sites")
      .select("slug, title, html")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();

    return row;
  });
