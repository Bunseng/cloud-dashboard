import { useEffect, useState } from "react";

import { Gift } from "@/components/animate-ui/icons/gift";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REDEEM_CODES, type WalletCurrency } from "@/data/redeem-codes";

/* ------------------------------------------------------------------ *
 * Redeem — a promo/voucher code that tops the wallet up without going
 * through payment. Which balance a code credits comes from the code
 * itself, not from the caller.
 * ------------------------------------------------------------------ */

export function RedeemDialog({
  open,
  onOpenChange,
  onRedeem,
  presetCode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRedeem: (amount: number, code: string, currency: WalletCurrency) => void;
  /** Pre-fills the field when a caller already knows the code. */
  presetCode?: string;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCode(presetCode ?? "");
      setError(null);
    }
  }, [open, presetCode]);

  function submit() {
    const normalized = code.trim().toUpperCase();
    const entry = REDEEM_CODES[normalized];
    if (!entry) {
      setError("That code isn't valid or has already been used.");
      return;
    }
    onRedeem(entry.amount, normalized, entry.currency);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
            Redeem a Code
          </DialogTitle>
          <DialogDescription>
            Enter a voucher or promo code to add its value straight to your wallet.
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label htmlFor="redeem-code" className="text-zinc-900 dark:text-zinc-100">
            Code
          </Label>
          <Input
            id="redeem-code"
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="CLOUDPLUS50"
            className="mt-2 font-mono tracking-[0.08em] uppercase"
          />
          {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-9 text-sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="brand"
            disabled={code.trim().length === 0}
            onClick={submit}
            className="h-9 text-sm"
          >
            Redeem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
