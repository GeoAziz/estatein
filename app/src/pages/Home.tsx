import { useState, useEffect } from "react";
import { Quote } from "lucide-react";
import { PrimaryButton, SecondaryButton, Section, SectionHeading } from "../components/ui";
import ServiceHubBar from "../components/ServiceHubBar";
import PropertyCard from "../components/PropertyCard";
import { FaqCard } from "../components/Faq";
import CTASection from "../components/CTASection";
import SEO from "../components/SEO";
import { apiClient } from "../lib/api-client";
import { HOME_FAQS, TESTIMONIALS } from "../data/content";
import heroLifestyle from "../assets/img/hero-lifestyle.jpg";

const STATS = [
  { value: "200+", label: "Happy Customers" },
  { value: "10k+", label: "Properties For Clients" },
  { value: "16+", label: "Years of Experience" },
];

export default function Home() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getProperties({ limit: 6, sortBy: "views" })
      .then((res) => {
        const properties = res?.properties || res?.data || [];
        setFeatured(Array.isArray(properties) ? properties.slice(0, 6) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO
        title="Discover Your Dream Property with Estatein"
        description="Your journey to finding the perfect property begins here. Explore our listings to find the home that matches your dreams."
      />
      {/* Hero */}
      <Section className="pb-0 pt-12 lg:pt-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3.5">
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-[52px]">
                Discover Your Dream Property with{" "}
                <span className="text-primary-text">Estatein</span>
              </h1>
              <p className="text-base leading-relaxed text-muted lg:text-lg">
                Your journey to finding the perfect property begins here. Explore our listings to
                find the home that matches your dreams.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <SecondaryButton to="/about">Learn More</SecondaryButton>
              <PrimaryButton to="/properties">Browse Properties</PrimaryButton>
            </div>
            <div className="flex flex-wrap gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <span className="text-3xl font-bold text-white sm:text-4xl">{stat.value}</span>
                  <span className="text-sm text-muted sm:text-base">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <img
              src={heroLifestyle}
              alt="Modern property interior"
              className="h-[320px] w-full object-cover sm:h-[420px] lg:h-[520px]"
            />
          </div>
        </div>
      </Section>

      <Section>
        <ServiceHubBar />
      </Section>

      {/* Featured Properties */}
      <Section className="border-t border-border">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            title="Featured Properties"
            paragraph={`Explore our handpicked selection of featured properties. Each listing offers a glimpse into exceptional homes and investments available through Estatein. Click "View Details" for more information.`}
          />
          <SecondaryButton to="/properties" className="shrink-0">
            View All Properties
          </SecondaryButton>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-white/5 p-4">
                  <div className="h-48 w-full rounded-lg bg-white/10" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-white/10" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-white/10" />
                </div>
              ))
            : featured.map((property: any) => (
                <PropertyCard key={property.id} property={property} />
              ))}
        </div>
      </Section>

      {/* Testimonials */}
      <Section className="border-t border-border">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            title="What Our Clients Say"
            paragraph="Read the success stories and heartfelt testimonials from our valued clients. Discover why they chose Estatein for their real estate needs."
          />
          <SecondaryButton to="/contact" className="shrink-0">
            View All Testimonials
          </SecondaryButton>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="flex flex-col justify-between gap-8 rounded-xl border border-border p-8">
              <div className="flex flex-col gap-4">
                <Quote className="text-primary-text" size={28} />
                <h3 className="text-xl font-semibold text-white sm:text-2xl">{t.title}</h3>
                <p className="text-base leading-relaxed text-white/80">{t.quote}</p>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-medium text-white">{t.name}</span>
                <span className="text-sm text-muted">{t.location}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section className="border-t border-border">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            title="Frequently Asked Questions"
            paragraph="Find answers to common questions about Estatein's services, property listings, and the real estate process. We're here to provide clarity and assist you every step of the way."
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
