import { GuideToc, type AccordionSection } from "../components/Accordion";
import { Section, SectionHeading } from "../components/ui";

const SECTIONS: AccordionSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    content: [
      "Estatein (\"we\", \"us\", \"our\") respects your privacy and is committed to protecting the personal data you share with us while using our website and services.",
      "This policy explains what information we collect, how we use it, and the choices you have regarding your data.",
    ],
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: [
      "Contact details you provide through forms, such as name, email, phone number, and mailing address.",
      "Property preferences and inquiry details submitted when browsing listings or requesting information.",
      "Usage data such as pages visited, device type, and browser, collected automatically via cookies.",
    ],
  },
  {
    id: "how-we-use-information",
    title: "How We Use Information",
    content: [
      "To respond to inquiries, schedule tours, and connect you with agents or listings that match your criteria.",
      "To send property alerts, newsletters, and service updates you've opted into.",
      "To improve our website, understand usage patterns, and maintain security.",
    ],
  },
  {
    id: "data-sharing",
    title: "Data Sharing",
    content: [
      "We share information with listing agents and partner brokerages only as needed to fulfill your requests.",
      "We do not sell your personal data to third parties.",
      "We may disclose information if required by law or to protect the rights and safety of Estatein and our users.",
    ],
  },
  {
    id: "security",
    title: "Security",
    content: [
      "We use industry-standard safeguards, including encryption in transit, to protect your data.",
      "No method of transmission or storage is 100% secure, and we continually review our practices to reduce risk.",
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content: [
      "You may request access to, correction of, or deletion of your personal data at any time.",
      "You can opt out of marketing communications using the unsubscribe link in any email or by contacting us directly.",
    ],
  },
  {
    id: "contact-us",
    title: "Contact Us",
    content: [
      "For questions about this policy or your data, contact us at privacy@estatein.com or through our Contact page.",
    ],
  },
];

export default function Privacy() {
  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          eyebrow="Last Updated: June 1, 2026"
          title="Privacy Policy"
          paragraph="How Estatein collects, uses, and protects your personal information."
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
