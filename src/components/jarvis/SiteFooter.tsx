import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/guides", label: "Guides" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-10 border-t border-primary/25 px-4 py-6 text-[0.7rem] tracking-[0.15em] text-muted-foreground">
      <nav className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-6 gap-y-2">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="hover:text-primary">
            {l.label.toUpperCase()}
          </Link>
        ))}
      </nav>
      <p className="mt-3 text-center">© {new Date().getUTCFullYear()} J.A.R.V.I.S. Command System</p>
    </footer>
  );
}

export function ContentPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="hud-bg min-h-screen">
      <header className="relative z-10 border-b border-primary/25 px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/" className="text-sm tracking-[0.4em] text-primary hud-glow">
            J.A.R.V.I.S
          </Link>
          <Link to="/guides" className="text-[0.7rem] tracking-[0.2em] text-muted-foreground hover:text-primary">
            GUIDES
          </Link>
        </div>
      </header>
      <article className="relative z-10 mx-auto max-w-3xl px-4 py-10 font-sans text-[0.95rem] leading-relaxed text-foreground [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:tracking-[0.15em] [&_h1]:text-primary [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:text-primary [&_p]:mb-4 [&_p]:text-foreground/85 [&_li]:mb-2 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </article>
      <SiteFooter />
    </main>
  );
}
