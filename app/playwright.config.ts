import { defineConfig, devices } from "@playwright/test";

// These E2E specs mock the backend API via page.route() rather than hitting
// a live estate-backend + Postgres — that keeps them runnable in any
// environment (local or CI) without provisioning the full docker-compose
// stack, at the cost of not exercising the real API contract end-to-end.
// Prefer this suite for frontend regressions; use the backend's own
// integration tests (estate-backend/src/__tests__) for API contract coverage.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
