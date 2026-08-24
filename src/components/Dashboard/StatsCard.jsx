import { Skeleton } from "antd";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * StatsCard — matches the dashboard design:
 *   - Uppercase small label top-left
 *   - Large bold number
 *   - Subtitle line (e.g. "Active infrastructure")
 *   - Icon badge top-right
 *   - Trend chip bottom-left + "vs last 30 days" text
 *
 * Props:
 *   title       string   — uppercase label
 *   value       number   — main metric
 *   subtitle    string   — small descriptor under the value
 *   icon        ReactNode
 *   color       "blue" | "green" | "red" | "orange" | "purple"
 *   trend       "up" | "down" | "new" | "neutral"
 *   trendValue  string   — e.g. "+28%" or "New"
 *   loading     boolean
 */

const COLOR = {
  blue: {
    icon: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    trendUp: "bg-emerald-500/15 text-emerald-400",
    trendDown: "bg-rose-500/15 text-rose-400",
    trendNew: "bg-emerald-500/15 text-emerald-400",
  },
  green: {
    icon: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    trendUp: "bg-emerald-500/15 text-emerald-400",
    trendDown: "bg-rose-500/15 text-rose-400",
    trendNew: "bg-emerald-500/15 text-emerald-400",
  },
  red: {
    icon: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    trendUp: "bg-emerald-500/15 text-emerald-400",
    trendDown: "bg-rose-500/15 text-rose-400",
    trendNew: "bg-emerald-500/15 text-emerald-400",
  },
  orange: {
    icon: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    trendUp: "bg-emerald-500/15 text-emerald-400",
    trendDown: "bg-rose-500/15 text-rose-400",
    trendNew: "bg-emerald-500/15 text-emerald-400",
  },
  purple: {
    icon: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    trendUp: "bg-emerald-500/15 text-emerald-400",
    trendDown: "bg-rose-500/15 text-rose-400",
    trendNew: "bg-emerald-500/15 text-emerald-400",
  },
};

function TrendChip({ trend, trendValue }) {
  if (!trendValue) return null;

  const isDown = trend === "down";
  const isNeutral = !trend || trendValue === "0%";

  const chipClass = isNeutral
    ? "bg-zinc-500/15 text-zinc-400"
    : isDown
      ? "bg-rose-500/15 text-rose-400"
      : "bg-emerald-500/15 text-emerald-400";

  const Icon = !isNeutral && trend === "up"
    ? TrendingUp
    : !isNeutral && isDown
      ? TrendingDown
      : Minus;

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${chipClass}`}>
      <Icon size={11} />
      {trendValue}
    </span>
  );
}

const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
  trend,
  trendValue,
  loading = false,
}) => {
  const palette = COLOR[color] ?? COLOR.blue;

  if (loading) {
    return (
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "var(--app-border)",
          background: "var(--app-card, var(--app-surface))",
        }}
      >
        <Skeleton active paragraph={{ rows: 2 }} title={false} />
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col gap-3"
      style={{
        borderColor: "var(--app-border)",
        background: "var(--app-card, var(--app-surface))",
      }}
    >
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--app-text-muted, #94a3b8)" }}
        >
          {title}
        </span>
        {icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base ${palette.icon}`}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p
          className="text-4xl font-bold leading-none tracking-tight"
          style={{ color: "var(--app-text, #f1f5f9)" }}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {subtitle && (
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--app-text-muted, #94a3b8)" }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Trend row */}
      {trendValue !== undefined && (
        <div className="flex items-center gap-2 pt-1">
          <TrendChip trend={trend} trendValue={trendValue ?? "0%"} />
          <span
            className="text-xs"
            style={{ color: "var(--app-text-muted, #94a3b8)" }}
          >
            vs last 30 days
          </span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
