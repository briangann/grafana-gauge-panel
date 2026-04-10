// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';

// Suppress React warnings about SVG tags (path, marker, defs, etc.)
// that jsdom does not recognize as valid HTML elements.
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('is unrecognized in this browser')) {
    return;
  }
  originalConsoleError(...args);
};

// Suppress i18next promotional banner from Grafana UI internals.
const originalConsoleInfo = console.info;
console.info = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('i18next')) {
    return;
  }
  originalConsoleInfo(...args);
};
