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
        />
      </div>
    </div>
  );
};
