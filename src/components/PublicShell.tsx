import { Search } from "@/components/animate-ui/icons/search";
import { Sun } from "@/components/animate-ui/icons/sun";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Logo } from "./atoms";
import footerFacebook from "@/assets/footer-facebook.svg";
import footerTwitter from "@/assets/footer-twitter.svg";
import footerInstagram from "@/assets/footer-instagram.svg";
import footerLinkedin from "@/assets/footer-linkedin.svg";

/* ------------------------------------------------------------------ *
 * Shared shell for every page that lives outside the dashboard (no
 * sidebar, no login required) — the Log Out landing page and the
 * public Pricing page both render inside this same top bar/footer
 * instead of each hand-rolling their own, so going Home → Pricing →
 * Home never feels like leaving to a different site.
 * ------------------------------------------------------------------ */

export function PublicHeader({
  dark,
  onToggleTheme,
  onLogIn,
}: {
  dark: boolean;
  onToggleTheme: () => void;
  onLogIn: () => void;
}) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <button
        type="button"
        onClick={() => navigate("/logout")}
        className="flex h-full w-[254px] shrink-0 items-center border-r border-zinc-200 px-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:border-zinc-800"
      >
        <Logo />
      </button>

      <div className="flex flex-1 items-center gap-3 px-6">
        <div className="relative w-full max-w-[420px]">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Search className="h-4 w-4 text-zinc-400" animateOnView />
          </div>
          <Input placeholder="Search" className="pl-9" />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            className="h-9 w-9 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <Sun className="h-[18px] w-[18px]" animateOnHover animateOnTap />
          </Button>
          <Button variant="brand" onClick={onLogIn} className="h-9 px-5 text-sm">
            Log In
          </Button>
        </div>
      </div>
    </header>
  );
}

const FOOTER_LINKS: { label: string; to?: string }[] = [
  { label: "Home", to: "/logout" },
  { label: "About" },
  { label: "Pricing", to: "/pricing" },
  { label: "Blog" },
  { label: "Contact" },
];

export function PublicFooter() {
  const navigate = useNavigate();

  return (
    <footer className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">SabayTEKH</p>

        <nav className="flex flex-wrap items-center gap-7 text-[15px] text-zinc-600 dark:text-zinc-400">
          {FOOTER_LINKS.map(({ label, to }) => (
            <button
              key={label}
              type="button"
              onClick={to ? () => navigate(to) : undefined}
              className="hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:hover:text-zinc-100"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3.5">
          {[
            { src: footerFacebook, label: "Facebook" },
            { src: footerTwitter, label: "Twitter" },
            { src: footerInstagram, label: "Instagram" },
            { src: footerLinkedin, label: "LinkedIn" },
          ].map(({ src, label }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="flex h-[18px] w-[18px] items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40"
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-contain dark:invert dark:brightness-125"
              />
            </a>
          ))}
        </div>
      </div>

      <p className="mt-8 border-t border-zinc-200 pt-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Copyright © 2026 SabayTEKH | All Rights Reserved
      </p>
    </footer>
  );
}
