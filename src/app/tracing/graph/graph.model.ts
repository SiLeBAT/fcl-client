import {
    StationTracingData, DeliveryTracingData, StationData, DeliveryData, DataServiceData,
    Position, SelectedElements, StationId, DeliveryId, PositionMap
} from '../data.model';

class None { private ___ = {}; }

interface CyElementDef<T> {
    group: string;
    data: T;
    selected: boolean;
    classes?: string;
}

export interface CyNodeDef extends CyElementDef<CyNodeData> {
    position: Position;
}

export interface CyEdgeDef extends CyElementDef<CyEdgeData> {}

export interface BoundingBoxOptions {
    includeNodes?: boolean;
    includeEdges?: boolean;
    includeLabels?: boolean;
    includeMainLabels?: boolean;
    includeSourceLabels?: boolean;
    includeTargetLabels?: boolean;
    includeOverlays?: boolean;
}

type CyCallBackFun = (a?: any) => void;

export interface Cy {
    nodes(a?: string): CyNodeCollection;
    edges(a?: string): CyEdgeCollection;
    elements(a?: string): CyElementCollection<CyNode | CyEdge>;
    container(): any;
    resize(): void;
    destroy(): void;
    destroyed(): boolean;
    batch(a: () => void): void;
    reset(): void;
    fit(): void;
    zoom<T extends number | { level: number } | None>(a?: T): None extends T ? number : void;
    maxZoom<T extends number | unknown>(newZoom?: T): T extends number ? void : number;
    minZoom<T extends number | unknown>(newZoom?: T): T extends number ? void : number;
    pan<T extends Position | None>(a?: T): None extends T ? Position : void;
    add(a: CyNodeDef[] | CyEdgeDef[]): CyElementCollection<CyNode | CyEdge>;
    on<
        T extends string | CyCallBackFun,
        K extends (T extends string ? CyCallBackFun : None)
    >(eventName: string, eventFilterOrCallBack: T, eventCallBack?: K): void;
    one<
        T extends string | CyCallBackFun,
        K extends (T extends string ? CyCallBackFun : None)
    >(eventName: string, eventFilterOrCallBack: T, eventCallBack?: K): void;
    removeListener(events: string, handler: (event?: any) => void): void;
    removeAllListeners(): void;
    getElementById(id: string): CyNode | CyEdge;
    ready(callBack: () => void): void;
    style(): {};
    setStyle(style: {}): void;
    width(): number;
    height(): number;
    userPanningEnabled<T extends boolean | None>(a?: T): None extends T ? boolean : void;
    autoungrabify<T extends boolean | None>(a?: T): None extends T ? boolean : void;
    layout(options: { name: string, [key: string]: any }): CyLayout;
    zoomingEnabled<T extends boolean | unknown>(a?: T): T extends boolean ? void : boolean;
    viewport(zoom: number, pan: Position): void;
    extent(): CyExtent;
    remove(selectorOrEles: string | CyElementCollection<CyNode | CyEdge>): void;
}

export interface CyExtent {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    w: number;
    h: number;
}

interface CyLayout {
    run(): void;
    stop(): void;
}

export interface BoundingBox {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    w: number;
    h: number;
}

export interface CyElementCollection<E> {
    size(): number;
    allAre(a: string): number;
    map<T>(a: (b: E) => T): T[];
    style(a: {}): void;
    unselect(): void;
    select(): void;
    remove(): void;
    forEach(a: (b: E) => void): void;
    scratch(a: string, b: boolean): void;
    filter(a: ((b: E) => boolean) | string): CyElementCollection<E>;
    first(): E;
    toggleClass(a: string, b?: boolean): void;
    renderedBoundingBox(options?: BoundingBoxOptions): BoundingBox;
    union(elementsOrSelector: CyElementCollection<CyNode | CyEdge> | string): CyElementCollection<CyNode | CyEdge>;
    difference(elementsOrSelector: CyElementCollection<CyNode | CyEdge> | string): CyElementCollection<CyNode | CyEdge>;

}

export interface CyNodeCollection extends CyElementCollection<CyNode> {
    layout(options: { name: string, [key: string]: any }): CyLayout;
    positions(a: (b: CyNode) => Position): void;
    filter(a: ((b: CyNode) => boolean) | string): CyNodeCollection;
    edgesWith(a: string | CyNodeCollection): CyEdgeCollection;
    connectedEdges(a?: string): CyEdgeCollection;
}

export interface CyEdgeCollection extends CyElementCollection<CyEdge> {
    connectedNodes(a?: string): CyNodeCollection;
    parallelEdges(selector?: string): CyEdgeCollection;
    union<T extends CyElementCollection<CyNode | CyEdge>>(
        elements: T
    ): T extends CyEdgeCollection ? CyEdgeCollection : CyElementCollection<CyNode | CyEdge>;
    difference(elementsOrSelector: CyEdgeCollection | string): CyEdgeCollection;
}

export interface CyElement {
    isEdge(): boolean;
    isNode(): boolean;
    id(): string;
    data(a?: string): any;
    selected(): boolean;
    style<
        T extends string | {[key: string]: any} | None,
        K extends (None extends T ? None : T extends string ? number | string | boolean | None : None)
    >(a?: T, b?: K): None extends T ? {} : (T extends string ? (None extends K ? number | string | boolean : void) : void);
    on<
        T extends string | CyCallBackFun,
        K extends (T extends string ? CyCallBackFun : None)
    >(eventName: string, eventFilterOrCallBack: T, eventCallBack?: K): void;
    removeListener(events: string, handler: (event?: any) => void): void;
    renderedBoundingBox(options?: BoundingBoxOptions): BoundingBox;
}

export interface CyNode extends CyElement {
    data<T extends string | None>(a?: T): None extends T ? CyNodeData : any;
    position(): Position;
    renderedPosition(): Position;
    height(): number;
    connectedEdges(a?: string): CyEdgeCollection;
}

export interface CyEdge extends CyElement {
    data<T extends string | None>(a?: T): None extends T ? CyEdgeData : any;
    source(): CyNode;
    target(): CyNode;
}

export type NodeId = string;
export type EdgeId = string;

export interface CyNodeData extends StationTracingData {
    id: NodeId;
    station: StationData;
    label: string;
    isMeta: boolean;
    selected: boolean;
    stopColors: string;
    stopPositions: string;
    shape: string;
    zindex?: number;
    relZindex?: number;
    degree?: number;
}

export interface CyEdgeData extends DeliveryTracingData {
    id: EdgeId;
    deliveries: DeliveryData[];
    stopColors: string;
    stopPositions: string;
    label?: string;
    labelWoPrefix: string;
    selected: boolean;
    source: NodeId;
    target: NodeId;
    wLabelSpace: boolean;
}

export interface GraphElementData {
    nodeData: CyNodeData[];
    edgeData: CyEdgeData[];
}

export interface GraphServiceData extends GraphElementData, DataServiceData {
    statIdToNodeDataMap: Record<StationId, CyNodeData>;
    idToNodeMap?: Record<NodeId, CyNodeData>;
    delIdToEdgeDataMap: Record<DeliveryId, CyEdgeData>;
    nodeSel: Record<NodeId, boolean>;
    edgeSel: Record<EdgeId, boolean>;
    propsChangedFlag: {};
    edgeLabelChangedFlag: {};
    ghostElements: GraphElementData;
    hoverEdges: EdgeId[];
    selectedElements: SelectedGraphElements;
}

export interface GraphGhostData extends GraphElementData {
    posMap: PositionMap;
}

export interface Size {
    width: number;
    height: number;
}

export interface ContextMenuRequestContext {
    nodeId?: NodeId;
    edgeId?: EdgeId;
}

export interface ContextMenuRequestInfo {
    position: Position;
    hoverContext: ContextMenuRequestContext;
}

export interface SelectedGraphElements {
    nodes: NodeId[];
    edges: EdgeId[];
}

export interface ContextSelection extends SelectedElements, SelectedGraphElements {}
