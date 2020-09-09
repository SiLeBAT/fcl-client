import { CyNodeData, CyEdgeData, Cy, CyNodeDef, CyEdgeDef } from '../../graph.model';
import { Layout, Position, PositionMap, Size } from '../../../data.model';
import { ElementRef } from '@angular/core';
import cytoscape from 'cytoscape';
import * as CyListeners from './cy-listeners';
import { StyleConfig, CyStyle } from './cy-style';
import { Utils } from '@app/tracing/util/non-ui-utils';

interface CyConfig {

}

export interface LayoutConfig {
    name: string;
    zoom?: number;
    pan?: Position;
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
interface GraphEventListeners {
    [GraphEventType.LAYOUT_IN_PROGRESS]: (() => void)[];
    [GraphEventType.LAYOUT_CHANGE]: (() => void)[];
    [GraphEventType.PAN_CHANGE]: (() => void)[];
    [GraphEventType.SELECTION_CHANGE]: (() => void)[];
    [GraphEventType.CONTEXT_MENU_REQUEST]: (() => void)[];
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
    private listeners: GraphEventListeners = {
        [GraphEventType.LAYOUT_CHANGE]: [],
        [GraphEventType.SELECTION_CHANGE]: [],
        [GraphEventType.PAN_CHANGE]: [],
        [GraphEventType.CONTEXT_MENU_REQUEST]: [],
        [GraphEventType.LAYOUT_IN_PROGRESS]: []
    }

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
        this.cy.zoom(value);
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

    get layout(): Layout {
        return {
            zoom: this.zoom,
            pan: this.pan
        };
    }

    get style(): StyleConfig {
        return this.styleConfig;
    }

    get data(): GraphData {
        return this.graphData;
    }

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

    registerListener<GE extends keyof GraphEventListeners>(event: GE, listener: GraphEventListeners[GE][0]): void {
        this.listeners[event].push(listener);
    }

    unregisterListener<GE extends keyof GraphEventListeners>(event: GE, listener: GraphEventListeners[GE][0]): void {
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }

    hoverEdges(edgeIds: string): void {}

    showGhostElements(nodeData: CyNodeData[], edgeData: CyEdgeData[]): void {}

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

    protected createCyConfig(): {} {
        return {};
    }

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
            style: new CyStyle(this.graphData, this.styleConfig).createCyStyle(),
            wheelSensitivity: 0.5,
            ...this.createCyConfig()
        });

        if (this.containerElement) {
            this.registerCyListeners();
        }
    }

    protected registerCyListeners(): void {
        CyListeners.registerSelectionListener(this.cy, () => this.onSelectionChanged());
        CyListeners.registerPanListener(this.cy, () => this.onPanChanged(), () => this.onLayoutChanged());
        this.cy.on('zoom', () => this.onLayoutChanged());
    }

    protected onSelectionChanged(): void {
        this.graphData = {
            ...this.graphData,
            selectedElements: {
                nodeSel: Utils.createSimpleStringSet(this.cy.nodes(':selected').map(n => n.id())),
                edgeSel: Utils.createSimpleStringSet(this.cy.edges(':selected').map(e => e.id()))
            }
        };
        this.listeners.SELECTION_CHANGE.forEach(l => l());
    }

    protected onPanChanged(): void {
        this.listeners.PAN_CHANGE.forEach(l => l());
    }

    protected onLayoutChanged(): void {
        this.listeners.LAYOUT_CHANGE.forEach(l => l());
    }

    private updateNodes(): void {
        this.cy.batch(() => {
            this.cy.elements().remove();
            this.cy.add(this.createNodes(this.graphData.nodeData, this.graphData.nodePositions));
            this.cy.add(this.createEdges(this.graphData.edgeData));
            this.updateStyle();
        });
    }

    private updateEdges(): void {
        this.cy.batch(() => {
            this.cy.edges().remove();
            this.cy.add(this.createEdges(this.graphData.edgeData));
        });
    }

    private updateStyle(): void {
        this.cy.setStyle(new CyStyle(this.graphData, this.styleConfig).createCyStyle());
        this.cy.elements().scratch('_update', true);
    }

    private updateSelection(): void {
        this.cy.batch(() => {
            this.cy.elements(':selected[!selected]').unselect();
            this.cy.elements(':unselected[?selected]').select();
            this.cy.elements().scratch('_update', true);
        });
    }

    private updateEdgeLabels(): void {
        this.cy.edges().scratch('_update', true);
    }

    updateGraph(graphData: GraphData, styleConfig: StyleConfig): void {
        const oldData = this.graphData;
        const oldStyle = this.styleConfig;
        this.graphData = graphData;
        this.styleConfig = styleConfig;
        if (oldData.nodeData !== graphData.nodeData) {
            this.updateNodes();
        } else if (oldData.edgeData !== graphData.edgeData) {
            this.updateEdges();
        } else if (oldData.propsChangedFlag !== graphData.propsChangedFlag) {
            this.updateStyle();
        } else if (oldData.selectedElements !== graphData.selectedElements) {
            this.updateSelection();
        } else if (oldStyle !== styleConfig) {
            this.updateStyle();
        } else if (oldData.edgeLabelChangedFlag !== graphData.edgeLabelChangedFlag) {
            this.updateEdgeLabels();
        }
    }
}
