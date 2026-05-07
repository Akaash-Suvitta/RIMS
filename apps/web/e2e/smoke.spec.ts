import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Smoke tests', () => {
  test('login page loads and has no a11y violations', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/RegAxis/i);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toHaveLength(0);
  });

  test('unauthenticated user is redirected to login from /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
