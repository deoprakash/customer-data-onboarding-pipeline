/**
 * Complete End-to-End Onboarding Flow Tests
 *
 * Covers:
 *  1. Happy path  – existing customer (acme) with known schema:
 *       CSV upload → immediate job queue → job COMPLETED
 *
 *  2. New customer path – unknown customer triggers AI mapping:
 *       CSV upload → AI mapping review → approve → job COMPLETED
 *
 *  3. Self-healing path – deliberately broken config (wrong date format) is
 *     uploaded for a known customer; the pipeline should attempt LLM healing
 *     and ultimately COMPLETE (or show the healing status message in transit).
 *
 * Prerequisites (must be running):
 *   - Frontend   : npm run dev  (port 5173)
 *   - Backend    : npm run dev  (port 3000)
 *   - Python worker: python -m app.worker
 *   - Redis + PostgreSQL via docker compose up -d
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ─── sample files ───────────────────────────────────────────────────────────
const NOVAMART_CSV   = path.resolve(__dirname, '../../sample-data/novamart/customers.csv');
const GLOBALMART_CSV = path.resolve(__dirname, '../../sample-data/globalmart/customers.csv');
const ACME_CSV       = path.resolve(__dirname, '../../sample-data/acme/customers.csv');

// ─── helpers ────────────────────────────────────────────────────────────────
async function navigateToUpload(page: Page) {
  await page.goto('/');
  await page.click('button:has-text("⇧ Upload Data")');
  await expect(page.locator('text=Start New Onboarding')).toBeVisible();
}

async function waitForJobCompletion(page: Page, timeoutMs = 90_000) {
  // Poll until badge says COMPLETED or FAILED
  await expect(page.locator('.badge-completed, .badge-failed')).toBeVisible({ timeout: timeoutMs });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Complete Onboarding Flow', () => {

  /**
   * HAPPY PATH — existing customer with a known, valid schema
   * acme has acme.yaml → no AI review, job should queue immediately and complete
   */
  test('Happy path: acme (known schema) → job queued and COMPLETED', async ({ page }) => {
    await navigateToUpload(page);

    await page.fill('input#customer', 'acme');
    await page.setInputFiles('input[type="file"]', ACME_CSV);
    await page.click('button[type="submit"]');

    // No AI review – should jump straight to Jobs tracker
    await expect(
      page.locator('h1:has-text("Jobs")')
    ).toBeVisible({ timeout: 15000 });

    // Wait for completion
    await waitForJobCompletion(page);

    const badge = page.locator('.badge-completed');
    await expect(badge).toContainText(/COMPLETED/i);

    // Stats cards should reflect data
    const totalRecords = page.locator('.stat-card').filter({ hasText: 'Total Records' }).locator('.stat-value');
    await expect(totalRecords).not.toHaveText('0');
  });

  /**
   * NEW CUSTOMER PATH — unknown customer triggers AI mapping approval flow
   * globalmart-style headers in a uniquely named customer
   */
  test('New customer: AI mapping approval → job COMPLETED', async ({ page }) => {
    await navigateToUpload(page);

    const customerName = `e2e-new-${Date.now()}`;
    await page.fill('input#customer', customerName);
    await page.setInputFiles('input[type="file"]', NOVAMART_CSV);
    await page.click('button[type="submit"]');

    // AI review screen must appear
    await expect(page.locator('h2:has-text("Review AI Schema Mapping")')).toBeVisible({ timeout: 20000 });

    // Verify the generated mapping JSON contains expected canonical fields
    const textarea = page.locator('textarea');
    const mappingJson = await textarea.inputValue();
    const mapping = JSON.parse(mappingJson);
    expect(mapping).toHaveProperty('created_at');
    expect(mapping.created_at).toHaveProperty('format'); // must include date format inferred from CSV

    // Approve the mapping
    await page.click('button:has-text("Approve & Run Job")');

    // Redirected to Jobs tracker
    await expect(
      page.locator('h1:has-text("Jobs")')
    ).toBeVisible({ timeout: 10000 });

    // Wait for job to finish
    await waitForJobCompletion(page);
    await expect(page.locator('.badge-completed')).toContainText(/COMPLETED/i);

    // Valid records > 0
    const validRecords = page.locator('.stat-card').filter({ hasText: 'Valid' }).locator('.stat-value');
    await expect(validRecords).not.toHaveText('0');
  });

  /**
   * GLOBALMART LARGE DATASET — 20 rows, 1 intentionally rejected
   */
  test('Large dataset: globalmart (20 rows, 1 rejection) → COMPLETED with correct stats', async ({ page }) => {
    await navigateToUpload(page);

    await page.fill('input#customer', 'globalmart');
    await page.setInputFiles('input[type="file"]', GLOBALMART_CSV);
    await page.click('button[type="submit"]');

    // globalmart has a known schema — skip AI review
    await expect(
      page.locator('h1:has-text("Jobs")')
    ).toBeVisible({ timeout: 15000 });

    await waitForJobCompletion(page);
    await expect(page.locator('.badge-completed')).toContainText(/COMPLETED/i);

    const total = page.locator('.stat-card').filter({ hasText: 'Total Records' }).locator('.stat-value');
    await expect(total).toHaveText('20');
  });

  /**
   * SELF-HEALING PATH — deliberately write a broken YAML config with a wrong
   * date format for novamart (novamart uses %Y-%m-%d, we'll set it to %m/%d/%Y).
   * The worker should detect the failure, invoke the LLM healer, and retry.
   * We verify the job eventually lands in COMPLETED or at minimum shows the
   * healing status message during processing.
   */
  test('Self-healing: broken date format → LLM fixes schema → COMPLETED', async ({ page }) => {
    const CONFIG_PATH = path.resolve(
      __dirname,
      '../../data_engine/configs/customers/novamart.yaml'
    );

    // Read original config so we can restore it after the test
    const originalConfig = fs.existsSync(CONFIG_PATH)
      ? fs.readFileSync(CONFIG_PATH, 'utf8')
      : null;

    // Deliberately write a broken date format
    const brokenConfig = `customer_id:
  source: client_ref
  required: true
first_name:
  source: customer_name
  required: true
  transformation: first_name
last_name:
  source: customer_name
  required: true
  transformation: last_name
email:
  source: contact_email
  required: true
phone:
  source: contact_number
  required: true
created_at:
  source: signup_date
  format: '%m/%d/%Y'   # WRONG — actual format is %Y-%m-%d
  required: true
`;

    fs.writeFileSync(CONFIG_PATH, brokenConfig, 'utf8');

    try {
      await navigateToUpload(page);

      await page.fill('input#customer', 'novamart');
      await page.setInputFiles('input[type="file"]', NOVAMART_CSV);
      await page.click('button[type="submit"]');

      // novamart has a config → no AI review screen, goes straight to Jobs
      await expect(
        page.locator('h1:has-text("Jobs")')
      ).toBeVisible({ timeout: 15000 });

      // While processing, the self-healing status message may briefly appear
      // (we do a soft check — it may flash by too fast)
      const healingMsg = page.locator('text=LLM self-healing in progress');
      // Not mandatory to catch the transient message, but log if seen
      const sawHealing = await healingMsg.isVisible().catch(() => false);
      if (sawHealing) {
        console.log('✓ Observed LLM self-healing status message');
      }

      // The job must eventually complete (LLM heals → retry → success)
      await waitForJobCompletion(page, 120_000); // allow extra time for LLM round-trip

      const badge = page.locator('.badge-completed');
      await expect(badge).toContainText(/COMPLETED/i);

      // Verify the healed config was saved and uses the correct format
      const healedConfig = fs.readFileSync(CONFIG_PATH, 'utf8');
      expect(healedConfig).toContain('%Y-%m-%d'); // LLM should have corrected this
    } finally {
      // Always restore original config
      if (originalConfig !== null) {
        fs.writeFileSync(CONFIG_PATH, originalConfig, 'utf8');
        console.log('✓ Restored original novamart.yaml');
      }
    }
  });

});
