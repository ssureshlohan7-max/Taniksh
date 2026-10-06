import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentPage } from "@/components/jarvis/SiteFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — J.A.R.V.I.S." },
      { name: "description", content: "The rules for using the J.A.R.V.I.S. voice assistant, AI Photo Lab and Site Forge website builder." },
      { property: "og:title", content: "Terms of Use — J.A.R.V.I.S." },
      { property: "og:description", content: "The rules for using the J.A.R.V.I.S. voice assistant, AI Photo Lab and Site Forge website builder." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://taniksh.lovable.app/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://taniksh.lovable.app/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <ContentPage>
      <h1>Terms of Use</h1>
      <p>Last updated: October 6, 2026</p>
      <p>By using J.A.R.V.I.S. you agree to these terms.</p>
      <h2>Using the service</h2>
      <p>
        The assistant, Photo Lab and Site Forge are provided free of charge, “as is”, without any
        guarantee that answers are complete or correct. Always double-check important information
        such as medical, legal or financial advice.
      </p>
      <h2>Your content</h2>
      <p>
        You are responsible for the websites and images you create and publish. Do not create
        content that is illegal, hateful, deceptive, sexually explicit, infringes someone else’s
        rights, or impersonates real people. We may remove published websites that break these
        rules.
      </p>
      <h2>Accounts</h2>
      <p>
        Keep your password private. You can delete your websites at any time, and we may suspend
        accounts that abuse the service.
      </p>
      <h2>Third-party sites</h2>
      <p>
        Voice commands can open other websites such as YouTube or WhatsApp. Those sites have their
        own terms and we are not responsible for them.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms? Visit our{" "}
        <Link to="/contact" className="text-primary underline">contact page</Link>.
      </p>
    </ContentPage>
  );
}
