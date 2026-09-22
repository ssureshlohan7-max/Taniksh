import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublicSite } from "@/lib/forge.functions";

export const Route = createFileRoute("/s/$slug")({
  loader: ({ params }) => getPublicSite({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Site unavailable" }, { name: "robots", content: "noindex" }],
      };
    }
    return {
      meta: [
        { title: loaderData.title },
        { name: "description", content: `${loaderData.title} — built with J.A.R.V.I.S. Site Forge.` },
        { property: "og:title", content: loaderData.title },
        {
          property: "og:description",
          content: `${loaderData.title} — built with J.A.R.V.I.S. Site Forge.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <Missing />,
  notFoundComponent: () => <Missing />,
  component: PublicSite,
});

function Missing() {
  return (
    <main className="hud-bg flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-lg tracking-[0.3em] text-primary hud-glow">SITE NOT FOUND</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This address is not published, or it was taken offline.
        </p>
        <Link to="/" className="mt-4 inline-block text-xs tracking-[0.25em] text-accent">
          ← J.A.R.V.I.S.
        </Link>
      </div>
    </main>
  );
}

function PublicSite() {
  const site = Route.useLoaderData();
  if (!site) return <Missing />;

  return (
    <iframe
      title={site.title}
      srcDoc={site.html}
      sandbox="allow-scripts allow-popups allow-forms"
      className="h-screen w-screen border-0"
    />
  );
}
