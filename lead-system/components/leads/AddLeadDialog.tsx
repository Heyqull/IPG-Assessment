"use client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const SAMPLE_PAYLOAD = JSON.stringify(
  {
    leadId: "LD1002",
    name: "Sara Lim",
    phone: "0198765432",
    email: "sara@email.com",
    source: "Google Ads",
    project: "Pelangi Heights",
    budget: 450000,
    message: "Looking for a 2-bedroom unit",
    createdAt: "2026-04-25T09:00:00Z",
  },
  null,
  2
);

interface Row { label: string; value: string }

const HEADERS: Row[] = [
  { label: "Method", value: "POST" },
  { label: "URL", value: "http://localhost:3000/api/leads/incoming" },
  { label: "Content-Type", value: "application/json" },
  { label: "Authorization", value: "Bearer supersecrettoken123" },
];

export function AddLeadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Lead via API</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Send a <code className="bg-muted px-1 rounded text-xs">POST</code> request using Postman or curl with the details below.
        </p>

        <div className="rounded-lg border overflow-hidden text-sm">
          {HEADERS.map(({ label, value }) => (
            <div key={label} className="flex border-b last:border-b-0 divide-x">
              <span className="w-36 shrink-0 px-3 py-2 bg-muted text-muted-foreground font-medium text-xs">
                {label}
              </span>
              <span className="px-3 py-2 font-mono text-xs break-all">{value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Body (raw JSON)</p>
          <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
            {SAMPLE_PAYLOAD}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
