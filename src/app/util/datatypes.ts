export interface FclData {
  elements: FclElements;
  layout: Layout;
  gisLayout: Layout;
  graphSettings: GraphSettings;
  tableSettings: TableSettings;
}

export interface FclElements {
  stations: StationData[];
  deliveries: DeliveryData[];
}

export interface Layout {
  zoom: number;
  pan: Position;
}

export interface CyNode {
  group: string;
  data: StationData;
  selected: boolean;
  position: Position;
}

export interface CyEdge {
  group: string;
  data: DeliveryData;
  selected: boolean;
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface Position {
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
  lat: number;
  lon: number;
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
  crossContamination: boolean;
  score: number;
  commonLink: boolean;
  position: Position;
  positionRelativeTo: string;
  properties: { name: string, value: string }[];
}

export interface DeliveryData {
  id: string;
  name: string;
  lot: string;
  date: string;
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
  type: GraphType;
  nodeSize: Size;
  fontSize: Size;
  mergeDeliveries: boolean;
  showLegend: boolean;
  showZoom: boolean;
}

export interface TableSettings {
  mode: TableMode;
  width: number;
  stationColumns: string[];
  deliveryColumns: string[];
  showType: ShowType;
}

export enum GraphType {
  GRAPH = 'Graph' as any,
  GIS = 'GIS' as any
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
  TINY = 'Tiny' as any,
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

export enum DialogAlignment {
  LEFT, CENTER, RIGHT
}
