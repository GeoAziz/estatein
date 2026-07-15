import { BarChart3, Bath, BedDouble, Ruler } from "lucide-react";
import type { Property } from "../data/properties";
import { PrimaryButton } from "./ui";
import BlurImage from "./BlurImage";
import { useCompare } from "./CompareBar";

export default function PropertyCard({ property }: { property: Property }) {
  const { toggle, isSelected } = useCompare();
  const selected = isSelected(property.slug);

  return (
    <div className="group flex flex-col gap-6 rounded-xl border border-border p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_32px_-12px_rgba(112,59,247,0.35)] md:p-10">
      <div className="overflow-hidden rounded-lg">
        <BlurImage
          src={property.image}
          alt={property.name}
          className="h-[220px] w-full object-cover transition duration-300 group-hover:scale-[1.04] md:h-[260px]"
        />
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
            <Ruler size={16} className="text-primary-text" />
            {property.type}
          </span>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-muted">Price</span>
            <span className="text-xl font-semibold text-white sm:text-2xl">{property.price}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                toggle(property.slug);
              }}
              className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] border px-4 py-3 text-sm font-medium transition ${
                selected
                  ? "border-primary bg-primary/10 text-primary-text"
                  : "border-border text-white hover:border-primary hover:text-primary-text"
              }`}
              aria-label={selected ? "Remove from compare" : "Add to compare"}
            >
              <BarChart3 size={14} />
              Compare
            </button>
            <PrimaryButton to={`/properties/${property.slug}`} className="w-full sm:w-auto">
              View Property Details
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
