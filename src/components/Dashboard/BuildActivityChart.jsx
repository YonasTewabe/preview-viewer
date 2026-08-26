import { useState } from "react";
import { Card, Spin } from "antd";
import {
  BarChart2,
  CheckCircle,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { useBuildActivity } from "../../hooks/useBuildActivity";

// ─── Time range options ────────────────────────────────────────────────────────
const RANGES = [
  { label: "24H",  value: "24h" },
  { label: "7D",   value: "7d" },
  { label: "30D",  value: "30d" },
  { label: "All",  value: "all" },
];

// ─── Axis tick formatter ───────────────────────────────────────────────────────
function formatXTick(value, range) {
  if (!value) return "";
  if (range === "24h") {
    // value: "2026-08-24 14:00" → "14:00"
    return value.slice(-5);
  }
  // value: "2026-08-24" → "Aug 24"
  const [, month, day] = value.split("-");
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, range }) {
  if (!active || !payload?.length) return null;

  const total      = payload.find((p) => p.dataKey === "total")?.value ?? 0;
  const successful = payload.find((p) => p.dataKey === "successful")?.value ?? 0;
  const failed     = payload.find((p) => p.dataKey === "failed")?.value ?? 0;

  return (
    <div
      className="rounded-xl border px-4 py-3 text-sm shadow-xl"
      style={{
        background: "var(--app-card, #1a1f2e)",
        borderColor: "var(--app-border, #2d3748)",
        minWidth: 160,
      }}
    >
      <p className="mb-2 font-semibold" style={{ color: "var(--app-text, #e2e8f0)" }}>
        {range === "24h" ? label : formatXTick(label, range)}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: "#818cf8" }}>
            <span className="inline-block h-2 w-2 rounded-full bg-[#818cf8]" />
            Total
          </span>
          <span className="font-bold" style={{ color: "#818cf8" }}>{total}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: "#34d399" }}>
            <span className="inline-block h-2 w-2 rounded-full bg-[#34d399]" />
            Success
          </span>
          <span className="font-bold" style={{ color: "#34d399" }}>{successful}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: "#f87171" }}>
            <span className="inline-block h-2 w-2 rounded-full bg-[#f87171]" />
            Failed
          </span>
          <span className="font-bold" style={{ color: "#f87171" }}>{failed}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Legend ────────────────────────────────────────────────────────────────────
function ChartLegend({ summary }) {
  const inRange = summary?.total ?? 0;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
      <span className="flex items-center gap-1.5" style={{ color: "var(--app-text-muted, #94a3b8)" }}>
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#818cf8]" />
        Total
      </span>
      <span className="flex items-center gap-1.5" style={{ color: "var(--app-text-muted, #94a3b8)" }}>
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#34d399]" />
        Successful
      </span>
      <span className="flex items-center gap-1.5" style={{ color: "var(--app-text-muted, #94a3b8)" }}>
        <span
          className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#f87171]"
          style={{ background: "transparent", borderStyle: "dashed" }}
        />
        Failed
      </span>
      <span
        className="ml-auto rounded-full border px-2.5 py-0.5 font-medium"
        style={{
          borderColor: "var(--app-border, #2d3748)",
          color: "var(--app-text-muted, #94a3b8)",
        }}
      >
        {inRange} in this range
      </span>
    </div>
  );
}

// ─── Summary stat pill ─────────────────────────────────────────────────────────
function SummaryPill({ label, value, iconClass, valueClass }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 flex-1 min-w-[130px]"
      style={{
        borderColor: "var(--app-border, #2d3748)",
        background: "var(--app-surface, #131720)",
      }}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--app-text-muted, #94a3b8)" }}
        >
          {label}
        </p>
        <p className={`text-xl font-bold leading-tight ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function BuildActivityChart() {
  const [range, setRange] = useState("24h");
  const { data, isLoading, isError } = useBuildActivity(range);

  const summary = data?.summary ?? {
    total: 0,
    successful: 0,
    failed: 0,
    successRate: 0,
    activeBuilds: 0,
  };
  const series = data?.series ?? [];

  // Avg builds per day — meaningful for any range
  const avgPerDay = series.length > 0
    ? Math.round((summary.total / Math.max(series.length, 1)) * 10) / 10
    : 0;

  // Determine max y value for a clean ceiling
  const maxVal = series.reduce((m, d) => Math.max(m, d.total ?? 0), 0);
  const yMax = maxVal === 0 ? 10 : Math.ceil(maxVal * 1.2);

  return (
    <Card
      className="shadow-sm"
      styles={{ body: { padding: "20px 24px 16px" } }}
    >
      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: "color-mix(in srgb,var(--app-primary,#6366f1) 15%,transparent)" }}
          >
            <BarChart2
              size={18}
              style={{ color: "var(--app-primary, #6366f1)" }}
            />
          </span>
          <div>
            <h3
              className="text-base font-semibold leading-tight"
              style={{ color: "var(--app-text, #e2e8f0)" }}
            >
              Build activity
            </h3>
            <p
              className="text-xs"
              style={{ color: "var(--app-text-muted, #94a3b8)" }}
            >
              Aggregated from node build history
            </p>
          </div>
        </div>

        {/* Range selector */}
        <div
          className="flex rounded-lg p-0.5 text-xs font-medium"
          style={{
            border: "1px solid var(--app-border, #2d3748)",
            background: "var(--app-surface, #131720)",
          }}
        >
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`cursor-pointer rounded-md px-3 py-1.5 transition-colors ${
                range === r.value
                  ? "text-white"
                  : "hover:opacity-80"
              }`}
              style={
                range === r.value
                  ? { background: "var(--app-primary, #6366f1)", color: "#fff" }
                  : { background: "transparent", color: "var(--app-text-muted, #94a3b8)" }
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary pills ── */}
      <div className="mb-5 flex flex-wrap gap-3">
        <SummaryPill
          icon={CheckCircle}
          label="Success Rate"
          value={`${summary.successRate}%`}
          iconClass="bg-emerald-500/15 text-emerald-400"
          valueClass="text-emerald-400"
        />
        <SummaryPill
          icon={Zap}
          label="Avg / Day"
          value={avgPerDay}
          iconClass="bg-violet-500/15 text-violet-400"
          valueClass="text-violet-400"
        />
        <SummaryPill
          icon={RefreshCw}
          label="Total Executions"
          value={summary.total}
          iconClass="bg-indigo-500/15 text-indigo-400"
          valueClass="text-indigo-400"
        />
      </div>

      {/* ── Chart ── */}
      {isLoading ? (
        <div className="flex h-52 items-center justify-center">
          <Spin size="large" />
        </div>
      ) : isError ? (
        <div className="flex h-52 items-center justify-center text-sm" style={{ color: "var(--app-text-muted)" }}>
          Failed to load build activity data.
        </div>
      ) : series.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm" style={{ color: "var(--app-text-muted)" }}>
          No build history yet for this time range.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={series}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--app-border, #2d3748)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatXTick(v, range)}
              tick={{ fontSize: 11, fill: "var(--app-text-muted, #94a3b8)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, yMax]}
              tick={{ fontSize: 11, fill: "var(--app-text-muted, #94a3b8)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip range={range} />}
              cursor={{ stroke: "var(--app-border, #2d3748)", strokeWidth: 1 }}
            />
            {/* Total */}
            <Line
              type="monotone"
              dataKey="total"
              stroke="#818cf8"
              strokeWidth={2}
              dot={{ r: 3, fill: "#818cf8", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#818cf8" }}
            />
            {/* Successful */}
            <Line
              type="monotone"
              dataKey="successful"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 3, fill: "#34d399", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#34d399" }}
            />
            {/* Failed */}
            <Line
              type="monotone"
              dataKey="failed"
              stroke="#f87171"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 3, fill: "#f87171", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#f87171" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* ── Legend ── */}
      <ChartLegend summary={summary} range={range} />
    </Card>
  );
}
