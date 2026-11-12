import type { ReactNode } from "react";

/* Shared between VPS Monitoring (full dashboard) and the Instance
   Detail Overview tab (just the hostname/uptime stat panel) — kept in
   one place so both read the exact same bar/stat styling instead of
   two hand-copied versions drifting apart. */

export const BLUE = "#3a86d1";
export const OLIVE = "#c3d61f";
export const TEAL = "#20a4a0";
export const EMERALD = "#10b981";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* Random walk — each tick nudges the value by a small delta instead of
   jumping to a fresh random number, so it reads as a real fluctuating
   load rather than flickering noise. */
export function drift(value: number, delta: number, min: number, max: number): number {
  return clamp(value + (Math.random() * 2 - 1) * delta, min, max);
}

export function MonitorPanel({
  title,
  legend,
  children,
}: {
  title: string;
  legend?: { label: string; color: string }[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
        <p className="truncate text-[13px] font-semibold text-[#1C75BC] dark:text-[#6FA8D8]">{title}</p>
        {legend && (
          <div className="flex shrink-0 items-center gap-3">
            {legend.map((l) => (
              <span
                key={l.label}
                className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function BarStatRow({
  label,
  valueText,
  pct,
  color,
}: {
  label: string;
  valueText: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="pb-3">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className="tabular-nums text-zinc-900 dark:text-zinc-100">{valueText}</span>
      </div>
      <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full motion-safe:transition-[width]"
          style={{ width: `${clamp(pct, 0, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function PlainStatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 pb-3 text-[13px]">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="tabular-nums text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}
