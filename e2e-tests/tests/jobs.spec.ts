/**
 * Jobs Tracker Tests
 *
 * Covers:
 *  1. Jobs tab renders job list
 *  2. Searching a valid job ID shows job details
 *  3. Searching an invalid job ID shows an error message
 *  4. Pipeline progress steps are rendered
 */

import { test, expect } from '@playwright/test';

const BACKEND = 'http://localhost:3000';

test.describe('Job Tracker', () => {

  test('Jobs tab shows recent jobs list', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("⚡ Jobs")');

    // Either the list table or a "no jobs" message must appear
    await expect(
      page.locator('text=All Recent Jobs, text=No jobs found in history.')
    ).toBeVisible({ timeout: 8000 });
  });

  test('invalid job ID shows error message', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("⚡ Jobs")');

    const input = page.locator('input#jobId');
    await input.fill('nonexistent-job-id-xyz');
    await page.click('button:has-text("Track")');

    await expect(page.locator('text=Job not found')).toBeVisible({ timeout: 8000 });
  });

  test('valid job ID shows job detail with pipeline steps', async ({ page, request }) => {
    // Fetch the most recent job from the backend to use as our test job ID
    const res  = await request.get(`${BACKEND}/jobs`);
    const jobs = await res.json() as { job_id: string; status: string }[];

    if (!jobs || jobs.length === 0) {
      test.skip(true, 'No jobs in the database — run an onboarding first.');
      return;
    }

    const latestJob = jobs[0];

    await page.goto('/');
    await page.click('button:has-text("⚡ Jobs")');

    const input = page.locator('input#jobId');
    await input.fill(latestJob.job_id);
    await page.click('button:has-text("Track")');

    // Job detail heading
    await expect(page.locator('h2:has-text("Track Job Status")')).toBeVisible({ timeout: 8000 });

    // Pipeline steps container
    await expect(page.locator('.pipeline-container')).toBeVisible();

    // All 6 pipeline step labels must be visible
    for (const step of ['Upload', 'Profile', 'Schema Mapping', 'Validation', 'Transformation', 'Load']) {
      await expect(page.locator(`.pipeline-container`).locator(`text=${step}`)).toBeVisible();
    }

    // Status badge must exist
    await expect(page.locator('.badge')).toBeVisible();
  });

  test('back-to-list button returns to jobs list', async ({ page, request }) => {
    const res  = await request.get(`${BACKEND}/jobs`);
    const jobs = await res.json() as { job_id: string }[];

    if (!jobs || jobs.length === 0) {
      test.skip(true, 'No jobs in the database — run an onboarding first.');
      return;
    }

    await page.goto('/');
    await page.click('button:has-text("⚡ Jobs")');

    const input = page.locator('input#jobId');
    await input.fill(jobs[0].job_id);
    await page.click('button:has-text("Track")');

    await expect(page.locator('h2:has-text("Track Job Status")')).toBeVisible({ timeout: 8000 });

    await page.click('button:has-text("← Back to List")');

    await expect(
      page.locator('h2:has-text("Track Specific Job")')
    ).toBeVisible();
  });

});
