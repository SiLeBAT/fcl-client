import cytoscape from 'cytoscape';
import { CyNodeData, CyEdgeData } from '../../graph.model';

enum GraphSize {
    SMALL, LARGE, HUGE
}

export interface GraphData {
    nodeData: CyNodeData[];
    edgeData: CyEdgeData[];
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
    private static readonly MAX_NODE_SIZE_FACTOR = 1.44;

    private maxScore: number;
    private minScore: number;

    constructor(private graphData: GraphData, private styleConfig: StyleConfig) {
        this.initScoreLimits();
    }

    private initScoreLimits(): void {
        const scores = this.graphData.nodeData.map(n => n.station.score);
        this.minScore = scores.length === 0 ? 0 : Math.min(...scores);
        this.maxScore = scores.length === 0 ? 0 : Math.max(...scores);
    }

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

    private createNodeSizeStyle(): { height: string, width: string } {
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
                'overlay-color': 'rgb(0, 0, 255)',
                'overlay-padding': 10,
                'overlay-opacity': e => (e.scratch('_active') ? 0.5 : 0.0)
            })
            .selector('node')
            .style({
                ...(
                    graphSize !== GraphSize.HUGE ?
                        {
                            content: 'data(label)',
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
                color: 'rgb(0, 0, 0)'
            })

            .selector('edge')
            .style({
                ...(
                    graphSize !== GraphSize.HUGE ?
                        {
                            content: 'data(label)',
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
                width: edgeWidth,
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
                color: 'rgb(0, 0, 255)'
            })
            .selector('edge:selected:inactive')
            .style({
                width: selectedEdgeWidth,
                color: 'rgb(0, 0, 255)',
                'overlay-color': 'rgb(0, 0, 255)',
                'overlay-padding': selectedEdgeWidth / 5.0,
                'overlay-opacity': 1,
                'target-arrow-color': 'rgb(0, 0, 255)'
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
                color: 'rgb(179, 170, 179)',
                'border-color': 'rgb(179, 170, 179)'
            })
            .selector('edge.ghost-element')
            .style({
                color: 'rgb(179, 170, 179)',
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
        if (this.maxScore > this.minScore) {
            const minNodeSize = this.styleConfig.nodeSize;
            const maxNodeSize = minNodeSize * CyStyle.MAX_NODE_SIZE_FACTOR;
            return 'mapData(score, ' + this.minScore + ', ' + this.maxScore + ', ' + minNodeSize + ',' + maxNodeSize + ')';
        } else {
            return this.styleConfig.nodeSize.toString();
        }
    }
}
