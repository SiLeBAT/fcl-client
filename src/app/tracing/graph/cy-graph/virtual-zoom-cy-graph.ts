import { Layout, Position, Size, Range, PositionMap } from '../../data.model';
import { StyleConfig } from './cy-style';
import { getEnclosingRectFromPoints } from '@app/tracing/util/geometry-utils';
import { getDenovoFitLayout } from './denovo-fit-layout-computation';
import { GraphDataChange, InteractiveCyGraph } from './interactive-cy-graph';
import { createLayoutConfigFromLayout, GraphData, CyConfig } from './cy-graph';
import { addCustomZoomAdapter } from './cy-adapter';
import { getActivePositions, getAvailableSpace, getZoomedGraphData, getZoomedNodePositions } from './virtual-zoom-utils';
import { CY_MAX_ZOOM, CY_MIN_ZOOM } from './cy.constants';

const DEFAULT_LAYOUT = {
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
        cyConfig?: CyConfig
    ) {
        const fitLayout = !graphData.layout;
        cyConfig = cyConfig || {};
        const zoomLimits = {
            min: cyConfig.minZoom === undefined ? VirtualZoomCyGraph.DEFAULT_MIN_ZOOM : correctZoomLimit(cyConfig.minZoom),
            max: cyConfig.maxZoom === undefined ? VirtualZoomCyGraph.DEFAULT_MAX_ZOOM : correctZoomLimit(cyConfig.maxZoom)
        };

        if (!graphData.layout) {
            const availableSpace = getAvailableSpace(htmlContainerElement);

            graphData = {
                ...graphData,
                layout: getDenovoFitLayout(
                    getActivePositions(graphData),
                    availableSpace,
                    zoomLimits,
                    DEFAULT_LAYOUT
                )
            };
        }

        const layoutConfig = createLayoutConfigFromLayout(graphData.layout);
        layoutConfig.fit = false;

        super(
            htmlContainerElement,
            getZoomedGraphData(graphData),
            styleConfig,
            undefined,
            {
                ...cyConfig,
                zoomingEnabled: false,
                minZoom: 1,
                maxZoom: 1
            }
        );
        this.cachedGraphData = graphData;
        this.zoomLimits = zoomLimits;
        if (fitLayout) {
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

    private setLayout(layout: Layout): void {
        const oldZoom = this.zoom;

        this.cachedGraphData = {
            ...this.cachedGraphData,
            layout: layout
        };

        const zoomedGraphData: GraphData = {
            ...this.cachedGraphData,
            layout: {
                zoom: 1,
                pan: layout.pan
            },
            nodePositions:
                layout.zoom === oldZoom || this.cachedGraphData.nodePositions === undefined ?
                super.nodePositions :
                getZoomedNodePositions(
                    this.cachedGraphData.nodeData,
                    this.cachedGraphData.nodePositions,
                    layout.zoom
                )
        };

        super.updateGraph(zoomedGraphData, this.style);
    }

    private fitZoomFromCurrentLayout(): void {
        if (this.cachedGraphData.nodeData.length > 0) {

            const rendNodePosEnclosingBBox = getEnclosingRectFromPoints(
                getActivePositions(this.cachedGraphData)
                    .map(p => ({ x: p.x * this.zoom + this.pan.x, y: p.y * this.zoom + this.pan.y }))
            );

            const availableSpace = this.getAvailableSpace();

            // reset the layout so that the rendered graph fits and is centered
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
                    (availableSpace.width - hMargin) / (graphBBox.w - hMargin + 2 * VirtualZoomCyGraph.ZOOM_FIT_MARGIN),
                    (availableSpace.height - vMargin) / (graphBBox.h - vMargin + 2 * VirtualZoomCyGraph.ZOOM_FIT_MARGIN)
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

            const newLayout = {
                zoom: newZoom,
                pan: newPan
            };

            this.setLayout(newLayout);
        }
    }

    zoomFit(): void {
        if (this.cachedGraphData.nodeData.length > 0) {

            const availableSpace = this.getAvailableSpace();

            // Approximate initial layout based on node positions only
            // The Approximation is used as first upper bound on a fitting zoom
            const posBasedFitLayout = getDenovoFitLayout(
                getActivePositions(this.cachedGraphData),
                availableSpace,
                { min: this.minZoom, max: this.maxZoom },
                { ...this.cachedGraphData.layout }
            );
            posBasedFitLayout.zoom = this.getNextFeasibleZoom(posBasedFitLayout.zoom);

            const graphBB = this.cy.elements().renderedBoundingBox();

            if (
                posBasedFitLayout.zoom < this.zoom || // to much zoomed in
                (
                    graphBB.w < availableSpace.width &&
                    graphBB.h < availableSpace.height // o much zoomed out
                )
            ) {
                // the current layout is not sufficient for layout prediction
                // apply the position based layout
                this.setLayout(posBasedFitLayout);
            }

            // the layout will be fitted based on the rendered graph
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
            this.setLayout({ zoom: newZoom, pan: newPan });

            this.onLayoutChanged();
        }
    }

    updateGraph(graphData: GraphData, styleConfig: StyleConfig): void {
        const oldGraphData = this.cachedGraphData;
        this.cachedGraphData = graphData;

        const zoomChanged = graphData.layout.zoom !== oldGraphData.layout.zoom;
        const nodePositions =
            zoomChanged || graphData.nodePositions !== oldGraphData.nodePositions ?
            getZoomedNodePositions(graphData.nodeData, graphData.nodePositions, graphData.layout.zoom) :
            super.data.nodePositions;

        let ghostPositions: PositionMap | null = null;
        if (graphData.ghostData) {
            ghostPositions =
                zoomChanged ||
                oldGraphData.ghostData === null ||
                oldGraphData.ghostData.posMap !== graphData.ghostData.posMap ?
                getZoomedNodePositions(graphData.ghostData.nodeData, graphData.ghostData.posMap, graphData.layout.zoom) :
                super.data.ghostData.posMap;
        }

        super.updateGraph({
            ...graphData,
            nodePositions: nodePositions,
            layout: {
                zoom: 1,
                pan: graphData.layout.pan
            },
            ghostData: graphData.ghostData === null ?
                null :
                {
                    ...graphData.ghostData,
                    posMap: ghostPositions
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