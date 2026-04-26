export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

export interface Agent {
  id: string;
  name: string;
  email: string;
}

export interface Lead {
  id: string;
  external_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  project: string | null;
  budget: number | null;
  message: string | null;
  status: LeadStatus;
  assigned_agent_id: string | null;
  agents: Agent | null;
  external_created_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  body: string;
  author: string;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  lead_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  changed_at: string;
}
