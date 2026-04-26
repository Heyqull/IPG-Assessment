"use client";
import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/types";

const colours: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge className={`${colours[status]} border-0 capitalize`}>{status}</Badge>
  );
}
