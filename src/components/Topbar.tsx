import { useState } from "react";

import { BellRing } from "@/components/animate-ui/icons/bell-ring";
import { Check } from "@/components/animate-ui/icons/check";
import { Clapperboard } from "@/components/animate-ui/icons/clapperboard";
import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import { Coins } from "@/components/animate-ui/icons/coins";
import { Gem } from "@/components/animate-ui/icons/gem";
import { LogOut } from "@/components/animate-ui/icons/log-out";
import { PanelLeft } from "@/components/animate-ui/icons/panel-left";
import { Receipt } from "@/components/animate-ui/icons/receipt";
import { Sun } from "@/components/animate-ui/icons/sun";
import { UserPlus } from "@/components/animate-ui/icons/user-plus";
import { UserRound } from "@/components/animate-ui/icons/user-round";
import { Wallet } from "@/components/animate-ui/icons/wallet";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAccountBalance } from "@/context/AccountBalanceContext";
import { useFirstUser } from "@/firstusersrc/FirstUserContext";

/* ------------------------------------------------------------------ *
 * Top bar
 * ------------------------------------------------------------------ */

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Stack \"api-gateway\" is deploying.",
    time: "5 minutes ago",
    read: false,
  },
  {
    id: "n2",
    title: "Invoice for August is ready.",
    time: "2 hours ago",
    read: true,
  },
  {
    id: "n3",
    title: "VPS Instance 1 restarted successfully.",
    time: "Yesterday",
    read: true,
  },
];

export function Topbar({
  onToggleSidebar,
  dark,
  onToggleTheme,
  breadcrumb,
  onOpenBilling,
  onOpenPayment,
  onOpenProfile,
  onOpenMedia,
  onLogOut,
}: {
  onToggleSidebar?: () => void;
  dark?: boolean;
  onToggleTheme?: () => void;
  breadcrumb: string[];
  onOpenBilling?: () => void;
  onOpenPayment?: () => void;
  onOpenProfile?: () => void;
  onOpenMedia?: () => void;
  onLogOut?: () => void;
}) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [logOutConfirmOpen, setLogOutConfirmOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const { isFirstUser, toggleFirstUser } = useFirstUser();
  const { khr, bg } = useAccountBalance();

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white pl-4 pr-9 dark:border-zinc-800 dark:bg-zinc-950">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="h-8 w-8 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        <PanelLeft className="h-4 w-4" animateOnHover animateOnTap />
      </Button>

      <Separator
        orientation="vertical"
        className="h-5 bg-zinc-200 dark:bg-zinc-800"
      />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
        {breadcrumb.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-400" animateOnView />}
            <span
              className={
                i === breadcrumb.length - 1
                  ? "text-zinc-600 dark:text-zinc-300"
                  : "text-zinc-500 dark:text-zinc-400"
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {/* KHR + BG balance pills — an at-a-glance account summary that
            belongs up here (every screen sees it). Cancelling/resuming a
            subscription on the Billing page reloads/takes back its
            amount from the matching balance, so both need to stay live
            here rather than a frozen number. Clicking jumps to Payment,
            same as the Sidebar's own "Payment" row. */}
        <button
          type="button"
          onClick={onOpenPayment}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 motion-safe:transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          <Coins className="h-3.5 w-3.5 text-amber-500" animateOnView />
          {khr.toLocaleString()}
          <span className="font-normal text-zinc-400 dark:text-zinc-500">KHR</span>
        </button>

        <button
          type="button"
          onClick={onOpenPayment}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 motion-safe:transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          <Gem className="h-3.5 w-3.5 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
          {bg.toLocaleString()}
          <span className="font-normal text-zinc-400 dark:text-zinc-500">BG</span>
        </button>

        <Separator
          orientation="vertical"
          className="h-5 bg-zinc-200 dark:bg-zinc-800"
        />

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            className="h-8 w-8 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <Sun className="h-4 w-4" animateOnHover animateOnTap />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                className="relative h-8 w-8 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <BellRing className="h-4 w-4" animateOnHover animateOnTap />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-red-500 dark:border-zinc-950" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[320px]">
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                    className="text-xs font-medium text-[#1C75BC] hover:underline dark:text-[#6FA8D8]"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="items-start gap-2.5 whitespace-normal"
                    onSelect={() =>
                      setNotifications((prev) =>
                        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                      )
                    }
                  >
                    <span
                      className={
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full " +
                        (n.read ? "bg-transparent" : "bg-[#1C75BC] dark:bg-[#6FA8D8]")
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] leading-snug text-zinc-700 dark:text-zinc-300">
                        {n.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-400 dark:text-zinc-500">{n.time}</span>
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <p className="px-2 py-6 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
                  You're all caught up.
                </p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="" />
                <AvatarFallback className="bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  CP
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[240px]">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Cloud+ User</p>
              <p className="mt-0.5 truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
                cloudplus@sabay.com
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onOpenProfile?.()}>
              <UserRound className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenMedia?.()}>
              <Clapperboard className="h-4 w-4" />
              Media
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenBilling?.()}>
              <Receipt className="h-4 w-4" />
              Billing Subscription
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onOpenPayment?.()}>
              <Wallet className="h-4 w-4" />
              Payment
            </DropdownMenuItem>
            {/* Demo-only toggle: previews the dashboard exactly as a
                brand-new account sees it (no subscriptions, no
                services) — every page reads this from FirstUserContext.
                Kept open on select (preventDefault) so it's quick to
                flip back and forth without reopening the menu. */}
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                toggleFirstUser();
              }}
            >
              <UserPlus className="h-4 w-4" />
              First User
              {isFirstUser && <Check className="ml-auto h-4 w-4 text-[#1C75BC] dark:text-[#6FA8D8]" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setLogOutConfirmOpen(true)}>
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={logOutConfirmOpen}
        onOpenChange={setLogOutConfirmOpen}
        title="Log out?"
        description="You'll need to sign back in to access your dashboard."
        confirmLabel="Log out"
        variant="destructive"
        onConfirm={() => onLogOut?.()}
      />
    </header>
  );
}
