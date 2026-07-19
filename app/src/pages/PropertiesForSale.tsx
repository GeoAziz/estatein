import { useCallback, useEffect, useState } from "react";
import { PrimaryButton, Section, SectionHeading } from "../components/ui";
import PropertyCard from "../components/PropertyCard";
import { SkeletonCard } from "../components/Skeleton";
import CTASection from "../components/CTASection";
import SEO from "../components/SEO";
import { apiClient } from "../lib/api-client";
import type { Property } from "../data/properties";

const PRICE_RANGES = ["Any Price", "Under KSh 5M", "KSh 5M – KSh 20M", "Over KSh 20M"];
const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4+"];
const TYPE_OPTIONS = ["Any Type", "house", "apartment", "townhouse", "land", "villa"];

export default function PropertiesForSale() {
  const [price, setPrice] = useState(PRICE_RANGES[0]);
  const [beds, setBeds] = useState(BEDROOM_OPTIONS[0]);
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { listingStatus: "sale", limit: 50 };
      if (beds !== "Any") {
        params.bedrooms = parseInt(beds.replace("+", ""));
      }
      if (type !== "Any Type") {
        params.propertyType = type;
      }
      if (price !== "Any Price") {
        if (price === "Under KSh 5M") params.maxPrice = 5000000;
        else if (price === "Over KSh 20M") params.minPrice = 20000000;
        else { params.minPrice = 5000000; params.maxPrice = 20000000; }
      }
      const result = await apiClient.getProperties(params);
      const items = result?.properties || result?.data || [];
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
  }, [beds, type, price]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const filtered = properties.filter((p) => {
    if (beds !== "Any" && String(p.beds) !== beds.replace("+", "") && !(beds === "4+" && p.beds >= 4)) return false;
    if (type !== "Any Type" && p.type !== type) return false;
    return true;
  });

  return (
    <>
      <SEO
        title="Properties for Sale"
        description="Browse homes for sale across Kenya, from coastal villas to city apartments, filterable by price, bedrooms, and property type."
      />
      <Section className="border-b border-border pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Find Your Dream Home"
          paragraph="Browse our full catalogue of homes for sale — from coastal villas to city apartments. Filter by price, bedrooms, and property type to find the one that's right for you."
        />
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="flex h-fit flex-col gap-6 rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-white">Filters</h3>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-muted">Price Range</span>
              <select
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-white focus:outline-none"
              >
                {PRICE_RANGES.map((opt) => (
                  <option key={opt} value={opt} className="bg-base text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-muted">Bedrooms</span>
              <select
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-white focus:outline-none"
              >
                {BEDROOM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-base text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-muted">Property Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded-lg border border-border bg-transparent px-4 py-3 text-sm text-white focus:outline-none"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-base text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </aside>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                {filtered.map((property) => (
                  <PropertyCard key={property.slug} property={property} />
                ))}
                {filtered.length === 0 && (
                  <p className="col-span-full text-center text-base text-muted">
                    No homes match those filters — try widening your search.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="mt-10 flex justify-center">
          <PrimaryButton to="/properties">View All Properties</PrimaryButton>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
