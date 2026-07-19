import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PrimaryButton, Section, SectionHeading } from "../components/ui";
import PropertyCard from "../components/PropertyCard";
import { SkeletonCard } from "../components/Skeleton";
import InquiryForm, { type FormField } from "../components/InquiryForm";
import CTASection from "../components/CTASection";
import SEO from "../components/SEO";
import { apiClient } from "../lib/api-client";
import type { Property } from "../data/properties";

const LOCATION_OPTIONS = ["Any Location", "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];
const PROPERTY_TYPE_OPTIONS = ["Any Type", "house", "apartment", "townhouse", "land", "villa"];
const PRICE_RANGES: { label: string; minPrice?: number; maxPrice?: number }[] = [
  { label: "Any Price" },
  { label: "Under KSh 5M", maxPrice: 5_000_000 },
  { label: "KSh 5M – KSh 20M", minPrice: 5_000_000, maxPrice: 20_000_000 },
  { label: "Over KSh 20M", minPrice: 20_000_000 },
];

const FORM_FIELDS: FormField[] = [
  { name: "firstName", label: "First Name", placeholder: "Enter First Name" },
  { name: "lastName", label: "Last Name", placeholder: "Enter Last Name" },
  { name: "email", label: "Email", placeholder: "Enter your Email", type: "email" },
  { name: "phone", label: "Phone", placeholder: "Enter Phone Number", type: "tel" },
  { name: "location", label: "Preferred Location", placeholder: "Select Location", type: "select", options: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"] },
  { name: "propertyType", label: "Property Type", placeholder: "Select Property Type", type: "select", options: ["house", "apartment", "townhouse", "land", "villa"] },
  { name: "bathrooms", label: "No. of Bathrooms", placeholder: "Select no. of Bathrooms", type: "select", options: ["1", "2", "3", "4+"] },
  { name: "bedrooms", label: "No. of Bedrooms", placeholder: "Select no. of Bedrooms", type: "select", options: ["1", "2", "3", "4+"] },
  { name: "budget", label: "Budget", placeholder: "Select Budget", type: "select", options: ["Under KSh 5M", "KSh 5M – KSh 20M", "Over KSh 20M"] },
  { name: "message", label: "Message", placeholder: "Enter your Message here..", type: "textarea", full: true },
];

export default function Properties() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState(LOCATION_OPTIONS[0]);
  const [propertyType, setPropertyType] = useState(PROPERTY_TYPE_OPTIONS[0]);
  const [priceRange, setPriceRange] = useState(PRICE_RANGES[0].label);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);

  const fetchProperties = useCallback(async (filters?: { location?: string; propertyType?: string; priceRange?: string }) => {
    setLoading(true);
    try {
      const activeLocation = filters?.location ?? LOCATION_OPTIONS[0];
      const activePropertyType = filters?.propertyType ?? PROPERTY_TYPE_OPTIONS[0];
      const activePriceRange = filters?.priceRange ?? PRICE_RANGES[0].label;
      const range = PRICE_RANGES.find((r) => r.label === activePriceRange);

      const result = await apiClient.getProperties({
        location: activeLocation !== LOCATION_OPTIONS[0] ? activeLocation : undefined,
        propertyType: activePropertyType !== PROPERTY_TYPE_OPTIONS[0] ? activePropertyType : undefined,
        minPrice: range?.minPrice,
        maxPrice: range?.maxPrice,
        limit: 50,
      });
      const items = Array.isArray(result) ? result : result?.properties || result?.data || [];

      setProperties(items.map((p: any) => ({
        slug: p.slug || p.id,
        name: p.name || p.title,
        location: p.city || p.location || "",
        category: p.category || "",
        price: p.price ? `KSh ${Number(p.price).toLocaleString()}` : "Price TBD",
        beds: p.bedrooms || p.beds || 0,
        baths: p.bathrooms || p.baths || 0,
        type: p.propertyType || p.type || "Property",
        area: p.area || p.sqft ? `${p.sqft || p.area} sq ft` : "",
        image: p.images?.[0] || p.image || "",
        summary: p.description?.slice(0, 150) || "",
        description: p.description || "",
        features: p.features || [],
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

  function handleFindProperty() {
    fetchProperties({ location, propertyType, priceRange });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
    );
  }, [query, properties]);

  return (
    <>
      <SEO
        title="Properties"
        description="Explore our curated selection of properties, each offering a unique story and a chance to redefine your life."
      />
      {/* Hero search */}
      <Section className="border-b border-border pb-16 pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Find Your Dream Property"
          paragraph="Welcome to Estatein, where your dream property awaits in every corner of our beautiful world. Explore our curated selection of properties, each offering a unique story and a chance to redefine your life."
        />
        <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-3">
          <div className="flex flex-col gap-3 rounded-t-xl border border-border p-4 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 px-2">
              <Search className="shrink-0 text-subtle" size={22} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search For A Property"
                className="w-full bg-transparent text-lg text-white placeholder:text-subtle focus:outline-none"
              />
            </div>
            <PrimaryButton className="w-full sm:w-auto" onClick={handleFindProperty} disabled={loading}>
              Find Property
            </PrimaryButton>
          </div>
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-border p-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3">
              <span className="text-sm text-muted">Location</span>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none"
              >
                {LOCATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-base text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3">
              <span className="text-sm text-muted">Property Type</span>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none"
              >
                {PROPERTY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-base text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3">
              <span className="text-sm text-muted">Pricing Range</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none"
              >
                {PRICE_RANGES.map((r) => (
                  <option key={r.label} value={r.label} className="bg-base text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </Section>

      {/* Categories / listings */}
      <Section>
        <SectionHeading
          title="Discover a World of Possibilities"
          paragraph="Our portfolio of properties is as diverse as your dreams. Explore the following categories to find the perfect property that resonates with your vision of home."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {filtered.map((property, i) => (
                <div key={property.slug} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <PropertyCard property={property} />
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full text-center text-base text-muted">
                  No properties match "{query}" — try a different search.
                </p>
              )}
            </>
          )}
        </div>
      </Section>

      {/* Inquiry form */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Let's Make it Happen"
          paragraph="Ready to take the first step toward your dream property? Fill out the form below, and our real estate wizards will work their magic to find your perfect match. Don't wait; let's embark on this exciting journey together."
        />
        <div className="mt-12">
          <InquiryForm fields={FORM_FIELDS} source="properties-search" />
        </div>
      </Section>

      <CTASection />
    </>
  );
}
