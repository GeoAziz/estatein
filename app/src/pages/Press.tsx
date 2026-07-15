import { Download, Mail } from "lucide-react";
import { Section, SectionHeading } from "../components/ui";
import CTASection from "../components/CTASection";
import { MEDIA_MENTIONS, PRESS_RELEASES } from "../data/content";

export default function Press() {
  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Press & Media"
          paragraph="Press releases, media coverage, and company announcements from Estatein."
        />
      </Section>

      {/* Press Releases */}
      <Section className="border-t border-border">
        <SectionHeading title="Latest News About Estatein" />
        <div className="mt-10 flex flex-col gap-4">
          {PRESS_RELEASES.map((release) => (
            <div
              key={release.title}
              className="flex flex-col gap-3 rounded-xl border border-border p-6 md:flex-row md:items-center md:justify-between md:p-8"
            >
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted">{release.date}</span>
                <h3 className="text-xl font-semibold text-white">{release.title}</h3>
                <p className="max-w-2xl text-base leading-relaxed text-muted">{release.excerpt}</p>
              </div>
              <a
                href="#"
                className="shrink-0 text-base font-medium text-white underline underline-offset-4 hover:text-primary-text"
              >
                Read Full Release
              </a>
            </div>
          ))}
        </div>
      </Section>

      {/* Media Coverage */}
      <Section className="border-t border-border">
        <SectionHeading title="Featured In" />
        <div className="mt-10 flex flex-wrap items-center gap-4">
          {MEDIA_MENTIONS.map((name) => (
            <a
              key={name}
              href="#"
              className="rounded-xl border border-border px-8 py-6 text-lg font-semibold text-white hover:border-primary hover:text-primary-text"
            >
              {name}
            </a>
          ))}
        </div>
      </Section>

      {/* Press Kit */}
      <Section className="border-t border-border">
        <div className="rounded-xl border border-border p-6 md:p-10">
          <SectionHeading
            title="Press Kit"
            paragraph="Download official Estatein brand assets, or reach out directly for media inquiries."
          />
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#"
              className="flex items-center gap-2 rounded-[10px] border border-border px-6 py-[18px] text-base font-medium text-white hover:border-primary hover:text-primary-text"
            >
              <Download size={18} />
              Brand Guidelines PDF
            </a>
            <a
              href="#"
              className="flex items-center gap-2 rounded-[10px] border border-border px-6 py-[18px] text-base font-medium text-white hover:border-primary hover:text-primary-text"
            >
              <Download size={18} />
              Logo & Assets
            </a>
          </div>
          <div className="mt-6 flex items-center gap-2 text-base text-muted">
            <Mail size={16} className="text-primary-text" />
            Press Inquiries: <a href="mailto:press@estatein.com" className="text-white hover:text-primary-text">press@estatein.com</a>
          </div>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
