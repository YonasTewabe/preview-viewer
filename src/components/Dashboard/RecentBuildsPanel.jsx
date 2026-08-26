import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Pagination, Spin } from "antd";
import { GitBranch, Search, ArrowRight } from "lucide-react";
import { useRecentBuilds } from "../../hooks/useRecentBuilds";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateString) {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

/** First letter(s) for the avatar circle */
function initials(name) {
  const parts = String(name ?? "?")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Consistent color per first char */
const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-blue-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];
function avatarColor(name) {
  const code = String(name ?? "").charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    success:  { label: "Passed",    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    failed:   { label: "Failed",    cls: "bg-rose-500/15    text-rose-400    border-rose-500/30" },
    building: { label: "Building",  cls: "bg-blue-500/15    text-blue-400    border-blue-500/30" },
    unknown:  { label: "Unknown",   cls: "bg-zinc-500/15    text-zinc-400    border-zinc-500/30" },
  };
  const cfg = map[status] ?? map.unknown;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Single build card ─────────────────────────────────────────────────────────
function BuildCard({ build }) {
  const canLink = build.project_id && build.node_id;
  const detailPath = canLink
    ? `/projects/${build.project_id}/nodes/${build.node_id}`
    : null;

  const inner = (
    <div className="flex flex-col gap-3 h-full">
      {/* Top row: avatar + name + badge */}
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${avatarColor(build.service_name)}`}
        >
          {initials(build.service_name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="truncate text-sm font-semibold"
              style={{ color: "var(--app-text)" }}
            >
              {build.service_name}
            </span>
            <StatusBadge status={build.status} />
          </div>
        </div>
      </div>

      {/* Tags: branch · project · build # */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {/* Branch */}
        <span
          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono"
          style={{
            borderColor: "var(--app-border)",
            color: "var(--app-text-muted)",
            background: "var(--app-surface)",
          }}
        >
          <GitBranch size={10} className="shrink-0" />
          {build.branch_name}
        </span>
        {/* Project */}
        <span
          className="inline-flex items-center rounded-md border px-2 py-0.5"
          style={{
            borderColor: "var(--app-border)",
            color: "var(--app-text-muted)",
            background: "var(--app-surface)",
          }}
        >
          {build.project_name}
        </span>
        {/* Build number */}
        {build.build_number != null && (
          <span
            className="inline-flex items-center rounded-md border px-2 py-0.5 font-mono"
            style={{
              borderColor: "var(--app-border)",
              color: "var(--app-text-muted)",
              background: "var(--app-surface)",
            }}
          >
            #{build.build_number}
          </span>
        )}
      </div>

      {/* Footer: time ago + view link */}
      <div
        className="mt-auto flex items-center justify-between border-t pt-2.5 text-xs"
        style={{ borderColor: "var(--app-border)", color: "var(--app-text-muted)" }}
      >
        <span>{formatTimeAgo(build.built_at)}</span>
        {detailPath && (
          <span className="flex items-center gap-1 font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            View node <ArrowRight size={12} />
          </span>
        )}
      </div>
    </div>
  );

  const baseClass =
    "rounded-xl border p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg flex flex-col h-full";

  return detailPath ? (
    <Link
      to={detailPath}
      className={`${baseClass} no-underline hover:text-inherit text-inherit`}
      style={{
        borderColor: "var(--app-border)",
        background: "var(--app-surface)",
      }}
    >
      {inner}
    </Link>
  ) : (
    <div
      className={`${baseClass} cursor-default`}
      style={{
        borderColor: "var(--app-border)",
        background: "var(--app-surface)",
      }}
    >
      {inner}
    </div>
  );
}

// ─── Filter tab ────────────────────────────────────────────────────────────────
function FilterTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
      style={
        active
          ? { background: "var(--app-primary, #6366f1)", color: "#fff" }
          : { background: "transparent", color: "var(--app-text-muted, #94a3b8)" }
      }
    >
      {label}
    </button>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────────────
export default function RecentBuildsPanel() {
  const [page,   setPage]   = useState(1);
  const [status, setStatus] = useState("all");
  const [q,      setQ]      = useState("");
  const [inputQ, setInputQ] = useState("");

  const { data, isLoading, isError } = useRecentBuilds({ page, limit: 6, status, q });

  const builds     = data?.builds     ?? [];
  const total      = data?.total      ?? 0;

  // Debounce search: commit on Enter or after blur
  const handleSearch = useCallback((val) => {
    setQ(val);
    setPage(1);
  }, []);

  const handleStatusChange = (val) => {
    setStatus(val);
    setPage(1);
  };

  return (
    <div
      className="rounded-xl border shadow-sm"
      style={{
        borderColor: "var(--app-border)",
        background: "var(--app-card, var(--app-bg))",
      }}
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-5"
        style={{ borderColor: "var(--app-border)" }}
      >
        <div>
          <h3 className="text-base font-semibold" style={{ color: "var(--app-text)" }}>
            Fast lookup
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--app-text-muted)" }}>
            Search recent builds by service, project, or branch
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search input */}
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-1.5"
            style={{
              borderColor: "var(--app-border)",
              background: "var(--app-surface)",
            }}
          >
            <Search size={13} style={{ color: "var(--app-text-muted)" }} />
            <input
              type="text"
              placeholder="Search builds..."
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(inputQ)}
              onBlur={() => handleSearch(inputQ)}
              className="w-44 bg-transparent text-sm outline-none placeholder:text-zinc-500"
              style={{ color: "var(--app-text)" }}
            />
          </div>

          {/* Status filter */}
          <div
            className="flex rounded-lg p-0.5"
            style={{
              border: "1px solid var(--app-border)",
              background: "var(--app-surface)",
            }}
          >
            {["all", "passed", "failed"].map((s) => (
              <FilterTab
                key={s}
                label={s.charAt(0).toUpperCase() + s.slice(1)}
                active={status === s}
                onClick={() => handleStatusChange(s)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 py-5">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spin size="large" />
          </div>
        ) : isError ? (
          <div className="flex h-48 items-center justify-center text-sm"
            style={{ color: "var(--app-text-muted)" }}
          >
            Failed to load builds.
          </div>
        ) : builds.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm"
            style={{ color: "var(--app-text-muted)" }}
          >
            No builds found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {builds.map((build) => (
              <BuildCard key={build.id} build={build} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer: count + pagination ── */}
      {total > 0 && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4"
          style={{ borderColor: "var(--app-border)" }}
        >
          <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>
            Showing {Math.min((page - 1) * 6 + builds.length, total)} of {total} builds
          </span>
          <Pagination
            current={page}
            total={total}
            pageSize={6}
            onChange={(p) => setPage(p)}
            size="small"
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}
