import { PanelModel } from '@grafana/data';
import { config } from "@grafana/runtime";
import { satisfies, coerce } from 'semver';

import { GaugeOptions } from './components/types';

interface AngularOptions {
  decimals: number;
  format: string;
  operatorName: string;
}

/**
 * This is called when the panel is imported or reloaded
 */
export const PanelMigrationHandler = (panel: PanelModel<GaugeOptions>): Partial<GaugeOptions> => {
  // @ts-ignore
  if (!panel.gauge) {
    // not angular, just return the options if currently set
    if (!panel.options) {
      // This happens on the first load or when migrating from angular
      return {} as any;
    }
    // have settings, return them unchanged
    return panel.options;
  }
  // @ts-ignore
  const newDefaults = migrateDefaults(panel.gauge);
  const options = newDefaults;
  // @ts-ignore
  delete panel.gauge;
  return options;
};

export const migrateDefaults = (angular: AngularOptions) => {
  const options: GaugeOptions = {
    panelHeight: undefined,
    panelWidth: undefined,
    panelId: 0,
    decimals: 2,
    unitFormat: '',
    operatorName: 'avg',
  };
  return options;
};

/**
 * This is called when the panel changes from another panel
 *
 * not currently used
 */
export const PanelChangedHandler = (
  panel: PanelModel<Partial<GaugeOptions>> | any,
  prevPluginId: string,
  prevOptions: any
) => {
  // Changing from angular polystat panel
  if (prevPluginId === 'd3gauge' && prevOptions.angular) {
    console.log('detected old panel');
    const oldOpts = prevOptions.angular;
    console.log(JSON.stringify(oldOpts));
  }
  return {};
};

// Roboto font was removed Dec 1, 2022, and releases after that date should not attempt to use it
export const hasRobotoFont = () => {
  const version = coerce(config.buildInfo.version);
  if (version !== null) {
    if (satisfies(version, '<9.4.0')) {
      return true;
    }
  }
  return false;
};
