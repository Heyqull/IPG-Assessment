import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();

  const [{ data: lead, error }, { data: notes }, { data: history }] = await Promise.all([
    supabase
      .from("leads")
      .select("*, agents(id, name, email)")
      .eq("id", id)
      .single(),
    supabase
      .from("lead_notes")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("lead_status_history")
      .select("*")
      .eq("lead_id", id)
      .order("changed_at", { ascending: true }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ lead, notes, history });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await req.json();

  const EDITABLE = ["name","phone","email","source","project","budget","message","status","assigned_agent_id"] as const;
  const allowed: Record<string, unknown> = {};
  for (const key of EDITABLE) {
    if (key in body) allowed[key] = body[key] ?? null;
  }

  const { data, error } = await supabase
    .from("leads")
    .update(allowed)
    .eq("id", id)
    .select("*, agents(id, name, email)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
