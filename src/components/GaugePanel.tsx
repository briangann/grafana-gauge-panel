import React, { useMemo } from 'react';
import {
  PanelProps,
  FieldDisplay,
  getDisplayProcessor,
  getFieldDisplayValues,
  formattedValueToString,
} from '@grafana/data';
import { GaugeOptions } from './types';
import { Gauge } from './Gauge';
import { css, cx } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { getComponentStyles } from './gauge_panel_styles';

interface Props extends PanelProps<GaugeOptions> {}

export const GaugePanel: React.FC<Props> = ({
  options,
  data,
  id,
  width,
  height,
  replaceVariables,
  fieldConfig,
  timeZone,
}) => {
  const styles = useStyles2(getComponentStyles);
  const theme2 = useTheme2();

  const gaugeRadiusCalc = useMemo(() => {
    if (options.gaugeRadius === 0) {
      return width < height ? width / 2 : height / 2;
    }
    return options.gaugeRadius;
  }, [options.gaugeRadius, width, height]);

  const dimensionStyle = useMemo(
    () =>
      css`
        width: ${width}px;
        height: ${height}px;
      `,
    [width, height]
  );

  const getValues = (): FieldDisplay[] => {
    for (const frame of data.series) {
      for (const field of frame.fields) {
        if (field.config.unit === 'percent' || field.config.unit === 'percentunit') {
          const min = field.config.min ?? 0;
          const max = field.config.max ?? (field.config.unit === 'percent' ? 100 : 1);
          field.state = field.state ?? {};
          field.state.range = { min, max, delta: max - min };
          field.display = getDisplayProcessor({ field, theme: theme2 });
        }
      }
    }
    return getFieldDisplayValues({
      fieldConfig,
      reduceOptions: {
        calcs: [options.operatorName],
        values: false,
      },
      replaceVariables,
      theme: theme2,
      data: data.series,
      timeZone,
    });
  };

  const metrics = useMemo(
    () => getValues(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.series, fieldConfig, options.operatorName, replaceVariables, theme2, timeZone]
  );

  const metric = metrics[0];

  return (
    <div className={cx(styles.wrapper, dimensionStyle)}>
      <div className={cx(styles.container)}>
        <Gauge
          {...options}
          displayFormatted={formattedValueToString(metric.display)}
          displayValue={isNaN(metric.display.numeric) ? NaN : metric.display.numeric}
          displayTitle={metric.display.title || ''}
          panelId={id}
          panelWidth={width}
          panelHeight={height}
          gaugeRadius={gaugeRadiusCalc}
          pivotRadius={options.pivotRadius * gaugeRadiusCalc}
          padding={options.padding * gaugeRadiusCalc}
          edgeWidth={options.edgeWidth * gaugeRadiusCalc}
          tickEdgeGap={options.tickEdgeGap * gaugeRadiusCalc}
          tickLengthMaj={options.tickLengthMaj * gaugeRadiusCalc}
          tickLengthMin={options.tickLengthMin * gaugeRadiusCalc}
          thresholds={fieldConfig.defaults.thresholds}
        />
      </div>
    </div>
  );
};
