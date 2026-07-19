import { Download } from "lucide-react";
import { AccordionItem, GuideToc, type AccordionSection } from "../components/Accordion";
import { PrimaryButton, Section, SectionHeading } from "../components/ui";
import CTASection from "../components/CTASection";
import SEO from "../components/SEO";

const SECTIONS: AccordionSection[] = [
  {
    id: "prepare",
    title: "Prepare Your Home",
    content: [
      "Declutter and deep-clean every room, then stage key spaces — living room, kitchen, and primary bedroom — to help buyers picture themselves living there.",
      "Common repairs worth making before listing: fresh paint, fixing leaky faucets, replacing worn carpet, and touching up landscaping.",
      "Budget roughly 1–3% of your home's value for pre-listing repairs and staging, depending on condition.",
    ],
  },
  {
    id: "price",
    title: "Set the Right Price",
    content: [
      "Your agent will run a comparative market analysis (CMA) using recently sold, similar homes nearby to recommend a price range.",
      "Pricing slightly under market value can generate competitive offers, while overpricing often leads to a longer time on market and price cuts later.",
      "Consider current absorption rate and inventory in your area — see Market Trends for the latest local data.",
    ],
  },
  {
    id: "market",
    title: "Market Your Home",
    content: [
      "Professional photography is the single highest-impact investment in your listing — homes with quality photos sell faster and for more.",
      "A strong listing description highlights lifestyle, not just square footage: proximity to schools, walkability, and standout features.",
      "Your home will be syndicated to major listing sites in addition to Estatein's own property search.",
    ],
  },
  {
    id: "show",
    title: "Show Your Home",
    content: [
      "Open houses work best in the first two weekends after listing, when buyer interest is highest.",
      "Be ready for buyer questions about age of major systems, utility costs, and reasons for selling.",
      "Expect negotiation on price, closing date, and included fixtures — your agent will guide counteroffers.",
    ],
  },
  {
    id: "close",
    title: "Close the Sale",
    content: [
      "A final walkthrough lets the buyer confirm the home's condition matches the contract before closing.",
      "Typical seller closing costs include agent commission, transfer taxes, and any agreed-upon repair credits — usually 6–10% of sale price.",
      "Once documents are signed and funds are transferred, keys are handed over and the sale is complete.",
    ],
  },
];

export default function SellingGuide() {
  return (
    <>
      <SEO
        title="Home Selling Guide"
        description="Prepare, price, market, and close the sale of your home with our step-by-step selling guide covering staging, pricing strategy, and negotiations."
      />
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Sell Your Home with Confidence"
          paragraph="A step-by-step guide to preparing, pricing, marketing, and closing the sale of your home."
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
        <div className="flex flex-col items-center gap-6 rounded-xl border border-border p-8 text-center md:p-12">
          <h3 className="text-2xl font-semibold text-white">Get the Seller's Checklist</h3>
          <p className="max-w-xl text-base leading-relaxed text-muted">
            Download a printable checklist covering every step from prep to closing, so nothing falls
            through the cracks.
          </p>
          <a
            href="#"
            className="flex items-center gap-2 rounded-[10px] border border-border px-6 py-[18px] text-base font-medium text-white hover:border-primary hover:text-primary-text"
          >
            <Download size={18} />
            Download Checklist PDF
          </a>
        </div>
      </Section>

      <Section className="border-t border-border">
        <div className="flex justify-center">
          <PrimaryButton to="/contact">List Your Home Now</PrimaryButton>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
