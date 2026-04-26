"use client";
import type { LeadStatus } from "@/types";

type StatusConfig = { bg: string; text: string; icon: string };

const config: Record<LeadStatus, StatusConfig> = {
  new:       { bg: "#8FB9A8", text: "#f0e8ec", icon: "●" },
  contacted: { bg: "#FEFAD4", text: "#6b5f1a", icon: "✦" },
  qualified: { bg: "#FCD0BA", text: "#7a3a1e", icon: "✔" },
  won:       { bg: "#F1828D", text: "#7a1228", icon: "✔✔" },
  lost:      { bg: "#765D69", text: "#f0e8ec", icon: "✖" },
};

export const statusColour: Record<LeadStatus, string> = {
  new:       "bg-[#8FB9A8] text-[#f0e8ec]",
  contacted: "bg-[#FEFAD4] text-[#6b5f1a]",
  qualified: "bg-[#FCD0BA] text-[#7a3a1e]",
  won:       "bg-[#F1828D] text-[#7a1228]",
  lost:      "bg-[#765D69] text-[#f0e8ec]",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const { bg, text, icon } = config[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap transition-transform duration-150 hover:scale-105"
      style={{ backgroundColor: bg, color: text }}
    >
      <span className="text-[10px] leading-none">{icon}</span>
      <span className="capitalize">{status}</span>
    </span>
  );
}
