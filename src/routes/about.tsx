import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentPage } from "@/components/jarvis/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About J.A.R.V.I.S. — Voice Assistant & AI Website Builder" },
      { name: "description", content: "Learn what J.A.R.V.I.S. is, who it is for, and how its voice assistant, AI photo lab and website builder work." },
      { property: "og:title", content: "About J.A.R.V.I.S. — Voice Assistant & AI Website Builder" },
      { property: "og:description", content: "Learn what J.A.R.V.I.S. is, who it is for, and how its voice assistant, AI photo lab and website builder work." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://taniksh.lovable.app/about" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://taniksh.lovable.app/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <ContentPage>
      <h1>About J.A.R.V.I.S.</h1>
      <p>
        J.A.R.V.I.S. is a free, browser-based voice assistant inspired by the futuristic computer
        interfaces of science fiction. It brings together three tools in one place: a voice
        assistant that answers questions and opens websites, an AI Photo Lab for editing and
        creating images, and the Site Forge, which builds complete websites from a simple
        description.
      </p>
      <h2>Who it is for</h2>
      <p>
        The project is designed for students, shop owners, creators and anyone who wants to get
        everyday tasks done faster — in English or in Haryanvi and Hindi. No technical knowledge is
        needed: if you can describe what you want, the assistant can help.
      </p>
      <h2>What you can do</h2>
      <ul>
        <li>Ask questions and hear spoken answers, hands-free with Live Talk.</li>
        <li>Open and search YouTube, Google, Maps, Amazon, WhatsApp and many more by voice.</li>
        <li>Edit photos or generate new images by describing them.</li>
        <li>Build, edit, publish and share your own website with a custom address.</li>
        <li>Customize the assistant’s name, voice, personality, theme and shortcuts.</li>
      </ul>
      <h2>Our principles</h2>
      <p>
        We keep the assistant honest about what a web browser can and cannot do, keep your settings
        stored on your own device, and never put secret keys in the page you load. Read our{" "}
        <Link to="/privacy" className="text-primary underline">privacy policy</Link> to learn more,
        or start with our <Link to="/guides" className="text-primary underline">guides</Link>.
      </p>
    </ContentPage>
  );
}
