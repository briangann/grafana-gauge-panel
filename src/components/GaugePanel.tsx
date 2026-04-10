import React, { useCallback, useMemo, useState } from 'react';
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
import { Icon, Tooltip, useStyles2, useTheme2 } from '@grafana/ui';
import { getComponentStyles } from './gauge_panel_styles';
import { computeTickSpacing } from './Gauge/tick_spacing';

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

  const wrappedValue = useMemo(() => {
    const raw = metric.display.numeric;
    if (!options.wrapValues || isNaN(raw)) {
      return raw;
    }
    const range = options.maxValue - options.minValue;
    if (range <= 0) {
      return raw;
    }
    return ((((raw - options.minValue) % range) + range) % range) + options.minValue;
  }, [metric.display.numeric, options.wrapValues, options.minValue, options.maxValue]);

  const [ticksClamped, setTicksClamped] = useState(false);

  const onTicksClamped = useCallback((clamped: boolean) => {
    setTicksClamped(clamped);
  }, []);

  const suggestedSpacing = useMemo(() => {
    if (!ticksClamped) {
      return null;
    }
    return computeTickSpacing(options.minValue, options.maxValue);
  }, [ticksClamped, options.minValue, options.maxValue]);

  const tickLabelFormatter = useMemo(() => {
    if (!options.formatTickLabelsWithUnit) {
      return undefined;
    }
    const displayProcessor = getDisplayProcessor({ field: { config: metric.field }, theme: theme2 });
    return (value: number) => formattedValueToString(displayProcessor(value));
  }, [options.formatTickLabelsWithUnit, metric.field, theme2]);

  return (
    <div className={cx(styles.wrapper, dimensionStyle)}>
      {ticksClamped && suggestedSpacing && (
        <div className={styles.warningIcon} data-testid="tick-clamp-warning">
          <Tooltip
            content={`Tick count exceeds maximum (100). Adjust tick spacing for your value range. Suggested major spacing: ${suggestedSpacing.majorSpacing}`}
          >
            <Icon name="exclamation-triangle" size="sm" />
          </Tooltip>
        </div>
      )}
      <div className={cx(styles.container)}>
        <Gauge
          {...options}
          displayFormatted={options.wrapValues && !isNaN(wrappedValue)
            ? formattedValueToString(
                getDisplayProcessor({ field: { config: metric.field }, theme: theme2 })(wrappedValue)
              )
            : formattedValueToString(metric.display)}
          displayValue={isNaN(wrappedValue) ? NaN : wrappedValue}
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
          thresholds={metric.field.thresholds ?? fieldConfig.defaults.thresholds}
          onTicksClamped={onTicksClamped}
          tickLabelFormatter={tickLabelFormatter}
        />
      </div>
    </div>
  );
};
