// tests/e2e/happy-path.spec.ts
//
// Option B: resilient happy-path test against live Polymarket data.
//
// `page.route` cannot intercept server-side fetches issued from Next.js
// server components / API routes (those run in the Node runtime, not the
// browser), so we cannot deterministically mock the gamma API at the
// network layer from Playwright.
//
// Instead this test verifies behavior — that the home page renders either
// trending markets or an empty state, and that clicking through to a
// market lands on a page with the flip button. It does not assert specific
// market questions or trigger the full flip→sim flow because live data is
// non-deterministic.
import { test, expect } from "@playwright/test";

test("home renders, navigating to a market shows the flip button", async ({ page }) => {
  await page.goto("/");

  // Header is always present.
  await expect(page.getByRole("heading", { name: /MarketFlip/ })).toBeVisible();

  // Trending section heading is always present.
  await expect(page.getByText("Trending now")).toBeVisible();

  // Either a market card link rendered, or the empty-state copy.
  const marketLink = page.locator('a[href^="/m/"]').first();
  const emptyState = page.getByText(/No live markets right now/i);

  // Wait for whichever one appears first.
  await expect(marketLink.or(emptyState)).toBeVisible({ timeout: 15_000 });

  if (await emptyState.isVisible().catch(() => false)) {
    test.info().annotations.push({
      type: "note",
      description: "No trending markets returned by Polymarket; skipping market-page assertions.",
    });
    return;
  }

  // Click into the first market.
  await marketLink.click();

  // Market page should show the flip button.
  await expect(page.getByRole("button", { name: /flip the coin/i })).toBeVisible({
    timeout: 15_000,
  });

  // And the simulation panel run button.
  await expect(page.getByRole("button", { name: /run 1,000/i })).toBeVisible();
});
