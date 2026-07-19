import { useState } from "react";
import { BedDouble, Building2, CalendarDays } from "lucide-react";
import { PrimaryButton, Section, SectionHeading } from "../components/ui";
import BlurImage from "../components/BlurImage";
import CTASection from "../components/CTASection";
import SEO from "../components/SEO";
import { NEW_CONSTRUCTION_PROPERTIES } from "../data/listings";

const BUILDERS = ["All Builders", ...new Set(NEW_CONSTRUCTION_PROPERTIES.map((p) => p.developer))];

export default function NewConstruction() {
  const [builder, setBuilder] = useState(BUILDERS[0]);

  const filtered = NEW_CONSTRUCTION_PROPERTIES.filter(
    (p) => builder === "All Builders" || p.developer === builder
  );

  return (
    <>
      <SEO
        title="New Construction Homes"
        description="Browse brand-new construction properties across Kenya with move-in dates, starting prices, and builder details, filterable by developer."
      />
      <Section className="border-b border-border pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Brand New Homes Available"
          paragraph="Be the first to call it home. Explore new-construction communities with move-in dates, starting prices, and builder details."
        />
        <div className="mx-auto mt-10 flex max-w-xl justify-center">
          <label className="flex w-full flex-col gap-2 rounded-lg border border-border px-4 py-3">
            <span className="text-sm text-muted">Builder</span>
            <select
              value={builder}
              onChange={(e) => setBuilder(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none"
            >
              {BUILDERS.map((opt) => (
                <option key={opt} value={opt} className="bg-base text-white">
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((property) => (
            <div key={property.slug} className="group flex flex-col gap-6 rounded-xl border border-border p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_32px_-12px_rgba(112,59,247,0.35)] md:p-10">
              <div className="relative overflow-hidden rounded-lg">
                <BlurImage
                  src={property.image}
                  alt={property.name}
                  className="h-[220px] w-full object-cover transition duration-300 group-hover:scale-[1.04] md:h-[260px]"
                />
                <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                  New
                </span>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-xl font-semibold text-white sm:text-2xl">{property.name}</h3>
                  <p className="text-base leading-relaxed text-muted">{property.summary}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm text-white">
                    <Building2 size={16} className="text-primary-text" />
                    {property.developer}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm text-white">
                    <BedDouble size={16} className="text-primary-text" />
                    {property.beds}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm text-white">
                    <CalendarDays size={16} className="text-primary-text" />
                    {property.completionDate}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-muted">Starting Price</span>
                    <span className="text-xl font-semibold text-white sm:text-2xl">
                      {property.startingPrice}
                    </span>
                  </div>
                  <PrimaryButton to="/contact" className="w-full sm:w-auto">
                    Request Preview
                  </PrimaryButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <CTASection />
    </>
  );
}
