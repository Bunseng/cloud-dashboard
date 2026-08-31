import type { ComponentType } from "react";
import { useNavigate } from "react-router-dom";

import { ArrowRight } from "@/components/animate-ui/icons/arrow-right";
import { ArrowUpRight } from "@/components/animate-ui/icons/arrow-up-right";
import { Cloud } from "@/components/animate-ui/icons/cloud";
import { Headphones } from "@/components/animate-ui/icons/headphones";
import { ImagePlay } from "@/components/animate-ui/icons/image-play";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { Sparkles } from "@/components/animate-ui/icons/sparkles";
import { Users } from "@/components/animate-ui/icons/users";
import { Zap } from "@/components/animate-ui/icons/zap";
import { Button } from "@/components/ui/button";

type AnimateIconComponent = ComponentType<{
  className?: string;
  strokeWidth?: number;
  animate?: boolean;
  animateOnHover?: boolean;
  animateOnTap?: boolean;
  animateOnView?: boolean;
  loop?: boolean;
}>;

import { PublicFooter, PublicHeader } from "../components/PublicShell";

/* Hero is the supplied animated GIF — the one asset this page keeps
   untouched. The top bar and footer now live in PublicShell, shared
   with the public Pricing page, instead of being hand-rolled here. */
import heroCloud from "@/assets/hero-cloud.gif";

/* ------------------------------------------------------------------ *
 * Logged-out landing page — reached from the sidebar's "Log out".
 * Follows the Figma "Log Out" frame: it replaces the dashboard shell
 * entirely (no sidebar), with its own top bar and marketing footer.
 * The hero GIF is the one supplied asset; everything around it is
 * restyled to feel like a real product landing page rather than a
 * placeholder — trust badges, a floating stat card, staggered
 * entrance animation, and matching hover treatment on every card.
 * ------------------------------------------------------------------ */

interface LandingService {
  id: string;
  icon: AnimateIconComponent;
  title: string;
  items: string[];
}

const LANDING_SERVICES: LandingService[] = [
  {
    id: "cloud",
    icon: Cloud,
    title: "Cloud Service",
    items: ["Storage", "Run App", "Database"],
  },
  {
    id: "media",
    icon: ImagePlay,
    title: "Media Service",
    items: ["Live Stream", "Streaming", "Transcoder"],
  },
];

const TRUST_BADGES: { icon: AnimateIconComponent; label: string }[] = [
  { icon: ShieldCheck, label: "Enterprise-grade security" },
  { icon: Zap, label: "99.9% uptime SLA" },
  { icon: Headphones, label: "24/7 local support" },
];

function LandingServiceCard({
  service,
  index,
}: {
  service: LandingService;
  index: number;
}) {
  const Icon = service.icon;

  return (
    <div
      style={{ animationDelay: `${index * 90}ms` }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 p-7 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-safe:fill-mode-both motion-safe:transition-all hover:-translate-y-1 hover:border-[#1C75BC]/40 hover:shadow-[0_10px_28px_rgba(28,117,188,0.14)] dark:border-zinc-800"
    >
      <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-[#1C75BC] to-[#35C3D9] motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-x-100" />

      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] motion-safe:transition-transform motion-safe:duration-300 group-hover:-rotate-3 group-hover:scale-110 dark:bg-zinc-800">
        <Icon
          className="h-6 w-6 text-[#1C75BC] dark:text-[#6FA8D8]"
          strokeWidth={1.5}
          animateOnView
        />
      </span>

      <p className="mt-5 text-[22px] font-bold leading-tight text-zinc-900 dark:text-zinc-50">
        {service.title}
      </p>

      <ul className="mt-4 flex-1 space-y-2.5 text-sm text-zinc-600 dark:text-zinc-400">
        {service.items.map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1C75BC] dark:bg-[#6FA8D8]" />
            {item}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1C75BC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        Learn More
        <ArrowRight className="h-4 w-4 motion-safe:transition-transform group-hover:translate-x-0.5" animateOnHover animateOnTap />
      </button>
    </div>
  );
}

export function LogOutPage({
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
    <div className="flex h-screen flex-col overflow-y-auto bg-white dark:bg-zinc-950">
      <PublicHeader dark={dark} onToggleTheme={onToggleTheme} onLogIn={onLogIn} />

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-10">
        {/* Hero */}
        <div className="relative flex items-center gap-12 overflow-visible">
          <div className="min-w-0 flex-1 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-3 motion-safe:duration-500">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1C75BC] dark:bg-zinc-900 dark:text-[#6FA8D8]">
              <Sparkles className="h-3.5 w-3.5" animateOnView />
              Cloud platform for modern teams
            </span>

            <h1 className="mt-4 text-[46px] font-bold leading-[1.1] tracking-[-0.025em] text-zinc-900 dark:text-zinc-50">
              Welcome Cloud Plus
            </h1>
            <p className="mt-5 max-w-[460px] text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Unlock the power of the cloud. Streamline your business with secure,
              scalable solutions, and local.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                variant="brand"
                onClick={onLogIn}
                className="h-11 gap-1.5 px-6 text-sm font-medium"
              >
                Get Started
                <ArrowRight className="h-4 w-4" animateOnHover animateOnTap />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/pricing")}
                className="h-11 px-6 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                View Plans
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400"
                >
                  <Icon className="h-4 w-4 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* The GIF's own backdrop is white; the light-blue panel matches
              Figma's hero container and only needs a white swap once the
              theme goes dark. Decorative blobs + a floating stat card
              are purely cosmetic additions around the untouched asset. */}
          <div className="relative hidden shrink-0 md:block motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-3 motion-safe:duration-500">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#35C3D9]/20 blur-3xl motion-safe:animate-float"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-8 -left-8 h-44 w-44 rounded-full bg-[#1C75BC]/15 blur-3xl motion-safe:animate-float [animation-delay:2s]"
            />

            <div className="relative flex h-[340px] w-[340px] items-center justify-center overflow-clip rounded-2xl bg-[#EFF6FF] shadow-[0_20px_48px_rgba(28,117,188,0.16)] dark:bg-white dark:p-3 dark:ring-1 dark:ring-zinc-800">
              <img
                src={heroCloud}
                alt=""
                className="h-full w-full object-contain"
              />
            </div>

            <div className="absolute -bottom-5 -left-6 flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-white px-4 py-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-800">
                <Users className="h-4 w-4 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight text-zinc-900 dark:text-zinc-50">
                  10,000+
                </p>
                <p className="text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
                  Active businesses
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Service cards */}
        <div className="mt-16 grid grid-cols-2 gap-6">
          {LANDING_SERVICES.map((service, i) => (
            <LandingServiceCard key={service.id} service={service} index={i} />
          ))}
        </div>

        {/* CTA banner */}
        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C75BC] to-[#0d3f66] px-10 py-9">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#35C3D9]/25 blur-3xl motion-safe:animate-float"
          />
          <p className="relative text-xl leading-[1.4] text-white">
            See Our Work in Action.
            <br />
            Start Your Creative Journey with Us!
          </p>
          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="relative flex shrink-0 items-center gap-3 rounded-full border border-white/70 py-1.5 pl-6 pr-1.5 text-sm font-bold text-white motion-safe:transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Pricing
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
              <ArrowUpRight className="h-4 w-4 text-[#1C75BC]" animateOnHover animateOnTap />
            </span>
          </button>
        </div>

        <PublicFooter />
      </main>
    </div>
  );
}
