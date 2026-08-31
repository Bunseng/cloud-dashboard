import { forwardRef } from "react";
import type { ChangeEventHandler, CSSProperties, KeyboardEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { ComponentType } from "react";

import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { ChevronsLeft } from "@/components/animate-ui/icons/chevrons-left";
import { ChevronsRight } from "@/components/animate-ui/icons/chevrons-right";
import { Copy } from "@/components/animate-ui/icons/copy";
import { Plus } from "@/components/animate-ui/icons/plus";
import { RefreshCw } from "@/components/animate-ui/icons/refresh-cw";
import { Search } from "@/components/animate-ui/icons/search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

/* ------------------------------------------------------------------ *
 * Brand mark — placeholder for the real CLOUD+ logo SVG
 * ------------------------------------------------------------------ */

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-0.5 select-none">
      <span className="text-[19px] font-bold leading-none tracking-[0.06em] text-[#1C75BC]">
        {compact ? "C" : "CLOUD"}
      </span>
      <Plus
        className="h-3 w-3 shrink-0 self-start text-[#35C3D9]"
        strokeWidth={3}
        animateOnView
      />
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Shared UI atoms — small pieces reused across the panels below, so the
 * same search field / refresh button / copy button / clickable-card
 * logic isn't hand-copied at every call site.
 * ------------------------------------------------------------------ */

export const PILL_TABS_LIST_CLASS =
  "inline-flex h-auto w-auto gap-0 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900";
export const PILL_TAB_TRIGGER_CLASS =
  "rounded-md px-4 py-1.5 text-sm text-zinc-500 data-[state=active]:bg-white data-[state=active]:font-medium data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm dark:text-zinc-400 dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 motion-safe:transition-colors";

// Uncontrolled everywhere it was already used (no value/onChange passed);
// Billing's list is the first caller that filters as you type, so it
// takes those as optional props rather than forking a second component.
export function SearchField({
  value,
  onChange,
  placeholder = "Search",
}: {
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <Search className="h-4 w-4 text-zinc-400" animateOnView />
      </div>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="pl-9"
      />
    </div>
  );
}

export function RefreshIconButton() {
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Refresh"
      className="h-9 w-9 shrink-0 text-zinc-600 dark:text-zinc-300"
    >
      <RefreshCw className="h-4 w-4" animateOnHover animateOnTap />
    </Button>
  );
}

export function BillingDashboardButton({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      onClick={() => navigate("/billing")}
      className={
        "shrink-0 gap-1 font-medium text-zinc-700 dark:text-zinc-300 " +
        (compact ? "h-8 text-xs" : "h-9 text-sm")
      }
    >
      Billing Dashboard
      <ChevronRight
        className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
        animateOnHover
        animateOnTap
      />
    </Button>
  );
}

export function CopyIconButton({
  value,
  label,
  className = "",
  iconClassName = "h-4 w-4",
}: {
  value: string;
  label: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(value)}
      aria-label={`Copy ${label}`}
      className={
        "shrink-0 text-zinc-400 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:hover:text-zinc-300 " +
        className
      }
    >
      <Copy className={iconClassName} animateOnHover animateOnTap />
    </button>
  );
}

/* Makes a <div> behave like a button only when `onClick` is provided —
   used by any card that's sometimes interactive, sometimes just a
   display surface (ServicePlanCard, ServiceCard). */
export const ClickableSurface = forwardRef<
  HTMLDivElement,
  {
    onClick?: () => void;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
  }
>(function ClickableSurface({ onClick, className, style, children }, ref) {
  const clickable = Boolean(onClick);
  return (
    <div
      ref={ref}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={className}
      style={style}
    >
      {children}
    </div>
  );
});

/* ------------------------------------------------------------------ *
 * Status badge — shared by Stack/Database/Service tables and rows.
 * ------------------------------------------------------------------ */

export const STATUS_TONES = {
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  blue: "bg-[#EFF6FF] text-[#1C75BC] dark:bg-zinc-800 dark:text-[#6FA8D8]",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  red: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function StatusBadge({
  label,
  tone = "zinc",
}: {
  label: ReactNode;
  tone?: keyof typeof STATUS_TONES | (string & {});
}) {
  return (
    <Badge
      variant="outline"
      className={
        "gap-1.5 border-transparent font-medium " +
        STATUS_TONES[tone as keyof typeof STATUS_TONES]
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

export const PAGINATION_CONTROLS: {
  Icon: ComponentType<{
    className?: string;
    animateOnHover?: boolean;
    animateOnTap?: boolean;
  }>;
  label: string;
}[] = [
  { Icon: ChevronsLeft, label: "First page" },
  { Icon: ChevronLeft, label: "Previous page" },
  { Icon: ChevronRight, label: "Next page" },
  { Icon: ChevronsRight, label: "Last page" },
];

/* One label/value pair in the summary strip. */
export function StatTile({ label, children }: { label: ReactNode; children?: ReactNode }) {
  return (
    <div>
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{label}</p>
      <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {children}
      </div>
    </div>
  );
}

/* A copyable connection value. Long strings truncate rather than wrap. */
export function ConnectionRow({
  label,
  value,
  copyable = true,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="truncate font-mono text-[13px] text-zinc-900 dark:text-zinc-100">
          {value}
        </p>
      </div>
      {copyable && (
        <CopyIconButton value={value} label={label} iconClassName="h-3.5 w-3.5" />
      )}
    </div>
  );
}

/* "3 GB of 10 GB" reads faster than a donut when the point is headroom. */
export function UsageBar({
  label,
  used,
  total,
  unit,
}: {
  label: string;
  used: number;
  total: number;
  unit: string;
}) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {used} {unit}
          </span>{" "}
          of {total} {unit}
        </p>
      </div>
      <Progress value={pct} className="mt-2 rounded-full" indicatorClassName="rounded-full" />
    </div>
  );
}

export function RadialGauge({
  label,
  value,
  max,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(1, value / max) : 0;

  return (
    <div className="flex flex-col items-center rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{label}</p>
      <div className="relative mt-3 h-24 w-24 shrink-0">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="8"
            className="stroke-zinc-100 dark:stroke-zinc-800"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            className="stroke-[#1C75BC] motion-safe:transition-[stroke-dashoffset]"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#1C75BC]">
          {value}
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        /{max} {unit}
      </p>
    </div>
  );
}

export function CredentialField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="truncate font-mono text-[13px] text-zinc-900 dark:text-zinc-100">
          {value}
        </p>
      </div>
      <CopyIconButton
        value={value}
        label={label}
        className="rounded-md p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900"
      />
    </div>
  );
}
