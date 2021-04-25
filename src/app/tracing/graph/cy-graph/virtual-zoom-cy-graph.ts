import { Layout, Position, Size, Range, PositionMap } from '../../data.model';
import { StyleConfig } from './cy-style';
import { getEnclosingRectFromPoints } from '@app/tracing/util/geometry-utils';
import { getPositionBasedFitViewPort } from './position-based-viewport-fitting';
import { GraphDataChange, InteractiveCyGraph } from './interactive-cy-graph';
import { GraphData, CyConfig, LayoutConfig, isPresetLayoutConfig } from './cy-graph';
import { addCustomZoomAdapter } from './cy-adapter';
import {
    createMargin, getActivePositions, getAvailableSpace, getExtendedTargetIncludingViewPort,
    getZoomedGraphData, getZoomedNodePositions} from './virtual-zoom-utils';
import { CY_MAX_ZOOM, CY_MIN_ZOOM } from './cy.constants';
import { CyNodeCollection, NodeId } from '../graph.model';
import _ from 'lodash';

const DEFAULT_VIEWPORT = {
    zoom: 1,
    pan: {
        x: 0,
        y: 0
    }
};

function correctZoomLimit(zoomLimit: number): number {
    return Math.min(CY_MAX_ZOOM, Math.max(CY_MIN_ZOOM, zoomLimit));
}

export class VirtualZoomCyGraph extends InteractiveCyGraph {

    private static readonly ZOOM_FIT_MARGIN = 10;

    private cachedGraphData: GraphData;
    private zoomLimits: Range;

    constructor(
        htmlContainerElement: HTMLElement,
        graphData: GraphData,
        styleConfig: StyleConfig,
        layoutConfig: LayoutConfig,
        cyConfig?: CyConfig
    ) {
        const isPresetLayout = isPresetLayoutConfig(layoutConfig);
        const fitViewPort = !isPresetLayout || layoutConfig.fit !== false;

        cyConfig = cyConfig || {};
        const zoomLimits = {
            min: cyConfig.minZoom === undefined ? VirtualZoomCyGraph.DEFAULT_MIN_ZOOM : correctZoomLimit(cyConfig.minZoom),
            max: cyConfig.maxZoom === undefined ? VirtualZoomCyGraph.DEFAULT_MAX_ZOOM : correctZoomLimit(cyConfig.maxZoom)
        };

        const superLayoutConfig: LayoutConfig = {
            ...layoutConfig,
            fit: false
        };

        if (isPresetLayout && fitViewPort) {
            const availableSpace = getAvailableSpace(htmlContainerElement);
            const positionBasedFitViewPort = getPositionBasedFitViewPort(
                getActivePositions(graphData),
                availableSpace,
                zoomLimits,
                DEFAULT_VIEWPORT
            );

            graphData = {
                ...graphData,
                layout: positionBasedFitViewPort
            };
            layoutConfig.pan = positionBasedFitViewPort.pan;
            layoutConfig.zoom = positionBasedFitViewPort.zoom;
        }

        if (graphData.layout === null) {
            graphData = {
                ...graphData,
                layout: DEFAULT_VIEWPORT
            };
        }

        const superGraphData = getZoomedGraphData(graphData);

        const superCyConfig: CyConfig = {
            ...cyConfig,
            zoomingEnabled: false,
            minZoom: 1,
            maxZoom: 1
        };

        super(
            htmlContainerElement,
            superGraphData,
            styleConfig,
            superLayoutConfig,
            superCyConfig
        );

        this.cachedGraphData = graphData;
        this.zoomLimits = zoomLimits;
        if (!isPresetLayout) {
            this.cachedGraphData = {
                ...this.cachedGraphData,
                layout: {
                    zoom: super.data.layout.zoom,
                    pan: { ...super.data.layout.pan }
                },
                nodePositions: { ...super.data.nodePositions }
            };

            this.zoomFit();
        } else if (fitViewPort) {
            this.fitZoomFromCurrentLayout();
        }
        if (this.cy.container()) {
            addCustomZoomAdapter(this.cy, () => this.zoom, (zoom, position) => this.zoomTo(zoom, position));
        }
    }

    protected getAvailableSpace(): Size {
        return {
            width: this.cy.width(),
            height: this.cy.height()
        };
    }

    protected get zoomFitMargin(): number {
        return VirtualZoomCyGraph.ZOOM_FIT_MARGIN;
    }

    get zoom(): number {
        return this.cachedGraphData.layout.zoom;
    }

    get minZoom(): number {
        return this.zoomLimits.min;
    }

    get maxZoom(): number {
        return this.zoomLimits.max;
    }

    get data(): GraphData {
        return this.cachedGraphData;
    }

    get nodePositions(): PositionMap {
        return this.cachedGraphData.nodePositions;
    }

    get layout(): Layout {
        return this.cachedGraphData.layout;
    }

    protected setViewPort(viewport: Layout): void {
        const oldZoom = this.zoom;

        this.cachedGraphData = {
            ...this.cachedGraphData,
            layout: viewport
        };

        const zoomedGraphData: GraphData = {
            ...this.cachedGraphData,
            layout: {
                zoom: 1,
                pan: viewport.pan
            },
            nodePositions:
                viewport.zoom === oldZoom || this.cachedGraphData.nodePositions === undefined ?
                super.nodePositions :
                getZoomedNodePositions(
                    this.cachedGraphData.nodeData,
                    this.cachedGraphData.nodePositions,
                    viewport.zoom
                )
        };

        super.updateGraph(zoomedGraphData, this.style);
    }

    protected fitZoomFromCurrentLayout(): void {
        if (this.cachedGraphData.nodeData.length > 0) {

            const rendNodePosEnclosingBBox = getEnclosingRectFromPoints(
                getActivePositions(this.cachedGraphData)
                    .map(p => ({ x: p.x * this.zoom + this.pan.x, y: p.y * this.zoom + this.pan.y }))
            );

            const availableSpace = this.getAvailableSpace();

            // reset the viewport so that the rendered graph fits and is centered
            const graphBBox = this.cy.elements().renderedBoundingBox();

            const margin = {
                left: rendNodePosEnclosingBBox.left - graphBBox.x1,
                right: graphBBox.x2 - rendNodePosEnclosingBBox.right,
                top: rendNodePosEnclosingBBox.top - graphBBox.y1,
                bottom: graphBBox.y2 - rendNodePosEnclosingBBox.bottom
            };
            const hMargin = margin.left + margin.right;
            const vMargin = margin.top + margin.bottom;

            const newZoom = this.getNextFeasibleZoom(
                Math.min(
                    (availableSpace.width - hMargin) / (graphBBox.w - hMargin + 2 * this.zoomFitMargin),
                    (availableSpace.height - vMargin) / (graphBBox.h - vMargin + 2 * this.zoomFitMargin)
                ) * this.zoom
            );

            const renderedNodePosCenter = {
                x: (rendNodePosEnclosingBBox.left + rendNodePosEnclosingBBox.right) / 2,
                y: (rendNodePosEnclosingBBox.top + rendNodePosEnclosingBBox.bottom) / 2
            };

            const avSpaceWoMarginsCenter = {
                x: (margin.left + availableSpace.width - margin.right) / 2,
                y: (margin.top + availableSpace.height - margin.bottom) / 2
            };

            const modelGraphCenter = {
                x: (renderedNodePosCenter.x - this.pan.x) / this.zoom,
                y: (renderedNodePosCenter.y - this.pan.y) / this.zoom
            };

            const newPan = {
                x: avSpaceWoMarginsCenter.x - modelGraphCenter.x * newZoom,
                y: avSpaceWoMarginsCenter.y - modelGraphCenter.y * newZoom
            };

            const newViewPort = {
                zoom: newZoom,
                pan: newPan
            };

            this.setViewPort(newViewPort);
        }
    }

    zoomFit(): void {
        if (this.cachedGraphData.nodeData.length > 0) {

            const availableSpace = this.getAvailableSpace();

            // Approximate initial viewport based on node positions only
            // The Approximation is used as first upper bound on a fitting zoom
            const posBasedFitViewPort = getPositionBasedFitViewPort(
                getActivePositions(this.cachedGraphData),
                availableSpace,
                { min: this.minZoom, max: this.maxZoom },
                { ...this.cachedGraphData.layout }
            );
            posBasedFitViewPort.zoom = this.getNextFeasibleZoom(posBasedFitViewPort.zoom);

            const graphBB = this.cy.elements().renderedBoundingBox();

            if (
                posBasedFitViewPort.zoom < this.zoom || // to much zoomed in
                (
                    graphBB.w < availableSpace.width &&
                    graphBB.h < availableSpace.height // to much zoomed out
                )
            ) {
                // the current zoom is not sufficient for viewport prediction
                // apply the position based viewport
                this.setViewPort(posBasedFitViewPort);
            }

            // the viewport will be fitted based on the rendered graph
            this.fitZoomFromCurrentLayout();

            this.onLayoutChanged();
        }
    }

    protected zoomTo(zoom: number, position?: Position): void {
        const oldZoom = this.zoom;
        const oldPan = this.pan;
        const newZoom = this.getNextFeasibleZoom(zoom);

        position = position ? position : { x: this.cy.width() / 2, y: this.cy.height() / 2 };

        const newPan = {
            x: position.x - ((position.x - oldPan.x) * newZoom) / oldZoom,
            y: position.y - ((position.y - oldPan.y) * newZoom) / oldZoom
        };

        if (newZoom !== this.zoom || newPan.x !== oldPan.x || newPan.y !== oldPan.y) {
            this.setViewPort({ zoom: newZoom, pan: newPan });

            this.onLayoutChanged();
        }
    }

    protected startLayouting(layoutConfig: LayoutConfig, nodesToLayout: NodeId[]): null | (() => void) {
        if (layoutConfig.animate) {
            this.cy.minZoom(this.zoomLimits.min);
            this.cy.maxZoom(this.zoomLimits.max);
            this.cy.zoomingEnabled(true);
        } else {
            layoutConfig.fit = false;
        }

        return super.startLayouting(layoutConfig, nodesToLayout);
    }

    protected postProcessLayout(layoutedNodes: NodeId[]): void {
        const viewportBeforeLayout = this.cachedGraphData.layout;

        if (this.cy.zoom() !== 1) {
            this.ignorePanOrZoomEvents = true;
            this.cy.zoom(1);
            this.edgeLabelOffsetUpdater.update(true);
            this.ignorePanOrZoomEvents = false;
        }
        if (this.cy.zoomingEnabled()) {
            this.cy.minZoom(1);
            this.cy.maxZoom(1);
            this.cy.zoomingEnabled(false);
        }
        const nodePositions = this.extractNodePositionsFromGraph();
        super.setGraphData({
            ...super.data,
            nodePositions: nodePositions,
            layout: {
                pan: { ...this.cy.pan() },
                zoom: this.cy.zoom()
            }
        });
        const wereAllNodesLayouted = layoutedNodes.length === this.cachedGraphData.nodeData.length;
        const newZoom = wereAllNodesLayouted ? 1 : this.cachedGraphData.layout.zoom;
        this.cachedGraphData = {
            ...this.cachedGraphData,
            nodePositions: getZoomedNodePositions(
                this.cachedGraphData.nodeData,
                nodePositions,
                1 / newZoom
            ),
            layout: {
                zoom: newZoom,
                pan: { ...super.data.layout.pan }
            }
        };
        if (wereAllNodesLayouted) {
            this.zoomFit();
        } else {
            this.extendViewportToIncludeSubgraph(viewportBeforeLayout, layoutedNodes);
            this.onLayoutChanged();
        }
    }

    private extendViewportToIncludeSubgraph(viewportBeforeLayouting: Layout, layoutedNodes: NodeId[]): void {
        const cyNodes = this.getNodeContext(layoutedNodes) as CyNodeCollection;
        const cyElements = cyNodes.union(cyNodes.edgesWith(cyNodes));
        const subGraphPosModelRect = getEnclosingRectFromPoints(layoutedNodes.map(nodeId => this.cachedGraphData.nodePositions[nodeId]));
        const subGraphBoundingRect = cyElements.renderedBoundingBox();
        const subGraphPosRenderRect = getEnclosingRectFromPoints(cyNodes.map(node => node.renderedPosition()));
        const subGraphMargin = {
            top: subGraphPosRenderRect.top - subGraphBoundingRect.y1,
            right: subGraphBoundingRect.x2 - subGraphPosRenderRect.right,
            bottom: subGraphBoundingRect.y2 - subGraphPosRenderRect.bottom,
            left: subGraphPosRenderRect.left - subGraphBoundingRect.x1
        };
        const newViewPort = getExtendedTargetIncludingViewPort(
            viewportBeforeLayouting,
            this.getAvailableSpace(),
            createMargin(VirtualZoomCyGraph.ZOOM_FIT_MARGIN),
            subGraphPosModelRect,
            subGraphMargin,
            this.zoomLimits.min
        );

        if (!_.isEqual(this.cachedGraphData.layout, newViewPort)) {
            this.setViewPort(newViewPort);
        }
    }

    updateGraph(graphData: GraphData, styleConfig: StyleConfig): void {
        const oldGraphData = this.cachedGraphData;
        this.cachedGraphData = graphData;

        const zoomChanged = graphData.layout.zoom !== oldGraphData.layout.zoom;
        const superNodePositions =
            zoomChanged || graphData.nodePositions !== oldGraphData.nodePositions ?
            getZoomedNodePositions(graphData.nodeData, graphData.nodePositions, graphData.layout.zoom) :
            super.data.nodePositions;

        let superGhostPositions: PositionMap | null = null;
        if (graphData.ghostData) {
            superGhostPositions =
                zoomChanged ||
                oldGraphData.ghostData === null ||
                oldGraphData.ghostData.posMap !== graphData.ghostData.posMap ?
                getZoomedNodePositions(graphData.ghostData.nodeData, graphData.ghostData.posMap, graphData.layout.zoom) :
                super.data.ghostData.posMap;
        }

        super.updateGraph({
            ...graphData,
            nodePositions: superNodePositions,
            layout: {
                zoom: 1,
                pan: graphData.layout.pan
            },
            ghostData: graphData.ghostData === null ?
                null :
                {
                    ...graphData.ghostData,
                    posMap: superGhostPositions
                }
        }, styleConfig);
    }

    protected applyGraphDataChangeBottomUp(graphDataChange: GraphDataChange): void {
        super.applyGraphDataChangeBottomUp(graphDataChange);
        this.cachedGraphData = { ...this.cachedGraphData };
        if (graphDataChange.layout) {
            this.cachedGraphData.layout = {
                zoom: this.cachedGraphData.layout.zoom,
                pan: super.pan
            };
        }
        if (graphDataChange.nodePositions) {
            this.cachedGraphData.nodePositions = getZoomedNodePositions(this.data.nodeData, super.nodePositions, 1 / this.zoom);
        }
        if (graphDataChange.selectedElements) {
            this.cachedGraphData.selectedElements = super.selectedElements;
        }
    }
}
