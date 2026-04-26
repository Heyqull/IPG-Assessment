import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { incomingLeadSchema } from "@/lib/schemas/lead";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (token !== process.env.INCOMING_API_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  let rawPayload: unknown;

  try {
    rawPayload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data: log } = await supabase
    .from("webhook_logs")
    .insert({ raw_payload: rawPayload, status: "pending" })
    .select("id")
    .single();

  const logId: string = log?.id;

  const parsed = incomingLeadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    await supabase
      .from("webhook_logs")
      .update({ status: "invalid", error: JSON.stringify(parsed.error.flatten()) })
      .eq("id", logId);
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const dupChecks: { field: string; column: string; value: string }[] = [
    { field: "external_id", column: "external_id", value: data.leadId },
    ...(data.phone ? [{ field: "phone", column: "phone", value: data.phone }] : []),
    ...(data.email ? [{ field: "email", column: "email", value: data.email }] : []),
  ];

  for (const check of dupChecks) {
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq(check.column, check.value)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("webhook_logs")
        .update({ status: "duplicate", lead_id: existing.id })
        .eq("id", logId);
      return NextResponse.json(
        { error: "Duplicate lead", field: check.field, value: check.value, existingId: existing.id },
        { status: 409 }
      );
    }
  }

  const { data: lead, error: insertError } = await supabase
    .from("leads")
    .insert({
      external_id: data.leadId,
      name: data.name,
      phone: data.phone ?? null,
      email: data.email ?? null,
      source: data.source ?? null,
      project: data.project ?? null,
      budget: data.budget ?? null,
      message: data.message ?? null,
      external_created_at: data.createdAt ?? null,
    })
    .select("id, external_id, name, phone, email, source, project, budget, message, status, created_at")
    .single();

  if (insertError || !lead) {
    await supabase
      .from("webhook_logs")
      .update({ status: "error", error: insertError?.message })
      .eq("id", logId);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  await supabase
    .from("webhook_logs")
    .update({ status: "ok", lead_id: lead.id })
    .eq("id", logId);

  return NextResponse.json({ id: lead.id, external_id: lead.external_id, name: lead.name, phone: lead.phone, email: lead.email, source: lead.source, project: lead.project, budget: lead.budget, message: lead.message, status: lead.status, created_at: lead.created_at }, { status: 201 });
}
