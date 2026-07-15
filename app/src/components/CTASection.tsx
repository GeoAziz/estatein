import { PrimaryButton, Section } from "./ui";

export default function CTASection() {
  return (
    <Section className="border-y border-border">
      <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
        <div className="flex max-w-2xl flex-col gap-3.5">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
            Start Your Real Estate Journey Today
          </h2>
          <p className="text-base leading-relaxed text-muted lg:text-lg">
            Your dream property is just a click away. Whether you're looking for a new home, a
            strategic investment, or expert real estate advice, Estatein is here to assist you
            every step of the way. Take the first step towards your real estate goals and explore
            our available properties or get in touch with our team for personalized assistance.
          </p>
        </div>
        <PrimaryButton to="/properties" className="shrink-0">
          Explore Properties
        </PrimaryButton>
      </div>
    </Section>
  );
}
