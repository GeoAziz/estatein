import { AccordionItem, GuideToc, type AccordionSection } from "../components/Accordion";
import { FaqCard } from "../components/Faq";
import { PrimaryButton, Section, SectionHeading } from "../components/ui";
import CTASection from "../components/CTASection";

const SECTIONS: AccordionSection[] = [
  {
    id: "for-renters",
    title: "For Renters",
    content: [
      "Start by defining your budget — most landlords look for rent to be no more than 30% of gross monthly income.",
      "A typical rental application requires proof of income, ID, references, and a credit and background check.",
      "Read your lease carefully before signing — pay attention to renewal terms, subletting rules, and maintenance responsibilities.",
      "Know your rights: most states require landlords to give proper notice before entry and to return deposits within a set timeframe.",
    ],
  },
  {
    id: "for-landlords",
    title: "For Landlords",
    content: [
      "Screen tenants consistently using income verification, credit checks, and references to reduce risk and stay compliant with fair housing laws.",
      "A solid lease agreement should cover rent due dates, late fees, maintenance responsibilities, and pet policies clearly.",
      "Respond to maintenance requests promptly — it's both a legal obligation in most areas and key to tenant retention.",
      "Eviction is a last resort with strict legal processes — consult local regulations or legal counsel before proceeding.",
    ],
  },
  {
    id: "trends",
    title: "Rental Market Trends",
    content: [
      "Average rents vary widely by market — check Market Trends for current data by city.",
      "Demand is currently highest for furnished, flexible-term rentals in urban centers and pet-friendly units in suburban areas.",
      "Rental inventory tends to loosen in winter months, giving renters more negotiating leverage.",
    ],
  },
  {
    id: "laws",
    title: "Rental Laws & Rights",
    content: [
      "Tenant protections vary by state but generally include the right to a habitable home, privacy, and protection from retaliatory eviction.",
      "Landlord responsibilities typically include maintaining safety systems, making timely repairs, and following proper notice procedures.",
      "For disputes, many areas offer mediation services before matters escalate to small claims court.",
    ],
  },
];

const COMPARISON = [
  { label: "Upfront Cost", renting: "Low — deposit + first month", buying: "High — down payment + closing costs" },
  { label: "Flexibility", renting: "High — easy to relocate", buying: "Low — selling takes time" },
  { label: "Equity Building", renting: "None", buying: "Yes — over time" },
  { label: "Maintenance", renting: "Landlord's responsibility", buying: "Owner's responsibility" },
  { label: "Monthly Cost Predictability", renting: "Can increase at renewal", buying: "Stable with fixed-rate loans" },
];

const FAQS = [
  { question: "How much notice does my landlord need to give before entering?", answer: "This varies by state but is typically 24–48 hours' written notice, except in emergencies." },
  { question: "Can my landlord raise the rent mid-lease?", answer: "Generally no — rent increases usually only apply at renewal unless your lease states otherwise." },
  { question: "What happens to my security deposit when I move out?", answer: "Most states require it to be returned within 14–30 days, minus any documented damages beyond normal wear and tear." },
];

export default function RentalGuide() {
  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="The Complete Rental Guide"
          paragraph="Everything you need to know about renting — for tenants and landlords alike."
        />
      </Section>

      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
          <GuideToc sections={SECTIONS} />
          <div className="flex flex-col gap-6">
            {SECTIONS.map((section, i) => (
              <AccordionItem key={section.id} section={section} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </Section>

      {/* Comparison table */}
      <Section className="border-t border-border">
        <SectionHeading title="Renting vs. Buying" />
        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-sm font-medium text-muted">Factor</th>
                <th className="p-4 text-sm font-medium text-muted">Renting</th>
                <th className="p-4 text-sm font-medium text-muted">Buying</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="p-4 text-base font-medium text-white">{row.label}</td>
                  <td className="p-4 text-base text-muted">{row.renting}</td>
                  <td className="p-4 text-base text-muted">{row.buying}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section className="border-t border-border">
        <SectionHeading title="Frequently Asked Questions" />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FAQS.map((faq) => (
            <FaqCard key={faq.question} item={faq} />
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <PrimaryButton to="/properties/for-rent">Browse Rentals</PrimaryButton>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
