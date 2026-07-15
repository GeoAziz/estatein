import { Section } from "../components/ui";
import { PrimaryButton } from "../components/ui";

export default function NotFound() {
  return (
    <Section className="flex flex-col items-center gap-6 py-32 text-center">
      <span className="text-sm font-medium uppercase tracking-wide text-primary-text">404</span>
      <h1 className="text-4xl font-semibold text-white sm:text-5xl">Page Not Found</h1>
      <p className="max-w-md text-base text-muted">
        We couldn't find the page you're looking for. It may have been moved or no longer exists.
      </p>
      <PrimaryButton to="/">Back to Home</PrimaryButton>
    </Section>
  );
}
