import {
    StationTracingData, DeliveryTracingData, StationData, DeliveryData, DataServiceData, Position
} from '../data.model';

class None { private ___ = {}; }

export interface CyNodeDef {
    group: string;
    data: CyNodeData;
    selected: boolean;
    position: Position;
}

export interface CyEdgeDef {
    group: string;
    data: CyEdgeData;
    selected: boolean;
}

type CyCallBackFun = (a?: any) => void;

export interface Cy {
    nodes(a?: string): CyElementCollection<CyNode>;
    edges(a?: string): CyElementCollection<CyEdge>;
    elements(a?: string): CyElementCollection<CyNode | CyEdge>;
    container(): any;
    resize(): void;
    batch(a: () => void): void;
    reset(): void;
    fit(): void;
    zoom<T extends number | { level: number } | None>(a?: T): None extends T ? number : void;
    maxZoom(): number;
    minZoom(): number;
    pan<T extends Position | None>(a?: T): None extends T ? Position : void;
    add(a: CyNodeDef[] | CyEdgeDef[]): void;
    on<
        T extends string | CyCallBackFun,
        K extends (T extends string ? CyCallBackFun : None)
    >(eventName: string, eventFilterOrCallBack: T, eventCallBack?: K): void;
    getElementById(id: string): CyNode | CyEdge;
    ready(callBack: () => void): void;
    style(): {};
    setStyle(style: {}): void;
    width(): number;
    height(): number;
    userPanningEnabled<T extends boolean | None>(a?: T): None extends T ? boolean : void;
    autoungrabify<T extends boolean | None>(a?: T): None extends T ? boolean : void;
    layout(options: { name: string, [key: string]: any }): CyLayout;
    zoomingEnabled<T extends boolean | None>(a?: T): None extends T ? boolean : void;
}

interface CyLayout {
    run(): void;
}

interface CyElementCollection<E> {
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
    positions(a: (b: CyNode) => Position): void;
}

interface CyElement {
    isEdge(): boolean;
    isNode(): boolean;
    id(): string;
    data(a?: string): any;
    selected(): boolean;
}

export interface CyNode extends CyElement {
    data<T extends string | None>(a?: T): None extends T ? CyNodeData : any;
    selected(): boolean;
    position(): Position;
    height(): number;
}

export interface CyEdge extends CyElement {
    data<T extends string | None>(a?: T): None extends T ? CyEdgeData : any;
    selected(): boolean;
}

export interface CyNodeData extends StationTracingData {
    id: string;
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
    id: string;
    deliveries: DeliveryData[];
    stopColors: string;
    stopPositions: string;
    label: string;
    selected: boolean;
    source: string;
    target: string;
}

export interface GraphServiceData extends DataServiceData {
    statIdToNodeDataMap: {[key: string]: CyNodeData };
    nodeData: CyNodeData[];
    idToNodeMap?: { [key: string]: CyNodeData };
    delIdToEdgeDataMap: {[key: string]: CyEdgeData };
    edgeData: CyEdgeData[];
    nodeSel: {[key: string]: boolean };
    edgeSel: {[key: string]: boolean };
    propsChangedFlag: {};
}
