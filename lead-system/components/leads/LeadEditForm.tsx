"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Agent, Lead, LeadStatus } from "@/types";

const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];

interface Props {
  draft: Partial<Lead>;
  agents: Agent[];
  onChange: (patch: Partial<Lead>) => void;
}

export function LeadEditForm({ draft, agents, onChange }: Props) {
  function field(key: keyof Lead) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ [key]: e.target.value });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input value={draft.name ?? ""} onChange={field("name")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Phone</Label>
          <Input value={draft.phone ?? ""} onChange={field("phone")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input value={draft.email ?? ""} onChange={field("email")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Source</Label>
          <Input value={draft.source ?? ""} onChange={field("source")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Project</Label>
          <Input value={draft.project ?? ""} onChange={field("project")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Budget (RM)</Label>
          <Input
            type="number"
            value={draft.budget ?? ""}
            onChange={(e) => onChange({ budget: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={draft.status ?? "new"}
            onValueChange={(v) => onChange({ status: v as LeadStatus })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Agent</Label>
          <Select
            value={draft.assigned_agent_id ?? "none"}
            onValueChange={(v) => onChange({ assigned_agent_id: v === "none" ? null : v })}
          >
            <SelectTrigger>
              <span className="text-sm">
                {agents.find((a) => a.id === draft.assigned_agent_id)?.name ?? "Unassigned"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Message</Label>
        <Textarea value={draft.message ?? ""} onChange={field("message")} rows={2} />
      </div>
    </div>
  );
}
