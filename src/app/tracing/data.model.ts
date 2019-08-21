interface ViewData {
    selected: boolean;
    invisible: boolean;
}

export interface FclData {
    fclElements: FclElements;
    graphSettings: GraphSettings;
    tableSettings: TableSettings;
    tracingSettings: TracingSettings;
    groupSettings: GroupData[];
}

export interface FclElements {
    stations: StationStoreData[];
    deliveries: DeliveryStoreData[];
    samples: SampleData[];
}

export interface StationStoreData {
    id: string;
    name: string;
    lat: number;
    lon: number;
    incoming: string[];
    outgoing: string[];
    connections: Connection[];
    properties: { name: string, value: string }[];
}

export interface DeliveryStoreData {
    id: string;
    name: string;
    lot: string;
    lotKey: string;
    date: string;
    source: string;
    target: string;
    properties: { name: string, value: string }[];
}

export interface Layout {
    zoom: number;
    pan: Position;
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

export interface SelectedElements {
    stations: string[];
    deliveries: string[];
}

export interface InvisibleElements {
    stations: string[];
    deliveries: string[];
}

export interface GraphSettings {
    type: GraphType;
    nodeSize: Size;
    fontSize: Size;
    mergeDeliveries: boolean;
    showLegend: boolean;
    showZoom: boolean;
    skipUnconnectedStations: boolean;
    selectedElements: SelectedElements;
    stationPositions: {[key: string]: Position};
    highlightingSettings: HighlightingSettings;
    schemaLayout: Layout;
    gisLayout: Layout;
}

export interface HighlightingSettings {
    invisibleStations: string[];
    stations?: StationHighlightingData[];
    deliveries?: DeliveryHighlightingData[];
}

interface ElementHighlightingData {
    name: string;
    showInLegend: boolean;
    color: number[];
    invisible: boolean;
    adjustThickness: boolean;
    labelProperty: string;
    valueCondition: ValueCondition;
    logicalConditions: LogicalCondition[][];
}

export interface DeliveryHighlightingData extends ElementHighlightingData {
    linePattern: LinePatternType;
}

export interface StationHighlightingData extends ElementHighlightingData {
    shape: NodeShapeType;
}

export enum NodeShapeType {
    CIRCLE = 'ellipse',
    SQUARE = 'rectangle',
    TRIANGLE = 'triangle',
    PENTAGON = 'pentagon',
    HEXAGON = 'hexagon',
    OCTAGON = 'octagon',
    STAR = 'star',
    DIAMOND = 'diamond'
}
export interface LogicalCondition {
    propertyName: string;
    operationType: OperationType;
    value: string;
}

export enum OperationType {
    EQUAL = '==',
    GREATER = '>',
    NOT_EQUAL = '!=',
    LESS = '<',
    REGEX_EQUAL = ' == (Regex)',
    REGEX_NOT_EQUAL = '!= (Regex)',
    REGEX_EQUAL_IGNORE_CASE = '== (Regex Ignore Case)',
    REGEX_NOT_EQUAL_IGNORE_CASE = '!= (Regex Ignore Case'
}

export interface ValueCondition {
    propertyName: string;
    valueType: ValueType;
    useZeroAsMinimum: boolean;
}

export enum ValueType {
    VALUE = 'Value',
    LOG_VALUE = 'Log Value'
}

export interface TableSettings {
    mode: TableMode;
    width: number;
    stationColumns: string[];
    deliveryColumns: string[];
    showType: ShowType;
}

interface TraceableElementSettings {
    id: string;
    observed: ObservedType;
    crossContamination: boolean;
    killContamination: boolean;
    weight: number;
}

export interface StationTracingSettings extends TraceableElementSettings {
    outbreak: boolean;
}

export interface DeliveryTracingSettings extends TraceableElementSettings {
}

export interface TracingSettings {
    stations: StationTracingSettings[];
    deliveries: DeliveryTracingSettings[];
}

export interface GroupData {
    id: string;
    name: string;
    contains: string[];
    groupType: GroupType;
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

export interface DataServiceData {
    statMap: { [key: string]: StationData };
    stations: StationData[];
    delMap: { [key: string]: DeliveryData };
    deliveries: DeliveryData[];
    statSel: { [key: string]: boolean };
    delSel: { [key: string]: boolean };
    statVis: { [key: string]: boolean };
    tracingResult: { maxScore: number };

    getStatById(ids: string[]): StationData[];
    getDelById(ids: string[]): DeliveryData[];
}

export interface StationTracingData extends StationTracingSettings {
    forward: boolean;
    backward: boolean;
    score: number;
    commonLink: boolean;
}

export interface DeliveryTracingData extends DeliveryTracingSettings {
    forward: boolean;
    backward: boolean;
    score: number;
}

export interface StationData extends StationStoreData, StationTracingData, ViewData, GroupData {
    contained: boolean;
    highlightingInfo?: HighlightingInfo;
}

export interface HighlightingInfo {
    label?: string[];
    color?: number[][];
}

export interface StationHighlightingInfo extends HighlightingInfo {
    shape?: NodeShapeType;
}

export interface DeliveryHighlightingInfo extends HighlightingInfo {
    linePattern?: LinePatternType;
}

export enum LinePatternType {
    SOLID
}

export interface DeliveryData extends DeliveryStoreData, DeliveryTracingData, ViewData {
    originalSource: string;
    originalTarget: string;
    highlightingInfo?: HighlightingInfo;
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

export interface ElementData {
    id: string;
    selected: boolean;
    label?: string;
}

export interface EdgeData extends ElementData {
    source: string;
    target: string;
    deliveryIds: string[];
    colors: Color[];
    width: number;
}

export interface NodeData extends ElementData {
    stationId: string;
    colors: Color[];
    size: number;
    position: Position;
}

export interface SelectedElements {
    stations: string[];
    deliveries: string[];
}

export interface TableSettings {
    mode: TableMode;
    width: number;
    stationColumns: string[];
    deliveryColumns: string[];
    showType: ShowType;
}

export enum DialogAlignment {
    LEFT, CENTER, RIGHT
}

export interface BasicGraphState {
    fclElements: FclElements;
    groupSettings: GroupData[];
    tracingSettings: TracingSettings;
    highlightingSettings: HighlightingSettings;
    selectedElements: SelectedElements;
}

export interface GraphState extends BasicGraphState {
    layout: Layout;
}

export interface SetTracingSettingsPayload {
    tracingSettings: TracingSettings;
}

export interface SetHighlightingSettingsPayload {
    highlightingSettings: HighlightingSettings;
}
