import { useState } from "react";
import { Section, SectionHeading } from "../components/ui";
import SEO from "../components/SEO";

function Toggle({ label, description, defaultOn = true, locked = false }: { label: string; description: string; defaultOn?: boolean; locked?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-6 rounded-xl border border-border p-6">
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold text-white">{label}</span>
        <span className="text-sm text-muted">{description}</span>
      </div>
      <button
        aria-label={`Toggle ${label}`}
        disabled={locked}
        onClick={() => setOn((v) => !v)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-primary" : "bg-white/10"} ${locked ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}

const SECTIONS = [
  {
    title: "What are cookies?",
    body: "Cookies are small text files stored on your device that help websites remember information about your visit, like preferences and login state.",
  },
  {
    title: "Third-party cookies",
    body: "Some cookies are set by third-party services we use for analytics and advertising. These providers have their own privacy policies governing data use.",
  },
  {
    title: "Updates to this policy",
    body: "We may update this cookie policy periodically to reflect changes in the tools we use or applicable regulations. Check back for the latest version.",
  },
];

export default function Cookies() {
  return (
    <>
      <SEO
        title="Cookie Policy"
        description="Learn how Estatein uses cookies and similar technologies, and how you can manage your cookie preferences."
      />
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Cookie Policy"
          paragraph="How Estatein uses cookies, and how you can control them."
        />
      </Section>

      <Section className="border-t border-border">
        <SectionHeading title="Types of Cookies We Use" />
        <div className="mt-8 flex flex-col gap-4">
          <Toggle label="Essential Cookies" description="Required for the site to function — cannot be disabled." defaultOn locked />
          <Toggle label="Analytics Cookies" description="Help us understand how visitors use the site so we can improve it." defaultOn />
          <Toggle label="Marketing Cookies" description="Used to show you relevant listings and offers across the web." defaultOn={false} />
        </div>
      </Section>

      <Section className="border-t border-border">
        <div className="flex flex-col gap-10">
          {SECTIONS.map((section) => (
            <div key={section.title} className="flex flex-col gap-3">
              <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
              <p className="text-base leading-relaxed text-muted">{section.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold text-white">How to Control Cookies</h2>
          <p className="text-base leading-relaxed text-muted">
            You can manage your preferences above, or control cookies directly through your browser settings.
            Disabling non-essential cookies won't affect core site functionality, but may limit personalization.
          </p>
        </div>
      </Section>
    </>
  );
}
