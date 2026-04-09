
export interface TickMapItemProps {
  tickMap: TickMapItemType;
  ID: string;
  setter: (index: number, value: TickMapItemType) => void;
  remover: (index: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  createDuplicate: (index: number) => void;
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
  isOpen: boolean;
}
