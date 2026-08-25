import type { CSSProperties, ReactNode } from "react";
import {
  AppWindow,
  ArrowRight,
  Box,
  Database,
  ImagePlay,
  Rocket,
  Search,
  Server,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { ClickableSurface } from "../components/atoms";
import { FEATURES } from "../data/nav";
import { BILLING_RECORDS, PLACEHOLDER_SUBSCRIPTION_COUNT } from "../data/billing";

/* ------------------------------------------------------------------ *
 * Home — the service catalog shown for the "Home" main-nav item. A
 * gradient hero sets the tone, a quick-stats strip gives an
 * at-a-glance account summary, then services are grouped into
 * sections so it reads as "here's what's live" vs. "here's what's
 * coming" at a glance.
 *
 * Every number shown here is deliberately something NOT already on
 * screen elsewhere: the Topbar already carries the KHR/BG balance
 * pills and the service cards below already show which 4 services
 * are live, so neither is repeated in the hero or the stats strip.
 * Illustrations are lucide icon placeholders standing in for the
 * real exported artwork; swap them for the actual assets when
 * available.
 * ------------------------------------------------------------------ */

interface ServiceCardData {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  span: number;
  comingSoon?: boolean;
}

/* These map to a real Dashboard tab, so their cards are clickable. */
const CLOUD_SERVICE_CARDS: ServiceCardData[] = [
  {
    id: "storage",
    icon: Box,
    title: "Storage",
    description: "Secure, scalable object storage for your data. Build for Cloud.",
    span: 1,
  },
  {
    id: "runapp",
    icon: Rocket,
    title: "RunApp",
    description: "Deploy your apps faster with our managed Docker hosting service.",
    span: 1,
  },
  {
    id: "database",
    icon: Database,
    title: "Database",
    description: "Focus on your applications, not your database. Get started with managed databases in minutes.",
    span: 1,
  },
  {
    id: "vps",
    icon: Server,
    title: "VPS",
    description: "Full root-access virtual servers, provisioned in seconds.",
    span: 1,
  },
];

/* No destination yet — flagged with a "Coming soon" badge and left
   non-interactive, instead of silently doing nothing when clicked. */
const MEDIA_CONTENT_CARDS: ServiceCardData[] = [
  {
    id: "media",
    icon: ImagePlay,
    title: "Media Service",
    description:
      "A complete media solution for live streaming, video delivery, and transcoding. Deliver high-quality, low-latency video experiences with adaptive streaming and efficient processing across all devices.",
    span: 2,
    comingSoon: true,
  },
  {
    id: "cms",
    icon: AppWindow,
    title: "CMS",
    description: "Manage pages and content with a flexible, headless CMS built for speed.",
    span: 1,
    comingSoon: true,
  },
];

/* One-line "what's going on with this service right now" — shown in a
   HoverCard on hover so a card stays scannable at a glance but still
   answers "am I subscribed to this?" without a click. Storage is a
   single subscription (read straight off Billing); Run App/Database/VPS
   allow several side by side, so it's a count instead. */
function getQuickStat(id: string): { label: string; value: string } {
  const feature = FEATURES.find((f) => f.id === id);
  if (feature?.multiSubscription) {
    return {
      label: "Active subscriptions",
      value: `${PLACEHOLDER_SUBSCRIPTION_COUNT} running`,
    };
  }
  const record = BILLING_RECORDS.find((r) => r.category === id);
  if (record) {
    return { label: "Current plan", value: `${record.plan} · ${record.status.label}` };
  }
  return { label: "Status", value: "Not subscribed" };
}

function stagger(index: number): CSSProperties {
  return { animationDelay: `${index * 70}ms` };
}

function HomeHero({ onOpenPlanning }: { onOpenPlanning: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C75BC] via-[#155f96] to-[#0d3f66] p-7 shadow-lg shadow-[#1C75BC]/20 sm:p-8">
      {/* Decorative floating blobs — purely cosmetic, ignored by a11y tree. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-14 -top-16 h-64 w-64 rounded-full bg-[#35C3D9]/30 blur-3xl motion-safe:animate-float"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-white/10 blur-3xl motion-safe:animate-float [animation-delay:2s]"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-3 motion-safe:duration-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome back
          </span>
          <h1 className="mt-3 text-[28px] font-bold leading-[32px] tracking-[-0.6px] text-white sm:text-[30px]">
            What are we building today?
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/75">
            Jump straight into a service below, or search for something specific.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-3 motion-safe:duration-500">
          <div className="relative w-[220px] sm:w-[260px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
            <Input
              placeholder="Search"
              className="h-10 border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/60 focus-visible:ring-white/40"
            />
          </div>
          <Button
            onClick={onOpenPlanning}
            className="h-10 shrink-0 bg-white px-4 text-sm font-medium text-[#1C75BC] hover:bg-white/90"
          >
            All Plans
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  sub,
  index,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: ReactNode;
  index: number;
}) {
  return (
    <div
      style={stagger(index)}
      className="flex items-center gap-3.5 rounded-xl border border-[#e5e7eb] p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both dark:border-zinc-800"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-800">
        <Icon className="h-[18px] w-[18px] text-[#1C75BC] dark:text-[#6FA8D8]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] text-[#71717a] dark:text-zinc-400">{label}</p>
        <p className="truncate text-[15px] font-bold text-[#17171c] dark:text-zinc-50">
          {value}
          {sub && <span className="ml-1.5 text-[13px] font-medium text-[#71717a] dark:text-zinc-400">{sub}</span>}
        </p>
      </div>
    </div>
  );
}

function ServiceCard({
  index,
  span,
  icon,
  title,
  description,
  comingSoon,
  onClick,
}: {
  index: number;
  span: number;
  icon: LucideIcon;
  title: string;
  description: string;
  comingSoon?: boolean;
  onClick?: () => void;
}) {
  const Icon = icon;
  const clickable = Boolean(onClick);
  const quickStat = clickable ? getQuickStat(title.toLowerCase()) : null;

  const card = (
    <ClickableSurface
      onClick={onClick}
      className={
        "group relative flex flex-col overflow-hidden rounded-xl border border-[#e5e7eb] p-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-safe:fill-mode-both dark:border-zinc-800 " +
        (span === 2 ? "col-span-2 " : "col-span-1 ") +
        (clickable
          ? "cursor-pointer motion-safe:transition-all hover:-translate-y-1 hover:border-[#1C75BC]/40 hover:shadow-[0_8px_24px_rgba(28,117,188,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40"
          : "")
      }
      style={stagger(index)}
    >
      {/* Gradient top bar sweeps in on hover instead of sitting there
          statically — a small cue that the whole card is a button. */}
      {clickable && (
        <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-[#1C75BC] to-[#35C3D9] motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-x-100" />
      )}

      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] motion-safe:transition-transform motion-safe:duration-300 group-hover:-rotate-3 group-hover:scale-110 dark:bg-zinc-800">
          <Icon className="h-[22px] w-[22px] text-[#1C75BC] dark:text-[#6FA8D8]" strokeWidth={1.5} />
        </span>
        {comingSoon && (
          <span className="shrink-0 rounded-full bg-[#f3f3f5] px-2.5 py-[3px] text-[11px] font-medium text-[#71717a] dark:bg-zinc-800 dark:text-zinc-400">
            Coming soon
          </span>
        )}
      </div>

      <p className="mt-4 text-[17px] font-bold text-[#17171c] dark:text-zinc-50">{title}</p>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[#70707a] dark:text-zinc-400">
        {description}
      </p>

      {clickable && (
        <span className="mt-5 flex items-center gap-1.5 text-[13px] font-medium text-[#1C75BC] dark:text-[#6FA8D8]">
          Open
          <ArrowRight className="h-3.5 w-3.5 motion-safe:transition-transform group-hover:translate-x-0.5" />
        </span>
      )}
    </ClickableSurface>
  );

  if (!quickStat) return card;

  return (
    <HoverCard openDelay={150} closeDelay={80}>
      <HoverCardTrigger asChild>{card}</HoverCardTrigger>
      <HoverCardContent className="w-56" side="top">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{quickStat.label}</p>
        <p className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {quickStat.value}
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}

function HomeSection({
  title,
  description,
  cards,
  startIndex,
  onOpenService,
}: {
  title: string;
  description: string;
  cards: ServiceCardData[];
  startIndex: number;
  onOpenService: (id: string) => void;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline gap-3">
        <h2 className="text-[15px] font-bold text-[#1b1b1d] dark:text-zinc-50">{title}</h2>
        <span className="h-px flex-1 bg-[#e5e5e7] dark:bg-zinc-800" />
      </div>
      <p className="mt-1.5 text-sm text-[#71717a] dark:text-zinc-400">{description}</p>

      <div className="mt-5 grid grid-cols-3 items-stretch gap-5">
        {cards.map((card, i) => (
          <ServiceCard
            key={card.id}
            index={startIndex + i}
            span={card.span}
            icon={card.icon}
            title={card.title}
            description={card.description}
            comingSoon={card.comingSoon}
            onClick={card.comingSoon ? undefined : () => onOpenService(card.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function HomePage({
  onOpenService,
  onOpenPlanning,
}: {
  onOpenService: (id: string) => void;
  onOpenPlanning: () => void;
}) {
  const activeSubscriptions =
    FEATURES.filter((f) => f.multiSubscription).length * PLACEHOLDER_SUBSCRIPTION_COUNT +
    BILLING_RECORDS.filter((r) => r.category === "storage" && r.status.label === "Active").length;

  // Neither figure appears anywhere else on Home — Billing is the only
  // other place spend shows up, and this page never lists it.
  const activeRecords = BILLING_RECORDS.filter((r) => r.status.label === "Active");
  const spendKHR = activeRecords
    .filter((r) => r.currency === "KHR")
    .reduce((sum, r) => sum + r.amount, 0);
  const spendBG = activeRecords
    .filter((r) => r.currency === "BG")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <HomeHero onOpenPlanning={onOpenPlanning} />

      <div className="mt-6 grid grid-cols-2 gap-4">
        <QuickStat
          icon={Sparkles}
          label="Active Subscriptions"
          value={`${activeSubscriptions} running`}
          index={0}
        />
        <QuickStat
          icon={Wallet}
          label="This Month's Spend"
          value={`${spendKHR.toLocaleString()} KHR`}
          sub={spendBG > 0 ? `+ ${spendBG.toLocaleString()} BG` : undefined}
          index={1}
        />
      </div>

      <HomeSection
        title="Cloud Service"
        description="Storage, compute, and managed databases for your infrastructure."
        cards={CLOUD_SERVICE_CARDS}
        startIndex={2}
        onOpenService={onOpenService}
      />
      <HomeSection
        title="Media & Content"
        description="Streaming, delivery, and content tools."
        cards={MEDIA_CONTENT_CARDS}
        startIndex={2 + CLOUD_SERVICE_CARDS.length}
        onOpenService={onOpenService}
      />
    </div>
  );
}
