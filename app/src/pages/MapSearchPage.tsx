import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Pentagon, X } from "lucide-react";
import { Section, SectionHeading } from "../components/ui";
import PropertyMap from "../components/PropertyMap";
import BlurImage from "../components/BlurImage";
import SEO from "../components/SEO";
import { apiClient } from "../lib/api-client";
import type { Property } from "../data/properties";

type Marker = { name: string; price: string; lat: number; lng: number; slug: string };

const NAIROBI_CENTER = { lat: -1.2921, lng: 36.8219 };

export default function MapSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawMode, setDrawMode] = useState(false);
  const [polygonFilterIds, setPolygonFilterIds] = useState<string[] | null>(null);
  const [polygonSearching, setPolygonSearching] = useState(false);

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      try {
        const result = await apiClient.getProperties({ limit: 100 });
        const items = Array.isArray(result) ? result : result?.properties || result?.data || [];
        const mapped: Property[] = items.map((p: any) => ({
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
          lat: p.lat,
          lng: p.lng,
        }));
        setProperties(mapped);
        setMarkers(
          items
            .filter((p: any) => typeof p.lat === "number" && typeof p.lng === "number")
            .map((p: any) => ({
              name: p.name || p.title,
              price: p.price ? `KSh ${Number(p.price).toLocaleString()}` : "Price TBD",
              lat: p.lat,
              lng: p.lng,
              slug: p.slug || p.id,
            }))
        );
      } catch {
        setProperties([]);
        setMarkers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  const filtered = useMemo(() => {
    let list = markers;
    if (polygonFilterIds) {
      list = list.filter((m) => polygonFilterIds.includes(m.slug));
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) => m.name.toLowerCase().includes(q) || m.price.includes(q)
    );
  }, [query, markers, polygonFilterIds]);

  async function handlePolygonComplete(polygon: { lat: number; lng: number }[]) {
    setPolygonSearching(true);
    setDrawMode(false);
    try {
      const result = await apiClient.searchByBounds(polygon);
      const ids = (result?.properties || []).map((p: any) => p.slug || p.id);
      setPolygonFilterIds(ids);
    } catch {
      setPolygonFilterIds([]);
    } finally {
      setPolygonSearching(false);
    }
  }

  const selectedProperty = useMemo(
    () => properties.find((p) => p.slug === selected),
    [selected, properties]
  );

  return (
    <>
      <SEO
        title="Map Search"
        description="Explore properties across Kenya on an interactive map. Search by name or price and click a marker to see details."
      />
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Explore Properties on the Map"
          paragraph="Search properties by name or price and view them on an interactive map. Click a marker to see details."
        />
        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-border p-4">
            <Search className="shrink-0 text-subtle" size={20} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search by name or price..."
              className="w-full bg-transparent text-white placeholder:text-subtle focus:outline-none"
            />
          </div>
          {polygonFilterIds ? (
            <button
              onClick={() => setPolygonFilterIds(null)}
              className="flex items-center justify-center gap-2 rounded-xl border border-primary bg-primary/10 px-4 py-4 text-sm font-medium text-primary-text hover:bg-primary/20"
            >
              <X size={16} />
              Clear Area ({filtered.length})
            </button>
          ) : (
            <button
              onClick={() => setDrawMode((d) => !d)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-4 text-sm font-medium transition ${
                drawMode
                  ? "border-primary bg-primary/10 text-primary-text"
                  : "border-border text-white hover:border-primary/40"
              }`}
            >
              <Pentagon size={16} />
              {drawMode ? "Drawing… click map" : "Draw Search Area"}
            </button>
          )}
        </div>
      </Section>

      <Section className="border-t border-border pt-0">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {polygonSearching && (
              <p className="mb-2 text-sm text-muted">Searching properties within the drawn area…</p>
            )}
            <PropertyMap
              markers={filtered}
              center={filtered.length ? { lat: filtered[0].lat, lng: filtered[0].lng } : NAIROBI_CENTER}
              zoom={filtered.length === 1 ? 14 : 10}
              onMarkerClick={(slug) => setSelected(slug)}
              className="h-[500px] lg:h-[640px]"
              drawingMode={drawMode}
              onPolygonComplete={handlePolygonComplete}
            />
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto lg:h-[640px] lg:pr-2">
            <span className="text-sm text-muted">
              {loading ? "Loading properties…" : `${filtered.length} properties found`}
            </span>
            {filtered.map((m) => {
              const prop = properties.find((p) => p.slug === m.slug);
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
