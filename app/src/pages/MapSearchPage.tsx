import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Section, SectionHeading } from "../components/ui";
import PropertyMap from "../components/PropertyMap";
import BlurImage from "../components/BlurImage";
import { PROPERTIES } from "../data/properties";

const PROPERTY_MARKERS = [
  { name: "Seaside Serenity Villa", price: "$1,250,000", lat: 34.0259, lng: -118.7798, slug: "seaside-serenity-villa" },
  { name: "Metropolitan Haven", price: "$650,000", lat: 40.7128, lng: -74.006, slug: "metropolitan-haven" },
  { name: "Rustic Retreat Cottage", price: "$350,000", lat: 44.0886, lng: -72.7343, slug: "rustic-retreat-cottage" },
];

export default function MapSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROPERTY_MARKERS;
    return PROPERTY_MARKERS.filter(
      (m) => m.name.toLowerCase().includes(q) || m.price.includes(q)
    );
  }, [query]);

  const selectedProperty = useMemo(
    () => PROPERTIES.find((p) => p.slug === selected),
    [selected]
  );

  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Explore Properties on the Map"
          paragraph="Search properties by name or price and view them on an interactive map. Click a marker to see details."
        />
        <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-xl border border-border p-4">
          <Search className="shrink-0 text-subtle" size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search by name or price..."
            className="w-full bg-transparent text-white placeholder:text-subtle focus:outline-none"
          />
        </div>
      </Section>

      <Section className="border-t border-border pt-0">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PropertyMap
              markers={filtered}
              center={filtered.length ? { lat: filtered[0].lat, lng: filtered[0].lng } : undefined}
              zoom={filtered.length === 1 ? 14 : 10}
              onMarkerClick={(slug) => setSelected(slug)}
              className="h-[500px] lg:h-[640px]"
            />
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto lg:h-[640px] lg:pr-2">
            <span className="text-sm text-muted">{filtered.length} properties found</span>
            {filtered.map((m) => {
              const prop = PROPERTIES.find((p) => p.slug === m.slug);
              return (
                <button
                  key={m.slug}
                  onClick={() => setSelected(m.slug)}
                  className={`flex gap-4 rounded-xl border p-4 text-left transition ${
                    selected === m.slug
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {prop?.image && (
                    <BlurImage
                      src={prop.image}
                      alt={m.name}
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-white">{m.name}</span>
                    <span className="text-sm text-primary-text">{m.price}</span>
                    <span className="text-xs text-muted">{prop?.beds} bd · {prop?.baths} ba · {prop?.type}</span>
                  </div>
                </button>
              );
            })}

            {selectedProperty && (
              <div className="mt-2 rounded-xl border border-border p-5">
                <h3 className="text-lg font-semibold text-white">{selectedProperty.name}</h3>
                <p className="mt-1 text-sm text-muted">{selectedProperty.summary}</p>
                <button
                  onClick={() => navigate(`/properties/${selectedProperty.slug}`)}
                  className="mt-3 w-full rounded-[10px] bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90"
                >
                  View Details
                </button>
              </div>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
