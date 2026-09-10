import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ *
 * A 6-box one-time-code input — the standard modern OTP pattern:
 * type a digit and focus jumps to the next box, Backspace on an empty
 * box jumps back, arrow keys move between boxes, and pasting a full
 * code (from a real SMS/email, or this app's own demo chip) fills
 * every box at once instead of needing six separate keystrokes.
 * ------------------------------------------------------------------ */

export function OtpInput({
  length = 6,
  value,
  onChange,
  autoFocus,
  disabled,
}: {
  length?: number;
  value: string;
  onChange: (next: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function fillFrom(start: number, text: string) {
    const clean = text.replace(/\D/g, "");
    if (!clean) return;
    const next = digits.slice();
    let idx = start;
    for (const ch of clean) {
      if (idx >= length) break;
      next[idx] = ch;
      idx++;
    }
    onChange(next.join(""));
    refs.current[Math.min(idx, length - 1)]?.focus();
  }

  function handleChange(i: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (clean.length > 1) {
      fillFrom(i, clean);
      return;
    }
    const next = digits.slice();
    next[i] = clean;
    onChange(next.join(""));
    if (clean && i < length - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  return (
    <div className="flex items-center gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => {
            e.preventDefault();
            fillFrom(i, e.clipboardData.getData("text"));
          }}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1} of ${length}`}
          className="h-11 w-10 rounded-lg border border-zinc-200 text-center text-lg font-semibold text-zinc-900 outline-none motion-safe:transition-colors focus:border-[#1C75BC] focus:ring-2 focus:ring-[#1C75BC]/30 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      ))}
    </div>
  );
}
