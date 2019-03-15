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
    samples: SampleData[];
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
    groupType: GroupType;
    selected: boolean;
    observed: ObservedType;
    forward: boolean;
    backward: boolean;
    outbreak: boolean;
    weight: number;
    crossContamination: boolean;
    killContamination: boolean;
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
    lotKey: string;
    date: string;
    source: string;
    target: string;
    originalSource: string;
    originalTarget: string;
    invisible: boolean;
    selected: boolean;
    crossContamination: boolean;
    killContamination: boolean;
    observed: ObservedType;
    forward: boolean;
    backward: boolean;
    score: number;
    weight: number;
    properties: { name: string, value: string }[];
}

export enum SampleResultType {
    Confirmed, Negative, Probable, Unkown
}

export interface SampleData {
    station: string;
    lot: string;
    type: string;
    material: string;
    time: string;
    amount: string;
    result: string;
    resultType: SampleResultType;
}

export interface GraphSettings {
    type: GraphType;
    nodeSize: Size;
    fontSize: Size;
    mergeDeliveries: boolean;
    showLegend: boolean;
    showZoom: boolean;
    skipUnconnectedStations: boolean;
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

export enum GroupMode {
    WEIGHT_ONLY = 'Weight only' as any,
    PRODUCT_AND_WEIGHT = 'Product name and weight' as any,
    LOT_AND_WEIGHT = 'Lot and weight' as any
}

export enum GroupType {
    SOURCE_GROUP = 'Source group' as any,
    TARGET_GROUP = 'Target group' as any,
    ISOLATED_GROUP = 'Isolated subgraph' as any,
    SIMPLE_CHAIN = 'Simple chain' as any
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

export enum DialogAlignment {
    LEFT, CENTER, RIGHT
}
