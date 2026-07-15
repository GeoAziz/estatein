import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Section, SectionHeading } from "../components/ui";
import CTASection from "../components/CTASection";
import { MARKET_BY_LOCATION, MARKET_METRICS } from "../data/content";

export default function MarketTrends() {
  const [city, setCity] = useState(MARKET_BY_LOCATION[0].city);
  const activeCity = MARKET_BY_LOCATION.find((c) => c.city === city) ?? MARKET_BY_LOCATION[0];

  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Real Estate Market Analysis"
          paragraph="Current market trends & insights to help you make informed buying, selling, and investing decisions."
        />
      </Section>

      {/* Key Metrics */}
      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MARKET_METRICS.map((metric) => (
            <div key={metric.label} className="flex flex-col gap-2 rounded-xl border border-border p-6">
              <span className="text-sm text-muted">{metric.label}</span>
              <span className="text-2xl font-semibold text-white sm:text-3xl">{metric.value}</span>
              <span
                className={`flex items-center gap-1 text-sm font-medium ${
                  metric.direction === "up" ? "text-primary-text" : "text-white"
                }`}
              >
                {metric.direction === "up" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {metric.change}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Charts */}
      <Section className="border-t border-border">
        <SectionHeading title="Home Prices Over 12 Months" />
        <div className="mt-8 flex h-[220px] items-end gap-2 rounded-xl border border-border p-6">
          {[62, 58, 65, 70, 68, 74, 78, 76, 82, 85, 88, 92].map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="w-full rounded-t bg-primary/80" style={{ height: `${h}%` }} />
              <span className="text-[10px] text-subtle">
                {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border p-6">
            <h3 className="mb-6 text-lg font-semibold text-white">Listings by Property Type</h3>
            <div className="flex flex-col gap-4">
              {[
                { label: "Villa", pct: 32 },
                { label: "Apartment", pct: 45 },
                { label: "Cottage", pct: 23 },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span>{item.label}</span>
                    <span className="text-white">{item.pct}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-6">
            <h3 className="mb-6 text-lg font-semibold text-white">Price Changes by Neighborhood</h3>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, i) => {
                const intensity = (i * 37) % 100;
                return (
                  <div
                    key={i}
                    className="aspect-square rounded"
                    style={{ backgroundColor: `rgba(112, 59, 247, ${0.15 + intensity / 150})` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* Market Report by Location */}
      <Section className="border-t border-border">
        <SectionHeading title="Market Report by Location" />
        <div className="mt-8 inline-flex flex-wrap gap-2 rounded-xl border border-border p-2">
          {MARKET_BY_LOCATION.map((loc) => (
            <button
              key={loc.city}
              onClick={() => setCity(loc.city)}
              className={`rounded-[10px] px-6 py-3 text-base font-medium transition ${
                city === loc.city ? "border border-primary text-primary-text" : "border border-transparent text-muted hover:text-white"
              }`}
            >
              {loc.city}
            </button>
          ))}
        </div>
        <div key={activeCity.city} className="animate-page-fade mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1 rounded-xl border border-border p-6">
            <span className="text-sm text-muted">Average Price</span>
            <span className="text-xl font-semibold text-white">{activeCity.avgPrice}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border p-6">
            <span className="text-sm text-muted">Trend</span>
            <span className="text-xl font-semibold text-primary-text">{activeCity.trend}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border p-6">
            <span className="text-sm text-muted">Active Listings</span>
            <span className="text-xl font-semibold text-white">{activeCity.listings}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border p-6">
            <span className="text-sm text-muted">Absorption Rate</span>
            <span className="text-xl font-semibold text-white">{activeCity.absorption}</span>
          </div>
        </div>
      </Section>

      {/* Forecast */}
      <Section className="border-t border-border">
        <div className="rounded-xl border border-border p-6 md:p-10">
          <SectionHeading
            title="6-Month Outlook"
            paragraph="Analysts expect steady price appreciation nationally, with inventory recovery easing some of the competitive pressure seen in 2025. Coastal and metro markets remain the strongest performers, while suburban markets are seeing renewed buyer interest as rates stabilize."
          />
          <div className="mt-6 flex flex-wrap gap-4">
            <span className="flex items-center gap-2 rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary-text">
              <TrendingUp size={16} />
              Bullish: Coastal & Metro
            </span>
            <span className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-white">
              <TrendingUp size={16} className="text-muted" />
              Neutral: Suburban
            </span>
          </div>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
