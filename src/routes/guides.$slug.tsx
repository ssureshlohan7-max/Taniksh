import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ContentPage } from "@/components/jarvis/SiteFooter";
import { GUIDES } from "@/lib/guides";

export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => {
    const guide = GUIDES.find((g) => g.slug === params.slug);
    if (!guide) throw notFound();
    return { guide };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Guide not found" }, { name: "robots", content: "noindex" }] };
    const url = `https://taniksh.lovable.app/guides/${params.slug}`;
    return {
      meta: [
        { title: `${loaderData.guide.title} | J.A.R.V.I.S.` },
        { name: "description", content: loaderData.guide.summary },
        { property: "og:title", content: loaderData.guide.title },
        { property: "og:description", content: loaderData.guide.summary },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: GuideMissing,
  errorComponent: GuideMissing,
  component: GuidePage,
});

function GuideMissing() {
  return (
    <ContentPage>
      <h1>Guide not found</h1>
      <p>
        <Link to="/guides" className="text-primary underline">Back to all guides</Link>
      </p>
    </ContentPage>
  );
}

function GuidePage() {
  const { guide } = Route.useLoaderData();
  return (
    <ContentPage>
      <h1>{guide.title}</h1>
      <p className="text-muted-foreground">{guide.summary}</p>
      {guide.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          {s.body.map((p) => (
            <p key={p.slice(0, 32)}>{p}</p>
          ))}
        </section>
      ))}
      <p>
        <Link to="/guides" className="text-primary underline">← All guides</Link>
      </p>
    </ContentPage>
  );
}
