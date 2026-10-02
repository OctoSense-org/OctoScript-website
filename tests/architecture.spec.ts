import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const locale of ['en', 'cn'] as const) {
  const prefix = locale === 'cn' ? '/cn/' : '/';
  const cn = locale === 'cn';
  test(`${locale}: architecture modes, node details and keyboard navigation`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(prefix);
    await page.locator(`a[href="${prefix}docs/octosense-apps/#architecture-explorer"]`).click();
    const graph = page.locator('#architecture-explorer');
    await expect(graph.locator('.react-flow__node')).toHaveCount(8);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(await page.evaluate(() => {
      const h1 = document.querySelector('h1')!;
      const graph = document.querySelector('#architecture-explorer')!;
      const prose = document.querySelector('.doc-content article h2')!;
      return !!(h1.compareDocumentPosition(graph) & Node.DOCUMENT_POSITION_FOLLOWING)
        && !!(graph.compareDocumentPosition(prose) & Node.DOCUMENT_POSITION_FOLLOWING);
    })).toBe(true);
    await graph.getByLabel(cn ? '定位节点' : 'Focus a node', { exact: true }).selectOption('contained');
    await expect(graph.locator('[data-node-detail]')).toContainText(cn ? '没有注册宿主服务' : 'no host services');
    await graph.getByRole('button', { name: cn ? '请求 → 答案' : 'Request → answer', exact: true }).click();
    await expect(graph.locator('.react-flow__node')).toHaveCount(7);
    await expect(graph.locator('[data-node-detail]')).toHaveAttribute('data-node-detail', 'peer');
    const toolNode = graph.locator('.react-flow__node[data-id="tools"]');
    await toolNode.focus();
    await page.keyboard.press('Enter');
    await expect(graph.locator('[data-node-detail]')).toHaveAttribute('data-node-detail', 'tools');
    await expect(graph.locator('[data-node-detail]')).toContainText('mail.send');
    await graph.getByLabel(cn ? '定位节点' : 'Focus a node', { exact: true }).selectOption('data');
    await expect(graph.locator('[data-node-detail]')).toContainText(cn ? '账户工作区' : 'account workspace');
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
      await expect(graph.locator('.react-flow')).toHaveClass(new RegExp(theme));
      const audit = await new AxeBuilder({ page }).include('#architecture-explorer').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
    }
    await page.locator('.language-link').click();
    await expect(page).toHaveURL(new RegExp(`${cn ? '/' : '/cn/'}docs/octosense-apps/$`));
    expect(errors).toEqual([]);
  });

  test(`${locale}: architecture zoom, fit, pan and mobile page scrolling`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${prefix}docs/octosense-apps/#architecture-explorer`);
    const graph = page.locator('#architecture-explorer');
    const canvas = graph.getByRole('region', { name: cn ? '架构画布' : 'Architecture canvas', exact: true });
    const viewport = graph.locator('.react-flow__viewport');
    await expect(graph.locator('.architecture-zoom')).toHaveText('100%');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await graph.getByRole('button', { name: cn ? '缩小' : 'Zoom out', exact: true }).click();
    await expect(graph.locator('.architecture-zoom')).not.toHaveText('100%');
    await graph.getByRole('button', { name: cn ? '全图' : 'Fit view', exact: true }).click();
    await expect.poll(async () => Number((await graph.locator('.architecture-zoom').innerText()).replace('%', ''))).toBeLessThan(50);
    await graph.getByLabel(cn ? '定位节点' : 'Focus a node', { exact: true }).selectOption('l0');
    await expect(graph.locator('.architecture-zoom')).toHaveText('100%');
    await expect(graph.locator('[data-node-detail]')).toHaveAttribute('data-node-detail', 'l0');
    const before = await viewport.getAttribute('style');
    await canvas.focus();
    await page.keyboard.press('ArrowRight');
    await expect(viewport).not.toHaveAttribute('style', before!);
    await graph.getByRole('button', { name: cn ? '移动图' : 'Move graph', exact: true }).click();
    const bounds = await canvas.boundingBox();
    if (!bounds) throw new Error('Missing canvas');
    await canvas.scrollIntoViewIfNeeded();
    const visible = await canvas.boundingBox();
    if (!visible) throw new Error('Missing visible canvas');
    const priorDrag = await viewport.getAttribute('style');
    await page.mouse.move(visible.x + 20, visible.y + 25);
    await page.mouse.down();
    await page.mouse.move(visible.x + 100, visible.y + 75, { steps: 5 });
    await page.mouse.up();
    await expect(viewport).not.toHaveAttribute('style', priorDrag!);
    await page.mouse.move(visible.x + 30, visible.y + 40);
    const scroll = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scroll);
  });
}

test('architecture text and original guide remain usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/docs/octosense-apps/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await page.locator('.architecture-text summary').click();
  await expect(page.locator('.architecture-text')).toContainText('default App Hub admission rejects');
  await expect(page.locator('.doc-content article')).toContainText('tools/octo run');
  await page.locator('.language-link').click();
  await expect(page).toHaveURL(/\/cn\/docs\/octosense-apps\/$/);
  await context.close();
});
