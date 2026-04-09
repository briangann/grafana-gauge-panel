import React from 'react';

import { IconName, Input, Field, FieldSet, Card, IconButton } from '@grafana/ui';
import { TickMapItemProps } from './types';

const VISIBLE_ICON: IconName = 'eye';
const HIDDEN_ICON: IconName = 'eye-slash';

export const TickMapItem: React.FC<TickMapItemProps> = (props) => {
  const { tickMap, ID, setter, remover, moveUp, moveDown, createDuplicate } = props;

  return (
    <Card key={`tickmap-card-${ID}`}>
      <Card.Heading />
      <Card.Meta>
        <FieldSet>
          <Field
            label="Label"
            description="Sets the name of the Tick Map in the configuration editor"
            disabled={!tickMap.enabled}
          >
            <Input
              value={tickMap.label}
              placeholder=""
              onChange={(e) => setter(tickMap.order, { ...tickMap, label: e.currentTarget.value })}
            />
          </Field>
          <Field label="Value" description="Tick Value where the text will be placed" disabled={!tickMap.enabled}>
            <Input
              value={tickMap.value}
              placeholder=""
              onChange={(e) => setter(tickMap.order, { ...tickMap, value: e.currentTarget.value })}
            />
          </Field>
          <Field label="Text" description="Text to be displayed for tick value" disabled={!tickMap.enabled}>
            <Input
              value={tickMap.text}
              placeholder=""
              onChange={(e) => setter(tickMap.order, { ...tickMap, text: e.currentTarget.value })}
            />
          </Field>
        </FieldSet>
      </Card.Meta>

      <Card.Actions>
        <IconButton key="moveUp" name="arrow-up" tooltip="Move Up" onClick={() => moveUp(tickMap.order)} />
        <IconButton key="moveDown" name="arrow-down" tooltip="Move Down" onClick={() => moveDown(tickMap.order)} />
        <IconButton
          key="tickMapEnabled"
          name={tickMap.enabled ? VISIBLE_ICON : HIDDEN_ICON}
          tooltip="Hide/Show Override"
          onClick={() => setter(tickMap.order, { ...tickMap, enabled: !tickMap.enabled })}
        />
        <IconButton key="copyOverride" name="copy" tooltip="Duplicate" onClick={() => createDuplicate(tickMap.order)} />
        <IconButton
          key="deleteTickMap"
          variant="destructive"
          name="trash-alt"
          tooltip="Delete Tick Map"
          onClick={() => remover(tickMap.order)}
        />
      </Card.Actions>
    </Card>
  );
};
