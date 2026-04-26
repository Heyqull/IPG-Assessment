import type { StatusHistory } from "@/types";

export function StatusHistoryPanel({ history }: { history: StatusHistory[] }) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status History</p>
      <ol className="space-y-1">
        {history.map((h) => (
          <li key={h.id} className="flex gap-3 text-sm">
            <span className="text-muted-foreground text-xs w-32 shrink-0 mt-0.5">
              {new Date(h.changed_at).toLocaleString()}
            </span>
            <span className="capitalize">
              {h.from_status ?? "—"} → <strong>{h.to_status}</strong>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
