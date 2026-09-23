/** Plain CSS bar chart — no charting dependency for Media's few panels. */
export function MediaBarChart({
  data,
  labelEvery,
}: {
  data: { label: string; value: number }[];
  /** Thin the x-axis so long ranges don't overlap their own labels. */
  labelEvery?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const every = labelEvery ?? Math.max(1, Math.ceil(data.length / 7));

  return (
    <div>
      <div className="flex h-[190px] items-end gap-[3px]">
        {data.map((point, i) => (
          <div
            key={`${point.label}-${i}`}
            className="group relative min-w-0 flex-1 rounded-t-sm bg-[#1C75BC]/20 transition-colors hover:bg-[#1C75BC]/40 dark:bg-[#6FA8D8]/20 dark:hover:bg-[#6FA8D8]/40"
            style={{ height: `${Math.max((point.value / max) * 100, 3)}%` }}
          >
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-1.5 py-0.5 text-[11px] text-white group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
              {point.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex text-[11px] text-zinc-400 dark:text-zinc-500">
        {data.map((point, i) => (
          <span key={`${point.label}-${i}`} className="min-w-0 flex-1 truncate text-center">
            {i % every === 0 ? point.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
