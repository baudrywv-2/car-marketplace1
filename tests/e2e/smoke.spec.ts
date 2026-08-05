import { test, expect } from "@playwright/test";

test.describe("public smoke", () => {
  test("home loads with brand", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/DRCCARS/i).first()).toBeVisible();
  });

  test("cars browse SSR shell loads", async ({ page }) => {
    const res = await page.goto("/cars");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("login form is reachable (auth entry)", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(
      page.locator('input[type="password"], input[name="password"]').first()
    ).toBeVisible();
  });

  test("privacy no longer claims Stripe", async ({ page }) => {
    await page.goto("/privacy");
    const text = await page.locator("main").innerText();
    expect(text.toLowerCase()).not.toContain("stripe");
  });
});

test.describe("listing detail + RDV CTA", () => {
  test("first catalog car opens detail with meeting CTA or login prompt", async ({
    page,
  }) => {
    await page.goto("/cars");
    const card = page.locator('a[href^="/cars/"]').first();
    const count = await card.count();
    test.skip(count === 0, "No live listings in this environment");

    const href = await card.getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(href!);
    await expect(page.locator("h1, h2").first()).toBeVisible();

    const body = await page.locator("body").innerText();
    const hasRdvSignal =
      /rendez-vous|meeting|demande|login|connexion|se connecter/i.test(body);
    expect(hasRdvSignal).toBeTruthy();
  });
});

test.describe("authenticated flows", () => {
  const email = process.env.SMOKE_EMAIL;
  const password = process.env.SMOKE_PASSWORD;

  test("login → dashboard (when SMOKE_EMAIL/PASSWORD set)", async ({ page }) => {
    test.skip(!email || !password, "Set SMOKE_EMAIL and SMOKE_PASSWORD to run auth smoke");

    await page.goto("/login");
    await page.locator('input[type="email"], input[name="email"]').first().fill(email!);
    await page
      .locator('input[type="password"], input[name="password"]')
      .first()
      .fill(password!);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/dashboard|\/$/, { timeout: 30_000 });
    expect(page.url()).toMatch(/dashboard|\//);
  });
});
