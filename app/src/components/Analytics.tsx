import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Loads Google Analytics 4 (gated behind VITE_GA_MEASUREMENT_ID) and injects the
 * Google Search Console verification meta tag (gated behind VITE_GOOGLE_SITE_VERIFICATION).
 * Renders nothing — side effects only, mounted once at the app root.
 */
export default function Analytics() {
  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (measurementId && !document.querySelector(`script[data-ga-id="${measurementId}"]`)) {
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.async = true;
      script.setAttribute("data-ga-id", measurementId);
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: any[]) {
        window.dataLayer.push(args);
      };
      window.gtag("js", new Date());
      window.gtag("config", measurementId, { anonymize_ip: true });
    }

    const verificationCode = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;
    if (verificationCode && !document.querySelector('meta[name="google-site-verification"]')) {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "google-site-verification");
      meta.setAttribute("content", verificationCode);
      document.head.appendChild(meta);
    }
  }, []);

  return null;
}
