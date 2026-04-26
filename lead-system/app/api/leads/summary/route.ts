import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/types";

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, project, status, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byStatus = { new: 0, contacted: 0, qualified: 0, won: 0, lost: 0 } as Record<LeadStatus, number>;
  for (const lead of data) {
    if (lead.status in byStatus) byStatus[lead.status as LeadStatus]++;
  }

  return NextResponse.json({
    total: data.length,
    byStatus,
    recent: data.slice(0, 4),
  });
}
