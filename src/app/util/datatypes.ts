export interface FclData {
  elements: FclElements;
  layout: any;
  graphSettings: GraphSettings;
  tableSettings: TableSettings;
}

export interface FclElements {
  stations: StationData[];
  deliveries: DeliveryData[];
}

export interface CyNode {
  group: string;
  data: StationData;
  position?: any;
  selected?: boolean;
}

export interface CyEdge {
  group: string;
  data: DeliveryData;
  selected?: boolean;
}

export interface StationData {
  id: string;
  name: string;
  incoming: string[];
  outgoing: string[];
  invisible: boolean;
  contained: boolean;
  contains: string[];
  selected: boolean;
  observed: ObservedType;
  forward: boolean;
  backward: boolean;
  outbreak: boolean;
  score: number;
  commonLink: boolean;
  position: any;
  positionRelativeTo: string;
}

export interface DeliveryData {
  id: string;
  source: string;
  target: string;
  originalSource: string;
  originalTarget: string;
  incoming: string[];
  outgoing: string[];
  invisible: boolean;
  selected: boolean;
  observed: ObservedType;
  forward: boolean;
  backward: boolean;
  score: number;
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

export enum ObservedType {
  NONE = 'none' as any,
  FULL = 'full' as any,
  FORWARD = 'forward' as any,
  BACKWARD = 'backward' as any
}
