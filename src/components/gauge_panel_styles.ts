import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

export const getComponentStyles = (theme: GrafanaTheme2) => {
  return {
    wrapper: css`
      position: relative;
    `,
    warningIcon: css`
      position: absolute;
      top: 4px;
      right: 4px;
      z-index: 1;
      color: ${theme.colors.warning.text};
      opacity: 0.7;
      cursor: help;
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
