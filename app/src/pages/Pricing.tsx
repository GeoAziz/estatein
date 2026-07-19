import { CheckCircle2, Sparkles } from "lucide-react";
import { Section, SectionHeading, PrimaryButton } from "../components/ui";
import CTASection from "../components/CTASection";
import SEO from "../components/SEO";

const TIERS = [
  {
    slug: "starter",
    name: "Starter",
    price: "KSh 4,999",
    period: "/month",
    description: "Perfect for first-time buyers exploring the market.",
    features: [
      "Up to 5 property listings",
      "Basic property analytics",
      "Email support",
      "Standard listing placement",
      "1 user account",
    ],
    highlight: false,
  },
  {
    slug: "professional",
    name: "Professional",
    price: "KSh 14,999",
    period: "/month",
    description: "For agents and agencies ready to scale their portfolio.",
    features: [
      "Up to 50 property listings",
      "Advanced analytics dashboard",
      "Priority phone & email support",
      "Featured listing placement",
      "5 user accounts",
      "Lead management tools",
      "Custom branding on listings",
    ],
    highlight: true,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    price: "KSh 39,999",
    period: "/month",
    description: "Full platform access for large teams and agencies.",
    features: [
      "Unlimited property listings",
      "Full analytics suite + API access",
      "Dedicated account manager",
      "Premium placement + homepage feature",
      "Unlimited user accounts",
      "Advanced lead management & CRM",
      "Custom integrations",
      "White-label option",
    ],
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <>
      <SEO
        title="Pricing Plans"
        description="Compare Estatein's Starter, Professional, and other subscription plans for agents and agencies, including listing limits and analytics features."
      />
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          eyebrow="Pricing"
          title="Choose Your Perfect Plan"
          paragraph="Select a plan that fits your real estate goals. All plans include a 14-day free trial with no credit card required."
        />

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col gap-6 rounded-xl border p-6 md:p-10 ${
                tier.highlight
                  ? "border-primary bg-primary/5 shadow-[0_12px_32px_-12px_rgba(112,59,247,0.25)]"
                  : "border-border"
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-6 flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white">
                  <Sparkles size={12} /> Most Popular
                </span>
              )}

              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold text-white sm:text-2xl">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white sm:text-5xl">{tier.price}</span>
                  <span className="text-sm text-muted">{tier.period}</span>
                </div>
                <p className="text-base text-muted">{tier.description}</p>
              </div>

              <div className="flex flex-col gap-3 border-t border-border pt-6">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary-text" />
                    <span className="text-sm text-muted">{f}</span>
                  </div>
                ))}
              </div>

              <PrimaryButton
                to={`/signup?role=agent&plan=${tier.slug}`}
                className={`w-full ${tier.highlight ? "" : "border border-border bg-transparent hover:bg-white/5"}`}
              >
                Get Started
              </PrimaryButton>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 flex flex-col items-start gap-6 rounded-xl border border-border p-6 md:p-10">
          <SectionHeading
            title="Frequently Asked Questions"
            paragraph="Everything you need to know about our pricing plans."
          />
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              { q: "Can I switch plans later?", a: "Yes, you can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle." },
              { q: "Is there a free trial?", a: "All plans include a 14-day free trial. No credit card required to get started." },
              { q: "What payment methods do you accept?", a: "We accept M-Pesa, Visa, Mastercard, and bank transfers for all plans." },
              { q: "Can I cancel anytime?", a: "Absolutely. Cancel anytime with no penalties. You'll retain access until the end of your billing period." },
            ].map((item) => (
              <div key={item.q} className="flex flex-col gap-2">
                <h4 className="text-base font-semibold text-white">{item.q}</h4>
                <p className="text-sm leading-relaxed text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
