import { useMemo, useState } from "react";
import { Mail, MessageCircle, Phone, Search, Star } from "lucide-react";
import { FaqCard } from "../components/Faq";
import { PrimaryButton, Section, SectionHeading } from "../components/ui";
import SEO from "../components/SEO";
import { SUPPORT_FAQS } from "../data/content";

const CONTACT_METHODS = [
  { icon: Mail, title: "Email", value: "support@estatein.com" },
  { icon: Phone, title: "Phone", value: "1-800-ESTATEIN" },
  { icon: MessageCircle, title: "Chat", value: "Start a conversation via Contact" },
];

const CATEGORIES = ["Properties & Listings", "Accounts & Billing", "Technical Issues", "General Questions"];

export default function Support() {
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUPPORT_FAQS;
    return SUPPORT_FAQS.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <>
      <SEO
        title="Support Center"
        description="Get help with your Estatein account, listings, or bookings. Search FAQs or contact our support team by email, phone, or chat."
      />
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Customer Support Center"
          paragraph="Find answers fast, or reach our team directly — we're here to help."
        />
        <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-xl border border-border px-5 py-4">
          <Search className="shrink-0 text-subtle" size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search for help"
            className="w-full bg-transparent text-base text-white placeholder:text-subtle focus:outline-none"
          />
        </div>
      </Section>

      {/* Contact methods */}
      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CONTACT_METHODS.map(({ icon: Icon, title, value }) => (
            <div key={title} className="flex flex-col items-center gap-4 rounded-xl border border-border p-8 text-center">
              <span className="flex h-[62px] w-[62px] items-center justify-center rounded-full border border-border text-primary-text">
                <Icon size={24} />
              </span>
              <span className="text-lg font-semibold text-white">{title}</span>
              <span className="text-base text-muted">{value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Issue categories */}
      <Section className="border-t border-border">
        <SectionHeading title="Browse by Category" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setQuery(cat)}
              className="rounded-xl border border-border px-6 py-8 text-center text-base font-semibold text-white hover:border-primary hover:text-primary-text"
            >
              {cat}
            </button>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section className="border-t border-border">
        <SectionHeading title="Frequently Asked Questions" />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredFaqs.map((faq) => (
            <FaqCard key={faq.question} item={faq} />
          ))}
          {filteredFaqs.length === 0 && (
            <p className="col-span-full text-center text-base text-muted">
              No results for "{query}" — try the contact methods above.
            </p>
          )}
        </div>
      </Section>

      {/* Feedback form */}
      <Section className="border-t border-border">
        <div className="rounded-xl border border-border p-6 md:p-10">
          <SectionHeading title="How Did We Do?" paragraph="Rate your experience and let us know how we can improve." />
          {feedbackSent ? (
            <p className="mt-8 text-base text-primary-text">Thanks for the feedback — it helps us improve Estatein for everyone.</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFeedbackSent(true);
              }}
              className="mt-8 flex flex-col gap-6"
            >
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} star`}
                    className="text-subtle"
                  >
                    <Star size={28} className={n <= rating ? "fill-primary text-primary-text" : ""} />
                  </button>
                ))}
              </div>
              <textarea
                rows={4}
                placeholder="Suggest an improvement or report a bug.."
                className="w-full resize-none rounded-lg border border-border bg-transparent px-5 py-4 text-base text-white placeholder:text-subtle focus:border-primary focus:outline-none"
              />
              <PrimaryButton type="submit" className="w-full sm:w-auto">
                Submit Feedback
              </PrimaryButton>
            </form>
          )}
        </div>
      </Section>
    </>
  );
}
