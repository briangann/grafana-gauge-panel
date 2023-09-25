import { PanelModel } from '@grafana/data';
import { config } from '@grafana/runtime';

import {
  PanelMigrationHandler,
  hasRobotoFont,
} from './migrations';

describe('D3Gauge -> D3GaugeV2 migrations', () => {
  it('migrates empty d3gauge', () => {
    const panel: PanelModel = {
      id: 0,
      type: 'panel',
      options: {},
      fieldConfig: {
        defaults: {},
        overrides: [],
      },
    };
    const options = PanelMigrationHandler(panel);
    expect(options).toEqual({});
  });

  it('migrates start and end markers from angular d3gauge', () => {
    const panel: PanelModel = {
      id: 0,
      type: 'panel',
      options: {
        markerStartEnabled: true,
        markerStartShape: 'circle',
        markerEndEnabled: true,
        markerEndShape: 'arrow',
      },
      fieldConfig: {
        defaults: {},
        overrides: [],
      },
    };
    const options = PanelMigrationHandler(panel);
    expect(options).toEqual({
      markerStartEnabled: true,
      markerStartShape: 'circle',
      markerEndEnabled: true,
      markerEndShape: 'arrow',
    });
  });
  it('migrates start and end disabled markers from angular d3gauge', () => {
    const panel: PanelModel = {
      id: 0,
      type: 'panel',
      options: {
        markerStartEnabled: false,
        markerStartShape: 'circle',
        markerEndEnabled: true,
        markerEndShape: 'arrow',
      },
      fieldConfig: {
        defaults: {},
        overrides: [],
      },
    };
    const options = PanelMigrationHandler(panel);
    expect(options).toEqual({
      markerStartEnabled: false,
      markerStartShape: 'circle',
      markerEndEnabled: true,
      markerEndShape: 'arrow',
    });
  });

  it('checks if roboto is available to runtime', () => {
    const versions = new Map<string, boolean>([
      ['8.4.11', true],
      ['8.5.21', true],
      ['9.1.0', true],
      ['9.2.0', true],
      ['9.3.0', true],
      ['9.4.0', false],
      ['9.4.3', false],
    ]);
    for (const [key, value] of versions) {
      config.buildInfo.version = key;
      expect(hasRobotoFont()).toEqual(value);
    }
  });
});
