export interface FclData {
  elements: FclElements;
  layout: any;
  graphSettings: GraphSettings;
  tableSettings: TableSettings;
}

export interface FclElements {
  stations: any[];
  deliveries: any[];
}

export interface GraphSettings {
  nodeSize: Size;
  fontSize: Size;
  mergeDeliveries: boolean;
  showLegend: boolean;
}

export interface TableSettings {
  mode: TableMode;
  width: number;
  stationColumns: string[];
  deliveryColumns: string[];
  showType: ShowType;
}

export enum TableMode {
  STATIONS = 'Stations' as any,
  DELIVERIES = 'Deliveries' as any
}

export enum ShowType {
  ALL = 'All' as any,
  SELECTED_ONLY = 'Selected Only' as any,
  TRACE_ONLY = 'Trace Only' as any
}

export enum Size {
  SMALL = 'Small' as any,
  MEDIUM = 'Medium' as any,
  LARGE = 'Large' as any
}
