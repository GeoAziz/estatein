import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:3000/api";

const MOCK_USER = {
  id: "user_1",
  email: "buyer@example.com",
  name: "Test Buyer",
  role: "buyer",
  phone: "0712345678",
};

test.describe("Login flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${API_BASE}/auth/me`, (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ data: null, error: { code: "NOT_AUTHENTICATED", message: "Not authenticated", statusCode: 401 } }),
      })
    );
  });

  test("logs in with email and password and reaches the buyer dashboard", async ({ page }) => {
    await page.route(`${API_BASE}/auth/login`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { user: MOCK_USER } }),
      })
    );

    // Dashboard data fetches — stub as empty so the page renders without erroring.
    for (const path of ["favorites", "saved-searches", "inquiries"]) {
      await page.route(`${API_BASE}/${path}*`, (route) =>
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { [path]: [] } }) })
      );
    }

    await page.goto("/login");
    await page.getByPlaceholder(/you@example.com/i).fill("buyer@example.com");
    await page.getByPlaceholder(/enter your password/i).fill("Password1");
    await page.getByRole("button", { name: /^log in$/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/buyer/);
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    await page.route(`${API_BASE}/auth/login`, (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ data: null, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password", statusCode: 401 } }),
      })
    );

    await page.goto("/login");
    await page.getByPlaceholder(/you@example.com/i).fill("buyer@example.com");
    await page.getByPlaceholder(/enter your password/i).fill("WrongPassword1");
    await page.getByRole("button", { name: /^log in$/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("routes through the 2FA challenge when the backend requires it", async ({ page }) => {
    await page.route(`${API_BASE}/auth/login`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { requires2FA: true, userId: "user_1" } }),
      })
    );

    await page.goto("/login");
    await page.getByPlaceholder(/you@example.com/i).fill("buyer@example.com");
    await page.getByPlaceholder(/enter your password/i).fill("Password1");
    await page.getByRole("button", { name: /^log in$/i }).click();

    await expect(page.getByText(/two-factor verification/i)).toBeVisible();
    await expect(page.getByText(/use a backup code instead/i)).toBeVisible();
  });
});
