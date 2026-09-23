/**
 * Placeholder data for the Media section (Live Stream only — Rooms,
 * Analytics, Plans), styled after media-cloudplus's own mock data. Swap for
 * real API calls — every screen reads from here and nowhere else.
 */

export type Trend = "up" | "down";

export type Stat = {
  label: string;
  value: string;
  delta: string;
  trend: Trend;
};

export const analyticsStats: Stat[] = [
  { label: "Peak Concurrent", value: "1,204", delta: "+18.2%", trend: "up" },
  { label: "Total Watch Time", value: "12,480 Min", delta: "+6.1%", trend: "up" },
  { label: "Unique Viewers", value: "3,914", delta: "-3.4%", trend: "down" },
  { label: "Avg. Engagement", value: "62%", delta: "+2.8%", trend: "up" },
];

export type ViewPoint = { date: string; views: number };

/** Deterministic pseudo-random daily series so charts don't reshuffle on every render. */
export function buildViewSeries(days: number, seed = 7): ViewPoint[] {
  const end = new Date("2026-06-30T00:00:00Z");
  const out: ViewPoint[] = [];
  let s = seed;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(end.getUTCDate() - i);
    s = (s * 1103515245 + 12345) % 2147483648;
    const noise = s / 2147483648;
    out.push({ date: d.toISOString().slice(0, 10), views: Math.round(180 + noise * 620) });
  }
  return out;
}

export type MinutePoint = { time: string; views: number };

/** Per-10-minute viewer series for the room analytics chart. */
export function buildMinuteSeries(points = 18, seed = 5): MinutePoint[] {
  const out: MinutePoint[] = [];
  let s = seed;
  for (let i = 0; i < points; i++) {
    const minutes = 9 * 60 + i * 10;
    const hh = Math.floor(minutes / 60);
    const mm = minutes % 60;
    s = (s * 1103515245 + 12345) % 2147483648;
    out.push({
      time: `${String(hh % 12 || 12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`,
      views: Math.round(40 + (s / 2147483648) * 260),
    });
  }
  return out;
}

export type RoomStatus = "Live" | "Unlist" | "Scheduled" | "Ended";

export type Room = {
  id: string;
  name: string;
  views: number;
  status: RoomStatus;
  createdAt: string;
  type: "live" | "video";
  /** Drives the extra "Watch the recording" block on the Connections tab. */
  vodEnabled: boolean;
};

export const mediaRooms: Room[] = [
  { id: "streamingbucket", name: "streamingbucket", views: 0, status: "Unlist", createdAt: "2026-07-02", type: "live", vodEnabled: false },
  { id: "launch-event", name: "Product Launch Event", views: 1284, status: "Live", createdAt: "2026-07-04", type: "live", vodEnabled: true },
  { id: "weekly-standup", name: "Weekly Standup", views: 92, status: "Ended", createdAt: "2026-07-01", type: "live", vodEnabled: false },
  { id: "khmer-new-year", name: "Khmer New Year Concert", views: 8421, status: "Ended", createdAt: "2026-04-14", type: "live", vodEnabled: true },
  { id: "town-hall", name: "Company Town Hall", views: 340, status: "Scheduled", createdAt: "2026-07-09", type: "live", vodEnabled: false },
  { id: "training-vod", name: "Onboarding Training", views: 512, status: "Unlist", createdAt: "2026-06-21", type: "video", vodEnabled: true },
  { id: "highlight-reel", name: "Highlight Reel 2026", views: 2210, status: "Ended", createdAt: "2026-05-30", type: "video", vodEnabled: false },
  { id: "demo-day", name: "Demo Day Recording", views: 118, status: "Unlist", createdAt: "2026-06-11", type: "video", vodEnabled: false },
];

/* ---------------------------------------------------------------------------
 * Connection information (Room Detail → Connections tab)
 * ------------------------------------------------------------------------ */

export const playbackFormats = ["HLS", "LL-HLS"] as const;
export type PlaybackFormat = (typeof playbackFormats)[number];

export const ingestProtocols = ["RTMPS", "SRT", "WebRTC (WHIP)"] as const;
export type IngestProtocol = (typeof ingestProtocols)[number];

const EDGE = "e91bf6f62ae80bec701adf5ff6521e49.testing.sabay.com";
const ROOM_PATH = "one-more-room/5785e9ad";

/** Playback endpoints — "Use these endpoints in your web or mobile player." */
export const playbackUrls: Record<PlaybackFormat, string> = {
  HLS: `https://${EDGE}/${ROOM_PATH}/index.m3u8`,
  "LL-HLS": `https://${EDGE}/${ROOM_PATH}/ll.m3u8`,
};

/** The "Watch the recording" block, shown only when the room records VOD. */
export const vodPlaybackUrls: Record<PlaybackFormat, string> = {
  HLS: `https://${EDGE}/${ROOM_PATH}/vod/index.m3u8`,
  "LL-HLS": `https://${EDGE}/${ROOM_PATH}/vod/ll.m3u8`,
};

/** Publish endpoints — "Use these endpoints in OBS or your broadcasting software." */
export const publishUrls: Record<IngestProtocol, string> = {
  RTMPS: `rtmp://${EDGE}:6998/${ROOM_PATH}`,
  SRT: `srt://${EDGE}:6999?streamid=${ROOM_PATH}`,
  "WebRTC (WHIP)": `https://${EDGE}/whip/${ROOM_PATH}`,
};

export const signingDefaults = {
  playbackSigned: false,
  publishSigned: true,
  expirationMinutes: 15,
};

/* ---------------------------------------------------------------------------
 * Room Analytics tab
 * ------------------------------------------------------------------------ */

export const roomStatusOptions = ["Unlisted", "Live", "Schedule"] as const;
export type RoomStatusOption = (typeof roomStatusOptions)[number];

export const streamingResolutions = ["144p", "240p", "360p", "480p", "720p (HD)", "1080p (Full HD)"] as const;

/* ---------------------------------------------------------------------------
 * Room Configuration tab
 * ------------------------------------------------------------------------ */

export const retentionOptions = ["7 Days", "14 Days", "30 Days", "90 Days"] as const;

export const configurationDefaults = {
  bucketId: "",
  path: "",
  recordAsVod: false,
  recordAsMp4: false,
  automaticDeletion: false,
  retention: "30 Days",
};

export const vodRecordingUrls: Record<PlaybackFormat, string> = {
  HLS: `https://${EDGE}/${ROOM_PATH}/recording/index.m3u8`,
  "LL-HLS": `https://${EDGE}/${ROOM_PATH}/recording/ll.m3u8`,
};

export const mediaBuckets = [
  { id: "marketing", name: "marketing-assets" },
  { id: "training", name: "internal-training" },
  { id: "events", name: "event-recordings" },
  { id: "archive", name: "archive-2025" },
];

/* ---------------------------------------------------------------------------
 * Usage panel (Rooms list sidebar)
 * ------------------------------------------------------------------------ */

export const usage = {
  periodLabel: "02 Jul - 02 Aug",
  plan: "FREE",
  status: "Active",
  renewsOn: "Aug 2, 2026",
  duration: "30 Hour",
  transfer: "1 GB",
  liveDurationUsed: 6,
  liveDurationTotal: 30,
  transferUsed: 0.3,
  transferTotal: 1,
};

/* ---------------------------------------------------------------------------
 * Plans
 * ------------------------------------------------------------------------ */

export type Plan = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  strikePrice?: string;
  period: string;
  badge?: string;
  featured?: boolean;
  features: string[];
};

const sharedFeatures = [
  "10,000 Free Minutes",
  "Follow Functionality",
  "Simultaneous PK for Up to 9 Rooms",
  "In-Room Search Capability",
  "100 Monthly Active Users",
  "Chat and Emoji Support",
  "RTMP Entry Support",
  "Up to 10 Live Rooms Available",
  "AI Noise Suppression Technology",
  "2K/4K Video Quality Available",
  "Advanced Security Features",
];

export const liveStreamPlans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    tagline: "Unleash the power of your business with the Basic plan.",
    price: "40,000 KHR",
    period: "Per Month",
    features: sharedFeatures,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Unleash the power of your business with the Pro plan.",
    price: "90,000 KHR",
    period: "Per Month",
    features: sharedFeatures,
  },
  {
    id: "popular",
    name: "Popular",
    tagline: "Take your business to the next level with the Business plan.",
    price: "120,000 KHR",
    strikePrice: "200,000 KHR",
    period: "Per Month",
    badge: "Discount 50%",
    featured: true,
    features: sharedFeatures,
  },
];
