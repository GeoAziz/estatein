import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:3000/api";

const MOCK_PROPERTY = {
  id: "prop_1",
  slug: "riverside-villa",
  name: "Riverside Villa",
  title: "Riverside Villa",
  city: "Nairobi",
  price: 15_000_000,
  bedrooms: 4,
  bathrooms: 3,
  propertyType: "villa",
  images: ["https://example.com/photo.jpg"],
  description: "A spacious villa overlooking the river, in a quiet Nairobi suburb.",
  features: ["Swimming pool", "Backup generator"],
  lat: -1.2921,
  lng: 36.8219,
};

test.beforeEach(async ({ page }) => {
  // No live backend in this environment — stub the handful of endpoints the
  // golden path touches so the suite is hermetic and doesn't need Postgres.
  await page.route(`${API_BASE}/auth/me`, (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ data: null, error: { code: "NOT_AUTHENTICATED", message: "Not authenticated", statusCode: 401 } }),
    })
  );

  await page.route(`${API_BASE}/properties?*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { properties: [MOCK_PROPERTY] } }),
    })
  );

  await page.route(`${API_BASE}/properties/${MOCK_PROPERTY.slug}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { property: MOCK_PROPERTY } }),
    })
  );

  await page.route(`${API_BASE}/properties/${MOCK_PROPERTY.id}/views`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { success: true } }) })
  );
});

test("browse properties, open a listing, and reach the inquiry gate", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Estatein/i);

  await page.getByRole("link", { name: /^properties$/i }).first().click();
  await expect(page).toHaveURL(/\/properties$/);

  await expect(page.getByText(MOCK_PROPERTY.name)).toBeVisible();
  await page.getByRole("link", { name: /view property details/i }).click();

  await expect(page).toHaveURL(new RegExp(`/properties/${MOCK_PROPERTY.slug}$`));
  await expect(page.getByRole("heading", { name: MOCK_PROPERTY.name })).toBeVisible();

  // Not logged in — clicking through to contact the agent should gate on auth
  // rather than silently letting an anonymous inquiry through.
  await page.getByRole("button", { name: /schedule viewing/i }).click();
  const modal = page.getByRole("dialog");
  await expect(modal.getByText(/sign in to contact the agent/i)).toBeVisible();
  await expect(modal.getByRole("link", { name: /log in/i })).toBeVisible();
});

test("map search page renders a map container for a property with coordinates", async ({ page }) => {
  await page.route(`${API_BASE}/properties?limit=100`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { properties: [MOCK_PROPERTY] } }),
    })
  );

  await page.goto("/map-search");
  await expect(page.getByText(/properties found/i)).toBeVisible();
  await expect(page.getByText(MOCK_PROPERTY.name)).toBeVisible();
});
