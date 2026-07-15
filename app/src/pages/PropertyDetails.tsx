import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Bath, BedDouble, CheckCircle2, MapPin, Ruler } from "lucide-react";
import { PrimaryButton, Section, SectionHeading, SecondaryButton } from "../components/ui";
import InquiryForm, { type FormField } from "../components/InquiryForm";
import InquiryModal from "../components/InquiryModal";
import BlurImage from "../components/BlurImage";
import { Skeleton } from "../components/Skeleton";
import { FaqCard } from "../components/Faq";
import CTASection from "../components/CTASection";
import SEO from "../components/SEO";
import { apiClient } from "../lib/api-client";
import { PRICING_BREAKDOWN, PROPERTIES } from "../data/properties";
import { HOME_FAQS } from "../data/content";

export default function PropertyDetails() {
  const { slug } = useParams();
  const [property, setProperty] = useState(PROPERTIES.find((p) => p.slug === slug) ?? PROPERTIES[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    async function fetchProperty() {
      try {
        const result = await apiClient.getPropertyById(slug || "");
        if (result?.property) {
          const p = result.property;
          setProperty({
            slug: p.slug || p.id || slug || "",
            name: p.name || p.title || "Property",
            location: p.city || p.location || "",
            category: p.category || "",
            price: p.price ? `$${Number(p.price).toLocaleString()}` : "Price TBD",
            beds: p.bedrooms || p.beds || 0,
            baths: p.bathrooms || p.baths || 0,
            type: p.propertyType || p.type || "Property",
            area: p.area || p.sqft ? `${p.sqft || p.area} sq ft` : "",
            image: p.images?.[0] || p.image || "",
            summary: p.description?.slice(0, 150) || "",
            description: p.description || "",
            features: p.features || [],
          });
          if (p.id) apiClient.incrementPropertyViews(p.id).catch(() => {});
        } else {
          setProperty(PROPERTIES.find((p) => p.slug === slug) ?? PROPERTIES[0]);
        }
      } catch {
        // Fall back to the static entry for this slug rather than leaving
        // the previous property's data on screen under the new URL.
        setProperty(PROPERTIES.find((p) => p.slug === slug) ?? PROPERTIES[0]);
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [slug]);

  const formFields: FormField[] = [
    { name: "firstName", label: "First Name", placeholder: "Enter First Name" },
    { name: "lastName", label: "Last Name", placeholder: "Enter Last Name" },
    { name: "email", label: "Email", placeholder: "Enter your Email", type: "email" },
    { name: "phone", label: "Phone", placeholder: "Enter Phone Number", type: "tel" },
    {
      name: "selectedProperty",
      label: "Selected Property",
      type: "readonly",
      value: `${property.name}, ${property.location}`,
      full: true,
    },
    { name: "message", label: "Message", placeholder: "Enter your Message here..", type: "textarea", full: true },
  ];

  return (
    <>
      <SEO
        title={property.name}
        description={property.description || property.summary}
        image={property.image}
      />
      <Section className="pt-12 lg:pt-16">
        {loading ? (
          <div className="flex flex-col gap-6">
            <div className="mb-2 flex flex-col gap-3 border-b border-border pb-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-40" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-[280px] w-full rounded-xl sm:h-[400px] lg:h-[583px]" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-3 border-b border-border pb-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">{property.name}</h1>
                <span className="flex items-center gap-1.5 text-base text-white">
                  <MapPin size={16} className="text-primary-text" />
                  {property.location}
                </span>
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <div className="flex flex-col items-start gap-0.5 sm:items-end">
                  <span className="text-sm text-muted">Price</span>
                  <span className="text-2xl font-semibold text-white sm:text-3xl">{property.price}</span>
                </div>
                <div className="flex gap-3">
                  <PrimaryButton onClick={() => setModalOpen(true)}>Contact Agent</PrimaryButton>
                  <SecondaryButton onClick={() => setModalOpen(true)}>Schedule Viewing</SecondaryButton>
                </div>
              </div>
            </div>

            {modalOpen && (
              <InquiryModal propertyName={property.name} propertySlug={property.slug} onClose={() => setModalOpen(false)} />
            )}

            <div className="overflow-hidden rounded-xl border border-border">
              <BlurImage
                src={property.image}
                alt={property.name}
                loading="eager"
                className="h-[280px] w-full object-cover sm:h-[400px] lg:h-[583px]"
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-6 rounded-xl border border-border p-6 md:p-10">
                <div className="grid grid-cols-3 divide-x divide-border border-b border-border pb-6">
                  <div className="flex flex-col items-center gap-1 px-2 text-center">
                    <BedDouble className="text-primary-text" size={22} />
                    <span className="text-lg font-semibold text-white">{property.beds}</span>
                    <span className="text-xs text-muted">Bedrooms</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 px-2 text-center">
                    <Bath className="text-primary-text" size={22} />
                    <span className="text-lg font-semibold text-white">{property.baths}</span>
                    <span className="text-xs text-muted">Bathrooms</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 px-2 text-center">
                    <Ruler className="text-primary-text" size={22} />
                    <span className="text-lg font-semibold text-white">{property.area.split(" ")[0]}</span>
                    <span className="text-xs text-muted">Sq. Feet</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-semibold text-white">Description</h2>
                  <p className="text-base leading-relaxed text-muted">{property.description}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-border p-6 md:p-10">
                <h2 className="text-2xl font-semibold text-white">Key Features and Amenities</h2>
                <ul className="flex flex-col gap-3">
                  {property.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-base text-muted">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary-text" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </Section>

      {/* Pricing */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Comprehensive Pricing Details"
          paragraph={`At Estatein, transparency is key. We want you to have a clear understanding of all costs associated with your property investment. Below, we break down the pricing for ${property.name} to help you make an informed decision.`}
        />
        <div className="mt-10 flex flex-col gap-6 rounded-xl border border-border p-6 text-sm text-muted md:p-8">
          <span className="font-semibold text-white">Note</span>
          The figures below are estimates and may vary depending on the property, location, and
          individual circumstances.
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6 rounded-xl border border-border p-6 md:p-10">
            <div className="flex flex-col gap-1 border-b border-border pb-6">
              <span className="text-base text-muted">Listing Price</span>
              <span className="text-3xl font-semibold text-white sm:text-4xl">
                {PRICING_BREAKDOWN.listingPrice}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-white">Additional Fees</h3>
            <div className="flex flex-col gap-4">
              {PRICING_BREAKDOWN.additionalFees.map((fee) => (
                <div key={fee.label} className="flex items-center justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="text-base text-muted">{fee.label}</span>
                    <span className="text-xs text-subtle">{fee.note}</span>
                  </div>
                  <span className="shrink-0 text-lg font-semibold text-white">{fee.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-xl border border-border p-6 md:p-10">
            <h3 className="text-xl font-semibold text-white">Monthly Costs</h3>
            <div className="flex flex-col gap-4 border-b border-border pb-6">
              {PRICING_BREAKDOWN.monthlyCosts.map((fee) => (
                <div key={fee.label} className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-base text-muted">{fee.label}</span>
                    <span className="text-xs text-subtle">{fee.note}</span>
                  </div>
                  <span className="shrink-0 text-lg font-semibold text-white">{fee.amount}</span>
                </div>
              ))}
            </div>
            <h3 className="text-xl font-semibold text-white">Total Initial Costs</h3>
            <div className="flex flex-col gap-4">
              {PRICING_BREAKDOWN.totalInitialCosts.map((fee) => (
                <div key={fee.label} className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-base text-muted">{fee.label}</span>
                    {fee.note && <span className="text-xs text-subtle">{fee.note}</span>}
                  </div>
                  <span className="shrink-0 text-lg font-semibold text-white">{fee.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Inquiry */}
      <Section className="border-t border-border">
        <SectionHeading
          title={`Inquire About ${property.name}`}
          paragraph="Interested in this property? Fill out the form below, and our real estate experts will get back to you with more details, including scheduling a viewing and answering any questions you may have."
        />
        <div className="mt-12">
          <InquiryForm fields={formFields} propertyId={property.slug} source="property-details" />
        </div>
      </Section>

      {/* FAQ */}
      <Section className="border-t border-border">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            title="Frequently Asked Questions"
            paragraph="Find answers to common questions about Estatein's services, property listings, and the real estate process."
          />
          <SecondaryButton to="/contact" className="shrink-0">
            View All FAQ's
          </SecondaryButton>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {HOME_FAQS.map((faq) => (
            <FaqCard key={faq.question} item={faq} />
          ))}
        </div>
      </Section>

      <CTASection />
    </>
  );
}
