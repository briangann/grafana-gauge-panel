import React, { useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { TickMapItem } from './TickMapItem';
import { TickMapItemType, TickMapItemTracker } from './types';
import { v4 as uuidv4 } from 'uuid';
import { Button, Collapse } from '@grafana/ui';

export interface TickMapEditorSettings {
  tickMaps: TickMapItemType[];
  enabled: boolean;
}

interface Props extends StandardEditorProps<string | string[] | null, TickMapEditorSettings> { }

export const TickMapEditor: React.FC<Props> = ({ item, context, onChange }) => {
  const [settings] = useState(context.options.tickMapConfig || { tickMaps: [] as TickMapItemType[] });
  const [tracker, _setTracker] = useState((): TickMapItemTracker[] => {
    if (!settings.tickMaps) {
      const empty: TickMapItemTracker[] = [];
      return empty;
    }
    const items: TickMapItemTracker[] = [];
    settings.tickMaps.forEach((value: TickMapItemType, index: number) => {
      items[index] = {
        tickMap: value,
        order: index,
        ID: uuidv4(),
      };
    });
    return items;
  });

  const setTracker = (v: TickMapItemTracker[]) => {
    _setTracker(v);
    const allTickMaps: TickMapItemType[] = [];
    v.forEach((element) => {
      allTickMaps.push(element.tickMap);
    });
    const tickMapConfig = {
      tickMaps: allTickMaps,
      enabled: settings.enabled,
    };
    onChange(tickMapConfig as any);
  };

  const [isOpen, setIsOpen] = useState((): boolean[] => {
    if (!tracker) {
      const empty: boolean[] = [];
      return empty;
    }
    let size = tracker.length;
    const openStates: boolean[] = [];
    while (size--) {
      openStates[size] = false;
    }
    return openStates;
  });

  const updateTickMap = (index: number, value: TickMapItemType) => {
    tracker[index].tickMap = value;
    setTracker([...tracker]);
  };

  const createDuplicate = (index: number) => {
    const original = tracker[index].tickMap;
    const order = tracker.length;
    const aTickMap: TickMapItemType = {
      label: `${original.label} Copy`,
      enabled: original.enabled,
      order,
      value: original.value,
      text: original.text
    };
    const aTracker: TickMapItemTracker = {
      tickMap: aTickMap,
      order,
      ID: uuidv4(),
    };
    setTracker([...tracker, aTracker]);
    setIsOpen([...isOpen, true]);
  };

  // generic move
  const arrayMove = (arr: any, oldIndex: number, newIndex: number) => {
    if (newIndex >= arr.length) {
      let k = newIndex - arr.length + 1;
      while (k--) {
        arr.push(undefined);
      }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
  };

  const moveDown = (index: number) => {
    if (index !== tracker.length - 1) {
      arrayMove(tracker, index, index + 1);
      // reorder
      for (let i = 0; i < tracker.length; i++) {
        tracker[i].order = i;
        tracker[i].tickMap.order = i;
      }
      setTracker([...tracker]);
    }
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      arrayMove(tracker, index, index - 1);
      // reorder
      for (let i = 0; i < tracker.length; i++) {
        tracker[i].order = i;
        tracker[i].tickMap.order = i;
      }
      setTracker([...tracker]);
    }
  };

  const removeTickMap = (index: number) => {
    const allTickMaps = [...tracker];
    let removeIndex = 0;
    for (let i = 0; i < allTickMaps.length; i++) {
      if (allTickMaps[i].order === index) {
        removeIndex = i;
        break;
      }
    }
    allTickMaps.splice(removeIndex, 1);
    // reorder
    for (let i = 0; i < allTickMaps.length; i++) {
      allTickMaps[i].order = i;
      allTickMaps[i].tickMap.order = i;
    }
    setTracker([...allTickMaps]);
  };

  const toggleOpener = (index: number) => {
    const currentState = [...isOpen];
    currentState[index] = !currentState[index];
    setIsOpen([...currentState]);
  };

  const addItem = () => {
    const order = tracker.length;
    const aTickMap: TickMapItemType = {
      label: `TickMap-${order}`,
      enabled: true,
      order,
      value: '',
      text: ''
    };
    const aTracker: TickMapItemTracker = {
      tickMap: aTickMap,
      order,
      ID: uuidv4(),
    };
    setTracker([...tracker, aTracker]);
    // add an opener also
    setIsOpen([...isOpen, true]);
  };

  return (
    <>
      <Button fill='solid' variant='primary' icon='plus' onClick={addItem}>
        Add Tick Map
      </Button>
      {tracker &&
        tracker.map((trackerItem: TickMapItemTracker, index: number) => {
          return (
            <Collapse
              key={`tickmap-collapse-item-index-${trackerItem.ID}`}
              label={trackerItem.tickMap.label}
              isOpen={isOpen[index]}
              onToggle={() => toggleOpener(index)}
              collapsible
            >
              <TickMapItem
                key={`tickmap-item-index-${trackerItem.ID}`}
                ID={trackerItem.ID}
                tickMap={trackerItem.tickMap}
                enabled={trackerItem.tickMap.enabled}
                setter={updateTickMap}
                remover={removeTickMap}
                moveDown={moveDown}
                moveUp={moveUp}
                createDuplicate={createDuplicate}
                context={context}
              />
            </Collapse>
          );
        })}
    </>
  );
};
