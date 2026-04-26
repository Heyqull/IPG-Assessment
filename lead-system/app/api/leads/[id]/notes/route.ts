import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  const { body, author = "agent" } = await req.json();

  if (!body?.trim()) {
    return NextResponse.json({ error: "Note body required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lead_notes")
    .insert({ lead_id: id, body, author })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
