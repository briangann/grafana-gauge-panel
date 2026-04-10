// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';

// Suppress React warnings about SVG tags (path, marker, defs, etc.)
// that jsdom does not recognise as valid HTML elements.
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('is unrecognized in this browser')) {
    return;
  }
  originalConsoleError(...args);
};
