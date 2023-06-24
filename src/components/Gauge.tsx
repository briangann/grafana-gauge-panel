import React from 'react';

import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

import { GaugeOptions } from './types';

export const Gauge: React.FC<GaugeOptions> = (options) => {
  const divStyles = useStyles2(getWrapperStyles);
  const svgStyles = useStyles2(getSVGStyles);

  //if (options.processedData && options.processedData.length === 0) {
  //  return <div className={noTriggerTextStyles}>{options.globalDisplayTextTriggeredEmpty}</div>;
  //}

  const margin = { top: 0, right: 0, bottom: 0, left: 0 };


  return (
    <div className={divStyles}>
      <svg
        className={svgStyles}
        width={options.panelWidth}
        height={options.panelHeight}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox={`0,0,${options.panelWidth},${options.panelHeight}`}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
        </g>
      </svg>
    </div>
  );
};

const getWrapperStyles = (theme: GrafanaTheme2) => css`
  fill: transparent;
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
`;

const getSVGStyles = (theme: GrafanaTheme2) => css`
  text-align: center;
  align-items: center;
  justify-content: center;
  fill: transparent;
`;
