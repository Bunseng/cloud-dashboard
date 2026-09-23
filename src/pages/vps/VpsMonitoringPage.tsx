import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";

/* ------------------------------------------------------------------ *
 * VPS Monitoring — styled after Proxmox VE's node summary dashboard:
 * a stat/summary panel plus stacked area charts, following the app's
 * own light/dark theme instead of forcing a permanently dark surface.
 * No agent actually polls this VPS; values drift on a randomized
 * interval client-side so the page reads as "live" instead of a
 * static snapshot.
 * ------------------------------------------------------------------ */

const BLUE = "#3a86d1";
const OLIVE = "#c3d61f";
const TEAL = "#20a4a0";
const EMERALD = "#10b981";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* Random walk — each tick nudges the value by a small delta instead of
   jumping to a fresh random number, so it reads as a real fluctuating
   load rather than flickering noise. */
function drift(value: number, delta: number, min: number, max: number): number {
  return clamp(value + (Math.random() * 2 - 1) * delta, min, max);
}

/* Points shown across the width of a chart. */
const HISTORY_LENGTH = 30;
const TICK_MS = 1800;

function pushHistory(history: number[], next: number): number[] {
  const updated = [...history, next];
  return updated.length > HISTORY_LENGTH ? updated.slice(updated.length - HISTORY_LENGTH) : updated;
}

const LOG_LINES = [
  "sshd[2041]: Accepted publickey for root from {ip} port 51322 ssh2",
  "kernel: eth0: link becomes ready",
  "systemd[1]: Started Daily apt download activities.",
  "cron[892]: (root) CMD (run-parts /etc/cron.hourly)",
  "nginx: 200 GET /health 12ms",
  "sshd[2088]: Received disconnect from {ip} port 51322",
  "systemd[1]: Reloading Nginx configuration.",
  "kernel: TCP: request_sock_TCP: Possible SYN flooding, sending cookies",
  "fail2ban.actions: NOTICE [sshd] Ban 45.156.x.x",
  "postfix/smtpd: connect from unknown[{ip}]",
];

interface LogEntry {
  id: number;
  time: string;
  text: string;
}

function MonitorPanel({
  title,
  legend,
  children,
}: {
  title: string;
  legend?: { label: string; color: string }[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
        <p className="truncate text-[13px] font-semibold text-[#1C75BC] dark:text-[#6FA8D8]">{title}</p>
        {legend && (
          <div className="flex shrink-0 items-center gap-3">
            {legend.map((l) => (
              <span
                key={l.label}
                className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function BarStatRow({
  label,
  valueText,
  pct,
  color,
}: {
  label: string;
  valueText: string;
  pct: number;
  color: string;
}) {
  return (
    <div className="pb-3">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className="tabular-nums text-zinc-900 dark:text-zinc-100">{valueText}</span>
      </div>
      <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full motion-safe:transition-[width]"
          style={{ width: `${clamp(pct, 0, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function PlainStatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 pb-3 text-[13px]">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="tabular-nums text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}

interface AreaSeries {
  label: string;
  color: string;
  data: number[];
}

/* Gridded, filled area chart — supports stacking multiple series on top
   of one another (e.g. CPU usage + IO delay, or Used + Available memory). */
function AreaChart({
  series,
  max,
  stacked = false,
  height = 180,
  yTicks,
  xLabels,
}: {
  series: AreaSeries[];
  max: number;
  stacked?: boolean;
  height?: number;
  yTicks: number[];
  xLabels: string[];
}) {
  const width = 640;
  const n = series[0]?.data.length ?? 1;

  const toXY = (arr: number[]) =>
    arr.map((v, i) => {
      const x = n > 1 ? (i / (n - 1)) * width : 0;
      const y = height - (clamp(v, 0, max) / max) * height;
      return [x, y] as const;
    });

  let cumulative = new Array(n).fill(0);
  const layers = series.map((s) => {
    const bottomVals = stacked ? cumulative.slice() : new Array(n).fill(0);
    const topVals = stacked ? cumulative.map((c, i) => c + s.data[i]) : s.data;
    if (stacked) cumulative = topVals;
    const topXY = toXY(topVals);
    const bottomXY = toXY(bottomVals);
    const linePts = topXY.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const areaPts = [...topXY, ...bottomXY.slice().reverse()]
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");
    return { ...s, linePts, areaPts };
  });

  return (
    <div>
      <div className="flex gap-2">
        <div
          className="flex shrink-0 flex-col justify-between text-right text-[11px] leading-none tabular-nums text-zinc-500 dark:text-zinc-400"
          style={{ height }}
        >
          {yTicks
            .slice()
            .reverse()
            .map((t) => (
              <span key={t}>{t}</span>
            ))}
        </div>
        <div className="min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            style={{ height }}
            className="w-full text-zinc-200 dark:text-zinc-800"
          >
            {yTicks.map((t) => (
              <line
                key={`h-${t}`}
                x1={0}
                x2={width}
                y1={height - (t / max) * height}
                y2={height - (t / max) * height}
                stroke="currentColor"
                strokeWidth={1}
              />
            ))}
            {xLabels.map((_, i) => (
              <line
                key={`v-${i}`}
                x1={(i / (xLabels.length - 1)) * width}
                x2={(i / (xLabels.length - 1)) * width}
                y1={0}
                y2={height}
                stroke="currentColor"
                strokeWidth={1}
              />
            ))}
            {layers.map((l) => (
              <g key={l.label}>
                <polygon points={l.areaPts} fill={l.color} fillOpacity={0.45} />
                <polyline points={l.linePts} fill="none" stroke={l.color} strokeWidth={1.5} />
              </g>
            ))}
          </svg>
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">
            {xLabels.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VpsMonitoringPage({
  instanceName,
  publicIp,
  hostname,
  os = "Ubuntu 24.04 LTS",
  region = "Phnom Penh, KH",
  cpuCores = 2,
  memoryTotalGiB = 4,
  storageTotalGiB = 80,
  onBack,
}: {
  instanceName: string;
  publicIp: string;
  hostname?: string;
  os?: string;
  region?: string;
  cpuCores?: number;
  memoryTotalGiB?: number;
  storageTotalGiB?: number;
  onBack: () => void;
}) {
  const [statMode, setStatMode] = useState<"maximum" | "average">("average");

  const [cpu, setCpu] = useState(28);
  const [memory, setMemory] = useState(45);
  const [disk, setDisk] = useState(27);
  const [ioDelay, setIoDelay] = useState(0.45);
  const [loadAvg, setLoadAvg] = useState(1.5);
  const [netDown, setNetDown] = useState(12.4);
  const [netUp, setNetUp] = useState(3.1);

  const [cpuHistory, setCpuHistory] = useState<number[]>(() => Array(HISTORY_LENGTH).fill(28));
  const [memoryHistory, setMemoryHistory] = useState<number[]>(() => Array(HISTORY_LENGTH).fill(45));
  const [ioDelayHistory, setIoDelayHistory] = useState<number[]>(() => Array(HISTORY_LENGTH).fill(0.45));
  const [loadHistory, setLoadHistory] = useState<number[]>(() => Array(HISTORY_LENGTH).fill(1.5));

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const nextLogId = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const metricsTimer = setInterval(() => {
      setCpu((v) => {
        const next = drift(v, 10, 4, 96);
        setCpuHistory((h) => pushHistory(h, next));
        return next;
      });
      setMemory((v) => {
        const next = drift(v, 6, 20, 90);
        setMemoryHistory((h) => pushHistory(h, next));
        return next;
      });
      setDisk((v) => drift(v, 0.6, 15, 85));
      setIoDelay((v) => {
        const next = drift(v, 0.4, 0, 6);
        setIoDelayHistory((h) => pushHistory(h, next));
        return next;
      });
      setLoadAvg((v) => {
        const next = drift(v, 1.5, 0.4, 18);
        setLoadHistory((h) => pushHistory(h, next));
        return next;
      });
      setNetDown((v) => clamp(drift(v, 6, 0.5, 60), 0, 200));
      setNetUp((v) => clamp(drift(v, 2, 0.2, 20), 0, 200));
    }, TICK_MS);
    return () => clearInterval(metricsTimer);
  }, []);

  useEffect(() => {
    const logTimer = setInterval(() => {
      const line = LOG_LINES[Math.floor(Math.random() * LOG_LINES.length)].replace("{ip}", publicIp);
      setLogs((prev) => {
        const entry: LogEntry = {
          id: nextLogId.current++,
          time: new Date().toLocaleTimeString(undefined, { hour12: false }),
          text: line,
        };
        const next = [...prev, entry];
        return next.length > 40 ? next.slice(next.length - 40) : next;
      });
    }, 2600);
    return () => clearInterval(logTimer);
  }, [publicIp]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [logs]);

  const xLabels = Array.from({ length: 6 }, (_, i) => {
    const totalMs = HISTORY_LENGTH * TICK_MS;
    const t = new Date(Date.now() - totalMs * (1 - i / 5));
    return t.toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit" });
  });

  const memUsedGiB = (memory / 100) * memoryTotalGiB;
  const memAvailableHistory = memoryHistory.map((v) => memoryTotalGiB - (v / 100) * memoryTotalGiB);
  const memUsedHistory = memoryHistory.map((v) => (v / 100) * memoryTotalGiB);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-[#1C75BC] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C75BC]/40 dark:text-[#6FA8D8]"
      >
        <ChevronLeft className="h-4 w-4" animateOnHover animateOnTap />
        Back to {instanceName}
      </button>

      <div className="mt-5 flex items-center gap-3">
        <h1 className="text-[30px] font-bold leading-none tracking-[-0.02em] text-zinc-900 dark:text-zinc-50">
          Monitoring
        </h1>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </div>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        Key metrics for {instanceName} — a live sample; values drift on their own instead of
        reflecting a real monitoring agent.
      </p>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[13px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          Hour
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
        </button>
        <div className="flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          {(["maximum", "average"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setStatMode(mode)}
              className={
                mode === statMode
                  ? "bg-zinc-100 px-3 py-1.5 text-[13px] capitalize text-zinc-900 motion-safe:transition-colors dark:bg-zinc-800 dark:text-zinc-100"
                  : "bg-white px-3 py-1.5 text-[13px] capitalize text-zinc-500 motion-safe:transition-colors dark:bg-zinc-900 dark:text-zinc-400"
              }
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonitorPanel title={`${hostname ?? instanceName} (Uptime: 14d 6h 22m)`}>
          <BarStatRow
            label="CPU usage"
            valueText={`${cpu.toFixed(2)}% of ${cpuCores} CPUs`}
            pct={cpu}
            color={BLUE}
          />
          <BarStatRow
            label="IO delay"
            valueText={`${ioDelay.toFixed(2)}%`}
            pct={(ioDelay / 10) * 100}
            color={OLIVE}
          />
          <BarStatRow
            label="RAM usage"
            valueText={`${memory.toFixed(2)}% (${memUsedGiB.toFixed(2)} GiB of ${memoryTotalGiB} GiB)`}
            pct={memory}
            color={TEAL}
          />
          <PlainStatRow
            label="Load average"
            value={`${loadAvg.toFixed(2)}, ${(loadAvg * 0.92).toFixed(2)}, ${(loadAvg * 0.85).toFixed(2)}`}
          />
          <BarStatRow
            label="HD space"
            valueText={`${disk.toFixed(2)}% (${((disk / 100) * storageTotalGiB).toFixed(1)} GiB of ${storageTotalGiB} GiB)`}
            pct={disk}
            color={OLIVE}
          />
          <PlainStatRow label="Network" value={`↓ ${netDown.toFixed(1)} · ↑ ${netUp.toFixed(1)} Mbps`} />

          <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />

          <div className="pt-3">
            <PlainStatRow label="Operating System" value={os} />
            <PlainStatRow label="Region" value={region} />
            <PlainStatRow
              label="Health"
              value={
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: EMERALD }} />
                  Healthy — 3 / 3 OSDs up
                </span>
              }
            />
            <PlainStatRow
              label="VM Status"
              value={
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: EMERALD }} />
                  Running
                </span>
              }
            />
          </div>
        </MonitorPanel>

        <MonitorPanel
          title="CPU Usage"
          legend={[
            { label: "CPU usage", color: BLUE },
            { label: "IO delay", color: OLIVE },
          ]}
        >
          <AreaChart
            series={[
              { label: "CPU usage", color: BLUE, data: cpuHistory },
              { label: "IO delay", color: OLIVE, data: ioDelayHistory },
            ]}
            max={100}
            stacked
            yTicks={[0, 20, 40, 60, 80, 100]}
            xLabels={xLabels}
          />
        </MonitorPanel>

        <MonitorPanel title="Server Load" legend={[{ label: "Load average", color: OLIVE }]}>
          <AreaChart
            series={[{ label: "Load average", color: OLIVE, data: loadHistory }]}
            max={20}
            yTicks={[0, 5, 10, 15, 20]}
            xLabels={xLabels}
          />
        </MonitorPanel>

        <MonitorPanel
          title="Memory usage"
          legend={[
            { label: "Used", color: TEAL },
            { label: "Available", color: OLIVE },
          ]}
        >
          <AreaChart
            series={[
              { label: "Used", color: TEAL, data: memUsedHistory },
              { label: "Available", color: OLIVE, data: memAvailableHistory },
            ]}
            max={memoryTotalGiB}
            stacked
            yTicks={[0, memoryTotalGiB / 2, memoryTotalGiB]}
            xLabels={xLabels}
          />
        </MonitorPanel>
      </div>

      <div className="mt-4">
        <MonitorPanel title="System Log">
          <p className="mb-3 text-[11px] text-zinc-500 dark:text-zinc-400">
            Tailing /var/log/syslog — new lines stream in every few seconds.
          </p>
          <div
            ref={logRef}
            className="h-64 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[12px] leading-[1.7] text-zinc-300"
          >
            {logs.length === 0 ? (
              <p className="text-zinc-600">Waiting for log output…</p>
            ) : (
              logs.map((entry) => (
                <div key={entry.id} className="whitespace-pre-wrap">
                  <span className="text-zinc-500">{entry.time}</span>{" "}
                  <span className="text-[#6FA8D8]">
                    {instanceName.split(" ").join("-").toLowerCase()}
                  </span>{" "}
                  {entry.text}
                </div>
              ))
            )}
          </div>
        </MonitorPanel>
      </div>
    </div>
  );
}
