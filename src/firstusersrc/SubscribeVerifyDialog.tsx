import { useEffect, useRef, useState, type FormEvent } from "react";

import { Check } from "@/components/animate-ui/icons/check";
import { RotateCw } from "@/components/animate-ui/icons/rotate-cw";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { OtpInput } from "./OtpInput";
import {
  FIELD_META,
  FieldStatus,
  SuccessFlash,
  generateCode,
  type VerifyField,
} from "./VerifyContactDialog";

/* ------------------------------------------------------------------ *
 * The First-User "verify before subscribing" flow — one Dialog
 * instance for the whole thing (never closes/reopens between fields),
 * stepping through whichever of Phone/Email still need it. A 2-segment
 * tracker up top only shows when both are pending; verifying just one
 * (the other's already confirmed) skips the stepper entirely and reads
 * like the same single-field dialog Profile's own "Verify" uses.
 *
 * `fields` is decided once, when the flow starts (useVerifyBeforeSubscribe's
 * guard()), and never changes for the life of one flow — only this
 * component's own `index` advances internally, so there's no prop
 * identity change to accidentally reset or double-fire state on (the
 * bug the old two-separate-dialogs version had).
 * ------------------------------------------------------------------ */

type Phase = "details" | "otp" | "success";

function StepProgress({ fields, index }: { fields: VerifyField[]; index: number }) {
  return (
    <div className="flex items-center gap-2">
      {fields.map((field, i) => {
        const meta = FIELD_META[field];
        const isDone = i < index;
        const isCurrent = i === index;
        return (
          <div key={field} className="flex flex-1 items-center gap-2">
            <div
              className={
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold motion-safe:transition-colors " +
                (isDone
                  ? "bg-emerald-500 text-white"
                  : isCurrent
                  ? "bg-[#1C75BC] text-white"
                  : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500")
              }
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={
                "text-xs font-medium " +
                (isCurrent
                  ? "text-zinc-900 dark:text-zinc-100"
                  : isDone
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-400 dark:text-zinc-500")
              }
            >
              {meta.label}
            </span>
            {i < fields.length - 1 && (
              <span
                className={
                  "h-px flex-1 " + (isDone ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800")
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SubscribeVerifyDialog({
  fields,
  open,
  onOpenChange,
  onFieldVerified,
  onAllVerified,
}: {
  fields: VerifyField[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFieldVerified: (field: VerifyField, value: string) => void;
  onAllVerified: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [code, setCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [phase, setPhase] = useState<Phase>("details");

  const field = fields[index] ?? fields[0];
  const meta = FIELD_META[field];
  const Icon = meta.icon;
  const valid = meta.pattern.test(value.trim());

  // Per-field state resets whenever the step advances (including the
  // very first render) — driven by `index`, not by remounting the
  // dialog, so the Dialog root itself never closes/reopens.
  useEffect(() => {
    setValue("");
    setTouched(false);
    setCode("");
    setCodeInput("");
    setOtpError(false);
    setPhase("details");
  }, [index]);

  // The instant-of-success values (which field, what value, whether
  // more remain) are captured in a ref updated every render, so the
  // timer effect below only needs `phase` as a dependency — it can't
  // double-fire just because an unrelated prop/callback identity
  // changed, which is exactly what caused the old bug.
  const onSuccessRef = useRef<() => void>(() => {});
  useEffect(() => {
    onSuccessRef.current = () => {
      onFieldVerified(field, value.trim());
      if (index + 1 < fields.length) {
        setIndex(index + 1);
      } else {
        onAllVerified();
      }
    };
  });

  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => onSuccessRef.current(), 700);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "otp" || codeInput.length !== 6) return;
    if (codeInput === code) {
      setOtpError(false);
      setPhase("success");
    } else {
      setOtpError(true);
    }
  }, [codeInput, code, phase]);

  function sendCode() {
    setCode(generateCode());
    setCodeInput("");
    setOtpError(false);
  }

  function submitDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    sendCode();
    setPhase("otp");
  }

  // Reset to a clean slate whenever the dialog is dismissed early —
  // next time it opens (a fresh guard() call) it starts at step 0.
  function handleOpenChange(next: boolean) {
    if (!next) setIndex(0);
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          {fields.length > 1 && <StepProgress fields={fields} index={index} />}
          <div className={"flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] dark:bg-zinc-900" + (fields.length > 1 ? " mt-3" : "")}>
            <Icon className="h-5 w-5 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
          </div>
          <DialogTitle className="mt-3">
            {phase === "details" && meta.detailsTitle}
            {phase === "otp" && meta.otpTitle}
            {phase === "success" && `${meta.label} verified`}
          </DialogTitle>
          {phase === "details" && <DialogDescription>{meta.detailsDescription}</DialogDescription>}
          {phase === "otp" && (
            <DialogDescription>Enter the 6-digit code we sent to {value}.</DialogDescription>
          )}
        </DialogHeader>

        {phase === "details" && (
          <form onSubmit={submitDetails} className="space-y-4">
            <div>
              <Label htmlFor={`subscribe-verify-${field}`} className="text-zinc-900 dark:text-zinc-100">
                {meta.label}
                <span className="ml-0.5 text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id={`subscribe-verify-${field}`}
                  autoFocus
                  type={field === "email" ? "email" : "text"}
                  inputMode={field === "email" ? "email" : "tel"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={meta.placeholder}
                  className="pl-9 pr-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FieldStatus valid={valid} />
                </span>
              </div>
              {touched && !valid && (
                <p className="mt-1.5 text-xs text-red-500">{meta.invalidMessage}</p>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 text-sm"
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" className="h-9 text-sm">
                Send Code
              </Button>
            </DialogFooter>
          </form>
        )}

        {phase === "otp" && (
          <div className="space-y-4">
            <OtpInput value={codeInput} onChange={setCodeInput} autoFocus />
            {otpError && (
              <p className="text-xs text-red-500">That code doesn't match — try again.</p>
            )}
            <button
              type="button"
              onClick={() => setCodeInput(code)}
              className="flex w-full items-center justify-between rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-left text-xs text-zinc-500 motion-safe:transition-colors hover:border-[#1C75BC]/40 hover:bg-[#EFF6FF] dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              <span>No {meta.channel} in this demo — tap to autofill</span>
              <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                {code}
              </span>
            </button>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPhase("details")}
                className="h-9 gap-1 text-sm text-zinc-600 dark:text-zinc-400"
              >
                {meta.changeLabel}
              </Button>
              <button
                type="button"
                onClick={sendCode}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-[#1C75BC] hover:bg-zinc-100 dark:text-[#6FA8D8] dark:hover:bg-zinc-900"
              >
                <RotateCw className="h-3.5 w-3.5" animateOnHover animateOnTap />
                Resend
              </button>
            </DialogFooter>
          </div>
        )}

        {phase === "success" && (
          <SuccessFlash
            label={
              index + 1 < fields.length
                ? `${meta.label} confirmed. Next up: ${FIELD_META[fields[index + 1]].label}.`
                : `${meta.label} confirmed.`
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
