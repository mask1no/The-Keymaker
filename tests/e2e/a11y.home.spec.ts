import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright'; test.describe('Accessibility: Home', () => { test('homepage has no critical a11y violations', async ({ page }) => { await page.addInitScript(() => { (window as any).__TEST_MODE__ = true; }); await page.goto('/'); const accessibilityScanResults = await new AxeBuilder({ page }) .withTags(['wcag2a', 'wcag2aa']) .analyze(); const critical = accessibilityScanResults.violations.filter((v) => v.impact === 'critical'); expect(critical).toHaveLength(0); });
});
