import { createFileRoute } from "@tanstack/react-router";

/**
 * AI photo lab: edits an uploaded photo (or generates one from a prompt)
 * through the Lovable AI gateway. Returns a base64 data URL.
 */
export const Route = createFileRoute("/api/photo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json({ error: "Image core is not configured." }, { status: 500 });
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const prompt = String(form.get("prompt") ?? "").trim();
        if (!prompt) {
          return Response.json({ error: "Describe the edit first, sir." }, { status: 400 });
        }
        const file = form.get("image");
        const model = "openai/gpt-image-2.5-sunburst";

        let res: Response;
        if (file instanceof File && file.size > 0) {
          const upstream = new FormData();
          upstream.append("model", model);
          upstream.append("prompt", prompt);
          upstream.append("image", file, file.name || "photo.png");
          res = await fetch("https://ai.gateway.lovable.dev/v1/images/edits", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: upstream,
          });
        } else {
          res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, prompt, n: 1 }),
          });
        }

        if (!res.ok) {
          const detail = await res.text();
          console.error(`Image request failed [${res.status}]: ${detail}`);
          const message =
            res.status === 402
              ? "Out of AI credits. Add credits to keep the image core online."
              : res.status === 429
                ? "Image core is busy. Try again in a moment, sir."
                : `Image core error (${res.status}).`;
          return Response.json({ error: message }, { status: res.status });
        }

        const data = (await res.json()) as {
          data?: Array<{ b64_json?: string; url?: string }>;
        };
        const item = data.data?.[0];
        const image = item?.b64_json ? `data:image/png;base64,${item.b64_json}` : item?.url;
        if (!image) {
          return Response.json({ error: "No image was returned." }, { status: 502 });
        }
        return Response.json({ image });
      },
    },
  },
});
