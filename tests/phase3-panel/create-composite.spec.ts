import { expect, test } from '@grafana/plugin-e2e';

test('test nothing', async ({ page, panelEditPage }) => {
  await panelEditPage.datasource.set('TestData DB');
  await panelEditPage.setVisualization('D3 Gauge');
});
