import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentPage } from "@/components/jarvis/SiteFooter";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — J.A.R.V.I.S." },
      { name: "description", content: "Get in touch with the team behind the J.A.R.V.I.S. voice assistant and Site Forge." },
      { property: "og:title", content: "Contact — J.A.R.V.I.S." },
      { property: "og:description", content: "Get in touch with the team behind the J.A.R.V.I.S. voice assistant and Site Forge." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://taniksh.lovable.app/contact" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://taniksh.lovable.app/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <ContentPage>
      <h1>Contact Us</h1>
      <p>
        We would love to hear your feedback, feature ideas, or reports of a problem with the
        assistant, the Photo Lab or a published website.
      </p>
      <h2>How to reach us</h2>
      <p>
        Email:{" "}
        <a href="mailto:jarvis.taniksh@gmail.com" className="text-primary underline">
          jarvis.taniksh@gmail.com
        </a>
      </p>
      <p>We usually reply within two working days.</p>
      <h2>Reporting a published website</h2>
      <p>
        If a website published through the Site Forge breaks our{" "}
        <Link to="/terms" className="text-primary underline">terms of use</Link>, email us its link
        and we will review it.
      </p>
    </ContentPage>
  );
}
