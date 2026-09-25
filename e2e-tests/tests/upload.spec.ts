/**
 * Upload & AI Schema Mapping Tests
 *
 * Covers:
 *  1. File upload form validation (missing customer name, missing file)
 *  2. Uploading a new-customer CSV triggers AI mapping review screen
 *  3. The mapping textarea is editable (human-in-the-loop)
 *  4. Cancelling the approval returns to the upload form
 */

import { test, expect } from '@playwright/test';
import path from 'path';

const NOVAMART_CSV = path.resolve(__dirname, '../../sample-data/novamart/customers.csv');
const ACME_CSV    = path.resolve(__dirname, '../../sample-data/acme/customers.csv');

test.describe('Upload & AI Schema Mapping', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("⇧ Upload Data")');
    await expect(page.locator('text=Start New Onboarding')).toBeVisible();
  });

  test('submit button is disabled when form is empty', async ({ page }) => {
    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeDisabled();
  });

  test('submit button stays disabled with only customer name filled', async ({ page }) => {
    await page.fill('input#customer', 'test-customer');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('submit button enables after customer name + file selected', async ({ page }) => {
    await page.fill('input#customer', 'acme'); // known customer – no AI review
    await page.setInputFiles('input[type="file"]', ACME_CSV);
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('new customer CSV triggers AI schema mapping review', async ({ page }) => {
    const uniqueName = `e2e-upload-${Date.now()}`;
    await page.fill('input#customer', uniqueName);
    await page.setInputFiles('input[type="file"]', NOVAMART_CSV);
    await page.click('button[type="submit"]');

    // Expect the AI review screen to appear
    await expect(page.locator('h2:has-text("Review AI Schema Mapping")')).toBeVisible({ timeout: 20000 });

    // Textarea should contain a JSON mapping
    const textarea = page.locator('textarea');
    const content = await textarea.inputValue();
    expect(content).toContain('created_at');
  });

  test('mapping textarea is editable (human-in-the-loop)', async ({ page }) => {
    const uniqueName = `e2e-edit-${Date.now()}`;
    await page.fill('input#customer', uniqueName);
    await page.setInputFiles('input[type="file"]', NOVAMART_CSV);
    await page.click('button[type="submit"]');

    await expect(page.locator('h2:has-text("Review AI Schema Mapping")')).toBeVisible({ timeout: 20000 });

    const textarea = page.locator('textarea');
    // Clear and type some JSON to verify it's editable
    await textarea.click({ clickCount: 3 });
    await page.keyboard.type('{}'); // dummy — just verifying editability
    await expect(textarea).toHaveValue('{}');
  });

  test('cancelling AI mapping review returns to upload form', async ({ page }) => {
    const uniqueName = `e2e-cancel-${Date.now()}`;
    await page.fill('input#customer', uniqueName);
    await page.setInputFiles('input[type="file"]', NOVAMART_CSV);
    await page.click('button[type="submit"]');

    await expect(page.locator('h2:has-text("Review AI Schema Mapping")')).toBeVisible({ timeout: 20000 });
    await page.click('button:has-text("Cancel")');

    await expect(page.locator('text=Start New Onboarding')).toBeVisible();
  });

});
