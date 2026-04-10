import { expect, test } from '@grafana/plugin-e2e';

test('data query should return gauge A-series', async ({ panelEditPage }) => {
  await panelEditPage.datasource.set('TestData DB');
  await panelEditPage.setVisualization('D3 Gauge');
});
