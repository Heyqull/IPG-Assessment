"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { LeadCard } from "@/components/leads/LeadCard";
import { AddLeadDialog } from "@/components/leads/AddLeadDialog";
import { SummaryStrip } from "@/components/leads/SummaryStrip";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Agent, Lead, LeadStatus } from "@/types";

const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];
const COL = "grid-cols-[minmax(160px,2fr)_1fr_130px_1fr_100px_36px]";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [summary, setSummary] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const expandedIdRef = useRef<string | null>(null);
  expandedIdRef.current = expandedId;

  const fetchSummary = useCallback(async () => {
    const res = await fetch("/api/leads/summary");
    const data = await res.json();
    setSummary(data);
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error(`Failed to load leads (${res.status})`);
      const data = await res.json();
      setLeads(data);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => { fetchLeads(); fetchSummary(); }, [fetchLeads, fetchSummary]);

  useEffect(() => {
    fetch("/api/agents").then((r) => r.json()).then(setAgents);
  }, []);

  useEffect(() => {
    const supabase = getBrowserClient();
    const channel = supabase
      .channel("leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        fetchSummary();
        if (!expandedIdRef.current) fetchLeads();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads, fetchSummary]);

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f0f4f0 0%, #e8eef2 50%, #eef0f5 100%)" }}>
      {/* Top navbar */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <img src="/house.jpg" alt="logo" className="w-10 h-10 rounded-lg object-cover mix-blend-multiply" />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">Leads Management System</h1>
            <p className="text-xs text-muted-foreground">Internal CRM · Property Division</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
            <Button size="sm" className="rounded-full px-5" onClick={() => setShowAddDialog(true)}>+ Add New Lead</Button>
          </div>
        </div>
      </header>

      <AddLeadDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} />

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <SummaryStrip data={summary} />

        {/* Search & filter bar */}
        <div className="bg-white rounded-2xl shadow-sm border px-4 py-3 flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search name, phone, email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>
          <div className="w-px h-5 bg-border" />
          <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
            <SelectTrigger className="w-40 border-0 shadow-none h-auto py-0 text-sm text-muted-foreground focus:ring-0">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg border-0 overflow-hidden p-1 w-44">
              <SelectItem value="all" className="rounded-lg text-sm">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="rounded-lg text-sm capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Leads table */}
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : error ? (
          <p className="text-red-500 text-sm bg-white/80 rounded-lg px-4 py-3">{error}</p>
        ) : leads.length === 0 ? (
          <p className="text-muted-foreground text-sm">No leads found.</p>
        ) : (
          <div className="rounded-2xl border shadow-sm overflow-hidden">
            <div className={`grid ${COL} divide-x divide-white/10`} style={{ background: "rgb(143, 185, 168)" }}>
              {["Name & Project", "Source", "Status", "Agent", "Created", ""].map((h) => (
                <div key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white">
                  {h}
                </div>
              ))}
            </div>
            <div className="bg-white">
              {leads.map((lead, i) => (
                <LeadCard
                  key={lead.id}
                  col={COL}
                  lead={lead}
                  agents={agents}
                  expanded={expandedId === lead.id}
                  isLast={i === leads.length - 1}
                  onToggle={() => toggle(lead.id)}
                  onSaved={() => { setExpandedId(null); fetchLeads(); fetchSummary(); }}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
