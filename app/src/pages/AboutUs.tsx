import { Award, HandHeart, ShieldCheck, Sparkles } from "lucide-react";
import { Section, SectionHeading } from "../components/ui";
import CTASection from "../components/CTASection";
import SEO from "../components/SEO";
import { ACHIEVEMENTS, CLIENTS, PROCESS_STEPS, TEAM, VALUES } from "../data/content";
import aboutHero from "../assets/img/about-hero.jpg";

const STATS = [
  { value: "200+", label: "Happy Customers" },
  { value: "10k+", label: "Properties For Clients" },
  { value: "16+", label: "Years of Experience" },
];

const VALUE_ICONS = [ShieldCheck, Award, HandHeart, Sparkles];

export default function AboutUs() {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about Estatein's journey, values, and the team dedicated to making your real estate dreams a reality."
      />
      {/* Our Journey */}
      <Section className="pt-12 lg:pt-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-3.5">
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Our Journey
              </h1>
              <p className="text-base leading-relaxed text-muted lg:text-lg">
                Our story is one of continuous growth and evolution. We started as a small team
                with big dreams, determined to create a real estate platform that transcended the
                ordinary. Over the years, we've expanded our reach, forged valuable partnerships,
                and gained the trust of countless clients.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-1 flex-col gap-1 rounded-xl border border-border px-6 py-4"
                >
                  <span className="text-3xl font-bold text-white">{stat.value}</span>
                  <span className="text-sm text-muted">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <img
              src={aboutHero}
              alt="The Estatein team at work"
              className="h-[320px] w-full object-cover sm:h-[420px] lg:h-[546px]"
            />
          </div>
        </div>
      </Section>

      {/* Our Values */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Our Values"
          paragraph="Our story is one of continuous growth and evolution. We started as a small team with big dreams, determined to create a real estate platform that transcended the ordinary."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {VALUES.map((value, i) => {
            const Icon = VALUE_ICONS[i];
            return (
              <div key={value.title} className="flex items-start gap-4 rounded-xl border border-border p-6 md:p-8">
                <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full border border-primary text-primary-text">
                  <Icon size={26} />
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold text-white sm:text-2xl">{value.title}</h3>
                  <p className="text-base leading-relaxed text-muted">{value.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Our Achievements */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Our Achievements"
          paragraph="Our story is one of continuous growth and evolution. We started as a small team with big dreams, determined to create a real estate platform that transcended the ordinary."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {ACHIEVEMENTS.map((item) => (
            <div key={item.title} className="flex flex-col gap-4 rounded-xl border border-border p-8">
              <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
              <p className="text-base leading-relaxed text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Navigating the Estatein Experience"
          paragraph="At Estatein, we've designed a straightforward process to help you find and purchase your dream property with ease. Here's a step-by-step guide to how it all works."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PROCESS_STEPS.map((step) => (
            <div key={step.step} className="flex flex-col overflow-hidden rounded-xl border border-border">
              <div className="border-b border-primary bg-primary/10 px-6 py-4 text-sm font-semibold text-primary-text">
                {step.step}
              </div>
              <div className="flex flex-col gap-3 p-6">
                <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                <p className="text-base leading-relaxed text-muted">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Team */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Meet the Estatein Team"
          paragraph="At Estatein, our success is driven by the dedication and expertise of our team. Get to know the people behind our mission to make your real estate dreams a reality."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM.map((member) => (
            <div key={member.name} className="flex flex-col gap-6 rounded-xl border border-border p-6">
              <img
                src={member.image}
                alt={member.name}
                className="h-[220px] w-full rounded-lg object-cover"
                loading="lazy"
              />
              <div className="flex flex-col items-center gap-4 text-center">
                <div>
                  <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                  <p className="text-sm text-muted">{member.role}</p>
                </div>
                <button className="rounded-full border border-border px-6 py-2 text-sm font-medium text-white hover:border-primary hover:text-primary-text">
                  Say Hello 👋
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Clients */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Our Valued Clients"
          paragraph="At Estatein, we have had the privilege of working with a diverse range of clients across various industries. Here are some of the clients we've had the pleasure of serving."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {CLIENTS.map((client) => (
            <div key={client.name} className="flex flex-col gap-8 rounded-xl border border-border p-6 md:p-10">
              <div className="flex flex-col gap-3">
                <span className="text-sm text-muted">{client.since}</span>
                <h3 className="text-2xl font-semibold text-white sm:text-3xl">{client.name}</h3>
                <button className="self-start rounded-[10px] border border-border px-6 py-2.5 text-sm font-medium text-white hover:border-primary hover:text-primary-text">
                  Visit Website
                </button>
              </div>
              <div className="flex gap-10">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted">Domain</span>
                  <span className="text-base font-medium text-white">{client.domain}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted">Category</span>
                  <span className="text-base font-medium text-white">{client.category}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-lg bg-white/5 p-5">
                <span className="text-sm text-muted">What They Said 🤝</span>
                <p className="text-base leading-relaxed text-white">{client.testimonial}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <CTASection />
    </>
  );
}
