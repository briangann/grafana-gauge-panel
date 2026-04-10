import React, { useCallback, useState } from 'react';
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
  const [editValue, setEditValue] = useState<string | null>(null);

  const editorItem = item as unknown as EditorItem;
  const editorContext = context as unknown as EditorContext;

  const handleFocus = useCallback(() => {
    setEditValue(String(value ?? ''));
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.currentTarget.value);
  }, []);

  const handleBlur = useCallback(() => {
    const raw = editValue ?? '';
    setEditValue(null);
    const numericValue = parseFloat(raw);
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
  }, [editValue, editorItem, editorContext]);

  return (
    <Input
      type="number"
      value={editValue ?? String(value ?? '')}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};
