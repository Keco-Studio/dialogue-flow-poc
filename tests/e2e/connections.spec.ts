import { test, expect } from '@playwright/test';

test.describe('Connections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.react-flow__pane', { timeout: 10000 });
  });

  test('can connect two nodes via pin drag', async ({ page }) => {
    const pane = page.locator('.react-flow__pane');

    // Create first node (Line)
    await pane.click({ button: 'right', position: { x: 200, y: 100 } });
    await page.locator('.context-menu-item', { hasText: 'Line' }).click();

    // Create second node (End)
    await pane.click({ button: 'right', position: { x: 200, y: 300 } });
    await page.locator('.context-menu-item', { hasText: 'End' }).click();

    // Wait for both nodes
    await expect(page.locator('.react-flow__node')).toHaveCount(2);

    // Find source handle (output pin) on first node
    const sourceHandle = page.locator('.react-flow__node').first().locator('.react-flow__handle[data-handlepos="bottom"]').first();
    const targetHandle = page.locator('.react-flow__node').last().locator('.react-flow__handle[data-handlepos="top"]').first();

    // Drag from source to target
    const sourceBox = await sourceHandle.boundingBox();
    const targetBox = await targetHandle.boundingBox();

    if (sourceBox && targetBox) {
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 5 });
      await page.mouse.up();
    }

    // An edge should be created
    const edges = page.locator('.react-flow__edge');
    await expect(edges).toHaveCount(1);
  });

  test('can delete an edge', async ({ page }) => {
    const pane = page.locator('.react-flow__pane');

    // Create and connect two nodes
    await pane.click({ button: 'right', position: { x: 200, y: 100 } });
    await page.locator('.context-menu-item', { hasText: 'Line' }).click();

    await pane.click({ button: 'right', position: { x: 200, y: 300 } });
    await page.locator('.context-menu-item', { hasText: 'End' }).click();

    await expect(page.locator('.react-flow__node')).toHaveCount(2);

    // Connect them
    const sourceHandle = page.locator('.react-flow__node').first().locator('.react-flow__handle[data-handlepos="bottom"]').first();
    const targetHandle = page.locator('.react-flow__node').last().locator('.react-flow__handle[data-handlepos="top"]').first();

    const sourceBox = await sourceHandle.boundingBox();
    const targetBox = await targetHandle.boundingBox();

    if (sourceBox && targetBox) {
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 5 });
      await page.mouse.up();
    }

    await expect(page.locator('.react-flow__edge')).toHaveCount(1);

    // Click on the edge to select it
    const edge = page.locator('.react-flow__edge').first();
    await edge.click();

    // Press Delete to remove
    await page.keyboard.press('Delete');

    await expect(page.locator('.react-flow__edge')).toHaveCount(0);
  });
});
