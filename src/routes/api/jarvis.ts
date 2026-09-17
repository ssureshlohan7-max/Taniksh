import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are J.A.R.V.I.S., a concise, composed AI assistant.
Speak in short, precise sentences. Address the user as "sir" sparingly.
Answers are read aloud, so avoid markdown, lists, and symbols.
Use the Google Search tool whenever the question depends on current or factual
real-world information (news, prices, weather, sports, recent events).`;

export const Route = createFileRoute("/api/jarvis")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["GEMINI_API_KEY"];
        if (!apiKey) {
          return Response.json(
            { error: "The assistant is not configured with an API key yet." },
            { status: 500 },
          );
        }

        let body: { messages?: ChatMessage[] };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const messages = (body.messages ?? []).filter(
          (m) => typeof m?.content === "string" && m.content.trim().length > 0,
        );
        if (messages.length === 0) {
          return Response.json({ error: "No message provided." }, { status: 400 });
        }

        const basePayload = {
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: messages.slice(-12).map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        };

        const callGemini = (withSearch: boolean) =>
          fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
              },
              body: JSON.stringify(
                withSearch
                  ? { ...basePayload, tools: [{ google_search: {} }] }
                  : basePayload,
              ),
            },
          );

        // Google Search grounding requires a paid key; on free-tier keys it
        // fails with 429, so fall back to a plain answer.
        let res = await callGemini(true);
        let searchAvailable = true;
        if (res.status === 429) {
          searchAvailable = false;
          res = await callGemini(false);
        }

        if (!res.ok) {
          const detail = await res.text();
          console.error(`Gemini request failed [${res.status}]: ${detail}`);
          return Response.json(
            {
              error:
                res.status === 429
                  ? "Rate limit reached on the AI key. Please wait a moment and try again."
                  : `The AI service returned an error (${res.status}).`,
            },
            { status: 502 },
          );
        }

        const data = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
            groundingMetadata?: {
              webSearchQueries?: string[];
              groundingChunks?: Array<{ web?: { title?: string; uri?: string } }>;
            };
          }>;
        };

        const candidate = data.candidates?.[0];
        const text =
          candidate?.content?.parts
            ?.map((p) => p.text ?? "")
            .join("")
            .trim() ?? "";

        const grounding = candidate?.groundingMetadata;
        const sources = (grounding?.groundingChunks ?? [])
          .map((c) => c.web?.title)
          .filter((t): t is string => Boolean(t))
          .slice(0, 4);

        return Response.json({
          text: text || "I could not formulate a response to that.",
          usedSearch: Boolean(grounding?.webSearchQueries?.length || sources.length),
          queries: grounding?.webSearchQueries?.slice(0, 3) ?? [],
          sources,
        });
      },
    },
  },
});
