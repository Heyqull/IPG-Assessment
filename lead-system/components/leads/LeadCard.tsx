"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, statusColour } from "./StatusBadge";
import { LeadEditForm } from "./LeadEditForm";
import { NotesPanel } from "./NotesPanel";
import { StatusHistoryPanel } from "./StatusHistoryPanel";
import { SavedToast } from "./SavedToast";
import type { Agent, Lead, LeadNote, StatusHistory } from "@/types";

interface Props {
  col: string;
  lead: Lead;
  agents: Agent[];
  expanded: boolean;
  isLast: boolean;
  onToggle: () => void;
  onSaved: () => void;
}

export function LeadCard({ col, lead, agents, expanded, isLast, onToggle, onSaved }: Props) {
  const [fullLead, setFullLead] = useState<Lead>(lead);
  const [draft, setDraft] = useState<Partial<Lead>>({});
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const isDirty = Object.keys(draft).length > 0;

  useEffect(() => {
    if (!expanded) { setDraft({}); setDetailError(null); return; }
    fetch(`/api/leads/${lead.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load lead (${r.status})`);
        return r.json();
      })
      .then(({ lead: full, notes, history }) => {
        if (full) setFullLead(full);
        setNotes(notes ?? []);
        setHistory(history ?? []);
        setDetailError(null);
      })
      .catch((e) => setDetailError(String(e)));
  }, [expanded, lead.id]);

  function refreshDetail() {
    fetch(`/api/leads/${lead.id}`)
      .then((r) => r.json())
      .then(({ lead: full, notes, history }) => {
        if (full) setFullLead(full);
        setNotes(notes ?? []);
        setHistory(history ?? []);
      });
  }

  async function save() {
    if (!isDirty) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const json = await res.json();
        setSaveError(json.error ?? `Save failed (${res.status})`);
        return;
      }
      const updated = await res.json();
      setFullLead(updated);
      setDraft({});
      setSaved(true);
      onSaved();
    } catch (e) {
      setSaveError(String(e));
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft({});
    onToggle();
  }

  const display = { ...fullLead, ...draft };

  return (
    <>
    <SavedToast show={saved} />
    <div className={!isLast ? "border-b" : ""}>
      <div
        className={`grid ${col} divide-x divide-border cursor-pointer transition-all duration-200 ${expanded ? "bg-slate-50" : "hover:bg-slate-50 hover:pl-1"}`}
        onClick={onToggle}
      >
        <div className="px-4 py-3 min-w-0">
          <p className="font-medium text-sm truncate">{display.name}</p>
          <p className="text-xs text-muted-foreground truncate">{display.project ?? "—"}</p>
        </div>
        <div className="px-4 py-3 flex items-center text-sm text-muted-foreground">
          {display.source ?? "—"}
        </div>
        <div className="px-4 py-3 flex items-center">
          <StatusBadge status={display.status ?? "new"} />
        </div>
        <div className="px-4 py-3 flex items-center text-sm text-muted-foreground">
          {display.agents?.name ?? "Unassigned"}
        </div>
        <div className="px-4 py-3 flex items-center text-xs text-muted-foreground">
          {new Date(lead.created_at).toLocaleDateString()}
        </div>
        <div className="px-4 py-3 flex items-center justify-center text-muted-foreground text-xs select-none">
          <span
            className="inline-block transition-transform duration-300"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▼
          </span>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-6 py-5 space-y-5 border-t bg-slate-50/60">
            {detailError && <p className="text-xs text-red-500 bg-red-50 rounded-md px-3 py-2">{detailError}</p>}
            {saveError && <p className="text-xs text-red-500 bg-red-50 rounded-md px-3 py-2">{saveError}</p>}
            <LeadEditForm
              draft={display}
              agents={agents}
              onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
            />
            <Separator />
            <NotesPanel leadId={lead.id} notes={notes} onAdded={refreshDetail} />
            <Separator />
            <StatusHistoryPanel history={history} />
            <div className="flex justify-between pt-1">
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); cancel(); }}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!isDirty || saving}
                onClick={(e) => { e.stopPropagation(); save(); }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
