import { createFileRoute } from "@tanstack/react-router";

// Temporary debug route: lists models available to the configured key.
export const Route = createFileRoute("/api/jarvis-debug")({
  server: {
    handlers: {
      GET: async () => {
        const apiKey = process.env["GEMINI_API_KEY"];
        if (!apiKey) {
          return Response.json({ error: "no key" }, { status: 500 });
        }
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models?pageSize=100",
          { headers: { "x-goog-api-key": apiKey } },
        );
        const data = await res.json();
        if (!res.ok) return Response.json(data, { status: res.status });
        const names = (data.models ?? []).map((m: { name: string }) => m.name);
        return Response.json({ names });
      },
    },
  },
});
