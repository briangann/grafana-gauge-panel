import React, { useCallback, useEffect, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Input } from '@grafana/ui';
import { computeTickSpacing } from '../Gauge/tick_spacing';

/**
 * Extended item type that includes `path`, which Grafana provides at runtime
 * via OptionsEditorItem but is not surfaced through StandardEditorProps.
 */
interface EditorItem {
  path: string;
  [key: string]: unknown;
}

/**
 * Extended context type that includes `onOptionsChange`, which Grafana provides
 * at runtime but is not declared on StandardEditorContext.
 */
interface EditorContext {
  options: Record<string, unknown>;
  onOptionsChange: (options: Record<string, unknown>) => void;
}

const MAX_TICKS = 100;

interface Props extends StandardEditorProps<number> {}

export const RangeEditor: React.FC<Props> = ({ value, item, context }) => {
  const [localValue, setLocalValue] = useState<string>(String(value ?? ''));

  const editorItem = item as unknown as EditorItem;
  const editorContext = context as unknown as EditorContext;

  useEffect(() => {
    setLocalValue(String(value ?? ''));
  }, [value]);

  const handleBlur = useCallback(() => {
    const numericValue = parseFloat(localValue);
    if (isNaN(numericValue)) {
      return;
    }

    const options = editorContext.options;
    const min = editorItem.path === 'minValue' ? numericValue : (options.minValue as number);
    const max = editorItem.path === 'maxValue' ? numericValue : (options.maxValue as number);
    const range = Math.abs(max - min);
    const currentMajor = options.tickSpacingMajor as number;
    const currentMinor = options.tickSpacingMinor as number;

    const wouldExceedLimit =
      (currentMajor > 0 && range / currentMajor > MAX_TICKS) ||
      (currentMinor > 0 && range / currentMinor > MAX_TICKS);

    if (wouldExceedLimit) {
      const { majorSpacing, minorSpacing } = computeTickSpacing(min, max);
      editorContext.onOptionsChange({
        ...options,
        [editorItem.path]: numericValue,
        tickSpacingMajor: majorSpacing,
        tickSpacingMinor: minorSpacing,
      });
    } else {
      editorContext.onOptionsChange({
        ...options,
        [editorItem.path]: numericValue,
      });
    }
  }, [localValue, editorItem, editorContext]);

  return (
    <Input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.currentTarget.value)}
      onBlur={handleBlur}
    />
  );
};
