"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/leads/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Agent, Lead, LeadNote, LeadStatus, StatusHistory } from "@/types";

const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDetail = useCallback(async () => {
    const [detailRes, agentsRes] = await Promise.all([
      fetch(`/api/leads/${id}`),
      fetch("/api/agents"),
    ]);
    const { lead, notes, history } = await detailRes.json();
    const agentList = await agentsRes.json();
    setLead(lead);
    setNotes(notes ?? []);
    setHistory(history ?? []);
    setAgents(agentList ?? []);
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  async function updateStatus(status: LeadStatus) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchDetail();
  }

  async function assignAgent(agentId: string | null) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_agent_id: agentId === "none" ? null : agentId }),
    });
    fetchDetail();
  }

  async function addNote() {
    if (!noteBody.trim()) return;
    setSaving(true);
    await fetch(`/api/leads/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteBody }),
    });
    setNoteBody("");
    setSaving(false);
    fetchDetail();
  }

  if (!lead) return <p className="p-6 text-muted-foreground">Loading...</p>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/leads")}>← Back</Button>
        <h1 className="text-2xl font-bold">{lead.name}</h1>
        <StatusBadge status={lead.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Lead Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["ID", lead.external_id],
              ["Phone", lead.phone],
              ["Email", lead.email],
              ["Source", lead.source],
              ["Project", lead.project],
              ["Budget", lead.budget ? `RM ${lead.budget.toLocaleString()}` : null],
              ["Message", lead.message],
              ["Created", lead.created_at ? new Date(lead.created_at).toLocaleString() : null],
            ].map(([label, value]) => value ? (
              <div key={String(label)} className="flex gap-2">
                <span className="text-muted-foreground w-20 shrink-0">{label}</span>
                <span>{value}</span>
              </div>
            ) : null)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Manage</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={lead.status} onValueChange={(v) => updateStatus(v as LeadStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Assigned Agent</Label>
              <Select
                value={lead.assigned_agent_id ?? "none"}
                onValueChange={assignAgent}
              >
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {notes.length === 0 && <p className="text-muted-foreground text-sm">No notes yet.</p>}
            {notes.map((n) => (
              <div key={n.id} className="border rounded-md p-3 text-sm space-y-1">
                <p>{n.body}</p>
                <p className="text-muted-foreground text-xs">
                  {n.author} · {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-2">
            <Textarea
              placeholder="Add a note..."
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
            />
            <Button onClick={addNote} disabled={saving || !noteBody.trim()} size="sm">
              {saving ? "Saving..." : "Add Note"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 && <p className="text-muted-foreground text-sm">No changes yet.</p>}
          <ol className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="text-sm flex gap-2 items-start">
                <span className="text-muted-foreground text-xs mt-0.5 w-36 shrink-0">
                  {new Date(h.changed_at).toLocaleString()}
                </span>
                <span>
                  <span className="capitalize">{h.from_status ?? "—"}</span>
                  {" → "}
                  <span className="capitalize font-medium">{h.to_status}</span>
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </main>
  );
}
