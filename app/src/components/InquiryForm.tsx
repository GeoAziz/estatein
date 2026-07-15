import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { PrimaryButton } from "./ui";
import { apiClient } from "../lib/api-client";
import { useAuth } from "../lib/auth-api";

export type FormField = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "select" | "textarea" | "readonly";
  options?: string[];
  full?: boolean;
  value?: string;
};

export default function InquiryForm({
  fields,
  submitLabel = "Send Your Message",
  successMessage = "Thanks — your message is on its way. Our team will be in touch shortly.",
  propertyId,
  source = "contact",
}: {
  fields: FormField[];
  submitLabel?: string;
  successMessage?: string;
  /** When set, the inquiry is tied to a property and requires a signed-in buyer. */
  propertyId?: string;
  /** Identifies which page/form submitted this lead, for the public contact endpoint. */
  source?: string;
}) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agreed) return;

    if (propertyId && !user) {
      setError("Please log in to inquire about this property.");
      return;
    }

    const data = new FormData(e.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim();

    setError("");
    setSubmitting(true);
    try {
      if (propertyId) {
        await apiClient.createInquiry({
          propertyId,
          message: value("message") || `Inquiry from ${value("firstName")} ${value("lastName")}`.trim(),
          contactMethod: "email",
          phone: value("phone") || undefined,
        });
      } else {
        await apiClient.submitContactMessage({
          firstName: value("firstName"),
          lastName: value("lastName"),
          email: value("email"),
          phone: value("phone") || undefined,
          message: value("message") || "(no message field on this form)",
          source,
          metadata: Object.fromEntries(
            fields
              .filter((f) => !["firstName", "lastName", "email", "phone", "message"].includes(f.name))
              .map((f) => [f.name, value(f.name)])
          ),
        });
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong sending your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border p-10 text-center md:p-16">
        <CheckCircle2 className="text-primary-text" size={48} />
        <h3 className="text-2xl font-semibold text-white">Message Sent!</h3>
        <p className="max-w-md text-base text-muted">{successMessage}</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-2 text-base font-medium text-white underline underline-offset-4 hover:text-primary-text"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-8 rounded-xl border border-border p-6 md:p-12 lg:p-[50px]"
    >
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-[50px] gap-y-8 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={`flex flex-col gap-4 ${field.full ? "sm:col-span-2" : ""}`}>
            <label htmlFor={`inquiry-${field.name}`} className="text-lg font-semibold text-white sm:text-xl">
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                id={`inquiry-${field.name}`}
                name={field.name}
                required
                rows={5}
                placeholder={field.placeholder}
                className="w-full resize-none rounded-lg border border-border bg-transparent px-5 py-4 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
              />
            ) : field.type === "select" ? (
              <select
                id={`inquiry-${field.name}`}
                name={field.name}
                required
                defaultValue=""
                className="w-full rounded-lg border border-border bg-transparent px-5 py-4 text-base text-white focus:border-primary focus:outline-none"
              >
                <option value="" disabled className="bg-base text-subtle">
                  {field.placeholder}
                </option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt} className="bg-base text-white">
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "readonly" ? (
              <div id={`inquiry-${field.name}`} className="w-full rounded-lg border border-primary bg-transparent px-5 py-4 text-base text-white/90">
                {field.value}
              </div>
            ) : (
              <input
                id={`inquiry-${field.name}`}
                name={field.name}
                required
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-border bg-transparent px-5 py-4 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2.5 text-base text-muted">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-[28px] w-[28px] rounded border-border bg-transparent accent-primary"
          />
          I agree with Terms of Use and Privacy Policy
        </label>
        <PrimaryButton type="submit" disabled={submitting} className="w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Sending…" : submitLabel}
        </PrimaryButton>
      </div>
    </form>
  );
}
