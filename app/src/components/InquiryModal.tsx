import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, CreditCard, Loader2, X } from "lucide-react";
import { useAuth } from "../lib/auth-api";
import { apiClient } from "../lib/api-client";
import { isValidKenyanPhone, MAX_MESSAGE_LENGTH } from "../lib/validation";
import { useToast } from "../lib/toast";
import { useModalA11y } from "../lib/useModalA11y";

const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"];
const CONTACT_METHODS = ["Phone", "Email", "WhatsApp", "In-App Message"] as const;

const DEMO_AGENT_WHATSAPP = "254712345678";

export default function InquiryModal({
  propertyName,
  propertySlug,
  onClose,
}: {
  propertyName: string;
  propertySlug: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [message, setMessage] = useState("");
  const [wantsViewing, setWantsViewing] = useState(false);
  const [viewingDate, setViewingDate] = useState("");
  const [viewingTime, setViewingTime] = useState(TIME_SLOTS[0]);
  const [contactMethod, setContactMethod] = useState<(typeof CONTACT_METHODS)[number]>("Email");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [touchedFields, setTouchedFields] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [sent, setSent] = useState(false);

  const [wantsDeposit, setWantsDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState(2000);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(dialogRef, onClose);

  const today = new Date().toISOString().slice(0, 10);
  const messageError = touchedFields && !message.trim() ? "Message is required" : "";
  const viewingDateError = touchedFields && wantsViewing && !viewingDate ? "Select a date" : "";
  const phoneError =
    touchedFields && contactMethod !== "In-App Message" && phone && !isValidKenyanPhone(phone)
      ? "Enter a valid Kenyan phone number (e.g. 0712 345 678)"
      : "";

  const isValid =
    message.trim().length > 0 &&
    (!wantsViewing || Boolean(viewingDate)) &&
    (contactMethod === "In-App Message" || isValidKenyanPhone(phone));

  function handleWhatsApp() {
    const text = encodeURIComponent(
      `Hi, I'm interested in ${propertyName}${message.trim() ? `. ${message.trim()}` : ""}`
    );
    window.open(`https://wa.me/${DEMO_AGENT_WHATSAPP}?text=${text}`, "_blank", "noopener,noreferrer");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouchedFields(true);
    setSubmitError("");
    setPaymentError("");
    if (!user || !isValid) return;

    if (contactMethod === "WhatsApp") {
      handleWhatsApp();
    }

    setSubmitting(true);
    try {
      await apiClient.createInquiry({
        propertyId: propertySlug,
        message: message.trim(),
        viewingRequested: wantsViewing,
        viewingDate: wantsViewing ? viewingDate : undefined,
        viewingTime: wantsViewing ? viewingTime : undefined,
        contactMethod,
        phone: phone || undefined,
      });

      // Initiate payment in the background if selected (don't block on it)
      if (wantsDeposit && contactMethod !== "In-App Message") {
        setPaymentInProgress(true);
        apiClient
          .initiatePayment(
            depositAmount,
            "mpesa",
            phone.startsWith("0") ? phone : `0${phone}`,
            `Viewing deposit for ${propertyName}`
          )
          .then(() => {
            showToast("success", "M-Pesa prompt sent. Enter your PIN to secure the viewing.");
          })
          .catch((err: any) => {
            setPaymentError(`Deposit payment failed: ${err.message}. You can pay later.`);
          })
          .finally(() => {
            setPaymentInProgress(false);
          });
      }

      setSubmitting(false);
      setSent(true);
      showToast("success", "Inquiry sent successfully");
      setTimeout(onClose, 3000);
    } catch (error: any) {
      setSubmitting(false);
      setSubmitError(error.message || "Something went wrong sending your inquiry. Please try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in flex h-full w-full max-w-lg flex-col gap-6 overflow-y-auto border border-border bg-base p-6 shadow-2xl focus:outline-none sm:h-auto sm:max-h-[90vh] sm:rounded-xl md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="inquiry-modal-title" className="text-xl font-semibold text-white sm:text-2xl">
            {sent ? "Thanks for your inquiry!" : `Interested in ${propertyName}?`}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center text-subtle hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="text-primary-text" size={44} />
            <div className="flex flex-col gap-2">
              <p className="text-base text-white font-medium">Inquiry sent successfully!</p>
              <p className="text-sm text-muted">
                The agent will be in touch shortly. You can track your inquiry status in your dashboard.
              </p>
              {wantsDeposit && (
                <div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
                  paymentInProgress
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                    : paymentError
                      ? "border-red-500/40 bg-red-500/10 text-red-400"
                      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                }`}>
                  {paymentInProgress
                    ? "M-Pesa prompt sent. Complete the payment on your phone."
                    : paymentError
                      ? `Payment issue: ${paymentError}`
                      : "Deposit payment confirmed. Viewing is secured."}
                </div>
              )}
            </div>
            <button onClick={onClose} className="rounded-[10px] bg-primary px-6 py-3 text-base font-medium text-white hover:bg-primary/90">
              Close
            </button>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-base text-muted">Sign in to contact the agent</p>
            <div className="flex w-full gap-3">
              <Link to="/login" className="flex-1 rounded-[10px] bg-primary py-3 text-center text-base font-medium text-white hover:bg-primary/90">
                Log In
              </Link>
              <Link to="/signup" className="flex-1 rounded-[10px] border border-border py-3 text-center text-base font-medium text-white hover:border-primary hover:text-primary-text">
                Sign Up
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {submitError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {submitError}
              </div>
            )}

            {paymentError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {paymentError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-muted">Full Name</span>
                <input readOnly value={user.name} className="h-11 rounded-lg border border-border bg-white/5 px-4 text-sm text-white/80" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-muted">Email</span>
                <input readOnly value={user.email} className="h-11 rounded-lg border border-border bg-white/5 px-4 text-sm text-white/80" />
              </label>
            </div>

            {contactMethod !== "In-App Message" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-white">
                  Phone Number <span className="text-red-400">*</span>
                </span>
                <div className="flex gap-2">
                  <span className="flex h-11 items-center rounded-lg border border-border px-3 text-sm text-muted">+254</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouchedFields(true)}
                    type="tel"
                    inputMode="tel"
                    placeholder="712 345 678"
                    aria-invalid={Boolean(phoneError)}
                    aria-required="true"
                    className={`h-11 w-full rounded-lg border bg-transparent px-4 text-sm text-white placeholder:text-subtle focus:outline-none ${
                      phoneError ? "border-red-500" : "border-border focus:border-primary"
                    }`}
                  />
                </div>
                {phoneError && <span className="text-xs text-red-400">{phoneError}</span>}
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  Message <span className="text-red-400">*</span>
                </span>
                <span className="text-xs text-subtle">
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </span>
              </div>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                onBlur={() => setTouchedFields(true)}
                rows={3}
                aria-invalid={Boolean(messageError)}
                aria-required="true"
                placeholder="When is the earliest I can view? Are you open to negotiation?"
                className={`w-full resize-none rounded-lg border bg-transparent px-4 py-3 text-sm text-white placeholder:text-subtle focus:outline-none ${
                  messageError ? "border-red-500" : "border-border focus:border-primary"
                }`}
              />
              {messageError && <span className="text-xs text-red-400">{messageError}</span>}
            </label>

            <label className="flex min-h-[44px] items-center gap-2.5 text-sm text-white">
              <input
                type="checkbox"
                checked={wantsViewing}
                onChange={(e) => setWantsViewing(e.target.checked)}
                className="h-5 w-5 rounded border-border bg-transparent accent-primary"
              />
              I'd like to schedule a viewing
            </label>

            {wantsViewing && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm text-muted">Date</span>
                    <input
                      type="date"
                      min={today}
                      required={wantsViewing}
                      value={viewingDate}
                      onChange={(e) => setViewingDate(e.target.value)}
                      onBlur={() => setTouchedFields(true)}
                      aria-invalid={Boolean(viewingDateError)}
                      className={`h-11 rounded-lg border bg-transparent px-4 text-sm text-white focus:outline-none ${
                        viewingDateError ? "border-red-500" : "border-border focus:border-primary"
                      }`}
                    />
                    {viewingDateError && <span className="text-xs text-red-400">{viewingDateError}</span>}
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm text-muted">Time</span>
                    <select
                      value={viewingTime}
                      onChange={(e) => setViewingTime(e.target.value)}
                      className="h-11 rounded-lg border border-border bg-transparent px-4 text-sm text-white focus:outline-none"
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t} className="bg-base text-white">
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="flex min-h-[44px] items-center gap-2.5 rounded-lg border border-border p-4 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={wantsDeposit}
                    onChange={(e) => setWantsDeposit(e.target.checked)}
                    className="h-5 w-5 rounded border-border bg-transparent accent-primary"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CreditCard size={16} className="text-primary-text" />
                      Secure with M-Pesa deposit
                    </span>
                    <span className="text-xs text-muted">Shows the agent you're serious. Refundable if deal doesn't go through.</span>
                  </div>
                </label>

                {wantsDeposit && (
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-white">Deposit Amount</span>
                    <div className="flex gap-2">
                      {[1000, 2000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setDepositAmount(amt)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            depositAmount === amt
                              ? "border-primary bg-primary/10 text-primary-text"
                              : "border-border text-muted hover:border-primary hover:text-white"
                          }`}
                        >
                          KSh {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </label>
                )}
              </div>
            )}

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-white">Contact Method</legend>
              <div className="flex flex-wrap gap-3">
                {CONTACT_METHODS.map((m) => (
                  <label key={m} className="flex min-h-[44px] items-center gap-2 text-sm text-muted">
                    <input
                      type="radio"
                      name="contactMethod"
                      checked={contactMethod === m}
                      onChange={() => setContactMethod(m)}
                      className="h-4 w-4 border-border bg-transparent accent-primary"
                    />
                    {m}
                  </label>
                ))}
              </div>
              {contactMethod === "WhatsApp" && (
                <p className="text-xs text-subtle">Sending will also open WhatsApp with your message pre-filled.</p>
              )}
            </fieldset>

            {message.trim() && (
              <div className="rounded-lg border border-border bg-white/[0.02] p-3 text-xs text-muted">
                <span className="mb-1 block font-medium text-white">Preview</span>
                "{message.trim()}"{wantsViewing && viewingDate ? ` — requesting a viewing on ${viewingDate} at ${viewingTime}.` : ""}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting || paymentInProgress}
                className="flex-1 rounded-[10px] border border-border py-3 text-base font-medium text-white hover:border-primary hover:text-primary-text disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || submitting || paymentInProgress}
                className="flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-primary py-3 text-base font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {paymentInProgress && <Loader2 size={16} className="animate-spin" />}
                {paymentInProgress ? "Processing payment…" : submitting ? "Sending…" : "Send Inquiry"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
