import { test, expect, PanelEditPage } from '@grafana/plugin-e2e';
import { gte } from 'semver';

const SMOKE_DASHBOARD = { uid: 'briangann-gauge-smoke' };
const PANEL_ID = '1';

// The gauge's own <svg> is the one whose viewBox starts at "0,0,"; the
// panel-header icon <svg> has a different shape.
const gaugeSvg = (panelEditPage: PanelEditPage) =>
  panelEditPage.panel.locator.locator('svg[viewBox^="0,0,"]').first();

// Panel editor chrome (options group aria-labels, option-id label `for`
// attributes) only stabilises around Grafana 12. Skip interaction tests
// on 10.x/11.x — the smoke test still covers those versions at the
// render level.
const MIN_GRAFANA_FOR_INTERACTIONS = '12.0.0';

test.describe('gauge panel — edit-mode interactions', () => {
  test.beforeEach(async ({ grafanaVersion }) => {
    test.skip(
      !gte(grafanaVersion, MIN_GRAFANA_FOR_INTERACTIONS),
      `panel edit-mode chrome differs on Grafana <${MIN_GRAFANA_FOR_INTERACTIONS}`
    );
  });

  test('toggling "Show Value on Gauge" hides and restores the value label', async ({
    gotoPanelEditPage,
  }) => {
    const panelEditPage = await gotoPanelEditPage({ dashboard: SMOKE_DASHBOARD, id: PANEL_ID });

    const svg = gaugeSvg(panelEditPage);
    await expect(svg).toBeVisible({ timeout: 10000 });

    const texts = svg.locator('g').first().locator('text');
    const initialCount = await texts.count();
    expect(initialCount).toBeGreaterThan(0);

    // Grafana renders a <label> over the hidden switch input; clicking the
    // input is intercepted by the label, so target the label directly.
    const showValueLabel = panelEditPage.ctx.page
      .locator('label[for="briangann-gauge-panel-showValue"]')
      .first();
    await expect(showValueLabel).toBeVisible();
    await showValueLabel.click();

    await expect
      .poll(async () => texts.count(), { timeout: 5000 })
      .toBeLessThan(initialCount);

    // Flip back on and confirm the count returns
    await showValueLabel.click();
    await expect
      .poll(async () => texts.count(), { timeout: 5000 })
      .toBe(initialCount);
  });

  test('toggling "Show Threshold Band On Gauge" drops the threshold band paths', async ({
    gotoPanelEditPage,
  }) => {
    const panelEditPage = await gotoPanelEditPage({ dashboard: SMOKE_DASHBOARD, id: PANEL_ID });

    const svg = gaugeSvg(panelEditPage);
    await expect(svg).toBeVisible({ timeout: 10000 });

    const paths = svg.locator('g').first().locator('path');
    const initialPathCount = await paths.count();
    expect(initialPathCount).toBeGreaterThan(1);

    await panelEditPage.collapseSection('Thresholds');

    const thresholdLabel = panelEditPage.ctx.page
      .locator('label[for="briangann-gauge-panel-showThresholdBandOnGauge"]')
      .first();
    await expect(thresholdLabel).toBeVisible();
    await thresholdLabel.click();

    await expect
      .poll(async () => paths.count(), { timeout: 5000 })
      .toBeLessThan(initialPathCount);

    // Restore
    await thresholdLabel.click();
    await expect
      .poll(async () => paths.count(), { timeout: 5000 })
      .toBe(initialPathCount);
  });

  test('adding a tick map replaces a tick label with the mapped text', async ({
    gotoPanelEditPage,
  }) => {
    const panelEditPage = await gotoPanelEditPage({ dashboard: SMOKE_DASHBOARD, id: PANEL_ID });

    const svg = gaugeSvg(panelEditPage);
    await expect(svg).toBeVisible({ timeout: 10000 });

    // Expand the Tick Maps category in the options pane
    await panelEditPage.collapseSection('Tick Maps');

    // Click "Add Tick Map", then fill the first row with value 50 → HALF
    const addButton = panelEditPage.ctx.page.getByTestId('tickmap-add-button');
    await expect(addButton).toBeVisible();
    await addButton.click();

    const valueInput = panelEditPage.ctx.page.getByTestId('tickmap-value-input-0');
    const textInput = panelEditPage.ctx.page.getByTestId('tickmap-text-input-0');
    await expect(valueInput).toBeVisible();
    await valueInput.fill('50');
    await textInput.fill('HALF');
    // Commit the last input so React fires the onChange → debounce flush
    await textInput.press('Tab');

    const mappedLabel = svg
      .locator('g')
      .first()
      .locator('text')
      .filter({ hasText: 'HALF' });
    await expect(mappedLabel).toBeVisible({ timeout: 5000 });
  });
});
