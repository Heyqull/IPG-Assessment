import { z } from "zod";

export const incomingLeadSchema = z.object({
  leadId: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  source: z.string().optional(),
  project: z.string().optional(),
  budget: z.number().positive().optional(),
  message: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});

export type IncomingLead = z.infer<typeof incomingLeadSchema>;
