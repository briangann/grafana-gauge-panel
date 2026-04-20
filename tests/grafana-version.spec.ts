import { test, expect } from '@grafana/plugin-e2e';

test('Check Grafana Version from bootData', async ({ grafanaVersion }) => {
  expect(grafanaVersion).toMatch(/^\d+\.\d+\.\d+/);
});
