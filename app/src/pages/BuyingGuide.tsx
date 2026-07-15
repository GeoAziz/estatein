import { AccordionItem, GuideToc, type AccordionSection } from "../components/Accordion";
import { FaqCard } from "../components/Faq";
import { PrimaryButton, Section, SectionHeading } from "../components/ui";
import CTASection from "../components/CTASection";

const SECTIONS: AccordionSection[] = [
  {
    id: "pre-approved",
    title: "Getting Pre-Approved",
    content: [
      "Pre-approval tells sellers you're a serious, financially-ready buyer, and it tells you exactly what you can afford before you start touring homes.",
      "You'll typically need: recent pay stubs, two years of tax returns, bank statements, proof of ID, and details on any existing debts.",
      "Use our Mortgage Calculator to estimate your monthly payment before applying.",
    ],
  },
  {
    id: "finding-home",
    title: "Finding the Right Home",
    content: [
      "Make a list of must-haves versus nice-to-haves before you tour — location, bedrooms, commute time, and school district usually top the list.",
      "When viewing a home, check water pressure, cell signal, street noise, and natural light at different times of day if you can.",
      "Keep a simple checklist for every showing so you can compare properties fairly once you've seen several.",
    ],
  },
  {
    id: "making-offer",
    title: "Making an Offer",
    content: [
      "Your agent will help you submit a written offer that includes price, contingencies, and a proposed closing date.",
      "Earnest money is a deposit — typically 1–3% of the purchase price — that shows the seller you're committed. It's applied to your down payment at closing.",
      "In competitive markets, be prepared to negotiate on price, closing timeline, or included appliances rather than waiving important protections.",
    ],
  },
  {
    id: "inspection",
    title: "Home Inspection",
    content: [
      "A licensed inspector will check the roof, foundation, electrical, plumbing, and HVAC systems and give you a full written report.",
      "Common issues include aging roofs, minor electrical code violations, and plumbing wear — most are negotiable repair items, not deal-breakers.",
      "Good questions to ask: How old is the roof? Any history of water damage? When was the HVAC last serviced?",
    ],
  },
  {
    id: "closing",
    title: "Closing Process",
    content: [
      "Closing typically takes 30–45 days from an accepted offer, covering financing, inspection, appraisal, and final paperwork.",
      "You'll need a government ID, proof of homeowners insurance, and funds for your down payment and closing costs.",
      "A final walkthrough happens 24–48 hours before closing to confirm the home's condition hasn't changed.",
    ],
  },
];

const FAQS = [
  { question: "How much do I need for a down payment?", answer: "It varies by loan type — conventional loans often require 5–20%, while some programs allow as little as 3%. Use the Mortgage Calculator to see how down payment size affects your monthly payment." },
  { question: "What's the difference between pre-qualified and pre-approved?", answer: "Pre-qualification is a quick estimate based on self-reported info. Pre-approval involves a lender verifying your financials and is far more credible to sellers." },
  { question: "Can I back out after making an offer?", answer: "Yes, if your offer includes contingencies (inspection, financing, appraisal) that aren't met, you can typically walk away with your earnest money returned." },
];

export default function BuyingGuide() {
  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Your Complete Home Buying Guide"
          paragraph="From pre-approval to closing day, here's everything you need to know to buy your next home with confidence."
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

      <Section className="border-t border-border">
        <SectionHeading title="Frequently Asked Questions" />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FAQS.map((faq) => (
            <FaqCard key={faq.question} item={faq} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <PrimaryButton to="/properties">Browse Available Homes</PrimaryButton>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
