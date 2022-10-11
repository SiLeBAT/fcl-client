import {
    ContextMenuRequestInfo, Cy, CyEdge, CyEdgeCollection,
    CyEdgeDef, CyNode, CyNodeCollection, CyNodeDef,
    EdgeId, NodeId, SelectedGraphElements
} from '../graph.model';
import { Layout, Position, PositionMap } from '../../data.model';
import { StyleConfig, CyStyle } from './cy-style';
import _ from 'lodash';
import { CyGraph, CyConfig, GraphData, LayoutConfig, LayoutName } from './cy-graph';
import {
    addCyContextMenuRequestListener, addCyZoomListener, addCyDragListener,
    addCyPanListeners, addCySelectionListener
} from './cy-listeners';
import { Utils } from '@app/tracing/util/non-ui-utils';
import { getLayoutConfig } from './layouting-utils';
import {
    CSS_CLASS_HOVER,
    LAYOUT_BREADTH_FIRST, LAYOUT_CIRCLE, LAYOUT_CONCENTRIC, LAYOUT_CONSTRAINT_BASED, LAYOUT_DAG, LAYOUT_FARM_TO_FORK,
    LAYOUT_FRUCHTERMAN, LAYOUT_GRID, LAYOUT_RANDOM, LAYOUT_SPREAD
} from './cy.constants';
import { BoundaryRect, getDifference, getDistance, getRectCenter } from '@app/tracing/util/geometry-utils';
import { cropRect, getNonBlockedRect } from './shared-utils';

export enum GraphEventType {
    LAYOUT_CHANGE = 'LAYOUT_CHANGE',
    SELECTION_CHANGE = 'SELECTION_CHANGE',
    CONTEXT_MENU_REQUEST = 'CONTEXT_MENU_REQUEST'
}

const SELECTED_ELEMENTS_SELECTOR = ':selected';
const SELECTED_ELEMENTS_WITH_UNSELECTED_DATA_SELECTOR = ':selected[!selected]';
const UNSELECTED_ELEMENTS_WITH_SELECTED_DATA_SELECTOR = ':unselected[?selected]';
const SCRATCH_UPDATE_NAMESPACE = '_update';

export interface LayoutOption {
    name: LayoutName;
    disabled: boolean;
}
export interface GraphDataChange {
    nodePositions?: PositionMap;
    layout?: Layout;
    selectedElements?: SelectedGraphElements;
}

export type GraphEventListener<T extends GraphEventType> =
    T extends GraphEventType.LAYOUT_CHANGE ? () => void :
    T extends GraphEventType.SELECTION_CHANGE ? (shift: boolean) => void :
    T extends GraphEventType.CONTEXT_MENU_REQUEST ? (info: ContextMenuRequestInfo) => void :
    never;

export type GraphEventListeners<T extends GraphEventType> = Record<T, GraphEventListener<T>[]>;

interface NodeHProps {
    size: number;
    label: string;
    stopColors: string;
    shape: string;
    zindex: number;
    selected: boolean;
}

interface EdgeHProps {
    label: string;
    stopColors: string;
    zindex: number;
    selected: boolean;
}

interface HProps {
    nodeProps: NodeHProps[];
    edgeProps: EdgeHProps[];
    minNodeSize: number;
    maxNodeSize: number;
}

interface HPropsChange {
    nodeSizeLimitsChanged: boolean;
    edgePropsChanged: boolean;
    nodePropsChanged: boolean;
    edgeLabelChanged: boolean;
}

export class InteractiveCyGraph extends CyGraph {

    private static readonly ZOOM_FACTOR = 1.5;
    private static readonly MIN_RELAYOUTING_NODE_COUNT = 2;
    private static readonly POSITION_TOLERANCE = 1e-13;
    private static readonly GOLDEN_RATIO = 1 / 1.618033;

    private listeners: GraphEventListeners<GraphEventType>;
    protected ignorePanOrZoomEvents = false;

    private cachedHProps: HProps | null = null;

    constructor(
        htmlContainerElement: HTMLElement,
        graphData: GraphData,
        styleConfig: StyleConfig,
        layoutConfig: LayoutConfig,
        cyConfig?: CyConfig
    ) {
        super(htmlContainerElement, graphData, styleConfig, layoutConfig, cyConfig);
        this.listeners = {
            [GraphEventType.LAYOUT_CHANGE]: [],
            [GraphEventType.SELECTION_CHANGE]: [],
            [GraphEventType.CONTEXT_MENU_REQUEST]: []
        };
        this.cacheHProps(graphData);
    }

    zoomToPercentage(value: number): void {
        this.zoomTo(Math.exp((value / 100) * Math.log(this.maxZoom / this.minZoom)) * this.minZoom);
    }

    get zoomPercentage(): number {
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
        const newZoom = this.getNextFeasibleZoom(zoom);
        position = position ? position : { x: this.cy.width() / 2, y: this.cy.height() / 2 };

        this.cy.zoom({
            level: newZoom,
            renderedPosition: position
        });
    }

    protected initCy(
        htmlContainerElement: HTMLElement | undefined,
        layoutConfig: LayoutConfig,
        cyConfig: CyConfig | undefined
    ): void {
        super.initCy(htmlContainerElement, layoutConfig, cyConfig);
        this.registerCyListeners();
    }

    protected registerCyListeners(): void {
        if (this.cy.container()) {
            addCySelectionListener(this.cy, (shift: boolean) => this.onSelectionChanged(shift));
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
        super.setGraphData({
            ...super.data,
            ...dataChange
        });
    }

    private onDragEnd(): void {
        this.applyGraphDataChangeBottomUp({ nodePositions: this.extractNodePositionsFromGraph() });
        this.onLayoutChanged();
    }

    protected onSelectionChanged(shift: boolean): void {
        this.applyGraphDataChangeBottomUp({
            selectedElements: {
                nodes: this.cy.nodes(SELECTED_ELEMENTS_SELECTOR).map(n => n.id()),
                edges: this.cy.edges(SELECTED_ELEMENTS_SELECTOR).map(e => e.id())
            }
        });

        this.listeners.SELECTION_CHANGE.forEach((l: GraphEventListener<GraphEventType.SELECTION_CHANGE>) => l(shift));
    }

    private onPanOrZoom(): void {
        if (
            !this.ignorePanOrZoomEvents &&
            (
                this.cy.zoom() !== super.layout.zoom ||
                !_.isEqual(this.cy.pan(), super.layout.pan
                )
            )) {
            this.applyGraphDataChangeBottomUp({
                layout: {
                    zoom: this.cy.zoom(),
                    pan: { ...this.cy.pan() }
                }
            });
            this.onLayoutChanged();
        }
    }

    private onContextMenuRequest(info: ContextMenuRequestInfo): void {
        this.listeners.CONTEXT_MENU_REQUEST.forEach((l: GraphEventListener<GraphEventType.CONTEXT_MENU_REQUEST>) => l(info));
    }

    private updateNodes(): void {
        this.cy.elements().remove();
        this.cy.add(this.createNodes(super.data.nodeData, super.data.nodePositions));
        this.cy.add(this.createEdges(super.data.edgeData));
    }

    private updateEdges(): void {
        this.cy.edges().remove();
        this.cy.add(this.createEdges(super.data.edgeData));
    }

    private updateStyle(): void {
        this.cy.setStyle(new CyStyle(super.data, super.style).createCyStyle());
    }

    private updateSelection(): void {
        this.cy.elements(SELECTED_ELEMENTS_WITH_UNSELECTED_DATA_SELECTOR).unselect();
        this.cy.elements(UNSELECTED_ELEMENTS_WITH_SELECTED_DATA_SELECTOR).select();
    }

    private updateNodePositions(): void {
        this.cy.nodes().positions((n) => super.nodePositions[n.id()]);
    }

    private updateLayout(): void {
        this.cy.zoom(super.zoom);
        this.cy.pan({ ...super.pan });
    }

    private getParallelEdgesOfGhosts(): CyEdgeCollection {
        const edges = this.cy.edges('.ghost-element');
        return edges.parallelEdges().difference(edges);
    }

    private updateGhostElements(updateLabel: boolean) {
        if (updateLabel) {
            const edgesToUpdateBefore = this.getParallelEdgesOfGhosts();
            this.cy.batch(() => this.updateGhostElements(false));
            const edgesToUpdateAfter = this.cy.edges('.ghost-element').parallelEdges();
            this.edgeLabelOffsetUpdater.updateEdges(edgesToUpdateBefore.union(edgesToUpdateAfter));
        } else {
            this.removeGhostElements();
            this.addGhostElements();
        }
    }

    private addGhostElements() {
        if (super.data.ghostData !== null) {
            const ghostElements = this.createGhostElements();
            if (ghostElements.nodes.length > 0) {
                this.cy.add(ghostElements.nodes);
            }
            if (ghostElements.edges.length > 0) {
                this.cy.add(ghostElements.edges);
            }
        }
    }

    private removeGhostElements() {
        this.cy.remove('.ghost-element');
    }

    private createGhostElements(): { nodes: CyNodeDef[]; edges: CyEdgeDef[] } {
        const ghostNodes = this.createNodes(super.data.ghostData.nodeData, super.data.ghostData.posMap);
        ghostNodes.forEach(node => {
            node.selected = false;
            node.classes = 'ghost-element';
        });
        const ghostEdges = this.createEdges(super.data.ghostData.edgeData);
        ghostEdges.forEach(node => {
            node.selected = false;
            node.classes = 'top-center ghost-element';
        });

        return {
            nodes: ghostNodes,
            edges: ghostEdges
        };
    }

    private hoverEdges(edgeIds: EdgeId[]): void {
        const hoverEdge = Utils.createSimpleStringSet(edgeIds);

        this.cy.batch(() => {
            const notHoveredEdges = this.cy.edges().filter(e => !hoverEdge[e.id()]);
            const hoveredEdges = this.cy.edges().filter(e => !!hoverEdge[e.id()]);
            notHoveredEdges.removeClass(CSS_CLASS_HOVER);
            hoveredEdges.addClass(CSS_CLASS_HOVER);
        });
    }

    getLayoutOptions(nodesToLayout: NodeId[]): LayoutOption[] {
        const isNodeCountSufficient = nodesToLayout.length >= InteractiveCyGraph.MIN_RELAYOUTING_NODE_COUNT;
        const areAllNodesGoingToBeLayouted = nodesToLayout.length === super.data.nodeData.length;

        const knownLayoutManagerNames = [
            LAYOUT_FRUCHTERMAN, LAYOUT_FARM_TO_FORK, LAYOUT_CONSTRAINT_BASED, LAYOUT_RANDOM, LAYOUT_GRID, LAYOUT_CIRCLE, LAYOUT_CONCENTRIC,
            LAYOUT_BREADTH_FIRST, LAYOUT_SPREAD, LAYOUT_DAG
        ];
        const layoutManagersNotSupportingSubsets = [LAYOUT_FARM_TO_FORK, LAYOUT_SPREAD];

        return knownLayoutManagerNames.map(layoutManagerName => ({
            name: layoutManagerName,
            disabled: !isNodeCountSufficient ||
                (!areAllNodesGoingToBeLayouted && layoutManagersNotSupportingSubsets.indexOf(layoutManagerName) >= 0)
        }));
    }

    runLayout(layoutName: LayoutName, nodeIds: NodeId[]): null | (() => void) {
        if (nodeIds.length >= 2) {
            const layoutConfig: LayoutConfig = getLayoutConfig(layoutName);

            return this.startLayouting(layoutConfig, nodeIds);
        }
    }

    focusElement(elementId: NodeId | EdgeId): void {
        const cyElement = this.cy.getElementById(elementId);
        if (cyElement.isEdge()) {
            this.focusEdge(cyElement as CyEdge);
        } else if (cyElement.isNode()) {
            this.focusNode(cyElement as CyNode);
        }
    }

    protected focusEdge(cyEdge: CyEdge): void {
        // not implemented
    }

    private focusNode(cyNode: CyNode): void {
        const maxFocusRect = this.getMaxFocusRect();
        // const prefFocusRect = this.getPreferredFocusRect(maxSize);
        const focusPoint = getRectCenter(maxFocusRect);
        const refPoint = cyNode.renderedPosition();

        const panBy = getDifference(focusPoint, refPoint);
        if (panBy.x !== 0 || panBy.y !== 0) {
            this.cy.panBy(panBy);
        }
    }

    protected getPreferredFocusRect(maxFocusRect: BoundaryRect): BoundaryRect {
        const xMargin = (InteractiveCyGraph.GOLDEN_RATIO) * maxFocusRect.width / 2;
        const yMargin = (InteractiveCyGraph.GOLDEN_RATIO) * maxFocusRect.height / 2;
        return {
            left: maxFocusRect.left + xMargin,
            top: maxFocusRect.top + yMargin,
            right: maxFocusRect.right - xMargin,
            bottom: maxFocusRect.bottom - yMargin,
            width: maxFocusRect.width - 2 * xMargin,
            height: maxFocusRect.height - 2 * yMargin
        };
    }

    protected getMaxFocusRect(): BoundaryRect {
        const margin = this.style.fontSize;

        let rect = this.getNotBlockedSpace();
        rect = cropRect(rect, margin);
        return rect;
    }

    protected getEdgeLength(cyEdge: CyEdge): number {
        const mpt = cyEdge.renderedMidpoint();
        if (Number.isNaN(mpt.x)) {
            return 0;
        } else {
            const spt = cyEdge.renderedSourceEndpoint();
            const tpt = cyEdge.renderedTargetEndpoint();
            return getDistance(mpt, spt) + getDistance(mpt, tpt);
        }
    }

    private getNotBlockedSpace(): BoundaryRect {
        return getNonBlockedRect(this.cy.container(), 'fcl-right-sidenav');
    }

    protected getNodeContext(nodeIds: NodeId[]): Cy | CyNodeCollection {
        if (nodeIds.length === this.cy.nodes().size()) {
            return this.cy;
        } else {
            const nodeIdSet = Utils.createSimpleStringSet(nodeIds);
            return this.cy.nodes().filter((node) => nodeIdSet[node.id()]);
        }
    }

    protected startLayouting(layoutConfig: LayoutConfig, nodesToLayout: NodeId[]): null | (() => void) {
        const cyContext = this.getNodeContext(nodesToLayout);
        let isAsyncLayout = true;
        const stopFun = layoutConfig.stop;
        layoutConfig.stop = () => {
            isAsyncLayout = false;
            this.postProcessLayout(nodesToLayout);
            if (stopFun !== undefined) {
                stopFun();
            }
            this.ignorePanOrZoomEvents = false;
        };
        const layout = cyContext.layout(layoutConfig);

        this.ignorePanOrZoomEvents = true;

        layout.run();

        if (isAsyncLayout) {
            return () => layout.stop();
        } else {
            return null;
        }
    }

    protected postProcessLayout(layoutedNodes: NodeId[]): void {
        super.setGraphData({
            ...super.data,
            nodePositions: this.extractNodePositionsFromGraph(),
            layout: {
                pan: { ...this.cy.pan() },
                zoom: this.cy.zoom()
            }
        });
        this.edgeLabelOffsetUpdater.update(true);
        this.onLayoutChanged();
    }

    private cacheHProps(graphData: GraphData): void {
        const nodeSizes = graphData.nodeData.length === 0 ? [ 0 ] : graphData.nodeData.map(n => n.size);
        this.cachedHProps = {
            nodeProps: graphData.nodeData.map(n => ({
                stopColors: n.stopColors,
                label: n.label,
                zindex: n.zindex,
                size: n.size,
                shape: n.shape,
                selected: n.selected
            })),
            edgeProps: graphData.edgeData.map(e => ({
                stopColors: e.stopColors,
                label: e.label,
                zindex: e.zindex,
                selected: e.selected
            })),
            minNodeSize: Math.min(...nodeSizes),
            maxNodeSize: Math.max(...nodeSizes)
        };
    }

    private getHPropsChange(oldHProps: HProps, newHProps: HProps): HPropsChange {
        const edgeLabelChanged = !_.isEqual(
            oldHProps.edgeProps.map(e => e.label),
            newHProps.edgeProps.map(e => e.label)
        );
        return {
            nodeSizeLimitsChanged:
                oldHProps.maxNodeSize !== newHProps.maxNodeSize ||
                oldHProps.minNodeSize !== newHProps.minNodeSize,
            nodePropsChanged: !_.isEqual(oldHProps.nodeProps, newHProps.nodeProps),
            edgePropsChanged: edgeLabelChanged || !_.isEqual(oldHProps.edgeProps, newHProps.edgeProps),
            edgeLabelChanged: edgeLabelChanged
        };
    }

    updateGraph(graphData: GraphData, styleConfig: StyleConfig): void {
        const oldData = super.data;
        const oldStyle = super.style;
        super.setGraphData(graphData);
        super.setStyleConfig(styleConfig);
        const updateNodes = oldData.nodeData !== graphData.nodeData;
        const updateEdges = !updateNodes && oldData.edgeData !== graphData.edgeData;
        const updateCachedHProps = updateNodes || updateEdges || graphData.propsUpdatedFlag !== oldData.propsUpdatedFlag;

        let propChange: HPropsChange = {
            nodeSizeLimitsChanged: false,
            edgePropsChanged: false,
            edgeLabelChanged: false,
            nodePropsChanged: false
        };
        let updateStyle = !_.isEqual(oldStyle, styleConfig);
        if (updateCachedHProps) {
            const oldHProps = this.cachedHProps;
            this.cacheHProps(graphData);
            propChange = this.getHPropsChange(oldHProps, this.cachedHProps);
            if (propChange.nodeSizeLimitsChanged) {
                updateStyle = true;
            }
        }
        const updateSelection = !updateNodes && !_.isEqual(oldData.selectedElements, graphData.selectedElements);
        const updateNodePositions = !updateNodes && this.arePositionsDifferent(oldData, graphData);
        const updateLayout = !_.isEqual(oldData.layout, graphData.layout);
        const updateEdgeLabel = !updateNodes && !updateEdges && propChange.edgeLabelChanged;

        const scratchEdges = !updateNodes && !updateEdges && (
            updateStyle || updateEdgeLabel || updateSelection || propChange.edgePropsChanged
        );

        const scratchNodes = !updateNodes && (updateStyle || updateSelection || propChange.nodePropsChanged);

        const setAllEdgeLabelOffsets = updateNodePositions || updateNodes || updateEdges || scratchEdges || propChange.nodePropsChanged;
        const updateGhosts = oldData.ghostData !== graphData.ghostData;

        if (
            updateNodes || updateEdges || updateStyle || updateSelection ||
            updateNodes || updateLayout || updateEdgeLabel || updateNodePositions ||
            scratchNodes || scratchEdges ||
            (updateGhosts && setAllEdgeLabelOffsets)
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

                if (updateGhosts) {
                    this.updateGhostElements(false);
                }

                if (scratchNodes && scratchEdges) {
                    this.cy.elements().scratch(SCRATCH_UPDATE_NAMESPACE, true);
                } else if (scratchNodes) {
                    this.cy.nodes().scratch(SCRATCH_UPDATE_NAMESPACE, true);
                } else if (scratchEdges) {
                    this.cy.edges().scratch(SCRATCH_UPDATE_NAMESPACE, true);
                }
            });

            if (setAllEdgeLabelOffsets) {
                this.edgeLabelOffsetUpdater.update(true);
            }

        } else if (updateGhosts) {
            this.updateGhostElements(true);
        }

        if (oldData.hoverEdges !== graphData.hoverEdges) {
            this.hoverEdges(graphData.hoverEdges);
        }
    }

    private arePositionsDifferent(graphData1: GraphData, graphData2: GraphData): boolean {
        if (graphData1.nodePositions === graphData2.nodePositions) {
            return false;
        } else if (graphData1.nodeData !== graphData2.nodeData) {
            return true;
        } else {
            return graphData1.nodeData.some(n => {
                const pos1 = graphData1.nodePositions[n.id];
                const pos2 = graphData2.nodePositions[n.id];
                return this.getRelPosDiff(pos1, pos2) > InteractiveCyGraph.POSITION_TOLERANCE;
            });
        }
    }

    private getRelPosDiff(pos1: Position, pos2: Position): number {
        return Math.max(this.getRelNumberDiff(pos1.x, pos2.x), this.getRelNumberDiff(pos1.y, pos2.y));
    }

    private getRelNumberDiff(n1: number, n2: number): number {
        return n1 === n2 ? 0 : Math.abs(n1 - n2) / Math.max(Math.abs(n1), Math.abs(n2));
    }
}
