import { useId, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import loadingIllustration from "@/assets/media/loading.svg";

import { MediaBarChart } from "../../media/BarChart";
import { CopyField } from "../../media/CopyField";
import { RoomConnectionsTab } from "./RoomConnectionsTab";
import {
  buildMinuteSeries,
  configurationDefaults,
  mediaBuckets,
  mediaRooms,
  playbackFormats,
  retentionOptions,
  roomStatusOptions,
  streamingResolutions,
  vodRecordingUrls,
  type PlaybackFormat,
  type Room,
  type RoomStatusOption,
} from "../../data/media";

/* ------------------------------------------------------------------ *
 * Media → Live Stream → Room Detail. Ported from media-cloudplus's
 * three-tab room screen (Analytics / Connections Information /
 * Configuration) — Connections now matches the reference 1:1, see
 * RoomConnectionsTab.
 * ------------------------------------------------------------------ */

export function RoomDetailPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const room = mediaRooms.find((r) => r.id === roomId);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-8 text-zinc-900 dark:text-zinc-50 sm:text-3xl sm:leading-9">
            {room?.name ?? "Room"}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {room ? `${room.views.toLocaleString()} views · ${room.status}` : "This room no longer exists."}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/media/rooms")}>Back to Rooms</Button>
      </div>

      <Tabs defaultValue="analytics" className="mt-6">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="connections">Connections Information</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analytics" className="mt-6">
          <RoomAnalyticsTab room={room} />
        </TabsContent>
        <TabsContent value="connections" className="mt-6">
          <RoomConnectionsTab vodEnabled={room?.vodEnabled ?? false} />
        </TabsContent>
        <TabsContent value="configuration" className="mt-6">
          <ConfigurationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Analytics tab
 * ------------------------------------------------------------------ */

function toStatusOption(room?: Room): RoomStatusOption {
  if (room?.status === "Live") return "Live";
  if (room?.status === "Scheduled") return "Schedule";
  return "Unlisted";
}

function RoomAnalyticsTab({ room }: { room?: Room }) {
  const isLiveNow = room?.status === "Live";
  const series = useMemo(() => {
    const points = buildMinuteSeries(18, room?.name.length ?? 5);
    return room && room.views > 0 ? points : points.map((p) => ({ ...p, views: 0 }));
  }, [room]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="flex min-h-[320px] items-center justify-center">
          {isLiveNow ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500 motion-safe:animate-pulse" />
                Live now
              </span>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {room!.views.toLocaleString()} watching
              </p>
              <p className="max-w-[420px] text-sm text-zinc-500 dark:text-zinc-400">
                Viewer counts refresh every few seconds while the stream is running.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <img src={loadingIllustration} alt="" loading="lazy" className="h-auto w-full max-w-[172px]" />
              <div className="mt-2 w-full max-w-[460px] rounded-lg border border-dashed border-zinc-200 px-6 py-6 text-center dark:border-zinc-800">
                <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">No live stream available !!</p>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  This page displays all completed Live Streams and Scheduled Streams that have
                  already finished. You can review past sessions, performance data, and playback
                  details here.
                </p>
              </div>
            </div>
          )}
        </Card>

        <OverviewCard room={room} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Current Views" value={isLiveNow ? room!.views : 0} highlighted />
        <MetricCard label="Total Views" value={room?.views ?? 0} />
        <MetricCard label="Average Duration" value={room && room.views > 0 ? "4:11" : 0} />
      </div>

      <Card>
        <MediaBarChart data={series.map((p) => ({ label: p.time, value: p.views }))} labelEvery={3} />
      </Card>
    </div>
  );
}

function MetricCard({ label, value, highlighted }: { label: string; value: number | string; highlighted?: boolean }) {
  return (
    <Card className={cn("flex flex-col", highlighted && "border-[#1C75BC] shadow-[0_0_0_1px_#1C75BC]")}>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl leading-8 text-zinc-900 dark:text-zinc-50">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </Card>
  );
}

function OverviewCard({ room }: { room?: Room }) {
  const [title, setTitle] = useState(room?.name ?? "");
  const [status, setStatus] = useState<RoomStatusOption>(toStatusOption(room));
  const [resolutions, setResolutions] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  function toggleResolution(value: string, checked: boolean) {
    setResolutions((current) => (checked ? [...current, value] : current.filter((r) => r !== value)));
    setDirty(true);
  }

  return (
    <Card className="flex h-fit flex-col gap-4">
      <span className="inline-flex w-fit rounded-lg bg-[#1C75BC] px-4 py-2 text-sm font-medium text-white">
        Overview
      </span>

      <div className="grid gap-2">
        <Label htmlFor="overview-title">Title</Label>
        <Input id="overview-title" value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="overview-status">Status</Label>
        <Select value={status} onValueChange={(v) => { setStatus(v as RoomStatusOption); setDirty(true); }}>
          <SelectTrigger id="overview-status" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {roomStatusOptions.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {status === "Live" && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">Streaming Resolution</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {streamingResolutions.map((resolution) => (
              <div key={resolution} className="flex items-center gap-2">
                <Checkbox
                  id={`res-${resolution}`}
                  checked={resolutions.includes(resolution)}
                  onCheckedChange={(checked) => toggleResolution(resolution, checked === true)}
                />
                <Label htmlFor={`res-${resolution}`} className="font-normal text-zinc-700 dark:text-zinc-300">
                  {resolution}
                </Label>
              </div>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex justify-end">
        <Button variant="brand" disabled={!dirty} onClick={() => setDirty(false)} className="h-9 px-4 text-sm">
          Save
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Configuration tab
 * ------------------------------------------------------------------ */

function ConfigurationTab() {
  const [bucketId, setBucketId] = useState(configurationDefaults.bucketId);
  const [path, setPath] = useState(configurationDefaults.path);
  const [recordAsVod, setRecordAsVod] = useState(configurationDefaults.recordAsVod);
  const [vodFormat, setVodFormat] = useState<PlaybackFormat>("HLS");
  const [recordAsMp4, setRecordAsMp4] = useState(configurationDefaults.recordAsMp4);
  const [autoDelete, setAutoDelete] = useState(configurationDefaults.automaticDeletion);
  const [retention, setRetention] = useState(configurationDefaults.retention);
  const [dirty, setDirty] = useState(false);

  const hasBucket = bucketId !== "";
  const touch = () => setDirty(true);

  return (
    <Card className="flex max-w-[860px] flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Configuration</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Where this room's recordings are stored, and how long they're kept.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="config-bucket">Bucket</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={bucketId} onValueChange={(v) => { setBucketId(v); touch(); }}>
            <SelectTrigger id="config-bucket" className="w-full sm:max-w-[220px]"><SelectValue placeholder="Bucket Name" /></SelectTrigger>
            <SelectContent>
              {mediaBuckets.map((bucket) => (
                <SelectItem key={bucket.id} value={bucket.id}>{bucket.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input aria-label="Bucket path" placeholder="/pathname" value={path} onChange={(e) => { setPath(e.target.value); touch(); }} className="flex-1" />
        </div>
        <p className={hasBucket ? "text-sm text-zinc-500 dark:text-zinc-400" : "text-sm text-amber-600 dark:text-amber-400"}>
          Set up a storage bucket before enabling recording.
        </p>
      </div>

      <SettingRow
        title="Record Live Stream as VOD"
        description="Automatically saves the full recording as a Video-on-Demand file once the stream ends."
        checked={recordAsVod}
        disabled={!hasBucket}
        onCheckedChange={(next) => { setRecordAsVod(next); touch(); }}
      >
        <div className="grid gap-3">
          <div role="group" aria-label="VOD delivery format" className="flex flex-wrap gap-2">
            {playbackFormats.map((format) => (
              <button
                key={format}
                type="button"
                aria-pressed={vodFormat === format}
                onClick={() => setVodFormat(format)}
                className={
                  "rounded-md border px-3 py-1.5 text-sm outline-hidden transition-colors focus-visible:ring-[3px] focus-visible:ring-[#1C75BC]/30 " +
                  (vodFormat === format
                    ? "border-zinc-300 bg-white font-medium text-zinc-900 shadow-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    : "border-transparent bg-zinc-100 text-zinc-500 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100")
                }
              >
                {format}
              </button>
            ))}
          </div>
          <CopyField id="vod-recording-url" label="Recording URL" value={vodRecordingUrls[vodFormat]} />
        </div>
      </SettingRow>

      <SettingRow
        title="Record Live Stream as MP4"
        description="Keep a downloadable MP4 copy of every session alongside the VOD."
        checked={recordAsMp4}
        disabled={!hasBucket}
        onCheckedChange={(next) => { setRecordAsMp4(next); touch(); }}
      />

      <SettingRow
        title="Automatic Record Deletion"
        description="Recorded content is deleted after the retention period, to help manage storage."
        checked={autoDelete}
        disabled={!hasBucket}
        onCheckedChange={(next) => { setAutoDelete(next); touch(); }}
      >
        <div className="grid gap-2">
          <Label htmlFor="retention">Retention period</Label>
          <Select value={retention} onValueChange={(v) => { setRetention(v); touch(); }}>
            <SelectTrigger id="retention" className="w-full max-w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {retentionOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SettingRow>

      <div className="flex justify-end">
        <Button variant="brand" disabled={!dirty || !hasBucket} onClick={() => setDirty(false)} className="h-9 px-4 text-sm">
          Save
        </Button>
      </div>
    </Card>
  );
}

function SettingRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
  children,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: React.ReactNode;
}) {
  const uid = useId();
  return (
    <div className="grid gap-3">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <Label htmlFor={uid} className={"text-sm font-medium text-[#1C75BC] dark:text-[#6FA8D8]" + (disabled ? " opacity-60" : "")}>
            {title}
          </Label>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
        <Switch id={uid} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
      </div>
      {checked && children}
    </div>
  );
}
