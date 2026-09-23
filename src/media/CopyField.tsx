import { Check, CircleAlert, Copy } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Read-only endpoint with a copy affordance — copied over from
 * media-cloudplus's CopyField, using dashboard-ui's own Input/Button/Label
 * (which already carry the same shadcn semantic tokens).
 */
export function CopyField({
  label,
  value,
  id,
  hint,
  error,
  action,
  className,
}: {
  label?: string;
  value: string;
  id: string;
  hint?: string;
  /** Renders an alert row under the field — used for expired signed links. */
  error?: string;
  /** Small control shown on the label row, e.g. a state preview toggle. */
  action?: ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1500);
      return;
    } catch {
      // Clipboard blocked — select the value so it can be copied by hand.
      inputRef.current?.select();
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      {(label || action) && (
        <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
          {label ? <Label htmlFor={id}>{label}</Label> : <span />}
          {action}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          id={id}
          readOnly
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 font-mono text-[13px] text-muted-foreground md:text-[13px]"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={copy}
          aria-label={copied ? "Copied" : `Copy ${label ?? "endpoint"}`}
          className="shrink-0"
        >
          {copied ? (
            <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="size-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive"
        >
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
          <span className="min-w-0">{error}</span>
        </p>
      )}
      {hint && !error && <p className="text-[13px] text-muted-foreground">{hint}</p>}
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </div>
  );
}
