import type { VpsRegion } from "../data/regions";

/* ------------------------------------------------------------------ *
 * Stylized Cambodia outline — not surveyed geography, just a
 * recognizable silhouette (northern border, the Mekong's southeast
 * tail toward Vietnam, Tonle Sap lake) so a region card reads as "a
 * map" rather than a bare list of coordinates. Region dots plot at the
 * `x`/`y` percentages on VpsRegion, not real lat/lng.
 * ------------------------------------------------------------------ */

const CAMBODIA_OUTLINE =
  "M 118,34 L 170,24 L 222,34 L 252,58 L 270,96 L 262,132 L 232,150 " +
  "L 248,180 L 238,214 L 210,240 L 196,270 L 168,276 L 148,254 " +
  "L 120,246 L 98,220 L 84,186 L 72,146 L 78,100 L 96,62 Z";

export function CambodiaMap({
  regions,
  selectedId,
  className,
}: {
  regions: VpsRegion[];
  selectedId?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 340 300"
      className={className}
      role="img"
      aria-label="Map of Cambodia with datacenter regions"
    >
      <path
        d={CAMBODIA_OUTLINE}
        className="fill-zinc-100 stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-700"
        strokeWidth={1.5}
      />
      {/* Tonle Sap lake, roughly central-north */}
      <ellipse
        cx={128}
        cy={92}
        rx={26}
        ry={13}
        transform="rotate(-20 128 92)"
        className="fill-[#1C75BC]/15 dark:fill-[#6FA8D8]/15"
      />

      {regions.map((region) => {
        const cx = (region.x / 100) * 340;
        const cy = (region.y / 100) * 300;
        const selected = region.id === selectedId;
        return (
          <g key={region.id}>
            {selected && (
              <circle cx={cx} cy={cy} r={11} className="fill-[#1C75BC]/20 dark:fill-[#6FA8D8]/20">
                <animate attributeName="r" values="9;14;9" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.05;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={cx}
              cy={cy}
              r={selected ? 5 : 3}
              className={
                selected
                  ? "fill-[#1C75BC] stroke-white dark:stroke-zinc-900"
                  : region.available
                  ? "fill-emerald-500 stroke-white dark:stroke-zinc-900"
                  : "fill-zinc-400 stroke-white dark:fill-zinc-600 dark:stroke-zinc-900"
              }
              strokeWidth={1.5}
            />
            <text
              x={cx}
              y={cy - (selected ? 10 : 7)}
              textAnchor="middle"
              className={
                selected
                  ? "fill-zinc-900 text-[9px] font-semibold dark:fill-zinc-100"
                  : "fill-zinc-400 text-[8px] dark:fill-zinc-500"
              }
            >
              {region.city}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
