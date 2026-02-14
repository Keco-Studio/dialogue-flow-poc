import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Export/Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.react-flow__pane', { timeout: 10000 });
  });

  test('export button downloads a JSON file', async ({ page }) => {
    // Create a node so there's something to export
    const pane = page.locator('.react-flow__pane');
    await pane.click({ button: 'right', position: { x: 300, y: 200 } });
    await page.locator('.context-menu-item', { hasText: 'Line' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(1);

    // Click Export and catch the download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button', { hasText: 'Export' }).click();
    const download = await downloadPromise;

    // Verify it's a JSON file
    expect(download.suggestedFilename()).toMatch(/\.json$/);

    // Verify the content is valid JSON
    const filePath = await download.path();
    if (filePath) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      expect(data.schemaVersion).toBe(1);
      expect(data.graphs).toBeDefined();
    }
  });

  test('import restores project state', async ({ page }) => {
    // Create a test export file
    const testProject = {
      characters: [{ id: 'c1', name: 'TestChar' }],
      createdAt: '2024-01-01T00:00:00.000Z',
      graphs: [
        {
          edges: [],
          id: 'g1',
          name: 'Imported Graph',
          nodes: [
            {
              data: { speakerId: 'c1', text: 'Hello from import', type: 'line' },
              id: 'n1',
              inputPins: [{ direction: 'in', id: 'p1', nodeId: 'n1' }],
              outputPins: [{ direction: 'out', id: 'p2', nodeId: 'n1' }],
              position: { x: 100, y: 100 },
              type: 'line',
            },
          ],
        },
      ],
      hierarchyRoot: [],
      id: 'test-project',
      name: 'Test Import',
      schemaVersion: 1,
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    // Write temp file
    const tmpDir = path.join(__dirname, '..', '..', 'tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, 'test-import.json');
    fs.writeFileSync(tmpFile, JSON.stringify(testProject));

    // Use file chooser to import
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button', { hasText: 'Import' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tmpFile);

    // Wait for the import to complete and canvas to update
    await page.waitForTimeout(500);

    // The imported graph should be active with its node
    await expect(page.locator('.react-flow__node')).toHaveCount(1);

    // Clean up
    fs.unlinkSync(tmpFile);
    fs.rmdirSync(tmpDir, { recursive: true });
  });
});
