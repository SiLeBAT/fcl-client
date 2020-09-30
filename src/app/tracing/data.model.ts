interface ViewData {
    selected: boolean;
    invisible: boolean;
}

interface PropMap {
    [key: string]: string;
}

interface FclDataSourceInfo {
    name?: string;
    data?: any;
    propMaps?: {
        stationPropMap?: PropMap;
        deliveryPropMap?: PropMap;
    };
}
export interface FclData {
    source: FclDataSourceInfo;
    fclElements: FclElements;
    graphSettings: GraphSettings;
    tracingSettings: TracingSettings;
    groupSettings: GroupData[];
}

export interface StandardFilterSettings {
    filterTerm: string;
}

export interface TableColumn {
    id: string;
    name: string;
}

export interface RowHighlightingInfo {
    color: number[][];
    shape?: NodeShapeType;
}

export interface TableRow {
    id: string;
    highlightingInfo: RowHighlightingInfo;
    [key: string]: string | number | boolean | RowHighlightingInfo;
}

export interface DataTable {
    columns: TableColumn[];
    rows: TableRow[];
}

export interface StationRow extends TableRow {}
export interface StationTable extends DataTable {}

export interface FclElements {
    stations: StationStoreData[];
    deliveries: DeliveryStoreData[];
    samples: SampleData[];
}

export type StationId = string;
export type DeliveryId = string;

export interface StationStoreData {
    id: StationId;
    name?: string;
    lat?: number;
    lon?: number;
    incoming: string[];
    outgoing: string[];
    connections: Connection[];
    properties: { name: string, value: string }[];
}

export interface DeliveryStoreData {
    id: DeliveryId;
    name?: string;
    lot?: string;
    lotKey?: string;
    date?: string;
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

export type PositionMap = Record<string, Position>;

export interface Connection {
    source: DeliveryId;
    target: DeliveryId;
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
    stations: StationId[];
    deliveries: DeliveryId[];
}

export interface InvisibleElements {
    stations: StationId[];
    deliveries: DeliveryId[];
}

export interface GraphSettings {
    type: GraphType;
    mapType: MapType;
    shapeFileData: ShapeFileData;
    nodeSize: number;
    fontSize: number;
    mergeDeliveriesType: MergeDeliveriesType;
    showMergedDeliveriesCounts: boolean;
    showLegend: boolean;
    showZoom: boolean;
    skipUnconnectedStations: boolean;
    selectedElements: SelectedElements;
    stationPositions: {[key: string]: Position};
    highlightingSettings: HighlightingSettings;
    schemaLayout: Layout;
    gisLayout: Layout;
    ghostStation: string;
}

export interface HighlightingSettings {
    invisibleStations: StationId[];
    stations?: StationHighlightingData[];
    deliveries?: DeliveryHighlightingData[];
}

export interface TextElementInfo {
    text: string;
}

export interface PropElementInfo {
    prop: string;
    altText: string;
}

export type LabelElementInfo = TextElementInfo | PropElementInfo;

export interface ROALabelSettings {
    stationLabel: LabelElementInfo[][];
    lotLabel: LabelElementInfo[][];
    lotSampleLabel: LabelElementInfo[][];
    stationSampleLabel: LabelElementInfo[][];
}

export interface ROASettings {
    labelSettings: ROALabelSettings;
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

export enum MergeDeliveriesType {
    MERGE_ALL,
    MERGE_LOT_WISE,
    MERGE_PRODUCT_WISE,
    MERGE_LABEL_WISE,
    NO_MERGE
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
    REGEX_EQUAL = '== (Regex)',
    REGEX_NOT_EQUAL = '!= (Regex)',
    REGEX_EQUAL_IGNORE_CASE = '== (Regex Ignore Case)',
    REGEX_NOT_EQUAL_IGNORE_CASE = '!= (Regex Ignore Case)'
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

interface TraceableElementSettings {
    id: StationId | DeliveryId;
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
    id: StationId;
    name?: string;
    contains: string[];
    groupType: GroupType;
}

export enum GraphType {
    GRAPH = 'Graph' as any,
    GIS = 'GIS' as any
}

export enum MapType {
    SHAPE_FILE,
    BLACK_AND_WHITE,
    MAPNIK
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

export enum ObservedType {
    NONE = 'none' as any,
    FULL = 'full' as any,
    FORWARD = 'forward' as any,
    BACKWARD = 'backward' as any
}

export interface ShapeFileData {

}

export interface DataServiceData {
    statMap: Record<StationId, StationData>;
    stations: StationData[];
    delMap: Record<DeliveryId, DeliveryData>;
    deliveries: DeliveryData[];
    statSel: Record<StationId, boolean>;
    delSel: Record<DeliveryId, boolean>;
    statVis: Record<StationId, boolean>;
    tracingResult: { maxScore: number };
    legendInfo: LegendInfo;

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
    highlightingInfo?: StationHighlightingInfo;
}

export interface HighlightingInfo {
    label: string[];
    color: number[][];
}

export interface StationHighlightingInfo extends HighlightingInfo {
    shape: NodeShapeType;
}

export interface DeliveryHighlightingInfo extends HighlightingInfo {
    linePattern?: LinePatternType;
}

export enum LinePatternType {
    SOLID
}

export interface DeliveryData extends DeliveryStoreData, DeliveryTracingData, ViewData {
    originalSource: StationId;
    originalTarget: StationId;
    highlightingInfo?: DeliveryHighlightingInfo;
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
    stations: StationId[];
    deliveries: DeliveryId[];
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

interface LegendEntry {
    label: string;
    color: Color;
}

interface StationLegendEntry extends LegendEntry {
    shape: NodeShapeType;
}

export interface DeliveryLegendEntry extends LegendEntry {
    linePattern: LinePatternType;
}

export interface LegendInfo {
    stations: StationLegendEntry[];
    deliveries: DeliveryLegendEntry[];
}

export interface Size {
    width: number;
    height: number;
}

export interface Range {
    min: number;
    max: number;
}
