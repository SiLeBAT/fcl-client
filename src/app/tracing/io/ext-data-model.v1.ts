export const VERSION = '1.1.1';
export interface JsonData {
    version: string;
    data: Data;
    tracing?: TracingData;
    settings?: SettingsData;
}

export interface ColumnProperty {
    id: string;
    type: string;
}

interface ItemProperty {
    id: string;
    value: string | number | boolean;
}

export type DataRow = ItemProperty[];

export interface DataTable {
    columnProperties: ColumnProperty[];
    data: DataRow[];
}

interface Data {
    version: string;
    stations: DataTable;
    deliveries: DataTable;
    deliveryRelations: DataTable;
}

interface TracingElementSettings {
    id: string;
    weight: number;
    killContamination: boolean;
    crossContamination: boolean;
    observed: boolean;
}

export interface TracingData {
    version: string;
    // enforceTemporalOrder: boolean;
    nodes: TracingElementSettings[];
    deliveries: TracingElementSettings[];
}

export interface MetaNodeData {
    id: string;
    name?: string;
    type: string;
    members: string[];
}

export interface SettingsData {
    version: string;
    metaNodes: MetaNodeData[];
    view?: ViewData;
}

export interface ViewData {
    showGis?: boolean;
    // gisType?: string;
    showLegend?: boolean;
    // exportAsSvg?: boolean;
    // label?: string;
    edge: EdgeViewData;
    node: NodeViewData;
    gis?: GisGraphViewData;
    graph?: SchemaGraphViewData;
    // explosions?: ExplosionViewData[];
}

export interface NodeViewData {
    skipEdgelessNodes?: boolean;
    // labelPosition: string;
    selectedNodes?: string[];
    invisibleNodes?: string[] | null;
    highlightConditions?: StationHighlightingRule[];
}

export interface EdgeViewData {
    joinEdges?: boolean;
    mergeDeliveriesType?: string;
    showMergedDeliveriesCounts?: boolean;
    // showEdgesInMetanode: boolean;
    // hideArrowHead: boolean;
    // arrowHeadInMiddle: boolean;
    selectedEdges: string[];
    invisibleEdges?: string[] | null;
    highlightConditions?: DeliveryHighlightingRule[];
    // showCrossContaminatedDeliveries: boolean;
    // filter: EdgeFilterData;
}

interface GraphViewData {
    transformation: Transformation;
    edge?: {
        minWidth?: number;
        maxWidth?: number;
    };
    text?: {
        fontSize?: number;
        fontBold?: boolean;
    };
}

interface SchemaGraphViewData extends GraphViewData {
    node?: {
        minSize?: number;
        maxSize?: number;
        positions: { id: string; position: XY }[];
    };
}

interface GisGraphViewData extends GraphViewData {
    node?: {
        minSize?: number;
        maxSize?: number;
        avoidOverlay?: boolean;
    };
    borderAlpha?: number;
}

interface EdgeFilterData {
    invisibleEdges: string[];
    dateFilter: EdgeDateFilterData[];
}

interface EdgeDateFilterData {
    dateId: string;
    toDate: DateData;
    showDeliveriesWithoutDate: boolean;
}

export interface HighlightingRule {
    name: string;
    showInLegend: boolean;
    disabled?: boolean;
    color: number[];
    invisible: boolean;
    adjustThickness: boolean;
    labelProperty: string;
    valueCondition: ValueCondition;
    logicalConditions: LogicalCondition[][];
}

export interface DeliveryHighlightingRule extends HighlightingRule {
    linePattern: string;
}

export interface StationHighlightingRule extends HighlightingRule {
    shape: string;
}

export interface LogicalCondition {
    propertyName: string;
    operationType: string;
    value: string;
}

export interface ValueCondition {
    propertyName: string;
    valueType: string;
    useZeroAsMinimum: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ExplosionViewData {

}

interface DateData {
    year: number;
    month: number;
    day: number;
}

interface Transformation {
    scale: XY;
    translation: XY;
}

interface XY {
    x: number;
    y: number;
}
