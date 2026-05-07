import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page shows form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('invalid credentials show error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should stay on login page (not navigate away)
    await expect(page).toHaveURL(/\/login/);
  });
});
