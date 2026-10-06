import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentPage } from "@/components/jarvis/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — J.A.R.V.I.S." },
      { name: "description", content: "How J.A.R.V.I.S. collects, uses and protects your information, including cookies and advertising partners." },
      { property: "og:title", content: "Privacy Policy — J.A.R.V.I.S." },
      { property: "og:description", content: "How J.A.R.V.I.S. collects, uses and protects your information, including cookies and advertising partners." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://taniksh.lovable.app/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://taniksh.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <ContentPage>
      <h1>Privacy Policy</h1>
      <p>Last updated: October 6, 2026</p>
      <p>
        This policy explains what information J.A.R.V.I.S. (“we”, “the site”) collects when you
        use taniksh.lovable.app and how it is used.
      </p>
      <h2>Information you provide</h2>
      <p>
        If you create an account for the Site Forge, we store your email address and the websites
        you save or publish. Published websites are visible to anyone with the link. Text you type
        or speak to the assistant is sent to our AI providers only to produce a reply and is not
        sold.
      </p>
      <h2>Voice and microphone</h2>
      <p>
        Speech recognition is performed by your browser. The microphone is only active while you
        use Talk, Wake or Live Talk, and you can turn it off at any time.
      </p>
      <h2>Information stored on your device</h2>
      <p>
        Your assistant settings — name, theme, voice, background image and shortcuts — are saved in
        your browser’s local storage and never leave your device.
      </p>
      <h2>Cookies and advertising</h2>
      <p>
        We use third-party advertising, including Google AdSense and Monetag, to keep the service
        free. Third-party vendors, including Google, use cookies to serve ads based on your prior
        visits to this and other websites. Google’s use of advertising cookies enables it and its
        partners to serve ads based on your visits to this site and/or other sites on the Internet.
      </p>
      <p>
        You may opt out of personalised advertising by visiting{" "}
        <a href="https://www.google.com/settings/ads" className="text-primary underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>{" "}
        or{" "}
        <a href="https://www.aboutads.info/choices/" className="text-primary underline" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.
        Learn more about{" "}
        <a href="https://policies.google.com/technologies/partner-sites" className="text-primary underline" target="_blank" rel="noopener noreferrer">how Google uses data</a>.
      </p>
      <h2>Your choices</h2>
      <p>
        You can delete your saved websites at any time from the Site Forge, clear local settings by
        clearing your browser data, and request deletion of your account through our{" "}
        <Link to="/contact" className="text-primary underline">contact page</Link>.
      </p>
      <h2>Children</h2>
      <p>The service is not directed at children under 13.</p>
      <h2>Changes</h2>
      <p>We may update this policy; the date above shows the latest version.</p>
    </ContentPage>
  );
}
