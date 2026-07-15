import { Link } from "react-router-dom";
import { Section, SectionHeading } from "../components/ui";

const SITE_MAP = [
  {
    category: "Main",
    links: [
      { label: "Home", to: "/" },
      { label: "About Us", to: "/about" },
      { label: "Contact Us", to: "/contact" },
    ],
  },
  {
    category: "Browse Properties",
    links: [
      { label: "Properties", to: "/properties" },
      { label: "For Sale", to: "/properties/for-sale" },
      { label: "For Rent", to: "/properties/for-rent" },
      { label: "New Construction", to: "/properties/new-construction" },
      { label: "Coming Soon", to: "/properties/coming-soon" },
    ],
  },
  {
    category: "Resources",
    links: [
      { label: "Buying Guide", to: "/buying-guide" },
      { label: "Selling Guide", to: "/selling-guide" },
      { label: "Rental Guide", to: "/rental-guide" },
      { label: "Mortgage Calculator", to: "/mortgage-calculator" },
      { label: "Market Trends", to: "/market-trends" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    category: "Company",
    links: [
      { label: "Services", to: "/services" },
      { label: "Careers", to: "/careers" },
      { label: "Press", to: "/press" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    category: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Cookie Policy", to: "/cookies" },
      { label: "Support", to: "/support" },
    ],
  },
  {
    category: "Account",
    links: [
      { label: "Sign Up as Buyer", to: "/signup" },
      { label: "Sign Up as Agent", to: "/signup?role=agent" },
      { label: "Log In", to: "/login" },
      { label: "Forgot Password", to: "/forgot-password" },
      { label: "Buyer Dashboard", to: "/dashboard/buyer" },
      { label: "Agent Dashboard", to: "/dashboard/agent" },
      { label: "Admin Dashboard", to: "/admin/dashboard" },
    ],
  },
];

export default function Sitemap() {
  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading align="center" title="Sitemap" paragraph="Every page on Estatein, organized in one place." />
      </Section>

      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {SITE_MAP.map((group) => (
            <div key={group.category} className="flex flex-col gap-4 rounded-xl border border-border p-6 md:p-8">
              <h3 className="text-lg font-semibold text-white">{group.category}</h3>
              <div className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <Link key={link.label + link.to} to={link.to} className="text-base text-muted hover:text-primary-text">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
