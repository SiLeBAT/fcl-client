import cytoscape from 'cytoscape';
import { GraphElementData } from '../graph.model';
import { CSS_CLASS_HOVER } from './cy.constants';

enum GraphSize {
    SMALL, LARGE, HUGE
}

export interface StyleConfig {
    nodeSize: number;
    fontSize: number;
}

export class CyStyle {
    private static readonly NODE_SIZE_TO_BORDER_WIDTH_FACTOR = 1 / 20;
    private static readonly NODE_SIZE_TO_EDGE_WIDTH_FACTOR = 1 / 20;
    private static readonly SELECTED_EDGE_WIDTH_FACTOR = 3;
    private static readonly META_NODE_BORDER_WIDTH_FACTOR = 2;
    private static readonly SELECTED_NODE_BORDER_WIDTH_FACTOR = 2;
    private static readonly CONTROL_POINT_STEP_SIZE_FACTOR = 4;
    private static readonly MAX_STATION_NUMBER_FOR_SMALL_GRAPHS = 1000;
    private static readonly MAX_DELIVERIES_NUMBER_FOR_SMALL_GRAPHS = 3000;
    private static readonly SIZE_ONE_SIZE_FACTOR = 2;
    private static readonly DEFAULT_ACTIVE_OVERLAY_OPACITY = 0.5;
    private static readonly DEFAULT_ACTIVE_OVERLAY_COLOR = 'rgb(0, 0, 255)';
    private static readonly DEFAULT_ACTIVE_OVERLAY_PADDING = 10;

    private maxSize: number;
    private minSize: number;

    constructor(private graphData: GraphElementData, private styleConfig: StyleConfig) {
        this.initSizeLimits();
    }

    private initSizeLimits(): void {
        const sizes = this.graphData.nodeData.map(n => n.size);
        this.minSize = sizes.length === 0 ? 0 : Math.min(...sizes);
        this.maxSize = sizes.length === 0 ? 0 : Math.max(...sizes);
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    createCyStyle(): {} {
        const graphSize = this.getProperGraphSize();
        return this.createXGraphStyle(graphSize);
    }

    private getProperGraphSize(): GraphSize {
        if (this.graphData.nodeData.length > CyStyle.MAX_STATION_NUMBER_FOR_SMALL_GRAPHS) {
            return GraphSize.HUGE;
        } else if (this.graphData.edgeData.length > CyStyle.MAX_DELIVERIES_NUMBER_FOR_SMALL_GRAPHS) {
            return GraphSize.LARGE;
        } else {
            return GraphSize.SMALL;
        }
    }

    private createNodeSizeStyle(): { height: string; width: string } {
        const nodeSizeMapString = this.createNodeSizeMapString();
        return {
            height: nodeSizeMapString,
            width: nodeSizeMapString
        };
    }

    private createXGraphStyle(graphSize: GraphSize): any {

        const fontSize = this.styleConfig.fontSize;
        const nodeSize = this.styleConfig.nodeSize;
        const edgeWidth = nodeSize * CyStyle.NODE_SIZE_TO_EDGE_WIDTH_FACTOR;
        const selectedEdgeWidth = edgeWidth * CyStyle.SELECTED_EDGE_WIDTH_FACTOR;

        const style = cytoscape
            .stylesheet()
            .selector('*')
            .style({
                'overlay-color': CyStyle.DEFAULT_ACTIVE_OVERLAY_COLOR,
                'overlay-padding': CyStyle.DEFAULT_ACTIVE_OVERLAY_PADDING,
                'overlay-opacity': 0.0
            })
            .selector('.' + CSS_CLASS_HOVER)
            .style({
                'overlay-opacity': CyStyle.DEFAULT_ACTIVE_OVERLAY_OPACITY
            })
            .selector('node')
            .style({
                ...(
                    graphSize !== GraphSize.HUGE ?
                        {
                            'content': 'data(label)',
                            'text-valign': 'bottom',
                            'text-halign': 'right',
                            'text-wrap': 'none',
                            'font-size': fontSize
                        }
                        :
                        {}
                ),
                'shape': 'data(shape)',
                ...this.createNodeSizeStyle(),
                'background-fill': 'linear-gradient',
                'background-gradient-stop-colors': 'data(stopColors)',
                'background-gradient-stop-positions': 'data(stopPositions)',
                'background-gradient-direction': 'to-right',
                'border-width': nodeSize * CyStyle.NODE_SIZE_TO_BORDER_WIDTH_FACTOR,
                'border-color': 'rgb(0, 0, 0)',
                'z-index': 'data(zindex)',
                'color': 'rgb(0, 0, 0)'
            })

            .selector('edge')
            .style({
                ...(
                    graphSize !== GraphSize.HUGE ?
                        {
                            'content': 'data(label)',
                            'text-wrap': 'none',
                            'text-rotation': 'autorotate',
                            'font-size': fontSize
                        } :
                        {}
                ),
                'control-point-step-size': selectedEdgeWidth * CyStyle.CONTROL_POINT_STEP_SIZE_FACTOR,
                'target-arrow-shape': 'triangle-cross',
                'target-arrow-color': 'rgb(0, 0, 0)',
                'curve-style': graphSize === GraphSize.SMALL ? 'bezier' : 'straight',
                'line-fill': 'linear-gradient',
                'line-gradient-stop-colors': 'data(stopColors)',
                'line-gradient-stop-positions': 'data(stopPositions)',
                'z-index': 'data(zindex)',
                'width': edgeWidth,
                'arrow-scale': 1.4
            })

            .selector('node:selected')
            .style({
                'background-color': 'rgb(128, 128, 255)',
                'border-width': (
                    nodeSize *
                    CyStyle.NODE_SIZE_TO_BORDER_WIDTH_FACTOR *
                    CyStyle.SELECTED_NODE_BORDER_WIDTH_FACTOR
                ),
                'border-color': 'rgb(0, 0, 255)',
                'color': 'rgb(0, 0, 255)'
            })
            .selector('edge:selected:inactive')
            .style({
                'width': selectedEdgeWidth,
                'color': 'rgb(0, 0, 255)',
                'overlay-color': 'rgb(0, 0, 255)',
                'overlay-padding': selectedEdgeWidth / 5.0,
                'overlay-opacity': 1,
                'target-arrow-color': 'rgb(0, 0, 255)'
            })
            .selector('edge:selected:inactive.' + CSS_CLASS_HOVER)
            .style({
                'overlay-color': CyStyle.DEFAULT_ACTIVE_OVERLAY_COLOR,
                'overlay-padding': CyStyle.DEFAULT_ACTIVE_OVERLAY_PADDING,
                'overlay-opacity': CyStyle.DEFAULT_ACTIVE_OVERLAY_OPACITY
            })
            .selector('edge[?wLabelSpace]')
            .style({
                ...(
                    graphSize !== GraphSize.HUGE ?
                        {
                            'control-point-step-size': fontSize * 2.5
                        } :
                        {}
                )
            })
            .selector('edge.edge-label-disabled')
            .style({
                content: ''
            })
            .selector('node.ghost-element')
            .style({
                'color': 'rgb(179, 170, 179)',
                'border-color': 'rgb(179, 170, 179)'
            })
            .selector('edge.ghost-element')
            .style({
                'color': 'rgb(179, 170, 179)',
                'target-arrow-color': 'rgb(179, 170, 179)'
            })
            .selector('node[?isMeta]')
            .style({
                'border-width': (
                    nodeSize *
                    CyStyle.NODE_SIZE_TO_BORDER_WIDTH_FACTOR *
                    CyStyle.META_NODE_BORDER_WIDTH_FACTOR
                )
            })
            .selector('node:selected[?isMeta]')
            .style({
                'border-width': (
                    nodeSize *
                    CyStyle.NODE_SIZE_TO_BORDER_WIDTH_FACTOR *
                    CyStyle.META_NODE_BORDER_WIDTH_FACTOR *
                    CyStyle.SELECTED_NODE_BORDER_WIDTH_FACTOR
                )
            })
            .selector(':active')
            .style({
                'overlay-opacity': 0.5
            });

        return style;
    }

    private createNodeSizeMapString(): string {
        if (this.maxSize > this.minSize) {
            const minNodeSize = this.styleConfig.nodeSize;
            const maxNodeSize = minNodeSize * CyStyle.SIZE_ONE_SIZE_FACTOR * this.maxSize;
            return 'mapData(size, ' + this.minSize + ', ' + this.maxSize + ', ' + minNodeSize + ',' + maxNodeSize + ')';
        } else {
            return this.styleConfig.nodeSize.toString();
        }
    }
}
