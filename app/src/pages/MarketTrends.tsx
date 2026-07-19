import { useState, useEffect } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Section, SectionHeading } from "../components/ui";
import CTASection from "../components/CTASection";
import SEO from "../components/SEO";
import { apiClient } from "../lib/api-client";

const CITIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];

interface TrendData {
  medianPrice: number;
  averagePrice: number;
  priceChange: string;
  priceChangePercent: number;
  daysOnMarket: number;
  inventory: number;
  trend: "up" | "down" | "stable";
  pricePerSqft: number;
  priceHistory: { month: string; price: number }[];
  byType: Record<string, number>;
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `KSh ${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `KSh ${(price / 1_000).toFixed(0)}K`;
  return `KSh ${price}`;
}

export default function MarketTrends() {
  const [city, setCity] = useState(CITIES[0]);
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .getMarketTrends(city)
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [city]);

  const metrics = data
    ? [
        { label: "Median Price", value: formatPrice(data.medianPrice), direction: data.trend === "up" ? "up" : "down" as const, change: data.priceChange },
        { label: "Average Price/SqFt", value: `KSh ${data.pricePerSqft.toLocaleString()}`, direction: "up" as const, change: "Per sqft" },
        { label: "Days on Market", value: `${data.daysOnMarket}`, direction: data.daysOnMarket < 30 ? "up" : ("down" as const), change: "Avg days" },
        { label: "Active Listings", value: `${data.inventory}`, direction: "up" as const, change: "Properties" },
      ]
    : [];

  const maxHistoryPrice = data?.priceHistory?.length
    ? Math.max(...data.priceHistory.map((h) => h.price))
    : 1;

  return (
    <>
      <SEO
        title="Market Trends"
        description="Explore real estate market analysis for Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret, including median prices, days on market, and price history."
      />
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Real Estate Market Analysis"
          paragraph="Current market trends & insights to help you make informed buying, selling, and investing decisions."
        />
      </Section>

      {/* Key Metrics */}
      <Section className="border-t border-border">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border p-6">
                <div className="h-4 w-24 rounded bg-white/10" />
                <div className="mt-3 h-8 w-32 rounded bg-white/10" />
                <div className="mt-2 h-4 w-16 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
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
        )}
      </Section>

      {/* Charts */}
      <Section className="border-t border-border">
        <SectionHeading title="Home Prices Over 12 Months" />
        {loading ? (
          <div className="mt-8 h-[220px] animate-pulse rounded-xl border border-border bg-white/5" />
        ) : (
          <div className="mt-8 flex h-[220px] items-end gap-2 rounded-xl border border-border p-6">
            {(data?.priceHistory?.length
              ? data.priceHistory.slice(-12)
              : Array.from({ length: 12 }, (_, i) => ({
                  month: `${i + 1}`,
                  price: Math.round(maxHistoryPrice * (0.6 + i * 0.03)),
                }))
            ).map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${(h.price / maxHistoryPrice) * 100}%` }}
                />
                <span className="text-[10px] text-subtle">
                  {h.month.length > 3 ? h.month.slice(5, 7) : h.month}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border p-6">
            <h3 className="mb-6 text-lg font-semibold text-white">Listings by Property Type</h3>
            <div className="flex flex-col gap-4">
              {data?.byType
                ? Object.entries(data.byType).map(([type, count]) => {
                    const total = Object.values(data.byType).reduce((s, v) => s + v, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={type} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-sm text-muted">
                          <span className="capitalize">{type.replace(/_/g, " ")}</span>
                          <span className="text-white">{pct}%</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                : [
                    { label: "House", pct: 32 },
                    { label: "Apartment", pct: 45 },
                    { label: "Land", pct: 23 },
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
            <h3 className="mb-6 text-lg font-semibold text-white">Market Summary</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <span className="text-sm text-muted">Trend Direction</span>
                <span className={`text-lg font-semibold ${data?.trend === "up" ? "text-primary-text" : data?.trend === "down" ? "text-red-400" : "text-white"}`}>
                  {data?.trend === "up" ? "Bullish" : data?.trend === "down" ? "Bearish" : "Stable"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <span className="text-sm text-muted">Price Change</span>
                <span className="text-lg font-semibold text-white">{data?.priceChange || "0%"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <span className="text-sm text-muted">Avg Days on Market</span>
                <span className="text-lg font-semibold text-white">{data?.daysOnMarket || 0} days</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Market Report by Location */}
      <Section className="border-t border-border">
        <SectionHeading title="Market Report by Location" />
        <div className="mt-8 inline-flex flex-wrap gap-2 rounded-xl border border-border p-2">
          {CITIES.map((loc) => (
            <button
              key={loc}
              onClick={() => setCity(loc)}
              className={`rounded-[10px] px-6 py-3 text-base font-medium transition ${
                city === loc ? "border border-primary text-primary-text" : "border border-transparent text-muted hover:text-white"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
        <div key={city} className="animate-page-fade mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1 rounded-xl border border-border p-6">
            <span className="text-sm text-muted">Average Price</span>
            <span className="text-xl font-semibold text-white">{formatPrice(data?.averagePrice || 0)}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border p-6">
            <span className="text-sm text-muted">Trend</span>
            <span className="text-xl font-semibold text-primary-text">{data?.trend === "up" ? "Increasing" : data?.trend === "down" ? "Decreasing" : "Stable"}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border p-6">
            <span className="text-sm text-muted">Active Listings</span>
            <span className="text-xl font-semibold text-white">{data?.inventory || 0}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border p-6">
            <span className="text-sm text-muted">Price/SqFt</span>
            <span className="text-xl font-semibold text-white">KSh {data?.pricePerSqft?.toLocaleString() || 0}</span>
          </div>
        </div>
      </Section>

      {/* Forecast */}
      <Section className="border-t border-border">
        <div className="rounded-xl border border-border p-6 md:p-10">
          <SectionHeading
            title="6-Month Outlook"
            paragraph={`Based on current ${city} market data: ${data?.trend === "up" ? "prices are trending upward with strong demand" : data?.trend === "down" ? "prices are showing a downward trend, potentially offering buying opportunities" : "the market is stable with balanced supply and demand"}. ${data?.inventory || 0} active listings with an average of ${data?.daysOnMarket || 0} days on market.`}
          />
          <div className="mt-6 flex flex-wrap gap-4">
            <span className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium ${data?.trend === "up" ? "border-primary text-primary-text" : "border-border text-white"}`}>
              {data?.trend === "up" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {data?.trend === "up" ? "Bullish" : data?.trend === "down" ? "Bearish" : "Neutral"}: {city}
            </span>
            <span className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-white">
              <TrendingUp size={16} className="text-muted" />
              {data?.priceChange || "0%"} price change
            </span>
          </div>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
