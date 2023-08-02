import React from 'react';
import { PanelProps, GrafanaTheme2, FieldDisplay, getDisplayProcessor, getFieldDisplayValues, formattedValueToString, FieldColorModeId, ThresholdsConfig, ThresholdsMode, getActiveThreshold, Threshold, FieldConfig, DisplayValue } from '@grafana/data';
import { GaugeOptions } from './types';
import { Gauge } from './Gauge';
import { css, cx } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';

interface Props extends PanelProps<GaugeOptions> { }

const getComponentStyles = (theme: GrafanaTheme2) => {
  return {
    wrapper: css`
      position: relative;
    `,
    container: css`
      align-items: center;
      justify-content: center;
      display: flex;
      height: 100%;
      width: 100%;
      & svg > g > polygon {
        fill: transparent;
      }
    `,
  };
};

export const GaugePanel: React.FC<Props> = ({ options, data, id, width, height, replaceVariables, fieldConfig, timeZone }) => {
  const styles = useStyles2(getComponentStyles);
  const theme2 = useTheme2();
  let gaugeRadiusCalc = options.gaugeRadius;
  // autosize if radius is set to zero
  if (options.gaugeRadius === 0) {
    gaugeRadiusCalc = height / 2;
    if (width < height) {
      gaugeRadiusCalc = width / 2;
    }
  }
  // calculate the value to be displayed
  //
  // code from https://github.com/grafana/grafana/blob/main/public/app/plugins/panel/gauge/GaugePanel.tsx
  const getValues = (): FieldDisplay[] => {

    for (const frame of data.series) {
      for (const field of frame.fields) {
        // Set the Min/Max value automatically for percent and percentunit
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
        values: false
      },
      replaceVariables,
      theme: theme2,
      data: data.series,
      timeZone,
    });
  };

  const DEFAULT_THRESHOLDS: ThresholdsConfig = {
    mode: ThresholdsMode.Absolute,
    steps: [
      { value: -Infinity, color: 'green' },
      { value: 80, color: 'red' },
    ],
  };

  const getThresholdForValue = (
    field: FieldConfig,
    value: number,
    theme: GrafanaTheme2) => {

    if (fieldConfig.defaults.thresholds) {
      const thresholdResult = getActiveThreshold(value, field.thresholds?.steps);
      const realColor = theme.visualization.getColorByName(thresholdResult?.color);
      console.log(`realColor ${realColor} color for value ${value} is ${thresholdResult?.color} matched val ${thresholdResult?.value}`);
      return thresholdResult;
    }
    return null;
  };

  const getFormattedValue = (index: number) => {
    const singleMetric =  metrics[index];
    return formattedValueToString(singleMetric.display);
  };

  const getDisplayValue2 = (index: number) => {
    const singleMetric = metrics[index];
    if (singleMetric.display.numeric) {
      return Number(singleMetric.display.text);
    }
    return NaN;
  };
  const getDisplayValue = (index: number) => {
    const singleMetric = metrics[index];
    if (singleMetric.display.numeric) {
      return Number(singleMetric.display.text);
    }
    return NaN;
  };

  // get the formatted metrics
  const metrics = getValues();
  const thresholdResult = getThresholdForValue(fieldConfig.defaults, getDisplayValue(0), theme2);
  console.log(`color is ${thresholdResult?.color} matched val ${thresholdResult?.value}`);

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <div className={cx(styles.container)}>
        <Gauge
          displayFormatted={getFormattedValue(0)}
          displayValue={getDisplayValue(0)}
          panelId={id}
          panelWidth={width}
          panelHeight={height}
          operatorName={options.operatorName}
          valueYOffset={options.valueYOffset}
          valueFontSize={options.valueFontSize}
          valueFont={options.valueFont}
          tickLabelFontSize={options.tickLabelFontSize}
          tickFont={options.tickFont}
          animateNeedleValueTransition={options.animateNeedleValueTransition}
          animateNeedleValueTransitionSpeed={options.animateNeedleValueTransitionSpeed}
          markerEndEnabled={options.markerEndEnabled}
          markerEndShape={options.markerEndShape}
          markerStartEnabled={options.markerStartEnabled}
          markerStartShape={options.markerStartShape}
          minValue={options.minValue}
          maxValue={options.maxValue}
          gaugeRadius={gaugeRadiusCalc}
          pivotRadius={options.pivotRadius * gaugeRadiusCalc}
          padding={options.padding * gaugeRadiusCalc}
          edgeWidth={options.edgeWidth * gaugeRadiusCalc}
          tickEdgeGap={options.tickEdgeGap * gaugeRadiusCalc}
          tickLengthMaj={options.tickLengthMaj * gaugeRadiusCalc}
          tickLengthMin={options.tickLengthMin * gaugeRadiusCalc}
          needleTickGap={options.needleTickGap}
          needleLengthNeg={options.needleLengthNeg}
          zeroTickAngle={options.zeroTickAngle}
          maxTickAngle={options.maxTickAngle}
          zeroNeedleAngle={options.zeroNeedleAngle}
          maxNeedleAngle={options.maxNeedleAngle}
          tickSpacingMajor={options.tickSpacingMajor}
          tickSpacingMinor={options.tickSpacingMinor}
          outerEdgeColor={options.outerEdgeColor}
          innerColor={options.innerColor}
          pivotColor={options.pivotColor}
          needleColor={options.needleColor}
          unitsLabelColor={options.unitsLabelColor}
          tickLabelColor={options.tickLabelColor}
          tickMajorColor={options.tickMajorColor}
          tickMinorColor={options.tickMinorColor}
          ticknessGaugeBasis={options.ticknessGaugeBasis}
          tickWidthMajor={options.tickWidthMajor}
          tickWidthMinor={options.tickWidthMinor}
          tickMapConfig={options.tickMapConfig}
          showThresholdBandOnGauge={options.showThresholdBandOnGauge}
          showThresholdColorOnValue={options.showThresholdColorOnValue}
          showThresholdColorOnBackground={options.showThresholdColorOnBackground}
          showThresholdBandLowerRange={options.showThresholdBandLowerRange}
          showThresholdBandMiddleRange={options.showThresholdBandMiddleRange}
          showThresholdBandUpperRange={options.showThresholdBandUpperRange}
          needleWidth={options.needleWidth}
          thresholdColors={options.thresholdColors}
        />
      </div>
    </div>
  );
};
