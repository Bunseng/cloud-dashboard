import { useState } from "react";

import { BadgeCheck } from "@/components/animate-ui/icons/badge-check";
import { Building2 } from "@/components/animate-ui/icons/building-2";
import { Calendar } from "@/components/animate-ui/icons/calendar";
import { Camera } from "@/components/animate-ui/icons/camera";
import { CircleCheck } from "@/components/animate-ui/icons/circle-check";
import { Mail } from "@/components/animate-ui/icons/mail";
import { Phone } from "@/components/animate-ui/icons/phone";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { UserRound } from "@/components/animate-ui/icons/user-round";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { useFirstUser } from "../firstusersrc/FirstUserContext";
import { VerifyContactDialog, type VerifyField } from "../firstusersrc/VerifyContactDialog";

/* ------------------------------------------------------------------ *
 * Profile — restyled after media-cloudplus's own Profile page: one
 * bordered page card holding a side nav (Profile / Security Overview)
 * instead of everything stacked in a column of separate cards. Phone
 * and Email verification moved out of the main Profile tab entirely —
 * they're account-security concerns, so they live on the Security
 * Overview tab now, alongside Password and its recovery option.
 *
 * The default (non-First-User) account is this app's one seeded
 * identity; a First User account instead verifies phone and email one
 * at a time on Security Overview — once one is verified, only the
 * other still needs it, never asking to redo one that's already
 * confirmed.
 * ------------------------------------------------------------------ */

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "security", label: "Security Overview" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
    <div className="grid gap-2">
      <Label className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <Icon className="h-3.5 w-3.5" animateOnView />
        {label}
      </Label>
      {children}
    </div>
  );
}

/* One bordered row — every Security Overview control (Phone/Email
   verify, Password change, Recovery toggle) shares this shape. */
function SecurityCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      {children}
    </div>
  );
}

function VerifyRow({
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
    <SecurityCard>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-900">
          <Icon className="h-4 w-4 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
        </span>
        <div className="min-w-0">
          <Label className="text-sm">{label}</Label>
          <p className="truncate text-sm text-muted-foreground">
            {value ?? "Not added yet"}
          </p>
        </div>
      </div>
      {verified ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <BadgeCheck className="h-3.5 w-3.5" animateOnView />
          Verified
        </span>
      ) : (
        onVerify && (
          <Button variant="brand" onClick={onVerify} className="h-8 shrink-0 gap-1.5 px-3 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" animateOnView />
            Verify
          </Button>
        )
      )}
    </SecurityCard>
  );
}

export function ProfilePage() {
  const { isFirstUser, profile, verifyPhone, verifyEmail } = useFirstUser();
  const [tab, setTab] = useState<TabKey>("profile");
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
      ? { company: "", familyName: "", givenName: "", dob: "", gender: "" }
      : DEFAULT_PERSONAL
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
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold leading-8 tracking-[-0.02em] text-zinc-900 dark:text-zinc-50 sm:text-[30px] sm:leading-9">
          Profile
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your account settings and personal details.
        </p>
      </div>

      <Separator className="my-6 bg-zinc-200 dark:bg-zinc-800" />

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav
          aria-label="Profile sections"
          className="-mx-1 flex shrink-0 flex-row gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:w-[200px] lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-current={tab === t.key ? "page" : undefined}
              onClick={() => setTab(t.key)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40",
                tab === t.key
                  ? "bg-[#EFF6FF] text-[#1C75BC] dark:bg-zinc-900 dark:text-[#6FA8D8]"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {tab === "profile" ? (
            <ProfileTab
              name={name}
              allVerified={allVerified}
              isFirstUser={isFirstUser}
              personal={personal}
              onFieldChange={setPersonalField}
              saved={saved}
              onSave={handleSave}
            />
          ) : (
            <SecurityOverviewTab
              allVerified={allVerified}
              isFirstUser={isFirstUser}
              phoneValue={phoneValue}
              emailValue={emailValue}
              phoneVerified={phoneVerified}
              emailVerified={emailVerified}
              onVerifyPhone={() => setVerifyField("phone")}
              onVerifyEmail={() => setVerifyField("email")}
              recoverByPhone={recoverByPhone}
              onRecoverByPhoneChange={setRecoverByPhone}
            />
          )}
        </div>
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

function ProfileTab({
  name,
  allVerified,
  isFirstUser,
  personal,
  onFieldChange,
  saved,
  onSave,
}: {
  name: string;
  allVerified: boolean;
  isFirstUser: boolean;
  personal: typeof DEFAULT_PERSONAL;
  onFieldChange: <K extends keyof typeof DEFAULT_PERSONAL>(key: K, value: string) => void;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="relative flex flex-col items-center gap-4 overflow-hidden rounded-lg bg-gradient-to-r from-[#1C75BC] to-[#35C3D9] p-6 text-center sm:flex-row sm:gap-6 sm:text-left">
        <Avatar className="h-[72px] w-[72px] border-2 border-white/40">
          <AvatarFallback className="bg-white/15 text-xl font-medium text-white">
            {name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold text-white">{name}</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-white/80 sm:justify-start">
            {allVerified ? (
              <>
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified account
              </>
            ) : isFirstUser ? (
              "Not verified yet — see Security Overview"
            ) : (
              "Cloud+ member"
            )}
          </p>
        </div>
        <Button variant="secondary" className="gap-1.5 shrink-0 bg-white text-[#1C75BC] hover:bg-white/90">
          <Camera className="h-4 w-4" animateOnHover animateOnTap />
          Upload Profile Pic
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Personal Details</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          This is how others will see you on the site.
        </p>
      </div>

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      <form
        className="flex max-w-[544px] flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <DetailField icon={Building2} label="Company/Organisation">
          <Input
            value={personal.company}
            onChange={(e) => onFieldChange("company", e.target.value)}
            placeholder="No"
          />
        </DetailField>
        <DetailField icon={UserRound} label="Family Name">
          <Input
            value={personal.familyName}
            onChange={(e) => onFieldChange("familyName", e.target.value)}
          />
        </DetailField>
        <DetailField icon={UserRound} label="Given Name">
          <Input
            value={personal.givenName}
            onChange={(e) => onFieldChange("givenName", e.target.value)}
          />
        </DetailField>
        <div className="grid gap-2">
          <Label className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Calendar className="h-3.5 w-3.5" animateOnView />
            Date of Birth
          </Label>
          <div className="relative">
            <Input
              type="date"
              value={personal.dob}
              onChange={(e) => onFieldChange("dob", e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label className="text-xs text-zinc-500 dark:text-zinc-400">Gender</Label>
          <Select value={personal.gender} onValueChange={(v) => onFieldChange("gender", v)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="brand">
            Save changes
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-1 dark:text-emerald-400">
              <CircleCheck className="h-3.5 w-3.5" animate />
              Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function SecurityOverviewTab({
  allVerified,
  isFirstUser,
  phoneValue,
  emailValue,
  phoneVerified,
  emailVerified,
  onVerifyPhone,
  onVerifyEmail,
  recoverByPhone,
  onRecoverByPhoneChange,
}: {
  allVerified: boolean;
  isFirstUser: boolean;
  phoneValue: string | null;
  emailValue: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  onVerifyPhone: () => void;
  onVerifyEmail: () => void;
  recoverByPhone: boolean;
  onRecoverByPhoneChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex max-w-[544px] flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Security Overview</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Keep your account, phone number, and email protected.
        </p>
      </div>

      <Separator className="bg-zinc-200 dark:bg-zinc-800" />

      {allVerified ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Your account is in good standing
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Phone and email are both verified — no action needed.
            </p>
          </div>
        </div>
      ) : (
        isFirstUser && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Your account needs attention
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Verify your phone number and email below to secure your account.
              </p>
            </div>
          </div>
        )
      )}

      <div className="space-y-3">
        <VerifyRow
          icon={Phone}
          label="Phone Number"
          value={phoneValue}
          verified={phoneVerified}
          onVerify={isFirstUser ? onVerifyPhone : undefined}
        />
        <VerifyRow
          icon={Mail}
          label="Email"
          value={emailValue}
          verified={emailVerified}
          onVerify={isFirstUser ? onVerifyEmail : undefined}
        />
      </div>

      <SecurityCard>
        <div className="space-y-0.5">
          <Label className="text-sm">Password</Label>
          <p className="text-sm text-muted-foreground">
            We recommend using a secure password that you don't use anywhere else.
          </p>
        </div>
        <Button variant="outline" className="shrink-0">
          Change password
        </Button>
      </SecurityCard>

      <SecurityCard>
        <div className="space-y-0.5">
          <Label htmlFor="recover-by-phone" className="text-sm">
            Recover by phone number
          </Label>
          <p className="text-sm text-muted-foreground">
            Allow using your phone number to recover your login password.
          </p>
        </div>
        <Switch id="recover-by-phone" checked={recoverByPhone} onCheckedChange={onRecoverByPhoneChange} />
      </SecurityCard>
    </div>
  );
}
