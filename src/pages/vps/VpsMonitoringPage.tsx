import { useEffect, useRef, useState } from "react";

import { Activity } from "@/components/animate-ui/icons/activity";
import { ChevronLeft } from "@/components/animate-ui/icons/chevron-left";
import { Cpu } from "@/components/animate-ui/icons/cpu";
import { FileText } from "@/components/animate-ui/icons/file-text";
import { HardDrive } from "@/components/animate-ui/icons/hard-drive";
import { HeartPulse } from "@/components/animate-ui/icons/heart-pulse";
import { MemoryStick } from "@/components/animate-ui/icons/memory-stick";
import { Network } from "@/components/animate-ui/icons/network";
import { Card, CardTitle } from "@/components/ui/card";

import { RadialGauge, StatusBadge } from "../../components/atoms";

/* ------------------------------------------------------------------ *
 * VPS Monitoring — a live-updating sample of the metrics a real
 * monitoring agent would report. No agent actually polls this VPS;
 * values drift on a randomized interval client-side so the page reads
 * as "live" instead of a static snapshot.
 * ------------------------------------------------------------------ */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* Random walk — each tick nudges the value by a small delta instead of
   jumping to a fresh random number, so it reads as a real fluctuating
   load rather than flickering noise. */
function drift(value: number, delta: number, min: number, max: number): number {
  return clamp(value + (Math.random() * 2 - 1) * delta, min, max);
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

export function VpsMonitoringPage({
  instanceName,
  publicIp,
  onBack,
}: {
  instanceName: string;
  publicIp: string;
  onBack: () => void;
}) {
  const [cpu, setCpu] = useState(28);
  const [memory, setMemory] = useState(45);
  const [disk, setDisk] = useState(27);
  const [netDown, setNetDown] = useState(12.4);
  const [netUp, setNetUp] = useState(3.1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const nextLogId = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const metricsTimer = setInterval(() => {
      setCpu((v) => drift(v, 10, 4, 96));
      setMemory((v) => drift(v, 6, 20, 90));
      setDisk((v) => drift(v, 0.6, 15, 85));
      setNetDown((v) => clamp(drift(v, 6, 0.5, 60), 0, 200));
      setNetUp((v) => clamp(drift(v, 2, 0.2, 20), 0, 200));
    }, 1800);
    return () => clearInterval(metricsTimer);
  }, []);

  useEffect(() => {
    const logTimer = setInterval(() => {
      const line = LOG_LINES[Math.floor(Math.random() * LOG_LINES.length)].replace(
        "{ip}",
        publicIp
      );
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

      <div className="mt-6 grid grid-cols-3 gap-5">
        <RadialGauge label="CPU Usage" value={Math.round(cpu)} max={100} unit="%" />
        <RadialGauge label="Memory Usage" value={Math.round(memory)} max={100} unit="%" />
        <RadialGauge label="Disk Usage" value={Math.round(disk)} max={100} unit="%" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <Card>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-900">
              <Network className="h-4 w-4 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
            </span>
            <CardTitle>Network Throughput</CardTitle>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-zinc-500 dark:text-zinc-400">Download</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {netDown.toFixed(1)} Mbps
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-zinc-500 dark:text-zinc-400">Upload</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {netUp.toFixed(1)} Mbps
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-900">
              <HeartPulse className="h-4 w-4 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
            </span>
            <CardTitle>Ceph Health</CardTitle>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Underlying storage cluster
          </p>
          <div className="mt-4">
            <StatusBadge label="Healthy" tone="green" />
            <p className="mt-2 text-[13px] text-zinc-500 dark:text-zinc-400">
              3 / 3 OSDs up · 0 misplaced objects
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-900">
              <Activity className="h-4 w-4 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
            </span>
            <CardTitle>VM Status</CardTitle>
          </div>
          <div className="mt-4">
            <StatusBadge label="Running" tone="green" />
            <p className="mt-2 text-[13px] text-zinc-500 dark:text-zinc-400">Uptime: 14d 6h 22m</p>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-zinc-900">
            <FileText className="h-4 w-4 text-[#1C75BC] dark:text-[#6FA8D8]" animateOnView />
          </span>
          <CardTitle>System Log</CardTitle>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          Tailing /var/log/syslog — new lines stream in every few seconds.
        </p>
        <div
          ref={logRef}
          className="mt-4 h-64 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[12px] leading-[1.7] text-zinc-300"
        >
          {logs.length === 0 ? (
            <p className="text-zinc-600">Waiting for log output…</p>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className="whitespace-pre-wrap">
                <span className="text-zinc-500">{entry.time}</span>{" "}
                <span className="text-[#6FA8D8]">{instanceName.split(" ").join("-").toLowerCase()}</span>{" "}
                {entry.text}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
