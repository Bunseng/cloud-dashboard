import type { ComponentType, ReactNode } from "react";

import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ *
 * First User mode's shared empty-state card — swapped in for a
 * Feature's normal subscription/service content whenever First User
 * mode is on, so every "no subscriptions yet" screen in the app reads
 * the same way instead of each page inventing its own copy/layout.
 * ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number; animateOnView?: boolean }>;
  title: string;
  description: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 px-6 py-16 text-center dark:border-zinc-800">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFF6FF] dark:bg-zinc-900">
        <Icon className="h-6 w-6 text-[#1C75BC] dark:text-[#6FA8D8]" strokeWidth={1.5} animateOnView />
      </span>
      <p className="mt-4 text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="brand" onClick={onAction} className="mt-5 h-9 px-4 text-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
