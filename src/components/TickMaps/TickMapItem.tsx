import React, { useEffect, useState } from 'react';

import {
  IconName,
  Input,
  Field,
  FieldSet,
  Card,
  IconButton,
} from '@grafana/ui';
import { TickMapItemProps, TickMapItemType } from './types';

export const TickMapItem: React.FC<TickMapItemProps> = (props) => {
  const [tickMap, _setTickMap] = useState(props.tickMap);

  const setTickMap = (value: TickMapItemType) => {
    _setTickMap(value);
    props.setter(tickMap.order, value);
  };
  const [visibleIcon] = useState<IconName>('eye');
  const [hiddenIcon] = useState<IconName>('eye-slash');

  const removeItem = () => {
    props.remover(tickMap.order);
  };

  const moveUp = () => {
    props.moveUp(tickMap.order);
  };
  const moveDown = () => {
    props.moveDown(tickMap.order);
  };
  const createDuplicate = () => {
    props.createDuplicate(tickMap.order);
  };

  return (
    <Card heading='' key={`tickmap-card-${props.ID}`}>
      <Card.Meta>
        <FieldSet>
          <Field
            label='Label'
            description='Sets the name of the Tick Map in the configuration editor'
            disabled={!tickMap.enabled}
          >
            <Input
              value={tickMap.label}
              placeholder=''
              onChange={(e) => setTickMap({ ...tickMap, label: e.currentTarget.value })}
            />
          </Field>
          <Field
            label='Value'
            description='Tick Value where the text will be placed'
            disabled={!tickMap.enabled}
          >
            <Input
              value={tickMap.value}
              placeholder=''
              onChange={(e) => setTickMap({ ...tickMap, value: e.currentTarget.value })}
            />
          </Field>
          <Field
            label='Text'
            description='Text to be displayed for tick value'
            disabled={!tickMap.enabled}
          >
            <Input
              value={tickMap.text}
              placeholder=''
              onChange={(e) => setTickMap({ ...tickMap, text: e.currentTarget.value })}
            />
          </Field>
        </FieldSet>
      </Card.Meta>

      <Card.Actions>
        <IconButton key='moveUp' name='arrow-up' tooltip='Move Up' onClick={moveUp} />
        <IconButton key='moveDown' name='arrow-down' tooltip='Move Down' onClick={moveDown} />
        <IconButton
          key='tickMapEnabled'
          name={tickMap.enabled ? visibleIcon : hiddenIcon}
          tooltip='Hide/Show Override'
          onClick={() => setTickMap({ ...tickMap, enabled: !tickMap.enabled })}
        />
        <IconButton key='copyOverride' name='copy' tooltip='Duplicate' onClick={createDuplicate} />
        <IconButton
          key='deleteTickMap'
          variant='destructive'
          name='trash-alt'
          tooltip='Delete Tick Map'
          onClick={removeItem}
        />
      </Card.Actions>
    </Card>
  );
};
