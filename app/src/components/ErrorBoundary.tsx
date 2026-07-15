import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { apiClient } from "../lib/api-client";
import { Sentry } from "../lib/sentry";
import { PrimaryButton } from "./ui";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render errors anywhere below it so one broken page (e.g. a bad API
 * response shape) shows a recoverable screen instead of a blank white page
 * for the whole app — this is what would have contained the AdminDashboard
 * crash before that bug was fixed at the source.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack ?? undefined } });
    apiClient.reportError({
      message: error.message,
      stack: error.stack,
      context: { componentStack: info.componentStack ?? undefined },
      url: window.location.href,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base px-6 text-center text-white">
          <AlertTriangle className="text-red-400" size={40} />
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-base text-muted">
            This page hit an unexpected error. It's been reported — try reloading, or head back home.
          </p>
          <PrimaryButton onClick={() => window.location.assign("/")}>Go home</PrimaryButton>
        </div>
      );
    }
    return this.props.children;
  }
}
