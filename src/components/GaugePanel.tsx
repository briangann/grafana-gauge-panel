import React from 'react';
import { PanelProps, GrafanaTheme2 } from '@grafana/data';
import { GaugeOptions } from './types';
import { Gauge } from './Gauge';
import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';

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

export const GaugePanel: React.FC<Props> = ({ options, data, id, width, height, replaceVariables, fieldConfig }) => {
  const styles = useStyles2(getComponentStyles);
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
          decimals={options.decimals}
          panelId={id}
          panelWidth={width}
          panelHeight={height}
          operatorName={options.operatorName}
          unitFormat={options.unitFormat}
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
          gaugeRadius={options.gaugeRadius}
          pivotRadius={options.pivotRadius}
          padding={options.padding}
          edgeWidth={options.edgeWidth}
          tickEdgeGap={options.tickEdgeGap}
          tickLengthMaj={options.tickLengthMaj}
          tickLengthMin={options.tickLengthMin}
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
          ticknessGaugeBasis={200}
          tickWidthMajor={3}
          tickWidthMinor={1}
          tickMapConfig={options.tickMapConfig}
          showThresholdsOnGauge={options.showThresholdsOnGauge}
          showThresholdColorOnValue={options.showThresholdColorOnValue}
          showThresholdColorOnBackground={options.showThresholdColorOnBackground}
          showThresholdLowerRange={options.showThresholdLowerRange}
          showThresholdMiddleRange={options.showThresholdMiddleRange}
          showThresholdUpperRange={options.showThresholdUpperRange}
          needleWidth={options.needleWidth}
        />
      </div>
    </div>
  );
};
