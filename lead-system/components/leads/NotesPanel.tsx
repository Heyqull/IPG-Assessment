"use client";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { LeadNote } from "@/types";

interface Props {
  leadId: string;
  notes: LeadNote[];
  onAdded: () => void;
}

export function NotesPanel({ leadId, notes, onAdded }: Props) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!text.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        const json = await res.json();
        setErr(json.error ?? "Failed to save note");
        return;
      }
      setText("");
      onAdded();
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</p>
      {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
      <div className="space-y-2">
        {notes.map((n) => (
          <div key={n.id} className="bg-muted/40 rounded-md px-3 py-2 text-sm">
            <p>{n.body}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(n.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-end">
        <Textarea
          placeholder="Add a note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="text-sm"
        />
        <Button size="sm" onClick={submit} disabled={saving || !text.trim()}>
          {saving ? "..." : "Add"}
        </Button>
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  );
}
