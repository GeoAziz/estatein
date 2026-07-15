export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Accepts Kenyan numbers like "712345678" or "0712345678" typed alongside a
// separate +254 country-code selector.
export function isValidKenyanPhone(phone: string): boolean {
  return /^0?7\d{8}$/.test(phone.trim().replace(/[\s-]/g, ""));
}

export function formatKenyanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
}

export type PasswordStrength = { label: "Weak" | "Medium" | "Strong"; pct: number; color: string; valid: boolean };

export function passwordStrength(pw: string): PasswordStrength {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const valid = pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);
  if (score <= 1) return { label: "Weak", pct: 33, color: "bg-red-500", valid };
  if (score <= 3) return { label: "Medium", pct: 66, color: "bg-yellow-500", valid };
  return { label: "Strong", pct: 100, color: "bg-primary", valid };
}

export const MAX_MESSAGE_LENGTH = 500;
export const MAX_REPLY_LENGTH = 1000;

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
