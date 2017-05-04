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
  selected: boolean;
  position: CyPosition;
}

export interface CyEdge {
  group: string;
  data: DeliveryData;
  selected: boolean;
}

export interface CyPosition {
  x: number;
  y: number;
}

export interface Connection {
  source: string;
  target: string;
}

export interface StationData {
  id: string;
  name: string;
  incoming: string[];
  outgoing: string[];
  connections: Connection[];
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
  position: CyPosition;
  positionRelativeTo: string;
  properties: { name: string, value: string }[];
}

export interface DeliveryData {
  id: string;
  name: string;
  lot: string;
  source: string;
  target: string;
  originalSource: string;
  originalTarget: string;
  invisible: boolean;
  selected: boolean;
  observed: ObservedType;
  forward: boolean;
  backward: boolean;
  score: number;
  properties: { name: string, value: string }[];
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
