import { useEffect, useState, type FormEvent } from "react";

import { CircleCheck } from "@/components/animate-ui/icons/circle-check";
import { Mail } from "@/components/animate-ui/icons/mail";
import { Phone } from "@/components/animate-ui/icons/phone";
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

/* ------------------------------------------------------------------ *
 * Phone + Email verification — each field gets its own "Verify" button
 * on the Profile page and its own instance of this dialog, so verifying
 * one never re-asks for the other: once phone is verified, only
 * Email's own button ever shows up (FirstUserContext tracks the two
 * independently), and vice versa.
 *
 * Two steps per field — confirm the value, then enter the one-time
 * code sent to it. There's no real SMS/email backend here, so the code
 * is generated client-side; rather than making the tester transcribe
 * it by hand, it's offered as a tap-to-fill chip next to a real 6-box
 * OTP input that auto-submits the instant all 6 digits are in.
 * ------------------------------------------------------------------ */

const FIELD_META = {
  phone: {
    icon: Phone,
    label: "Phone Number",
    placeholder: "012 345 678",
    pattern: /^\+?[0-9()\s-]{8,16}$/,
    invalidMessage: "Enter a valid phone number.",
    detailsTitle: "Verify your phone number",
    detailsDescription: "Confirm the number to reach you at — we'll send a one-time code to it.",
    otpTitle: "Enter phone verification code",
    changeLabel: "Change Number",
    verifyLabel: "Verify Phone",
    channel: "SMS",
  },
  email: {
    icon: Mail,
    label: "Email",
    placeholder: "you@gmail.com",
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    invalidMessage: "Enter a valid email address.",
    detailsTitle: "Verify your email",
    detailsDescription: "Confirm the email to reach you at — we'll send a one-time code to it.",
    otpTitle: "Enter email verification code",
    changeLabel: "Change Email",
    verifyLabel: "Verify Email",
    channel: "email",
  },
} as const;

export type VerifyField = keyof typeof FIELD_META;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function FieldStatus({ valid }: { valid: boolean }) {
  if (!valid) return null;
  return <CircleCheck className="h-4 w-4 shrink-0 text-emerald-500" animateOnView />;
}

function SuccessFlash({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
        <CircleCheck className="h-7 w-7 text-emerald-500" animate />
      </span>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
    </div>
  );
}

type Step = "details" | "otp" | "success";

export function VerifyContactDialog({
  field,
  open,
  onOpenChange,
  onVerified,
}: {
  field: VerifyField;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: (value: string) => void;
}) {
  const meta = FIELD_META[field];
  const Icon = meta.icon;

  const [step, setStep] = useState<Step>("details");
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [code, setCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [otpError, setOtpError] = useState(false);

  const valid = meta.pattern.test(value.trim());

  function reset() {
    setStep("details");
    setValue("");
    setTouched(false);
    setCode("");
    setCodeInput("");
    setOtpError(false);
  }

  function sendCode() {
    setCode(generateCode());
    setCodeInput("");
    setOtpError(false);
  }

  function submitDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    // Mock "sending" a code — generated here and shown on the OTP step
    // itself (as a tap-to-fill chip), since there's no real backend.
    sendCode();
    setStep("otp");
  }

  // Auto-submits the instant 6 digits are in — no separate "Verify"
  // click needed on the happy path; the button stays as a manual
  // fallback (e.g. after fixing a wrong code).
  useEffect(() => {
    if (step !== "otp" || codeInput.length !== 6) return;
    if (codeInput === code) {
      setOtpError(false);
      setStep("success");
    } else {
      setOtpError(true);
    }
  }, [codeInput, code, step]);

  useEffect(() => {
    if (step !== "success") return;
    const t = setTimeout(() => onVerified(value.trim()), 700);
    return () => clearTimeout(t);
  }, [step, value, onVerified]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] dark:bg-zinc-900">
            <Icon className="h-5 w-5 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
          </div>
          <DialogTitle className="mt-3">
            {step === "details" && meta.detailsTitle}
            {step === "otp" && meta.otpTitle}
            {step === "success" && `${meta.label} verified`}
          </DialogTitle>
          {step === "details" && <DialogDescription>{meta.detailsDescription}</DialogDescription>}
          {step === "otp" && (
            <DialogDescription>
              Enter the 6-digit code we sent to {value}.
            </DialogDescription>
          )}
        </DialogHeader>

        {step === "details" && (
          <form onSubmit={submitDetails} className="space-y-4">
            <div>
              <Label htmlFor={`verify-${field}`} className="text-zinc-900 dark:text-zinc-100">
                {meta.label}
                <span className="ml-0.5 text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id={`verify-${field}`}
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

        {step === "otp" && (
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
                onClick={() => setStep("details")}
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

        {step === "success" && <SuccessFlash label={`${meta.label} confirmed.`} />}
      </DialogContent>
    </Dialog>
  );
}
