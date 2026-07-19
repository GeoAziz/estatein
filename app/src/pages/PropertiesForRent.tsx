import { useCallback, useEffect, useState } from "react";
import { Bath, BedDouble, PawPrint, Zap } from "lucide-react";
import { PrimaryButton, Section, SectionHeading } from "../components/ui";
import BlurImage from "../components/BlurImage";
import { SkeletonCard } from "../components/Skeleton";
import CTASection from "../components/CTASection";
import SEO from "../components/SEO";
import { apiClient } from "../lib/api-client";

type RentalProperty = {
  slug: string;
  name: string;
  image: string;
  summary: string;
  beds: number;
  baths: number;
  leaseTerm: string;
  rent: string;
  furnished: string;
  utilitiesIncluded: boolean;
  petPolicy: string;
};

const LEASE_TERMS = ["Any Term", "Month-to-Month", "6-Month", "1-Year"];
const RENT_RANGES = ["Any Price", "Under KSh 100K", "KSh 100K – KSh 300K", "Over KSh 300K"];

export default function PropertiesForRent() {
  const [term, setTerm] = useState(LEASE_TERMS[0]);
  const [properties, setProperties] = useState<RentalProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.getProperties({ listingStatus: "rent", limit: 50 });
      const items = result?.properties || result?.data || [];
      setProperties(items.map((p: any) => ({
        slug: p.slug || p.id,
        name: p.name || p.title,
        image: p.images?.[0] || p.image || "",
        summary: p.description?.slice(0, 150) || "",
        beds: p.bedrooms || p.beds || 0,
        baths: p.bathrooms || p.baths || 0,
        leaseTerm: p.leaseTerm || "1-Year",
        rent: p.price ? `KSh ${Number(p.price).toLocaleString()}/mo` : "N/A",
        furnished: p.furnished || "Unfurnished",
        utilitiesIncluded: p.utilitiesIncluded || false,
        petPolicy: p.petPolicy || "No pets",
      })));
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const filtered = properties.filter((p) => term === "Any Term" || p.leaseTerm === term);

  return (
    <>
      <SEO
        title="Properties for Rent"
        description="Browse rental homes across Kenya, from month-to-month studios to fully-furnished family houses, filterable by lease term and rent range."
      />
      <Section className="border-b border-border pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Discover Perfect Rental Homes"
          paragraph="From month-to-month studios to fully-furnished family homes, find a rental that fits your lifestyle and lease preferences."
        />
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-3 rounded-xl border border-border p-3">
          <label className="flex flex-1 flex-col gap-2 rounded-lg border border-border px-4 py-3">
            <span className="text-sm text-muted">Lease Term</span>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none"
            >
              {LEASE_TERMS.map((opt) => (
                <option key={opt} value={opt} className="bg-base text-white">
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-2 rounded-lg border border-border px-4 py-3">
            <span className="text-sm text-muted">Monthly Rent</span>
            <select defaultValue={RENT_RANGES[0]} className="bg-transparent text-sm text-white focus:outline-none">
              {RENT_RANGES.map((opt) => (
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
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {filtered.map((property) => (
                <div key={property.slug} className="group flex flex-col gap-6 rounded-xl border border-border p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_32px_-12px_rgba(112,59,247,0.35)] md:p-10">
                  <div className="overflow-hidden rounded-lg">
                    {property.image ? (
                      <BlurImage
                        src={property.image}
                        alt={property.name}
                        className="h-[220px] w-full object-cover transition duration-300 group-hover:scale-[1.04] md:h-[260px]"
                      />
                    ) : (
                      <div className="flex h-[220px] w-full items-center justify-center bg-white/5 text-subtle md:h-[260px]">No Image</div>
                    )}
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
                      <span className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm text-white">
                        {property.leaseTerm}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2.5 text-sm text-muted">
                      <span className="rounded-full border border-border px-3.5 py-2">{property.furnished}</span>
                      <span className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2">
                        <Zap size={14} className="text-primary-text" />
                        {property.utilitiesIncluded ? "Utilities Included" : "Utilities Not Included"}
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2">
                        <PawPrint size={14} className="text-primary-text" />
                        {property.petPolicy}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-muted">Monthly Rent</span>
                        <span className="text-xl font-semibold text-white sm:text-2xl">{property.rent}</span>
                      </div>
                      <PrimaryButton to="/contact" className="w-full sm:w-auto">
                        Schedule Tour
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full text-center text-base text-muted">
                  No rentals match that lease term right now — check back soon.
                </p>
              )}
            </>
          )}
        </div>
      </Section>

      <CTASection />
    </>
  );
}
