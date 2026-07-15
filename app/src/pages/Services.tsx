import {
  BarChart3,
  ClipboardCheck,
  Compass,
  FileCheck2,
  Gavel,
  Handshake,
  Home as HomeIcon,
  Scale,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";
import { PrimaryButton, Section, SectionHeading } from "../components/ui";
import ServiceHubBar from "../components/ServiceHubBar";
import CTASection from "../components/CTASection";
import { INVESTMENT_SERVICES, MANAGEMENT_SERVICES, SELLING_SERVICES } from "../data/services";

const SELLING_ICONS = [Compass, TrendingUp, Handshake, FileCheck2];
const MANAGEMENT_ICONS = [HomeIcon, Wrench, Wallet, Scale];
const INVESTMENT_ICONS = [BarChart3, ClipboardCheck, ShieldCheck, Gavel];

function ServiceCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Compass;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border p-6 md:p-10">
      <span className="flex h-[62px] w-[62px] items-center justify-center rounded-full border border-border text-primary-text md:h-[82px] md:w-[82px]">
        <Icon size={26} />
      </span>
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-white sm:text-2xl">{title}</h3>
        <p className="text-base leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}

function ServiceBanner({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-border bg-white/5 p-6 sm:flex-row sm:items-center md:p-10">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold text-white sm:text-3xl">{title}</h3>
        <p className="max-w-xl text-base leading-relaxed text-muted">{body}</p>
      </div>
      <PrimaryButton to="/contact" className="w-full shrink-0 sm:w-auto">
        Learn More
      </PrimaryButton>
    </div>
  );
}

export default function Services() {
  return (
    <>
      <Section className="pt-12 lg:pt-16">
        <SectionHeading
          title="Elevate Your Real Estate Experience"
          paragraph="Welcome to Estatein, where your real estate aspirations meet expert guidance. Explore our comprehensive range of services, each designed to cater to your unique needs and dreams."
        />
        <div className="mt-10">
          <ServiceHubBar />
        </div>
      </Section>

      {/* Selling */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Unlock Property Value"
          paragraph="Selling your property should be a rewarding experience, and at Estatein, we make sure it is. Our Property Selling Service is designed to maximize the value of your property, ensuring you get the best deal possible."
        />
        <div className="mt-12 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {SELLING_SERVICES.map((s, i) => (
              <ServiceCard key={s.title} icon={SELLING_ICONS[i]} title={s.title} description={s.description} />
            ))}
          </div>
          <ServiceBanner
            title="Unlock the Value of Your Property Today"
            body="Ready to unlock the true value of your property? Explore our Property Selling Service categories and let us help you achieve the best deal possible for your valuable asset."
          />
        </div>
      </Section>

      {/* Management */}
      <Section className="border-t border-border">
        <SectionHeading
          title="Effortless Property Management"
          paragraph="Owning a property should be a pleasure, not a hassle. Estatein's Property Management Service takes the stress out of property ownership, offering comprehensive solutions tailored to your needs."
        />
        <div className="mt-12 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {MANAGEMENT_SERVICES.map((s, i) => (
              <ServiceCard key={s.title} icon={MANAGEMENT_ICONS[i]} title={s.title} description={s.description} />
            ))}
          </div>
          <ServiceBanner
            title="Experience Effortless Property Management"
            body="Ready to experience hassle-free property management? Explore our Property Management Service categories and let us handle the complexities while you enjoy the benefits of property ownership."
          />
        </div>
      </Section>

      {/* Investment */}
      <Section className="border-t border-border">
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="flex flex-col gap-8 lg:w-2/5">
            <SectionHeading
              title="Smart Investments, Informed Decisions"
              paragraph="Building a real estate portfolio requires a strategic approach. Estatein's Investment Advisory Service empowers you to make smart investments and informed decisions."
            />
            <div className="flex flex-col gap-4 rounded-xl border border-border p-8">
              <h3 className="text-2xl font-semibold text-white">Unlock Your Investment Potential</h3>
              <p className="text-base leading-relaxed text-white/80">
                Explore our Investment Advisory Service categories and let us help you build a
                portfolio that works for your goals.
              </p>
              <PrimaryButton to="/contact" className="self-start">
                Learn More
              </PrimaryButton>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            {INVESTMENT_SERVICES.map((s, i) => (
              <ServiceCard key={s.title} icon={INVESTMENT_ICONS[i]} title={s.title} description={s.description} />
            ))}
          </div>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
