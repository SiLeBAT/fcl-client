import { Layout, PositionMap } from '../../data.model';
import { StyleConfig } from './cy-style';
import { GraphDataChange } from './interactive-cy-graph';
import { GraphData, CyConfig, LayoutConfig, isPresetLayoutConfig } from './cy-graph';
import _ from 'lodash';
import { VirtualZoomCyGraph } from './virtual-zoom-cy-graph';
import { getGraphDataWithReducedOverlay, getNonOverlayPositions } from './avoid-overlay-utils';
import * as assert from 'assert';

export class AvoidOverlayCyGraph extends VirtualZoomCyGraph {

    private graphData_: GraphData;
    private avoidOverlay: boolean;

    constructor(
        htmlContainerElement: HTMLElement,
        graphData: GraphData,
        styleConfig: StyleConfig,
        layoutConfig: LayoutConfig,
        cyConfig?: CyConfig
    ) {
        assert(isPresetLayoutConfig(layoutConfig), 'Non Preset Layout Config cannot be used with AvoidOverlayCyGraph.');
        assert(cyConfig.autoungrabify === true, 'AvoidOverlayGraph can only be used with autoungrabify on');

        const refZoom = layoutConfig.zoom === undefined ? 1 : layoutConfig.zoom;
        const fitViewPort = layoutConfig.fit !== false;

        // if the viewport is not known apriori (viewport is going to be fitted)
        // the supere node positions will be refined after super initialisation
        let superGraphData = (
            fitViewPort ?
            { ...graphData } :
            getGraphDataWithReducedOverlay(
                graphData,
                styleConfig.nodeSize,
                refZoom
            )
        );

        super(
            htmlContainerElement,
            superGraphData,
            styleConfig,
            layoutConfig,
            cyConfig
        );
        assert(super.data.layout !== null, 'VirtualZoomCyGraph.data.layout = null');

        this.graphData_ = {
            ...graphData,
            layout: super.layout
        };

        if (fitViewPort) {
            // super node positions have not been refined so far
            // refine super node positions to avoid overlay
            superGraphData = getGraphDataWithReducedOverlay(
                this.graphData_,
                styleConfig.nodeSize,
                this.graphData_.layout.zoom
            );
            super.updateGraph(superGraphData, this.style);
        }
        this.avoidOverlay = true;
    }

    protected get zoomFitMargin(): number {
        return super.zoomFitMargin + this.style.nodeSize;
    }

    get data(): GraphData {
        return this.graphData_;
    }

    get nodePositions(): PositionMap {
        return this.graphData_.nodePositions;
    }

    zoomFit(): void {
        if (this.avoidOverlay) {
            this.avoidOverlay = false;
            // zoomFitting reqires untreatet nodePositions
            let superGraphData = { ...this.graphData_ };

            super.updateGraph(superGraphData, this.style);
            super.zoomFit();
            // refine super node positions again to avoid overlay
            this.graphData_.layout = super.layout;
            superGraphData = getGraphDataWithReducedOverlay(
                this.graphData_,
                this.style.nodeSize,
                this.graphData_.layout.zoom
            );
            super.updateGraph(superGraphData, this.style);
            this.avoidOverlay = true;
        } else {
            super.zoomFit();
        }
    }

    protected setViewPort(viewport: Layout): void {
        if (this.avoidOverlay) {
            const graphData = {
                ...this.graphData_,
                layout: viewport
            };
            this.updateGraph_(graphData, this.style);
        } else {
            super.setViewPort(viewport);
        }
    }

    updateGraph(graphData: GraphData, styleConfig: StyleConfig): void {
        this.updateGraph_(graphData, styleConfig);
    }

    private updateGraph_(graphData: GraphData, styleConfig: StyleConfig): void {
        const oldGraphData = this.graphData_;
        this.graphData_ = graphData;

        const zoomChanged = graphData.layout.zoom !== oldGraphData.layout.zoom;
        const nodeSizeChanged = styleConfig.nodeSize !== this.style.nodeSize;
        const posChanged = graphData.nodePositions !== oldGraphData.nodePositions;

        const nodePositions =
            zoomChanged || nodeSizeChanged || posChanged ?
            getNonOverlayPositions(
                graphData.nodeData,
                graphData.nodePositions,
                styleConfig.nodeSize,
                graphData.layout.zoom
            ) :
            super.data.nodePositions;

        let ghostPositions: PositionMap | null = null;
        if (graphData.ghostData) {
            const ghostPosChanged = (
                oldGraphData.ghostData === null ||
                oldGraphData.ghostData.posMap !== graphData.ghostData.posMap
            );
            ghostPositions =
                zoomChanged || nodeSizeChanged || ghostPosChanged ?
                getNonOverlayPositions(
                    graphData.ghostData.nodeData,
                    graphData.ghostData.posMap,
                    styleConfig.nodeSize,
                    graphData.layout.zoom
                ) :
                super.data.ghostData.posMap;
        }

        super.updateGraph({
            ...graphData,
            nodePositions: nodePositions,
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
        this.graphData_ = { ...this.graphData_ };
        if (graphDataChange.layout) {
            this.graphData_.layout = {
                zoom: this.graphData_.layout.zoom,
                pan: super.pan
            };
        }
        if (graphDataChange.selectedElements) {
            this.graphData_.selectedElements = super.selectedElements;
        }
    }
}
