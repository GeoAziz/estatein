// Generates app/public/sitemap.xml for the Estatein SPA.
//
// This is a Vite SPA with client-side routing (react-router-dom), so there is
// no server-side route table available at build time. Instead of duplicating
// or parsing App.tsx's JSX by hand (which would be brittle), this script
// maintains a curated list of public, crawlable marketing/content routes
// mirrored from the <Route path="..."> definitions inside the <Layout />
// wrapper in `app/src/App.tsx` (read-only reference — this script never
// edits App.tsx). Auth pages (login/signup/forgot-password) and role-gated
// dashboard/agent routes are intentionally excluded since they are not
// meant to be indexed by search engines.
//
// It also attempts to enrich the sitemap with individual property detail
// pages by calling the backend API. If the backend is unreachable (e.g.
// during a frontend-only build), it falls back gracefully to just the
// static routes below.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

// Placeholder production domain — no VITE_SITE_URL / real domain was found
// configured in app/.env.local or vite.config.ts at the time this script was
// written. Update SITE_URL once a real production domain is available.
const SITE_URL = process.env.SITE_URL || "https://estatein.com";
const API_URL = process.env.VITE_API_URL || "http://localhost:3000/api";

// Mirrors the public routes nested under <Route element={<Layout />}> in
// app/src/App.tsx. Keep in sync manually if routes change there.
const STATIC_ROUTES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/properties", changefreq: "daily", priority: "0.9" },
  { path: "/properties/for-sale", changefreq: "daily", priority: "0.9" },
  { path: "/properties/for-rent", changefreq: "daily", priority: "0.9" },
  { path: "/properties/new-construction", changefreq: "daily", priority: "0.8" },
  { path: "/properties/coming-soon", changefreq: "weekly", priority: "0.6" },
  { path: "/map-search", changefreq: "weekly", priority: "0.7" },
  { path: "/pricing", changefreq: "monthly", priority: "0.6" },
  { path: "/services", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/careers", changefreq: "weekly", priority: "0.5" },
  { path: "/press", changefreq: "weekly", priority: "0.4" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/mortgage-calculator", changefreq: "monthly", priority: "0.6" },
  { path: "/market-trends", changefreq: "weekly", priority: "0.7" },
  { path: "/buying-guide", changefreq: "monthly", priority: "0.6" },
  { path: "/selling-guide", changefreq: "monthly", priority: "0.6" },
  { path: "/rental-guide", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/sitemap", changefreq: "monthly", priority: "0.3" },
  { path: "/cookies", changefreq: "yearly", priority: "0.3" },
  { path: "/support", changefreq: "monthly", priority: "0.4" },
];

async function fetchPropertyRoutes() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}/properties?limit=500`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const body = await res.json();
    const items = Array.isArray(body) ? body : body?.data?.properties || body?.properties || body?.data || [];
    if (!Array.isArray(items)) return [];
    return items
      .map((p) => p.slug || p.id)
      .filter(Boolean)
      .map((slug) => ({ path: `/properties/${slug}`, changefreq: "weekly", priority: "0.7" }));
  } catch (err) {
    console.warn(
      `[generate-sitemap] Could not fetch properties from ${API_URL} (backend may not be running at build time). Falling back to static routes only. Reason: ${err.message}`
    );
    return [];
  }
}

function toXml(routes) {
  const urls = routes
    .map(
      ({ path: routePath, changefreq, priority }) => `  <url>
    <loc>${SITE_URL}${routePath}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

async function main() {
  const propertyRoutes = await fetchPropertyRoutes();
  const allRoutes = [...STATIC_ROUTES, ...propertyRoutes];
  const xml = toXml(allRoutes);
  const outFile = path.join(PUBLIC_DIR, "sitemap.xml");
  await writeFile(outFile, xml, "utf-8");
  console.log(
    `[generate-sitemap] Wrote ${allRoutes.length} URLs (${STATIC_ROUTES.length} static, ${propertyRoutes.length} property) to ${outFile}`
  );
}

main().catch((err) => {
  console.error("[generate-sitemap] Failed to generate sitemap:", err);
  process.exitCode = 1;
});
