import SEO from "./SEO";

/**
 * Site-wide Organization structured data (schema.org JSON-LD).
 *
 * Mount this once near the root of the app so the Organization/RealEstateAgent
 * schema is present on every page, independent of any per-page <SEO> usage
 * (per-page SEO calls only override title/description/canonical/image — this
 * component's jsonLd injection is additive and cleans up its own <script> tag
 * on unmount like any other SEO usage).
 *
 * Where to mount: inside `app/src/App.tsx`, as a sibling of the routing tree —
 * e.g. directly under <AuthProvider> (or another top-level provider) so it
 * renders once regardless of route, such as:
 *
 *   <AuthProvider>
 *     <SiteSEO />
 *     <ToastProvider>
 *       ...
 *
 * Do not mount it inside <Routes>/<Route> since it should apply globally, not
 * per-route.
 */
export default function SiteSEO() {
  return (
    <SEO
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        name: "Estatein",
        description:
          "Discover Your Dream Property with Estatein. Browse properties for sale, rent, and investment opportunities.",
        url: typeof window !== "undefined" ? window.location.origin : undefined,
        areaServed: {
          "@type": "Country",
          name: "Kenya",
        },
      }}
    />
  );
}
