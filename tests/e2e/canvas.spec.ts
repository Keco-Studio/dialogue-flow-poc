import { test, expect } from '@playwright/test';

test.describe('Canvas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to initialize
    await page.waitForSelector('.react-flow__pane', { timeout: 10000 });
  });

  test('renders the app shell with three panels', async ({ page }) => {
    await expect(page.locator('.toolbar-title')).toHaveText('Narrative Flow Editor');
    await expect(page.locator('.canvas-panel')).toBeVisible();
    await expect(page.locator('.properties-panel')).toBeVisible();
  });

  test('can create a node via context menu', async ({ page }) => {
    const pane = page.locator('.react-flow__pane');
    await pane.click({ button: 'right', position: { x: 300, y: 200 } });

    // Context menu should appear
    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible();

    // Click "Line" to create a node
    await page.locator('.context-menu-item', { hasText: 'Line' }).click();

    // Should create a node on the canvas
    const nodes = page.locator('.react-flow__node');
    await expect(nodes.first()).toBeVisible();
  });

  test('can delete a node with Delete key', async ({ page }) => {
    // Create a node via context menu
    const pane = page.locator('.react-flow__pane');
    await pane.click({ button: 'right', position: { x: 300, y: 200 } });
    await page.locator('.context-menu-item', { hasText: 'End' }).click();

    // Wait for the node to appear
    const node = page.locator('.react-flow__node').first();
    await expect(node).toBeVisible();

    // Click the node to select it
    await node.click();

    // Press Delete
    await page.keyboard.press('Delete');

    // Node should be removed
    await expect(page.locator('.react-flow__node')).toHaveCount(0);
  });

  test('can pan with right-mouse drag', async ({ page }) => {
    const pane = page.locator('.react-flow__pane');

    // Get initial viewport transform
    const viewport = page.locator('.react-flow__viewport');
    const initialTransform = await viewport.getAttribute('style');

    // Right-click drag to pan
    await pane.click({ button: 'right', position: { x: 200, y: 200 } });
    // Close any context menu
    await page.keyboard.press('Escape');
  });
});
