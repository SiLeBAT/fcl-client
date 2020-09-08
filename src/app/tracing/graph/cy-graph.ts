import { CyNodeData, CyEdgeData, Cy, CyNodeDef, CyEdgeDef } from './graph.model';
import { Layout, Position, PositionMap, Size } from '../data.model';
import { ElementRef } from '@angular/core';
import cytoscape from 'cytoscape';

interface CyConfig {

}

export interface StyleConfig {
    nodeSize: number;
    fontSize: number;
}

export interface LayoutConfig {
    name: string;
    zoom?: number;
    pan?: Position;
    // availableSpace: AvailableSpace;
}

export interface SelectedGraphElements {
    nodeSel: { [key: string]: boolean };
    edgeSel: { [key: string]: boolean };
}

export interface GraphData {
    nodeData: CyNodeData[];
    edgeData: CyEdgeData[];
    nodePositions: PositionMap;
    layout: Layout;
    selectedElements: SelectedGraphElements;
    propsChangedFlag: {};
    edgeLabelChangedFlag: {};
}

export enum GraphEventType {
    LAYOUT_IN_PROGRESS = 'LAYOUT_IN_PROGRESS',
    LAYOUT_CHANGE = 'LAYOUT_CHANGE',
    PAN_CHANGE = 'PAN_CHANGE',
    SELECTION_CHANGE = 'SELECTION_CHANGE',
    CONTEXT_MENU_REQUEST = 'CONTEXT_MENU_REQUEST'
}

// interface GraphEventListeners {
//     LAYOUT_IN_PROGRESS?: () => void;
//     LAYOUT_CHANGE?: () => void;
//     PAN_CHANGE?: () => void;
//     SELECTION_CHANGE?: () => void;
//     CONTEXT_MENU_REQUEST?: () => void;
// }

interface GraphEventListeners {
    [GraphEventType.LAYOUT_IN_PROGRESS]?: (() => void)[];
    [GraphEventType.LAYOUT_CHANGE]?: (() => void)[];
    [GraphEventType.PAN_CHANGE]?: (() => void)[];
    [GraphEventType.SELECTION_CHANGE]?: (() => void)[];
    [GraphEventType.CONTEXT_MENU_REQUEST]?: (() => void)[];
}

export function isLayoutConfig(nodePositionsOrLayoutConfig: PositionMap | LayoutConfig): boolean {
    return typeof (nodePositionsOrLayoutConfig as LayoutConfig).name === 'string';
}

function createLayoutConfigFromLayout(layout: Layout): LayoutConfig {
    return {
        name: 'preset',
        zoom: layout.zoom,
        pan: layout.pan
    };
}

function createRandomLayoutConfig(): LayoutConfig {
    return {
        name: 'random'
    };
}

export class CyGraph {

    private static readonly ZOOM_FACTOR = 1.5;
    protected static readonly DEFAULT_MIN_ZOOM = 0.1;
    protected static readonly DEFAULT_MAX_ZOOM = 100.0;

    private cy: Cy;
    private minZoom_: number = CyGraph.DEFAULT_MIN_ZOOM;
    private maxZoom_: number = CyGraph.DEFAULT_MAX_ZOOM;
    private zoomPercentage_: number;
    private nodePositions_: PositionMap;

    constructor(containerElement: any, graphData: GraphData, styleConfig: StyleConfig, nodePositions: PositionMap, layout?: Layout);
    constructor(containerElement: any, graphData: GraphData, styleConfig: StyleConfig, layoutConfig: LayoutConfig);

    constructor(
        private containerElement: any,
        private graphData: GraphData,
        private styleConfig: StyleConfig,
        nodePositionsOrLayoutConfig: PositionMap | LayoutConfig,
        layout?: Layout
    ) {
        let layoutConfig: LayoutConfig;
        let nodePositions: PositionMap;
        if (isLayoutConfig(nodePositionsOrLayoutConfig)) {
            layoutConfig = nodePositionsOrLayoutConfig as LayoutConfig;
            nodePositions = {};
        } else {
            layoutConfig = layout ? createLayoutConfigFromLayout(layout) : createRandomLayoutConfig();
            nodePositions = nodePositionsOrLayoutConfig as PositionMap;
        }
        this.initCy(nodePositions, layoutConfig, styleConfig);
    }

    set zoomPercentage(value: number) {
        this.zoomTo(Math.exp((Number(value) / 100) * Math.log(this.maxZoom / this.minZoom)) * this.minZoom);
    }

    get zoomPercentage(): number {
        return this.zoomPercentage_ !== undefined ? this.zoomPercentage_ : 50;
    }

    set zoom(value: number) {
        if (this.cy) {
            this.cy.zoom(value);
        }
    }

    get zoom(): number {
        return this.cy ? this.cy.zoom() : 1.0;
    }

    get pan(): Position {
        return this.cy ? this.cy.pan() : { x: 0.0, y: 0.0 };
    }

    get minZoom(): number {
        return this.minZoom_;
    }

    get maxZoom(): number {
        return this.maxZoom_;
    }

    get nodePositions(): PositionMap {
        return this.nodePositions_;
    }

    // init(graphData: GraphServiceData, styleInfo: StyleInfo, positionMap: PositionMap, layout?: Layout): void;
    // init(graphData: GraphServiceData, styleInfo: StyleInfo, layoutGenerator: LayoutGenerator): void;

    // init(graphData: GraphServiceData, styleInfo: StyleInfo, posMapOrLayoutGen: PositionMap | LayoutGenerator, layout?: Layout): void {
    //     this
    // }

    runLayout(layoutConfig: LayoutConfig, nodeIds: string[]): void {}

    zoomTo(zoom: number, position?: Position): void {
        const newZoom = Math.min(Math.max(zoom, this.minZoom), this.maxZoom);
        if (newZoom !== this.zoom) { // this.cy.zoom()) {
            // this.zoom = newZoom;
            this.cy.zoom({
                level: newZoom,
                renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 }
            });
            this.zoomPercentage_ = Math.round(
                (Math.log(this.zoom / this.minZoom) / Math.log(this.maxZoom / this.minZoom)) * 100
            );
        }
    }

    zoomIn(): void {
        this.zoomTo(this.zoom * CyGraph.ZOOM_FACTOR);
    }

    zoomOut(): void {
        this.zoomTo(this.zoom / CyGraph.ZOOM_FACTOR);
    }

    resetZoom(): void {}

    destroy(): void {
        this.cleanCy();
    }

    registerListener<GE extends keyof GraphEventListeners>(event: GE, listener: GraphEventListeners[GE][0]): void {}

    unregisterListener<GE extends keyof GraphEventListeners>(event: GE, listener: GraphEventListeners[GE][0]): void {}

    hoverEdges(edgeIds: string): void {}

    showGhostElements(nodeData: CyNodeData[], edgeData: CyEdgeData[]): void {}

    updateStyle(styleConfig: StyleConfig): void {}

    updateSelection(): void {}

    updateSize(): void {}

    batch(fun: () => void): void {}

    private cleanCy(): void {
        if (this.cy) {
            // this.edgeLabelOffsetUpdater.disconnect();
            this.cy.destroy();
            this.cy = null;
        }
    }

    private createNodes(nodesData: CyNodeData[], positions: PositionMap): CyNodeDef[] {
        return nodesData.map(nodeData => ({
            group: 'nodes',
            data: nodeData,
            selected: nodeData.selected,
            position: positions[nodeData.id]
        }));
    }

    private createEdges(edgesData: CyEdgeData[]): CyEdgeDef[] {
        return edgesData.map(edgeData => ({
            group: 'edges',
            data: edgeData,
            selected: edgeData.selected
        }));
    }

    protected createLayoutConfig(): void {}
    protected createCyConfig(): void {}

    private initCy(nodePositions: PositionMap, layoutConfig: LayoutConfig, styleConfig: StyleConfig): void {
        console.log('CyGraph.initCy entered ...');
        this.cleanCy();

        this.cy = cytoscape({
            container: this.containerElement,
            elements: {
                nodes: this.createNodes(this.graphData.nodeData, nodePositions),
                edges: this.createEdges(this.graphData.edgeData)
            },
            layout: layoutConfig,
            wheelSensitivity: 0.5
        });
    }
}
