import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";

  let query = supabase
    .from("leads")
    .select("id, external_id, name, phone, email, source, project, budget, message, status, assigned_agent_id, created_at, updated_at, agents(id, name, email)")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
