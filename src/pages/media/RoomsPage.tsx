import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ChevronRight } from "@/components/animate-ui/icons/chevron-right";
import {
  PILL_TABS_LIST_CLASS,
  PILL_TAB_TRIGGER_CLASS,
  RadialGauge,
  SearchField,
  StatusBadge,
} from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { mediaRooms, usage, type Room, type RoomStatus } from "../../data/media";

/* ------------------------------------------------------------------ *
 * Media → Live Stream → Rooms. Ported from media-cloudplus's Room List
 * screen: a searchable, status-filtered table plus a Usage summary
 * panel, using dashboard-ui's own table/badge/gauge atoms.
 * ------------------------------------------------------------------ */

const statusTone: Record<RoomStatus, "red" | "zinc" | "amber"> = {
  Live: "red",
  Unlist: "zinc",
  Scheduled: "amber",
  Ended: "zinc",
};

const dateFormat: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
};

export function RoomsPage() {
  const navigate = useNavigate();
  const [roomType, setRoomType] = useState<"live" | "video">("live");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mediaRooms
      .filter((room) => room.type === roomType)
      .filter((room) => (q ? room.name.toLowerCase().includes(q) : true));
  }, [roomType, query]);

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <section className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            Room List
          </h1>
          <Button variant="brand" className="h-9 px-4 text-sm">Create Room</Button>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <SearchField value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rooms" />
          <Tabs
            value={roomType}
            onValueChange={(v) => setRoomType(v as "live" | "video")}
          >
            <TabsList className={PILL_TABS_LIST_CLASS}>
              <TabsTrigger value="live" className={PILL_TAB_TRIGGER_CLASS}>Live Stream</TabsTrigger>
              <TabsTrigger value="video" className={PILL_TAB_TRIGGER_CLASS}>Video Stream</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 dark:bg-zinc-900/60">
                  <TableHead>Room Name</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="w-px text-right">
                    <span className="sr-only sm:not-sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="h-[180px] text-center text-sm text-zinc-500 dark:text-zinc-400">
                      {query ? `Nothing matched "${query}".` : roomType === "live" ? "No live rooms yet." : "No videos yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((room) => (
                    <RoomRow key={room.id} room={room} onOpen={() => navigate(`/media/rooms/${room.id}`)} />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <UsagePanel />
    </div>
  );
}

function RoomRow({ room, onOpen }: { room: Room; onOpen: () => void }) {
  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell className="font-medium text-zinc-900 dark:text-zinc-50">
        {room.name}
        <span className="mt-0.5 block text-xs text-zinc-400 dark:text-zinc-500 md:hidden">
          <span className="sm:hidden">{room.views.toLocaleString()} views · </span>
          {new Date(room.createdAt).toLocaleDateString("en-US", dateFormat)}
        </span>
      </TableCell>
      <TableCell className="hidden text-right tabular-nums text-zinc-600 dark:text-zinc-300 sm:table-cell">
        {room.views.toLocaleString()}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <StatusBadge label={room.status} tone={statusTone[room.status]} />
      </TableCell>
      <TableCell className="hidden whitespace-nowrap text-zinc-500 dark:text-zinc-400 md:table-cell">
        {new Date(room.createdAt).toLocaleDateString("en-US", dateFormat)}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="link" size="sm" className="px-2" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          View Detail
        </Button>
      </TableCell>
    </TableRow>
  );
}

function UsagePanel() {
  return (
    <aside aria-label="Usage and billing" className="flex w-full flex-col gap-4 xl:w-[340px] xl:shrink-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Usage</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{usage.periodLabel}</p>
        </div>
        <Button variant="secondary" size="sm" className="text-zinc-600 dark:text-zinc-300">
          Billing Dashboard
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Plan</h3>
          <StatusBadge label={usage.plan} tone="blue" />
          <Button variant="secondary" size="sm" className="ml-auto text-zinc-600 dark:text-zinc-300">
            Upgrade Plan
          </Button>
        </div>
        <div className="flex flex-col gap-2.5">
          <UsageRow label="Status" value={<StatusBadge label={usage.status} tone="green" />} />
          <UsageRow label="Renews On" value={usage.renewsOn} />
          <UsageRow label="Duration" value={usage.duration} />
          <UsageRow label="Transfer" value={usage.transfer} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <RadialGauge label="Live Duration" value={usage.liveDurationUsed} max={usage.liveDurationTotal} unit="Hour" />
        <RadialGauge label="Transfer" value={usage.transferUsed} max={usage.transferTotal} unit="GB" />
      </div>
    </aside>
  );
}

function UsageRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="w-24 shrink-0 text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}
