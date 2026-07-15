import { useMemo, type ReactElement } from "react";
import { Bath, BedDouble } from "lucide-react";
import { Section, SectionHeading, PrimaryButton, SecondaryButton } from "../components/ui";
import BlurImage from "../components/BlurImage";
import CTASection from "../components/CTASection";
import { PROPERTIES } from "../data/properties";

type CompareField = {
  label: string;
  key: string;
  render?: (p: (typeof PROPERTIES)[number]) => string | ReactElement;
};

const FIELDS: CompareField[] = [
  { label: "Price", key: "price", render: (p) => <span className="text-xl font-semibold text-white">{p.price}</span> },
  { label: "Type", key: "type" },
  { label: "Bedrooms", key: "beds", render: (p) => <span className="flex items-center gap-1.5"><BedDouble size={16} className="text-primary-text" />{p.beds}</span> },
  { label: "Bathrooms", key: "baths", render: (p) => <span className="flex items-center gap-1.5"><Bath size={16} className="text-primary-text" />{p.baths}</span> },
  { label: "Area", key: "area" },
  { label: "Location", key: "location" },
  {
    label: "Features",
    key: "features",
    render: (p) => (
      <ul className="flex flex-col gap-2">
        {p.features.map((f) => (
          <li key={f} className="text-left text-sm text-muted">{f}</li>
        ))}
      </ul>
    ),
  },
  {
    label: "Description",
    key: "description",
    render: (p) => <p className="text-left text-sm text-muted leading-relaxed">{p.description}</p>,
  },
];

export default function CompareProperties() {
  const compareSlugs = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("ids")?.split(",") || [];
    } catch {
      return [];
    }
  }, []);

  const properties = useMemo(
    () =>
      compareSlugs
        .map((slug) => PROPERTIES.find((p) => p.slug === slug))
        .filter(Boolean) as typeof PROPERTIES,
    [compareSlugs]
  );

  if (properties.length < 2) {
    return (
      <Section className="pt-12 lg:pt-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <SectionHeading
            align="center"
            title="Compare Properties"
            paragraph="Select at least two properties to compare them side by side."
          />
          <SecondaryButton to="/properties">Browse Properties</SecondaryButton>
        </div>
      </Section>
    );
  }

  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          title="Compare Properties"
          paragraph={`Comparing ${properties.length} properties side by side.`}
        />

        <div className="mt-10 overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header row - property images + names */}
            <div className={`grid gap-4`} style={{ gridTemplateColumns: `180px repeat(${properties.length}, 1fr)` }}>
              <div />
              {properties.map((p) => (
                <div key={p.slug} className="flex flex-col gap-3 rounded-xl border border-border p-4">
                  <BlurImage
                    src={p.image}
                    alt={p.name}
                    className="h-[140px] w-full rounded-lg object-cover"
                  />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold text-white">{p.name}</h3>
                    <span className="text-xs text-muted">{p.location}</span>
                  </div>
                  <PrimaryButton to={`/properties/${p.slug}`} className="w-full py-3 text-sm">
                    View Details
                  </PrimaryButton>
                </div>
              ))}
            </div>

            {/* Data rows */}
            <div className="mt-4 flex flex-col gap-px rounded-xl border border-border overflow-hidden">
              {FIELDS.map((field, i) => (
                <div
                  key={field.key}
                  className={`grid items-start gap-4 px-4 py-5 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                  style={{ gridTemplateColumns: `180px repeat(${properties.length}, 1fr)` }}
                >
                  <span className="text-sm font-medium text-white">{field.label}</span>
                  {properties.map((p) => (
                    <div key={p.slug} className="text-sm text-muted">
                      {field.render ? field.render(p) : String((p as any)[field.key])}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
