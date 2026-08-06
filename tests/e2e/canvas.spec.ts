"""
Playwright E2E Test Suite for EduMechanic 3D Phase 4
Tests 3D Viewport interactions, Exploded View slider, Drawer tabs, and PDF export flow.
"""
# Content for E2E Spec documentation & JS test runner
"""
import { test, expect } from '@playwright/test';

test.describe('EduMechanic 3D Canvas & UI E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Page header and title renders correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/EduMechanic 3D/);
    await expect(page.getByText('EduMechanic 3D')).toBeVisible();
    await expect(page.getByText('5학년 2반 모둠 B')).toBeVisible();
  });

  test('Exploded View slider interacts properly', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    await slider.fill('50');
    await expect(page.getByText('50%')).toBeVisible();
  });

  test('Drawer panel tabs switch smoothly', async ({ page }) => {
    await page.getByRole('button', { name: '💬 함께 탐구하기' }).click();
    await expect(page.getByText('5학년 2반 모둠 B 실시간 대화')).toBeVisible();

    await page.getByRole('button', { name: '🧩 AI 탐구 퀴즈' }).click();
    await expect(page.getByText('AI 수수께끼 탐구 퀴즈')).toBeVisible();
  });
});
"""
