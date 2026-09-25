/**
 * Health & Navigation Tests
 * Verifies the app loads, the sidebar shows system operational status,
 * and all navigation tabs render without errors.
 */

import { test, expect } from '@playwright/test';

test.describe('Health & Navigation', () => {

  test('dashboard loads with KPI cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
    // Four KPI cards must exist
    await expect(page.locator('.kpi-card')).toHaveCount(4);
  });

  test('sidebar shows System Operational status', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar-footer')).toContainText('System Operational', { timeout: 8000 });
  });

  test('navigate to Customers tab', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("◉ Customers")');
    // The customer list page heading
    await expect(page.locator('text=Customers')).toBeVisible();
  });

  test('navigate to Upload Data tab', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("⇧ Upload Data")');
    await expect(page.locator('text=Start New Onboarding')).toBeVisible();
  });

  test('navigate to Jobs tab', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("⚡ Jobs")');
    await expect(
      page.locator('h2:has-text("Track Specific Job"), h2:has-text("Track Job Status")')
    ).toBeVisible();
  });

  test('navigate to Schema Mapping tab', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("⤢ Schema Mapping")');
    await expect(page.locator('h1:has-text("Schema Mapping")')).toBeVisible();
  });

  test('navigate to Activity Logs tab', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("◌ Activity Logs")');
    await expect(page.locator('text=Activity Logs')).toBeVisible();
  });

  test('navigate to Settings tab', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("⚙ Settings")');
    await expect(page.locator('text=Settings')).toBeVisible();
  });

});
