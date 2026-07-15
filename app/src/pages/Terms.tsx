import { GuideToc, type AccordionSection } from "../components/Accordion";
import { Section, SectionHeading } from "../components/ui";

const SECTIONS: AccordionSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: [
      "By accessing or using the Estatein website, you agree to be bound by these Terms of Service and our Privacy Policy.",
      "If you do not agree with any part of these terms, please discontinue use of the site.",
    ],
  },
  {
    id: "user-responsibilities",
    title: "User Responsibilities",
    content: [
      "You agree to provide accurate information when submitting inquiries, applications, or listing requests.",
      "You will not use the site for unlawful purposes or to misrepresent your identity or intentions to agents or other users.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    content: [
      "All content on this site, including text, graphics, logos, and property images, is owned by Estatein or its licensors and protected by copyright and trademark law.",
      "You may not reproduce, distribute, or create derivative works from our content without prior written permission.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    content: [
      "Property listings are provided for informational purposes and, while we strive for accuracy, are not guaranteed to be complete or error-free.",
      "Estatein is not liable for any indirect, incidental, or consequential damages arising from use of the site or reliance on listing information.",
    ],
  },
  {
    id: "dispute-resolution",
    title: "Dispute Resolution",
    content: [
      "Any disputes arising from these terms will first be addressed through good-faith negotiation.",
      "If unresolved, disputes will be handled through binding arbitration in accordance with applicable local law.",
    ],
  },
  {
    id: "changes-to-terms",
    title: "Changes to Terms",
    content: [
      "We may update these terms periodically. Continued use of the site after changes are posted constitutes acceptance of the revised terms.",
    ],
  },
  {
    id: "contact-information",
    title: "Contact Information",
    content: ["Questions about these terms can be directed to legal@estatein.com or via our Contact page."],
  },
];

export default function Terms() {
  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          eyebrow="Effective Date: June 1, 2026"
          title="Terms of Service"
          paragraph="The rules and guidelines that govern your use of the Estatein website and services."
        />
      </Section>

      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
          <GuideToc sections={SECTIONS} />
          <div className="flex flex-col gap-10">
            {SECTIONS.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-24 flex flex-col gap-3">
                <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
                {section.content.map((p, i) => (
                  <p key={i} className="text-base leading-relaxed text-muted">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
