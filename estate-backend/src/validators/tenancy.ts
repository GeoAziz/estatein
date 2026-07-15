import { z } from "zod";

export const CreateTenantSchema = z.object({
  userId: z.string().min(1),
  propertyId: z.string().min(1).optional(),
  leaseStartDate: z.coerce.date(),
  leaseEndDate: z.coerce.date().optional(),
  monthlyRent: z.number().positive(),
  currency: z.enum(["KSH", "USD", "EUR", "GBP"]).optional(),
  securityDeposit: z.number().nonnegative().optional(),
  paymentDay: z.number().int().min(1).max(31).optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdateTenantSchema = z.object({
  leaseStartDate: z.coerce.date().optional(),
  leaseEndDate: z.coerce.date().nullable().optional(),
  monthlyRent: z.number().positive().optional(),
  currency: z.enum(["KSH", "USD", "EUR", "GBP"]).optional(),
  securityDeposit: z.number().nonnegative().optional(),
  status: z.enum(["active", "inactive", "pending", "evicted"]).optional(),
  paymentDay: z.number().int().min(1).max(31).optional(),
  notes: z.string().max(2000).optional(),
});

export const CreateMaintenanceRequestSchema = z.object({
  tenantId: z.string().min(1),
  propertyId: z.string().min(1).optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().max(100).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  photos: z.array(z.string()).optional(),
});

export const UpdateMaintenanceRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.string().max(100).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  photos: z.array(z.string()).optional(),
});

export const CreateSupportTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.string().max(100).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export const UpdateSupportTicketSchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  category: z.string().max(100).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.enum(["open", "in_progress", "waiting_for_user", "resolved", "closed"]).optional(),
  assignedTo: z.string().min(1).optional(),
});

export const CreateMortgageApplicationSchema = z.object({
  projectId: z.string().min(1).optional(),
  propertyId: z.string().min(1).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(1).max(30),
  monthlyIncome: z.number().positive(),
  employmentType: z.string().max(100).optional(),
  loanAmount: z.number().positive(),
  downPayment: z.number().nonnegative().optional(),
  loanTermYears: z.number().int().positive(),
  propertyValue: z.number().positive(),
  notes: z.string().max(2000).optional(),
});

export const UpdateMortgageApplicationSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(30).optional(),
  monthlyIncome: z.number().positive().optional(),
  employmentType: z.string().max(100).optional(),
  loanAmount: z.number().positive().optional(),
  downPayment: z.number().nonnegative().optional(),
  loanTermYears: z.number().int().positive().optional(),
  propertyValue: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdateMortgageStatusSchema = z.object({
  status: z.enum([
    "draft",
    "submitted",
    "under_review",
    "approved",
    "conditionally_approved",
    "rejected",
    "disbursed",
    "completed",
  ]),
  notes: z.string().max(2000).optional(),
});
