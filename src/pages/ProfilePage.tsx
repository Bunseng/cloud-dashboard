import { useState } from "react";

import { BadgeCheck } from "@/components/animate-ui/icons/badge-check";
import { Mail } from "@/components/animate-ui/icons/mail";
import { Phone } from "@/components/animate-ui/icons/phone";
import { ShieldCheck } from "@/components/animate-ui/icons/shield-check";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

import { useFirstUser } from "../firstusersrc/FirstUserContext";
import { VerifyContactDialog, type VerifyField } from "../firstusersrc/VerifyContactDialog";

/* ------------------------------------------------------------------ *
 * Profile — the account's name plus its two contact points, each with
 * its own independent verification. The default (non-First-User)
 * account is this app's one seeded identity; a First User account
 * instead verifies phone and email one at a time right here — once one
 * is verified, only the other's "Verify" button ever shows up again,
 * never asking to redo one that's already confirmed.
 * ------------------------------------------------------------------ */

const DEFAULT_ACCOUNT = {
  name: "Cloud+ User",
  email: "cloudplus@sabay.com",
  phone: "+855 12 345 678",
};

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
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-900">
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

export function ProfilePage() {
  const { isFirstUser, profile, verifyPhone, verifyEmail } = useFirstUser();
  const [verifyField, setVerifyField] = useState<VerifyField | null>(null);

  const name = isFirstUser ? "New User" : DEFAULT_ACCOUNT.name;
  const phoneVerified = isFirstUser ? profile.phone.verified : true;
  const emailVerified = isFirstUser ? profile.email.verified : true;
  const phoneValue = isFirstUser ? (profile.phone.verified ? profile.phone.value : null) : DEFAULT_ACCOUNT.phone;
  const emailValue = isFirstUser ? (profile.email.verified ? profile.email.value : null) : DEFAULT_ACCOUNT.email;
  const allVerified = phoneVerified && emailVerified;

  return (
    <div>
      <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
        Profile
      </h1>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        Your account's contact information.
      </p>

      <div className="mt-6 flex items-center gap-4">
        <Avatar className="h-16 w-16">
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
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{name}</p>
          {isFirstUser && !allVerified && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Verify your phone and email to add them here.
            </p>
          )}
        </div>
      </div>

      <Card className="mt-6 max-w-lg space-y-3">
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
