import React, { useCallback, useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { TickMapItem } from './TickMapItem';
import { TickMapItemType, TickMapItemTracker } from './types';
import { v4 as uuidv4 } from 'uuid';
import { Button, Collapse } from '@grafana/ui';

export interface TickMapEditorSettings {
  tickMaps: TickMapItemType[];
  enabled: boolean;
}

interface Props extends StandardEditorProps<string | string[] | null, TickMapEditorSettings> {}

const reorder = (items: TickMapItemTracker[]): TickMapItemTracker[] =>
  items.map((item, i) => ({
    ...item,
    order: i,
    tickMap: { ...item.tickMap, order: i },
  }));

const swapItems = (items: TickMapItemTracker[], fromIndex: number, toIndex: number): TickMapItemTracker[] => {
  const result = [...items];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return reorder(result);
};

export const TickMapEditor: React.FC<Props> = ({ context, onChange }) => {
  const [settings] = useState(context.options.tickMapConfig || { tickMaps: [] as TickMapItemType[] });
  const [tracker, _setTracker] = useState((): TickMapItemTracker[] => {
    if (!settings.tickMaps) {
      return [];
    }
    return settings.tickMaps.map((value: TickMapItemType, index: number) => ({
      tickMap: value,
      order: index,
      ID: uuidv4(),
      isOpen: false,
    }));
  });

  const setTracker = useCallback(
    (v: TickMapItemTracker[]) => {
      _setTracker(v);
      const tickMapConfig = {
        tickMaps: v.map((element) => element.tickMap),
        enabled: settings.enabled,
      };
      onChange(tickMapConfig as any);
    },
    [settings.enabled, onChange]
  );

  const updateTickMap = useCallback(
    (index: number, value: TickMapItemType) => {
      setTracker(tracker.map((item, i) => (i === index ? { ...item, tickMap: value } : item)));
    },
    [tracker, setTracker]
  );

  const createDuplicate = useCallback(
    (index: number) => {
      const original = tracker[index].tickMap;
      const aTickMap: TickMapItemType = {
        label: `${original.label} Copy`,
        enabled: original.enabled,
        order: tracker.length,
        value: original.value,
        text: original.text,
      };
      const aTracker: TickMapItemTracker = {
        tickMap: aTickMap,
        order: tracker.length,
        ID: uuidv4(),
        isOpen: true,
      };
      setTracker([...tracker, aTracker]);
    },
    [tracker, setTracker]
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index < tracker.length - 1) {
        setTracker(swapItems(tracker, index, index + 1));
      }
    },
    [tracker, setTracker]
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index > 0) {
        setTracker(swapItems(tracker, index, index - 1));
      }
    },
    [tracker, setTracker]
  );

  const removeTickMap = useCallback(
    (index: number) => {
      setTracker(reorder(tracker.filter((_, i) => i !== index)));
    },
    [tracker, setTracker]
  );

  const toggleOpener = useCallback(
    (index: number) => {
      setTracker(tracker.map((item, i) => (i === index ? { ...item, isOpen: !item.isOpen } : item)));
    },
    [tracker, setTracker]
  );

  const addItem = useCallback(() => {
    const order = tracker.length;
    const aTickMap: TickMapItemType = {
      label: `TickMap-${order}`,
      enabled: true,
      order,
      value: '',
      text: '',
    };
    const aTracker: TickMapItemTracker = {
      tickMap: aTickMap,
      order,
      ID: uuidv4(),
      isOpen: true,
    };
    setTracker([...tracker, aTracker]);
  }, [tracker, setTracker]);

  return (
    <>
      <Button fill="solid" variant="primary" icon="plus" onClick={addItem}>
        Add Tick Map
      </Button>
      {tracker.map((trackerItem: TickMapItemTracker, index: number) => {
        return (
          <Collapse
            key={`tickmap-collapse-item-index-${trackerItem.ID}`}
            label={trackerItem.tickMap.label}
            isOpen={trackerItem.isOpen}
            onToggle={() => toggleOpener(index)}
          >
            <TickMapItem
              key={`tickmap-item-index-${trackerItem.ID}`}
              ID={trackerItem.ID}
              tickMap={trackerItem.tickMap}
              setter={updateTickMap}
              remover={removeTickMap}
              moveDown={moveDown}
              moveUp={moveUp}
              createDuplicate={createDuplicate}
            />
          </Collapse>
        );
      })}
    </>
  );
};
