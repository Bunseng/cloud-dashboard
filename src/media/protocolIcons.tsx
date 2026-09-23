import { Globe, MonitorPlay, Radio, Waypoints, Zap } from "lucide-react";
import type { ComponentType } from "react";

import type { IngestProtocol, PlaybackFormat } from "../data/media";

/**
 * One icon per delivery format / ingest protocol, matching
 * media-cloudplus's protocolIcons — dashboard-ui doesn't carry animated
 * versions of these particular glyphs, so plain lucide icons stand in.
 */
export const protocolIcons: Record<PlaybackFormat | IngestProtocol, ComponentType<{ className?: string }>> = {
  HLS: MonitorPlay,
  "LL-HLS": Zap,
  RTMPS: Radio,
  SRT: Waypoints,
  "WebRTC (WHIP)": Globe,
};
