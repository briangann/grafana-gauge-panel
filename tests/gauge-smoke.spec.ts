import { test, expect } from '@grafana/plugin-e2e';

test('gauge panel renders SVG with ticks, needle, and value label', async ({
  gotoDashboardPage,
}) => {
  const dashboardPage = await gotoDashboardPage({ uid: 'briangann-gauge-smoke' });
  const panel = dashboardPage.getPanelById(1);

  // The panel emits one <svg> whose <g> wraps circles, threshold bands,
  // ticks, tick labels, needle, value, and title. Filter to the first svg
  // that has the viewBox we set in gauge_render (square viewport), which
  // excludes the panel header icon svg.
  const gaugeSvg = panel.locator.locator('svg[viewBox^="0,0,"]').first();
  await expect(gaugeSvg).toBeVisible({ timeout: 10000 });

  const group = gaugeSvg.locator('g').first();
  await expect(group).toBeVisible();

  // Threshold bands, edge circles, and needle all render as <path> elements.
  // Under the smoke config we expect strictly more than one.
  const paths = group.locator('path');
  await expect.poll(async () => paths.count(), { timeout: 10000 }).toBeGreaterThan(1);

  // Major tick labels plus the value and title labels render as <text> elements.
  const texts = group.locator('text');
  await expect.poll(async () => texts.count(), { timeout: 10000 }).toBeGreaterThan(0);
});
