/**
 * Rounds a value to the nearest "nice" number in the series
 * 1, 2, 5, 10, 20, 50, 100, ... (power-of-10 x {1, 2, 5}).
 */
const niceNumber = (value: number): number => {
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / Math.pow(10, exponent);

  let niceFraction: number;
  if (fraction < 1.5) {
    niceFraction = 1;
  } else if (fraction < 3.5) {
    niceFraction = 2;
  } else if (fraction <= 7.5) {
    niceFraction = 5;
  } else {
    niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
};

export const computeTickSpacing = (
  min: number,
  max: number,
  targetMajorTicks = 10
): { majorSpacing: number; minorSpacing: number } => {
  const range = Math.abs(max - min);

  if (range === 0 || !isFinite(range)) {
    return { majorSpacing: 1, minorSpacing: 0.2 };
  }

  const rawInterval = range / targetMajorTicks;
  const majorSpacing = niceNumber(rawInterval);
  const minorSpacing = majorSpacing / 5;

  return { majorSpacing, minorSpacing };
};
