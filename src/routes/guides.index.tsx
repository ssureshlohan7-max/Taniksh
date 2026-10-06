import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentPage } from "@/components/jarvis/SiteFooter";
import { GUIDES } from "@/lib/guides";

export const Route = createFileRoute("/guides/")({
  head: () => ({
    meta: [
      { title: "Guides — Voice Control, AI Websites & Photo Editing | J.A.R.V.I.S." },
      {
        name: "description",
        content: "Free step-by-step guides for voice commands, building websites with AI, AI photo editing and customizing your assistant.",
      },
      { property: "og:title", content: "J.A.R.V.I.S. Guides" },
      {
        property: "og:description",
        content: "Step-by-step guides for voice control, AI website building and AI photo editing.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://taniksh.lovable.app/guides" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://taniksh.lovable.app/guides" }],
  }),
  component: GuidesPage,
});

function GuidesPage() {
  return (
    <ContentPage>
      <h1>Guides</h1>
      <p>Practical, step-by-step articles to help you get the most out of J.A.R.V.I.S.</p>
      <ul className="!list-none !pl-0 space-y-4">
        {GUIDES.map((g) => (
          <li key={g.slug} className="hud-panel p-4">
            <Link to="/guides/$slug" params={{ slug: g.slug }} className="text-lg text-primary">
              {g.title}
            </Link>
            <p className="!mb-0 mt-1">{g.summary}</p>
          </li>
        ))}
      </ul>
    </ContentPage>
  );
}
