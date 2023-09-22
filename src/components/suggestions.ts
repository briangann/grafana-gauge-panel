import { VisualizationSuggestionsBuilder } from '@grafana/data';
import { GaugeOptions } from './types';

export class DataSuggestionsSupplier {
  getSuggestionsForData(builder: VisualizationSuggestionsBuilder) {
    const { dataSummary: ds } = builder;

    if (!ds.hasData) {
      return;
    }
    if (!ds.hasNumberField) {
      return;
    }

    const list = builder.getListAppender<GaugeOptions, {}>({
      name: 'D3Gauge',
      pluginId: 'briangann-gauge-panel',
      options: {},
    });

    list.append({
      name: 'D3Gauge',
    });
  }
}
