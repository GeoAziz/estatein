import { useState, type FormEvent } from "react";
import { Bath, BedDouble, CalendarClock, CheckCircle2 } from "lucide-react";
import { Section, SectionHeading } from "../components/ui";
import BlurImage from "../components/BlurImage";
import CTASection from "../components/CTASection";
import { COMING_SOON_PROPERTIES } from "../data/listings";

function NotifyForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border p-8 text-center">
        <CheckCircle2 className="text-primary-text" size={36} />
        <p className="text-base text-white">You're on the list — we'll notify you the moment new listings drop.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border p-6 md:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <input
          required
          type="email"
          placeholder="Enter your Email"
          className="rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-white placeholder:text-subtle focus:border-primary focus:outline-none"
        />
        <select
          defaultValue=""
          className="rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-white focus:outline-none"
        >
          <option value="" disabled className="bg-base text-subtle">
            Preferred Bedrooms
          </option>
          {["1", "2", "3", "4+"].map((opt) => (
            <option key={opt} value={opt} className="bg-base text-white">
              {opt}
            </option>
          ))}
        </select>
        <select
          defaultValue=""
          className="rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-white focus:outline-none"
        >
          <option value="" disabled className="bg-base text-subtle">
            Preferred Price Range
          </option>
          {["Under $500,000", "$500,000 – $1,000,000", "Over $1,000,000"].map((opt) => (
            <option key={opt} value={opt} className="bg-base text-white">
              {opt}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-[10px] bg-primary px-6 py-[14px] text-base font-medium text-white hover:bg-primary/90"
      >
        Notify Me
      </button>
    </form>
  );
}

export default function ComingSoon() {
  return (
    <>
      <Section className="border-b border-border pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Upcoming Properties — Coming Soon"
          paragraph="Get a first look at homes before they officially hit the market. Sign up to be notified the moment these listings go live."
        />
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {COMING_SOON_PROPERTIES.map((property) => (
            <div key={property.slug} className="group flex flex-col gap-6 rounded-xl border border-border p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_32px_-12px_rgba(112,59,247,0.35)] md:p-10">
              <div className="relative overflow-hidden rounded-lg">
                <BlurImage
                  src={property.image}
                  alt={property.name}
                  className="h-[220px] w-full object-cover grayscale-[15%] transition duration-300 group-hover:scale-[1.04] md:h-[260px]"
                />
                <span className="absolute left-3 top-3 rounded-full border border-primary bg-base/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-text">
                  Coming Soon
                </span>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-xl font-semibold text-white sm:text-2xl">{property.name}</h3>
                  <p className="text-base leading-relaxed text-muted">{property.summary}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm text-white">
                    <BedDouble size={16} className="text-primary-text" />
                    {property.beds}-Bedroom
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm text-white">
                    <Bath size={16} className="text-primary-text" />
                    {property.baths}-Bathroom
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-muted">{property.price}</span>
                    <span className="flex items-center gap-1.5 text-base font-semibold text-primary-text">
                      <CalendarClock size={16} />
                      {property.expectedDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border">
        <SectionHeading
          title="Never Miss a Listing"
          paragraph="Tell us what you're looking for and we'll send an alert the moment a matching property is announced."
        />
        <div className="mt-8 max-w-3xl">
          <NotifyForm />
        </div>
      </Section>

      <CTASection />
    </>
  );
}
