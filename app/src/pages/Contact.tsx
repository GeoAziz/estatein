import { useState } from "react";
import { Mail, MapPinned, Navigation, Phone } from "lucide-react";
import { Facebook, Instagram, Linkedin } from "../components/SocialIcons";
import { Section, SectionHeading } from "../components/ui";
import InquiryForm, { type FormField } from "../components/InquiryForm";
import CTASection from "../components/CTASection";
import SEO from "../components/SEO";
import { OFFICES } from "../data/content";
import property1 from "../assets/img/property-1.jpg";
import property2 from "../assets/img/property-2.jpg";
import property3 from "../assets/img/property-3.jpg";
import aboutHero from "../assets/img/about-hero.jpg";
import heroLifestyle from "../assets/img/hero-lifestyle.jpg";

const INFO_CARDS = [
  { icon: Mail, label: "info@estatein.com" },
  { icon: Phone, label: "+1 (123) 456-7890" },
  { icon: MapPinned, label: "Main Headquarters" },
];

const SOCIAL_CARDS = [
  { icon: Instagram, label: "Instagram" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Facebook, label: "Facebook" },
];

const TABS = ["All", "Regional", "International"] as const;

const FORM_FIELDS: FormField[] = [
  { name: "firstName", label: "First Name", placeholder: "Enter First Name" },
  { name: "lastName", label: "Last Name", placeholder: "Enter Last Name" },
  { name: "email", label: "Email", placeholder: "Enter your Email", type: "email" },
  { name: "phone", label: "Phone", placeholder: "Enter Phone Number", type: "tel" },
  {
    name: "inquiryType",
    label: "Inquiry Type",
    placeholder: "Select Inquiry Type",
    type: "select",
    options: ["Buying", "Selling", "Renting", "Property Management", "Investment Advisory", "Other"],
  },
  {
    name: "referral",
    label: "How Did You Hear About Us?",
    placeholder: "Select",
    type: "select",
    options: ["Search Engine", "Social Media", "Referral", "Advertisement", "Other"],
  },
  { name: "message", label: "Message", placeholder: "Enter your Message here..", type: "textarea", full: true },
];

const GALLERY = [aboutHero, heroLifestyle, property1, property2, property3];

export default function Contact() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const visibleOffices =
    tab === "All" ? OFFICES : OFFICES.filter((o) => (tab === "Regional" ? o.label === "Regional Offices" : true));

  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with Estatein. We're here to assist you with any inquiries, requests, or feedback you may have."
      />
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Get in Touch with Estatein"
          paragraph="Welcome to Estatein's Contact Us page. We're here to assist you with any inquiries, requests, or feedback you may have. Whether you're looking to buy or sell a property, explore investment opportunities, or simply want to connect, we're just a message away."
        />
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {INFO_CARDS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-4 rounded-xl border border-border p-8 text-center"
            >
              <span className="flex h-[62px] w-[62px] items-center justify-center rounded-full border border-border text-primary-text">
                <Icon size={24} />
              </span>
              <span className="text-lg font-semibold text-white">{label}</span>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-4 flex max-w-4xl flex-wrap items-center justify-center gap-3">
          {SOCIAL_CARDS.map(({ icon: Icon, label }) => (
            <a
              key={label}
              href="#"
              className="flex items-center gap-2 rounded-full border border-border px-5 py-3 text-base font-semibold text-white hover:border-primary hover:text-primary-text"
            >
              <Icon size={18} />
              {label}
            </a>
          ))}
        </div>
      </Section>

      {/* Connect form */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Let's Connect"
          paragraph="We're excited to connect with you and learn more about your real estate goals. Use the form below to get in touch with Estatein. Whether you're a prospective client, partner, or simply curious about our services, we're here to answer your questions and provide the assistance you need."
        />
        <div className="mt-12">
          <InquiryForm fields={FORM_FIELDS} source="contact-page" />
        </div>
      </Section>

      {/* Offices */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Discover Our Office Locations"
          paragraph="Estatein is here to serve you across multiple locations. Whether you're looking to meet our team, discuss real estate opportunities, or simply drop by for a chat, we have offices conveniently located to serve your needs."
        />
        <div className="mt-8 inline-flex flex-wrap gap-2 rounded-xl border border-border p-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-[10px] px-6 py-3 text-base font-medium transition ${
                tab === t ? "border border-primary text-primary-text" : "border border-transparent text-muted hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div key={tab} className="animate-page-fade mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {visibleOffices.length === 0 && (
            <p className="col-span-full text-base text-muted">
              No international offices yet — but we ship consultations worldwide. Reach out via the
              form above.
            </p>
          )}
          {visibleOffices.map((office) => (
            <div key={office.label} className="flex flex-col gap-8 rounded-xl border border-border p-6 md:p-10">
              <div className="flex flex-col gap-3.5">
                <span className="text-sm font-medium text-muted">{office.label}</span>
                <h3 className="text-2xl font-semibold text-white sm:text-3xl">{office.heading}</h3>
                <p className="text-base leading-relaxed text-muted">{office.description}</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <span className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm text-white">
                  <Mail size={14} className="text-primary-text" />
                  {office.email}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm text-white">
                  <Phone size={14} className="text-primary-text" />
                  {office.phone}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm text-white">
                  <MapPinned size={14} className="text-primary-text" />
                  {office.city}
                </span>
              </div>
              <button className="flex items-center justify-center gap-2 rounded-[10px] bg-primary py-[18px] text-base font-medium text-white hover:bg-primary/90">
                <Navigation size={16} />
                Get Direction
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Gallery */}
      <Section className="border-t border-border">
        <div className="rounded-xl border border-border p-4 md:p-10">
          <SectionHeading
            title="Explore Estatein's World"
            paragraph="Step inside the world of Estatein, where professionalism meets warmth, and expertise meets passion. Our gallery offers a glimpse into our team and workspaces, inviting you to get to know us better."
          />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
            {GALLERY.map((src, i) => (
              <img
                key={src + i}
                src={src}
                alt="Estatein workspace"
                className={`h-[160px] w-full rounded-lg object-cover sm:h-[220px] ${i === 0 ? "col-span-2 h-[220px] sm:h-[300px] md:col-span-1" : ""}`}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
