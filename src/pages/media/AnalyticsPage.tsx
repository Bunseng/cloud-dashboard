import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingDown, TrendingUp } from "lucide-react";

import { MediaBarChart } from "../../media/BarChart";
import { analyticsStats, buildViewSeries, mediaRooms, type Stat } from "../../data/media";

/* ------------------------------------------------------------------ *
 * Media → Live Stream → Analytics. Ported from media-cloudplus's
 * Live Stream Analytics screen — a room filter, stat cards, and a
 * views-over-time chart.
 * ------------------------------------------------------------------ */

export function AnalyticsPage() {
  const withViews = useMemo(() => mediaRooms.filter((r) => r.views > 0), []);
  const [roomId, setRoomId] = useState<string>(withViews[0]?.id ?? "all");
  const series = useMemo(() => buildViewSeries(30, roomId.length || 3), [roomId]);
  const chartData = series.map((p) => ({
    label: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: p.views,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
            Analytics
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Viewer performance across your live rooms.
          </p>
        </div>
        <Select value={roomId} onValueChange={setRoomId}>
          <SelectTrigger className="w-full sm:w-[240px]" aria-label="Filter by room">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All rooms</SelectItem>
            {withViews.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {analyticsStats.map((stat) => (
          <AnalyticsStatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <Card>
        <MediaBarChart data={chartData} />
      </Card>
    </div>
  );
}

function AnalyticsStatCard({ stat }: { stat: Stat }) {
  const Icon = stat.trend === "up" ? TrendingUp : TrendingDown;
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-1.5">
        <p className="min-w-0 flex-1 text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
        <span className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
          <Icon className="h-3.5 w-3.5" />
          {stat.delta}
        </span>
      </div>
      <p className="mt-1 text-xl leading-7 text-zinc-900 dark:text-zinc-50 sm:text-2xl sm:leading-8">
        {stat.value}
      </p>
    </Card>
  );
}
