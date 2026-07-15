import { Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { PrimaryButton, Section, SectionHeading } from "../components/ui";
import CTASection from "../components/CTASection";
import { CULTURE_BENEFITS, JOBS, WHY_JOIN } from "../data/content";
import team1 from "../assets/img/team-1.jpg";
import team2 from "../assets/img/team-2.jpg";
import team3 from "../assets/img/team-3.jpg";
import team4 from "../assets/img/team-4.jpg";

const STATS = [
  { value: "50+", label: "Team Members" },
  { value: "Growing", label: "Rapidly" },
  { value: "Flexible", label: "Work" },
];

const CULTURE_ICONS = [ShieldCheck, Rocket, Sparkles, ShieldCheck];
const WHY_ICONS = [Rocket, Sparkles, ShieldCheck];
const TEAM_PHOTOS = [team1, team2, team3, team4];

export default function Careers() {
  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          align="center"
          title="Build Your Career at Estatein"
          paragraph="We're looking for talented people to join our growing company. Explore open roles and see what it's like to work with us."
        />
        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-border px-6 py-4 text-center">
              <span className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</span>
              <span className="text-sm text-muted">{stat.label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Open Positions */}
      <Section className="border-t border-border">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            title="Open Positions"
            paragraph="Find a role where your skills and ambitions can grow alongside ours."
          />
          <PrimaryButton to="/contact" className="shrink-0">
            Apply Today
          </PrimaryButton>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {JOBS.map((job) => (
            <div
              key={job.title}
              className="flex flex-col gap-6 rounded-xl border border-border p-6 md:p-8 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                <div className="flex flex-wrap gap-2.5">
                  <span className="rounded-full border border-border px-3.5 py-1.5 text-sm text-muted">
                    {job.department}
                  </span>
                  <span className="rounded-full border border-border px-3.5 py-1.5 text-sm text-muted">
                    {job.location}
                  </span>
                  <span className="rounded-full border border-border px-3.5 py-1.5 text-sm text-muted">
                    {job.type}
                  </span>
                </div>
              </div>
              <PrimaryButton to="/contact" className="w-full sm:w-auto">
                Apply Now
              </PrimaryButton>
            </div>
          ))}
        </div>
      </Section>

      {/* Company Culture */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Company Culture"
          paragraph="We invest in our team the same way we invest in our clients' futures."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CULTURE_BENEFITS.map((benefit, i) => {
            const Icon = CULTURE_ICONS[i];
            return (
              <div key={benefit.title} className="flex flex-col gap-4 rounded-xl border border-border p-6 md:p-8">
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-border text-primary-text">
                  <Icon size={22} />
                </span>
                <h3 className="text-lg font-semibold text-white">{benefit.title}</h3>
                <p className="text-base leading-relaxed text-muted">{benefit.description}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {TEAM_PHOTOS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="Estatein team"
              className="h-[160px] w-full rounded-lg object-cover sm:h-[220px]"
              loading="lazy"
            />
          ))}
        </div>
      </Section>

      {/* Why Join Us */}
      <Section className="border-t border-border">
        <SectionHeading title="Why Join Us" align="center" />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {WHY_JOIN.map((item, i) => {
            const Icon = WHY_ICONS[i];
            return (
              <div key={item.title} className="flex flex-col items-center gap-4 rounded-xl border border-border p-8 text-center">
                <span className="flex h-[62px] w-[62px] items-center justify-center rounded-full border border-border text-primary-text">
                  <Icon size={26} />
                </span>
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="text-base leading-relaxed text-muted">{item.description}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-10 flex justify-center">
          <PrimaryButton to="/contact">See All Jobs</PrimaryButton>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
