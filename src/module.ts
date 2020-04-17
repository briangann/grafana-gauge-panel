import { D3GaugePanelCtrl } from './ctrl';
import { loadPluginCss } from 'grafana/app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/briangann-gauge-panel/styles/dark.css',
  light: 'plugins/briangann-gauge-panel/styles/light.css',
});

export { D3GaugePanelCtrl as PanelCtrl };
