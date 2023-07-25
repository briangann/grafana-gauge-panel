
export interface TickMapItemProps {
  tickMap: TickMapItemType;
  ID: string;
  enabled: boolean;
  setter: any;
  remover: any;
  moveUp: any;
  moveDown: any;
  createDuplicate: any;
  context: any;
}

export interface TickMapItemType {
  label: string;
  value: string;
  text: string;
  enabled: boolean;
  order: number;
}

export interface TickMapItemTracker {
  tickMap: TickMapItemType;
  order: number;
  ID: string;
}
