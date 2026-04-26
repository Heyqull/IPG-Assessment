"use client";
import type { LeadStatus } from "@/types";

const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];

const STATUS_COLORS: Record<LeadStatus, string> = {
  new:       "#8FB9A8",
  contacted: "#FEFAD4",
  qualified: "#FCD0BA",
  won:       "#F1828D",
  lost:      "#765D69",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Summary {
  total: number;
  byStatus: Record<LeadStatus, number>;
  recent: { id: string; name: string; project: string | null; created_at: string }[];
}

function PieChart({ byStatus, total }: { byStatus: Record<LeadStatus, number>; total: number }) {
  const r = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = STATUSES.map((s) => {
    const count = byStatus[s] ?? 0;
    const fraction = total > 0 ? count / total : 0;
    const dash = fraction * circumference;
    const slice = { status: s, dash, offset, count };
    offset += dash;
    return slice;
  });

  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="20" />
        ) : (
          slices.map(({ status, dash, offset: off }) => (
            <circle
              key={status}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={STATUS_COLORS[status]}
              strokeWidth="20"
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset={-off}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "60px 60px",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))",
                transition: "stroke-width 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.strokeWidth = "24")}
              onMouseLeave={(e) => (e.currentTarget.style.strokeWidth = "20")}
            />
          ))
        )}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="21" style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px", pointerEvents: "none" }} />
      </svg>
      <div className="space-y-1.5 flex-1">
        {STATUSES.map((s) => (
          <div key={s} className="flex items-center justify-between gap-2 group/row">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 transition-transform duration-200 group-hover/row:scale-125"
                style={{ backgroundColor: STATUS_COLORS[s] }}
              />
              <span className="text-xs capitalize font-medium text-muted-foreground">{s}</span>
            </div>
            <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center bg-slate-100 transition-all duration-200 group-hover/row:bg-slate-200 group-hover/row:scale-110 text-foreground">
              {byStatus[s] ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SummaryStrip({ data }: { data: Summary | null }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-2xl shadow-sm p-5 overflow-hidden relative transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default" style={{ background: "rgb(143, 185, 168)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#fff" }}>Total Leads</p>
        <p className="text-7xl font-bold text-white">{data.total}</p>
        <p className="text-xs mt-2 text-white">across all statuses</p>
        <div className="absolute -bottom-5 -right-5 w-28 h-28 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
        <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.03)" }} />
        <div className="absolute top-4 right-5 text-5xl opacity-10">🏠</div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-5 overflow-hidden relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default border-l-4" style={{ borderLeftColor: "#8FB9A8" }}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">By Status</p>
        <PieChart byStatus={data.byStatus} total={data.total} />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-5 overflow-hidden relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default border-l-4" style={{ borderLeftColor: "#8FB9A8" }}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Leads</p>
        <div className="space-y-2.5">
          {data.recent.length === 0 && <p className="text-xs text-muted-foreground">No leads yet.</p>}
          {data.recent.map((lead) => (
            <div key={lead.id} className="flex items-start justify-between gap-2 rounded-lg px-2 py-1 -mx-2 transition-colors duration-200 hover:bg-slate-50">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{lead.name}</p>
                <p className="text-xs text-muted-foreground truncate">{lead.project ?? "—"}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{timeAgo(lead.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
