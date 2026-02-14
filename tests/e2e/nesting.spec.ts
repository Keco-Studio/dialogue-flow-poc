import { test, expect } from '@playwright/test';

test.describe('Nesting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.react-flow__pane', { timeout: 10000 });
  });

  test('can create a container and submerge into it', async ({ page }) => {
    const pane = page.locator('.react-flow__pane');

    // Create a Flow Fragment container
    await pane.click({ button: 'right', position: { x: 300, y: 200 } });
    await page.locator('.context-menu-item', { hasText: 'Flow Fragment' }).click();

    // Wait for the container node
    const containerNode = page.locator('.react-flow__node').first();
    await expect(containerNode).toBeVisible();

    // Double-click to submerge
    await containerNode.dblclick();

    // Breadcrumb should show navigation
    const breadcrumb = page.locator('.breadcrumb');
    await expect(breadcrumb).toBeVisible();

    // Should be in the inner graph (empty)
    // Canvas title should change
    await expect(page.locator('.panel-header', { hasText: 'Canvas' })).toBeVisible();
  });

  test('can emerge back from container via breadcrumb', async ({ page }) => {
    const pane = page.locator('.react-flow__pane');

    // Create a container
    await pane.click({ button: 'right', position: { x: 300, y: 200 } });
    await page.locator('.context-menu-item', { hasText: 'Dialogue Container' }).click();

    const containerNode = page.locator('.react-flow__node').first();
    await expect(containerNode).toBeVisible();

    // Submerge
    await containerNode.dblclick();

    // Create a node inside
    const innerPane = page.locator('.react-flow__pane');
    await innerPane.click({ button: 'right', position: { x: 200, y: 200 } });
    await page.locator('.context-menu-item', { hasText: 'Line' }).click();

    // Emerge via breadcrumb
    const breadcrumbItem = page.locator('.breadcrumb-item').first();
    await breadcrumbItem.click();

    // Should be back at outer graph with the container node
    await expect(page.locator('.react-flow__node')).toHaveCount(1);
  });
});
