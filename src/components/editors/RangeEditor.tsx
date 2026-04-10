import React, { useCallback, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
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

interface Props extends StandardEditorProps<number> {}

export const RangeEditor: React.FC<Props> = ({ value, onChange, item, context }) => {
  const [localValue, setLocalValue] = useState<string>(String(value ?? ''));

  const editorItem = item as unknown as EditorItem;
  const editorContext = context as unknown as EditorContext;

  const handleBlur = useCallback(() => {
    const numericValue = parseFloat(localValue);
    if (isNaN(numericValue)) {
      return;
    }

    onChange(numericValue);

    const options = editorContext.options;
    const min = editorItem.path === 'minValue' ? numericValue : (options.minValue as number);
    const max = editorItem.path === 'maxValue' ? numericValue : (options.maxValue as number);

    const { majorSpacing, minorSpacing } = computeTickSpacing(min, max);
    editorContext.onOptionsChange({
      ...options,
      [editorItem.path]: numericValue,
      tickSpacingMajor: majorSpacing,
      tickSpacingMinor: minorSpacing,
    });
  }, [localValue, onChange, editorItem, editorContext]);

  return (
    <input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      style={{ width: '100%' }}
    />
  );
};
