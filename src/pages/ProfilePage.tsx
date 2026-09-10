import { useState, type CSSProperties } from "react";

import { BadgeCheck } from "@/components/animate-ui/icons/badge-check";
import { Building2 } from "@/components/animate-ui/icons/building-2";
import { Calendar } from "@/components/animate-ui/icons/calendar";
import { CircleCheck } from "@/components/animate-ui/icons/circle-check";
import { Mail } from "@/components/animate-ui/icons/mail";
import { Phone } from "@/components/animate-ui/icons/phone";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { UserRound } from "@/components/animate-ui/icons/user-round";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { useFirstUser } from "../firstusersrc/FirstUserContext";
import { VerifyContactDialog, type VerifyField } from "../firstusersrc/VerifyContactDialog";

/* ------------------------------------------------------------------ *
 * Profile — the account's name plus its two contact points, each with
 * its own independent verification, plus Password & Security and
 * Personal Details. The default (non-First-User) account is this
 * app's one seeded identity; a First User account instead verifies
 * phone and email one at a time right here — once one is verified,
 * only the other still needs it, never asking to redo one that's
 * already confirmed.
 *
 * Every card enters with the same staggered fade/slide-up used on Home
 * and Log Out, so the page reads as one deliberate composition instead
 * of a plain settings dump.
 * ------------------------------------------------------------------ */

const DEFAULT_ACCOUNT = {
  name: "Cloud+ User",
  email: "cloudplus@sabay.com",
  phone: "+855 12 345 678",
};

const DEFAULT_PERSONAL = {
  company: "No",
  familyName: "Sorn",
  givenName: "Bunseng",
  dob: "1997-12-29",
  gender: "Male",
};

function stagger(index: number): CSSProperties {
  return { animationDelay: `${index * 80}ms` };
}

function ContactRow({
  icon: Icon,
  label,
  value,
  verified,
  onVerify,
}: {
  icon: typeof Mail;
  label: string;
  value: string | null;
  verified: boolean;
  onVerify?: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 motion-safe:transition-colors hover:border-[#1C75BC]/30 dark:border-zinc-800">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-110 dark:bg-zinc-900">
        <Icon className="h-4 w-4 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {value ?? <span className="text-zinc-400 dark:text-zinc-500">Not added yet</span>}
        </p>
      </div>
      {verified ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <BadgeCheck className="h-3.5 w-3.5" animateOnView />
          Verified
        </span>
      ) : (
        onVerify && (
          <Button
            variant="brand"
            onClick={onVerify}
            className="h-8 shrink-0 gap-1.5 px-3 text-xs"
          >
            <ShieldCheck className="h-3.5 w-3.5" animateOnView />
            Verify
          </Button>
        )
      )}
    </div>
  );
}

/* One "label — value — action link" row — Password is the only field
   left in this shape now that Phone/Email/Security Password moved out
   (Phone/Email already live in Contact Information above). */
function SecurityRow({
  label,
  value,
  actionLabel,
  onAction,
  helper,
}: {
  label: string;
  value?: string | null;
  actionLabel: string;
  onAction?: () => void;
  helper: string;
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
        >
          {actionLabel}
        </button>
      </div>
      {value && <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{value}</p>}
      <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{helper}</p>
    </div>
  );
}

/* A labeled input with a small leading icon — the shape every Personal
   Details field shares, so the form reads a little richer than plain
   stacked boxes. */
function DetailField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <Icon className="h-3.5 w-3.5" animateOnView />
        {label}
      </Label>
      <div className="relative mt-1.5">{children}</div>
    </div>
  );
}

export function ProfilePage() {
  const { isFirstUser, profile, verifyPhone, verifyEmail } = useFirstUser();
  const [verifyField, setVerifyField] = useState<VerifyField | null>(null);
  const [recoverByPhone, setRecoverByPhone] = useState(true);
  const [saved, setSaved] = useState(false);

  const name = isFirstUser ? "New User" : DEFAULT_ACCOUNT.name;
  const phoneVerified = isFirstUser ? profile.phone.verified : true;
  const emailVerified = isFirstUser ? profile.email.verified : true;
  const phoneValue = isFirstUser ? (profile.phone.verified ? profile.phone.value : null) : DEFAULT_ACCOUNT.phone;
  const emailValue = isFirstUser ? (profile.email.verified ? profile.email.value : null) : DEFAULT_ACCOUNT.email;
  const allVerified = phoneVerified && emailVerified;

  const [personal, setPersonal] = useState(
    isFirstUser
      ? { company: "", familyName: "", givenName: "", dob: "", gender: "", email: emailValue ?? "" }
      : { ...DEFAULT_PERSONAL, email: emailValue ?? "" }
  );

  function setPersonalField<K extends keyof typeof personal>(key: K, value: (typeof personal)[K]) {
    setPersonal((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Profile
      </h1>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        Your account's contact information.
      </p>

      <div className="mt-6 flex items-center gap-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <Avatar className="h-16 w-16 ring-2 ring-[#EFF6FF] dark:ring-zinc-900">
          <AvatarFallback className="bg-zinc-200 text-lg font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{name}</p>
            {allVerified && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <BadgeCheck className="h-3 w-3" />
                Verified account
              </span>
            )}
          </div>
          {isFirstUser && !allVerified && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Verify your phone and email to add them here.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 items-start gap-5">
        <div className="space-y-5">
          <Card
            style={stagger(0)}
            className="space-y-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both"
          >
            <CardTitle>Contact Information</CardTitle>
            <div className="space-y-2">
              <ContactRow
                icon={Phone}
                label="Phone Number"
                value={phoneValue}
                verified={phoneVerified}
                onVerify={isFirstUser ? () => setVerifyField("phone") : undefined}
              />
              <ContactRow
                icon={Mail}
                label="Email"
                value={emailValue}
                verified={emailVerified}
                onVerify={isFirstUser ? () => setVerifyField("email") : undefined}
              />
            </div>
          </Card>

          {/* Password & Security — just the account password itself now;
              Phone/Email verification lives in Contact Information
              above, and Security Password isn't modeled in this demo. */}
          <Card
            style={stagger(1)}
            className="divide-y divide-zinc-100 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both dark:divide-zinc-800"
          >
            <div className="pb-1">
              <CardTitle>Password &amp; Security</CardTitle>
            </div>
            <SecurityRow
              label="Password"
              value={isFirstUser ? undefined : "••••••••"}
              actionLabel="Change"
              helper="We recommend using a secure password that you don't use anywhere else."
            />

            <div className="pt-4">
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Password Recovery Options
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Switch checked={recoverByPhone} onCheckedChange={setRecoverByPhone} aria-label="Recover by phone number" />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Phone Number
                  </span>
                </div>
              </div>
              <p className="mt-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                Allow using phone number to recover login password.
              </p>
            </div>
          </Card>
        </div>

        {/* Personal Details — every field is editable straight away (no
            Edit-to-unlock step); Save just gives a brief confirmation
            since there's no backend behind it. */}
        <Card
          style={stagger(2)}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both"
        >
          <CardTitle>Personal Details</CardTitle>

          <div className="mt-4 space-y-4">
            <DetailField icon={Building2} label="Company/Organisation">
              <Input
                value={personal.company}
                onChange={(e) => setPersonalField("company", e.target.value)}
                placeholder="No"
              />
            </DetailField>
            <DetailField icon={UserRound} label="Family Name">
              <Input
                value={personal.familyName}
                onChange={(e) => setPersonalField("familyName", e.target.value)}
              />
            </DetailField>
            <DetailField icon={UserRound} label="Given Name">
              <Input
                value={personal.givenName}
                onChange={(e) => setPersonalField("givenName", e.target.value)}
              />
            </DetailField>
            <DetailField icon={Calendar} label="Date of Birth">
              <Input
                type="date"
                value={personal.dob}
                onChange={(e) => setPersonalField("dob", e.target.value)}
              />
            </DetailField>
            <div>
              <Label className="text-xs text-zinc-500 dark:text-zinc-400">Gender</Label>
              <Select value={personal.gender} onValueChange={(v) => setPersonalField("gender", v)}>
                <SelectTrigger className="mt-1.5 h-9 w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DetailField icon={Mail} label="Email">
              <Input
                value={personal.email}
                onChange={(e) => setPersonalField("email", e.target.value)}
                placeholder="Not added yet"
              />
            </DetailField>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            {saved && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-1 dark:text-emerald-400">
                <CircleCheck className="h-3.5 w-3.5" animate />
                Saved
              </span>
            )}
            <Button
              variant="brand"
              onClick={handleSave}
              className="h-9 rounded-full px-6 text-xs font-bold tracking-wide"
            >
              SAVE
            </Button>
          </div>
        </Card>
      </div>

      {verifyField && (
        <VerifyContactDialog
          field={verifyField}
          open={Boolean(verifyField)}
          onOpenChange={(open) => {
            if (!open) setVerifyField(null);
          }}
          onVerified={(value) => {
            if (verifyField === "phone") verifyPhone(value);
            else verifyEmail(value);
            setVerifyField(null);
          }}
        />
      )}
    </div>
  );
}
