export type HighlightingRuleId = string;

interface ViewData {
    selected: boolean;
    invisible: boolean;
    expInvisible: boolean;
}

export interface PropMap {
    [key: string]: string;
}

export interface FclDataSourceInfo {
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

export type TreeStatus = 'collapsed' | 'expanded';

export interface TableRow {
    id: string;
    highlightingInfo: RowHighlightingInfo;
    parentRow?: TableRow;
    parentRowId?: string;
    treeStatus?: TreeStatus;
    [key: string]: string | number | boolean | RowHighlightingInfo | TableRow;
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

export interface PropertyEntry {
    name: string;
    value: number | boolean | string;
}

export interface StationStoreData {
    id: StationId;
    name?: string;
    lat?: number;
    lon?: number;
    incoming: string[];
    outgoing: string[];
    connections: Connection[];
    properties: PropertyEntry[];
}

export interface DeliveryStoreData {
    id: DeliveryId;
    name?: string;
    lot?: string;
    lotKey?: string;
    dateIn?: string;
    dateOut?: string;
    source: string;
    target: string;
    properties: PropertyEntry[];
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

export interface ClearInvisibilitiesOptions {
    clearStationInvs: boolean;
    clearDeliveryInvs: boolean;
}

export interface ShowElementsTraceParams {
    stationIds: StationId[];
    deliveryIds: DeliveryId[];
    observedType: ObservedType;
}

export interface GraphSettings {
    type: GraphType;
    mapType: MapType;
    shapeFileData: ShapeFileData | null;
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
    schemaLayout: Layout | null;
    gisLayout: Layout | null;
    ghostStation: StationId | null;
    hoverDeliveries: DeliveryId[];
}

export interface HighlightingSettings {
    invisibleStations: StationId[];
    invisibleDeliveries: DeliveryId[];
    stations?: StationHighlightingRule[];
    deliveries?: DeliveryHighlightingRule[];
}

export interface MakeElementsInvisibleInputState {
    selectedElements: SelectedElements;
    highlightingSettings: HighlightingSettings;
    tracingSettings: TracingSettings;
}

export interface HighlightingRule {
    id: HighlightingRuleId;
    name: string;
    showInLegend: boolean;
    color: number[];
    invisible: boolean;
    disabled: boolean;
    adjustThickness: boolean;
    labelProperty: string;
    valueCondition: ValueCondition;
    logicalConditions: LogicalCondition[][];
}

export interface DeliveryHighlightingRule extends HighlightingRule {
    linePattern: LinePatternType;
}

export interface StationHighlightingRule extends HighlightingRule {
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
    CONTAINS = 'contains',
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

export enum CrossContTraceType {
    USE_EXPLICIT_DELIVERY_DATES,
    USE_INFERED_DELIVERY_DATES_LIMITS,
    DO_NOT_CONSIDER_DELIVERY_DATES
}

export interface GlobalTracingSettings {
    crossContTraceType: CrossContTraceType;
}

export interface TracingSettings extends GlobalTracingSettings {
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
    // todo: to define
}

interface TracingResult {
    maxScore: number;
}

interface SharedHighlightingStats {
    counts: Record<HighlightingRuleId, number>;
}
export interface StationHighlightingStats extends SharedHighlightingStats {
    conflicts: Record<HighlightingRuleId, number>;
}

export interface DeliveryHighlightingStats extends SharedHighlightingStats {}
export interface HighlightingStats {
    stationRuleStats: StationHighlightingStats;
    deliveryRuleStats: DeliveryHighlightingStats;
}
export interface DataServiceData {
    statMap: Record<StationId, StationData>;
    stations: StationData[];
    delMap: Record<DeliveryId, DeliveryData>;
    deliveries: DeliveryData[];
    statSel: Record<StationId, boolean>;
    delSel: Record<DeliveryId, boolean>;
    statVis: Record<StationId, boolean>;
    delVis: Record<DeliveryId, boolean>;
    tracingResult: TracingResult;
    legendInfo: LegendInfo;
    highlightingStats: HighlightingStats;

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
    isMeta: boolean;
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

export interface SharedGraphState extends BasicGraphState {
    mergeDeliveriesType: MergeDeliveriesType;
    showMergedDeliveriesCounts: boolean;
    ghostStation: StationId | null;
    hoverDeliveries: DeliveryId[];
}

export interface GraphState extends SharedGraphState {
    layout: Layout;
}

export interface SchemaGraphState extends SharedGraphState {
    stationPositions: Record<StationId, Position>;
    layout: Layout;
}

export interface SetTracingSettingsPayload {
    tracingSettings: TracingSettings;
}

export interface SetHighlightingSettingsPayload {
    highlightingSettings: HighlightingSettings;
}

export interface SetInvisibleElementsPayload {
    highlightingSettings: HighlightingSettings;
    selectedElements: SelectedElements;
    tracingSettings: TracingSettings;
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
