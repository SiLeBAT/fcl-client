import { ContextMenuRequestInfo, SelectedGraphElements } from '../graph.model';
import { Layout, Position, PositionMap } from '../../data.model';
import { StyleConfig, CyStyle } from '../components/graph-view/cy-style';
import _ from 'lodash';
import { CyGraph, CyConfig, GraphData, LayoutConfig } from '../components/graph-view/cy-graph';
import {
    addCyContextMenuRequestListener, addCyZoomListener, addCyDragListener,
    addCyPanListeners, addCySelectionListener
} from '../components/graph-view/cy-listeners';

export enum GraphEventType {
    LAYOUT_CHANGE = 'LAYOUT_CHANGE',
    SELECTION_CHANGE = 'SELECTION_CHANGE',
    CONTEXT_MENU_REQUEST = 'CONTEXT_MENU_REQUEST'
}

const SELECTED_ELEMENTS_SELECTOR = ':selected';
const SELECTED_ELEMENTS_WITH_UNSELECTED_DATA_SELECTOR = ':selected[!selected]';
const UNSELECTED_ELEMENTS_WITH_SELECTED_DATA_SELECTOR = ':unselected[?selected]';
const SCRATCH_UPDATE_NAMESPACE = '_update';

export interface GraphDataChange {
    nodePositions?: PositionMap;
    layout?: Layout;
    selectedElements?: SelectedGraphElements;
}

export type GraphEventListener<T extends GraphEventType> =
    T extends GraphEventType.LAYOUT_CHANGE | GraphEventType.SELECTION_CHANGE ? () => void :
    T extends GraphEventType.CONTEXT_MENU_REQUEST ? (info: ContextMenuRequestInfo) => void :
    never;

export type GraphEventListeners<T extends GraphEventType> = Record<T, GraphEventListener<T>[]>;

export class InteractiveCyGraph extends CyGraph {

    private static readonly ZOOM_FACTOR = 1.5;

    private listeners: GraphEventListeners<GraphEventType>;

    constructor(
        htmlContainerElement: HTMLElement,
        graphData: GraphData,
        styleConfig: StyleConfig,
        layoutConfig?: LayoutConfig,
        cyConfig?: CyConfig
    ) {
        // console.log('InteractiveCyGraph entered ...');
        super(htmlContainerElement, graphData, styleConfig, layoutConfig, cyConfig);
        // console.log('InteractiveCyGraph leaving ...');
        this.listeners = {
            [GraphEventType.LAYOUT_CHANGE]: [],
            [GraphEventType.SELECTION_CHANGE]: [],
            [GraphEventType.CONTEXT_MENU_REQUEST]: []
        };
    }

    zoomToPercentage(value: number): void {
        this.zoomTo(Math.exp((value / 100) * Math.log(this.maxZoom / this.minZoom)) * this.minZoom);
    }

    get zoomPercentage(): number {
        // console.log('InteractiveCyGraph.zoomPercentage get entered ...');
        return Math.round(
            (Math.log(this.zoom / this.minZoom) / Math.log(this.maxZoom / this.minZoom)) * 100
        );
    }

    zoomIn(): void {
        this.zoomTo(this.zoom * InteractiveCyGraph.ZOOM_FACTOR);
    }

    zoomOut(): void {
        this.zoomTo(this.zoom / InteractiveCyGraph.ZOOM_FACTOR);
    }

    zoomFit(): void {
        this.cy.fit();
    }

    registerListener<T extends GraphEventType>(event: T, listener: GraphEventListener<T>): void {
        this.listeners[event].push(listener);
    }

    unregisterListener<T extends GraphEventType>(event: T, listener: GraphEventListener<T>): void {
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }

    updateSize(): void {
        this.cy.resize();
    }

    protected getNextFeasibleZoom(zoom: number): number {
        return Math.min(Math.max(zoom, this.minZoom), this.maxZoom);
    }

    protected zoomTo(zoom: number, position?: Position): void {
        // console.log('InteractiveCyGraph.zoomTo entered ...');

        const newZoom = this.getNextFeasibleZoom(zoom);
        position = position ? position : { x: this.cy.width() / 2, y: this.cy.height() / 2 };

        this.cy.zoom({
            level: newZoom,
            renderedPosition: position
        });
        // console.log('InteractiveCyGraph.zoomTo leaving ...');
    }

    protected initCy(
        htmlContainerElement: HTMLElement | undefined,
        layoutConfig: LayoutConfig | undefined,
        cyConfig: CyConfig | undefined
    ): void {
        // console.log('InteractiveCyGraph.initCy entered ...');
        super.initCy(htmlContainerElement, layoutConfig, cyConfig);
        this.registerCyListeners();
    }

    protected registerCyListeners(): void {
        if (this.cy.container()) {
            addCySelectionListener(this.cy, () => this.onSelectionChanged());
            addCyPanListeners(this.cy, () => this.onPanOrZoom(), () => this.onPanOrZoom());
            addCyZoomListener(this.cy, () => this.onPanOrZoom());
            addCyDragListener(this.cy, () => this.onDragEnd());
            addCyContextMenuRequestListener(
                this.cy,
                (info: ContextMenuRequestInfo) => this.onContextMenuRequest(info)
            );
        }
    }

    protected onLayoutChanged(): void {
        this.listeners.LAYOUT_CHANGE.forEach((l: GraphEventListener<GraphEventType.LAYOUT_CHANGE>) => l());
    }

    protected applyGraphDataChangeBottomUp(dataChange: GraphDataChange): void {
        // console.log('InteractiveCyGraph.applyGraphDataChangeBottomUp entered ...');
        super.setGraphData({
            ...super.data,
            ...dataChange
        });
        // console.log('InteractiveCyGraph.applyGraphDataChangeBottomUp leaving ...');
    }

    private onDragEnd(): void {
        // console.log('InteractiveCyGraph.onDragEnd entered ...');
        this.applyGraphDataChangeBottomUp({ nodePositions: this.extractNodePositionsFromGraph() });
        this.onLayoutChanged();
        // console.log('InteractiveCyGraph.onDragEnd leaving ...');
    }

    protected onSelectionChanged(): void {
        // console.log('InteractiveCyGraph.onSelectionChanged entered ...');
        this.applyGraphDataChangeBottomUp({
            selectedElements: {
                nodes: this.cy.nodes(SELECTED_ELEMENTS_SELECTOR).map(n => n.id()),
                edges: this.cy.edges(SELECTED_ELEMENTS_SELECTOR).map(e => e.id())
            }
        });

        this.listeners.SELECTION_CHANGE.forEach((l: GraphEventListener<GraphEventType.SELECTION_CHANGE>) => l());
        // console.log('InteractiveCyGraph.onSelectionChanged leaving ...');
    }

    private onPanOrZoom(): void {
        // console.log('InteractiveCyGraph.onPanOrZoom entered ...');
        if (
            this.cy.zoom() !== super.layout.zoom ||
            !_.isEqual(this.cy.pan(), super.layout.pan
        )) {
            this.applyGraphDataChangeBottomUp({
                layout: {
                    zoom: this.cy.zoom(),
                    pan: { ...this.cy.pan() }
                }
            });
            this.onLayoutChanged();
        }
        // console.log('InteractiveCyGraph.onPanOrZoom leaving ...');
    }

    private onContextMenuRequest(info: ContextMenuRequestInfo): void {
        // console.log('InteractiveCyGraph.onContextMenuRequest entered ...');
        this.listeners.CONTEXT_MENU_REQUEST.forEach(l => l(info));
        // console.log('InteractiveCyGraph.onContextMenuRequest leaving ...');
    }

    private updateNodes(): void {
        // console.log('InteractiveCyGraph.updateNodes entered ...');
        this.cy.elements().remove();
        this.cy.add(this.createNodes(super.data.nodeData, super.data.nodePositions));
        this.cy.add(this.createEdges(super.data.edgeData));
    }

    private updateEdges(): void {
        // console.log('InteractiveCyGraph.updateEdges entered ...');
        this.cy.edges().remove();
        this.cy.add(this.createEdges(super.data.edgeData));
    }

    private updateStyle(): void {
        // console.log('InteractiveCyGraph.updateStyle entered ...');
        this.cy.setStyle(new CyStyle(super.data, super.style).createCyStyle());
    }

    private updateSelection(): void {
        // console.log('InteractiveCyGraph.updateSelection entered ...');
        this.cy.elements(SELECTED_ELEMENTS_WITH_UNSELECTED_DATA_SELECTOR).unselect();
        this.cy.elements(UNSELECTED_ELEMENTS_WITH_SELECTED_DATA_SELECTOR).select();
    }

    private updateNodePositions(): void {
        // console.log('InteractiveCyGraph.updateNodePositions entered ...');
        this.cy.nodes().positions((n) => super.nodePositions[n.id()]);
    }

    private updateLayout(): void {
        // console.log('InteractiveCyGraph.updateLayout entered ...');
        this.cy.zoom(super.zoom);
        this.cy.pan({ ...super.pan });
        // console.log('InteractiveCyGraph.updateLayout leaving ...');
    }

    updateGraph(graphData: GraphData, styleConfig: StyleConfig): void {
        // console.log('InteractiveCyGraph.updateGraph entered ...');
        const oldData = super.data;
        const oldStyle = super.style;
        super.setGraphData(graphData);
        super.setStyleConfig(styleConfig);
        const updateNodes = oldData.nodeData !== graphData.nodeData;
        const updateEdges = !updateNodes && oldData.edgeData !== graphData.edgeData;
        const updateStyle = updateNodes || oldStyle !== styleConfig || oldData.propsChangedFlag !== graphData.propsChangedFlag;
        const updateSelection = !updateNodes && oldData.selectedElements !== graphData.selectedElements;
        const updateNodePositions = !updateNodes && oldData.nodePositions !== graphData.nodePositions;
        const updateLayout = !_.isEqual(oldData.layout, graphData.layout);
        const updateEdgeLabel = !updateNodes && !updateEdges && oldData.edgeLabelChangedFlag !== graphData.edgeLabelChangedFlag;
        const scratchEdges = updateNodes || updateEdges || updateStyle || updateEdgeLabel || updateSelection;
        const scratchNodes = updateNodes || updateStyle || updateSelection;

        if (
            updateNodes || updateEdges || updateStyle || updateSelection ||
            updateNodes || updateLayout || updateEdgeLabel
        ) {

            this.cy.batch(() => {
                if (updateNodes) {
                    this.updateNodes();
                }
                if (updateEdges) {
                    this.updateEdges();
                }
                if (updateNodePositions) {
                    this.updateNodePositions();
                }
                if (updateLayout) {
                    this.updateLayout();
                }
                if (updateSelection) {
                    this.updateSelection();
                }
                if (updateStyle) {
                    this.updateStyle();
                }

                if (scratchNodes && scratchEdges) {
                    // console.log('scratching elements ...');
                    this.cy.elements().scratch(SCRATCH_UPDATE_NAMESPACE, true);
                } else if (scratchEdges) {
                    // console.log('scratching edges ...');
                    this.cy.edges().scratch(SCRATCH_UPDATE_NAMESPACE, true);
                }
            });

            if (updateNodePositions || updateNodes || updateEdges || scratchEdges) {
                this.edgeLabelOffsetUpdater.update(true);
            }
        } else {
            // console.log('InteractiveCyGraph.updateGraph - no update required.');
        }

        // console.log('InteractiveCyGraph.updateGraph leaving ...');
    }
}
