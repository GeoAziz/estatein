import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().optional(),
  role: z.enum(["buyer", "agent"]).default("buyer"),
  company: z.string().optional(),
  license: z.string().optional(),
  licenseState: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const SendOtpSchema = z.object({
  type: z.enum(["phone_verification", "login"]).default("phone_verification"),
});

export const VerifyOtpSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  type: z.enum(["phone_verification", "login"]).default("phone_verification"),
});

export const RequestOtpLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const VerifyOtpLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
});

export const Confirm2FASchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

export const VerifyLogin2FASchema = z.object({
  userId: z.string().min(1),
  code: z.string().length(6, "Code must be 6 digits"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
