import { z } from "zod";

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const IdParamSchema = z.object({
  id: z.string().min(1),
});

export const SlugParamSchema = z.object({
  slug: z.string().min(1),
});

export const CreateInquirySchema = z.object({
  propertyId: z.string().optional(),
  listingId: z.string().optional(),
  agentId: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(500),
  contactMethod: z.enum(["email", "phone", "whatsapp", "in_app"]).default("email"),
  viewingRequested: z.boolean().default(false),
  viewingDate: z.string().optional(),
  viewingTime: z.string().optional(),
  proposedOfferPrice: z.number().positive().optional(),
});

export const ReplySchema = z.object({
  message: z.string().min(1).max(1000),
});

export const UpdateInquiryStatusSchema = z.object({
  status: z.enum(["new", "read", "responded", "archived"]),
});

export const UpdateViewingStatusSchema = z.object({
  viewingStatus: z.enum(["requested", "confirmed", "cancelled"]),
});

export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
});

export const CreateSavedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  searchType: z.enum(["buy", "rent"]).default("buy"),
  location: z.string().optional(),
  radius: z.number().positive().optional(),
  filters: z.any().optional(),
  alertsEnabled: z.boolean().default(false),
  alertFrequency: z.enum(["daily", "weekly"]).optional(),
});

export const UpdateSavedSearchSchema = CreateSavedSearchSchema.partial();

export const MortgageCalculateSchema = z.object({
  homePrice: z.number().positive(),
  downPaymentPercent: z.number().min(0).max(100),
  interestRate: z.number().positive(),
  loanTermYears: z.number().int().positive(),
});

export const PreQualifySchema = z.object({
  income: z.number().positive(),
  debts: z.number().min(0),
  creditScore: z.number().int().min(300).max(850),
  downPaymentAmount: z.number().min(0),
});

export const AdminApproveSchema = z.object({
  notes: z.string().optional(),
});

export const AdminRejectSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

export const AdminUserStatusSchema = z.object({
  status: z.enum(["active", "suspended", "deleted"]),
});

export const AdminReportResolveSchema = z.object({
  action: z.enum(["ignore", "remove", "suspend"]),
});

export const ReportErrorSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(10000).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  url: z.string().max(500).optional(),
});

export const TrackEventSchema = z.object({
  name: z.string().min(1).max(100),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ContactMessageSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(30).optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
  source: z.string().max(50).default("contact"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
