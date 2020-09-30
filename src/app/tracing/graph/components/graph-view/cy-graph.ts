import { CyNodeData, CyEdgeData, Cy, CyNodeDef, CyEdgeDef, SelectedGraphElements } from '../../graph.model';
import { Layout, Position, PositionMap } from '../../../data.model';
import cytoscape from 'cytoscape';
import { StyleConfig, CyStyle } from './cy-style';
import _ from 'lodash';
import { EdgeLabelOffsetUpdater } from '../../edge-label-offset-updater';
import { EDGE_GROUP, NODE_GROUP, PRESET_LAYOUT_NAME } from '../../cy-graph/cy.constants';

function isPresetLayoutConfig(layoutConfig: LayoutConfig): boolean {
    return layoutConfig.name && !!layoutConfig.name.match(PRESET_LAYOUT_NAME);
}

export interface CyConfig {
    // interaction options:
    minZoom?: number;
    maxZoom?: number;
    zoomingEnabled?: boolean;
    userZoomingEnabled?: boolean;
    panningEnabled?: boolean;
    userPanningEnabled?: boolean;
    boxSelectionEnabled?: boolean;
    selectionType?: 'single' | 'additive';
    touchTapThreshold?: number;
    desktopTapThreshold?: number;
    autolock?: boolean;
    autoungrabify?: boolean;
    autounselectify?: boolean;

    // rendering options:
    headless?: boolean;
    styleEnabled?: boolean;
    hideEdgesOnViewport?: boolean;
    textureOnViewport?: boolean;
    motionBlur?: boolean;
    motionBlurOpacity?: number;
    wheelSensitivity?: number;
    pixelRatio?: number | 'auto';
}

export interface LayoutConfig {
    name: string;
    zoom?: number;
    pan?: Position;
    fit?: boolean;
    [key: string]: any;
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

export function createLayoutConfigFromLayout(layout: Layout): LayoutConfig {
    return {
        name: PRESET_LAYOUT_NAME,
        zoom: layout ? layout.zoom : undefined,
        pan: layout ? layout.pan : undefined,
        fit: !layout
    };
}

export class CyGraph {

    protected static readonly DEFAULT_MIN_ZOOM = 0.1;
    protected static readonly DEFAULT_MAX_ZOOM = 100.0;
    protected static readonly WHEEL_SENSITIVITY = 0.5;

    private cy_: Cy;
    private minZoom_: number = CyGraph.DEFAULT_MIN_ZOOM;
    private maxZoom_: number = CyGraph.DEFAULT_MAX_ZOOM;

    protected edgeLabelOffsetUpdater = new EdgeLabelOffsetUpdater();

    constructor(
        htmlContainerElement: HTMLElement | undefined,
        private graphData: GraphData,
        private styleConfig: StyleConfig,
        layoutConfig?: LayoutConfig,
        cyConfig?: CyConfig
    ) {
        // console.log('BaseCyGraph entered ...');
        layoutConfig = layoutConfig ? layoutConfig : createLayoutConfigFromLayout(this.graphData.layout);
        this.initCy(htmlContainerElement, layoutConfig, cyConfig);
        // console.log('BaseCyGraph leaving ...');
    }

    protected get cy(): Cy {
        return this.cy_;
    }

    get zoom(): number {
        return this.graphData.layout.zoom;
    }

    get pan(): Position {
        return this.graphData.layout.pan;
    }

    get minZoom(): number {
        return this.minZoom_;
    }

    get maxZoom(): number {
        return this.maxZoom_;
    }

    get layout(): Layout {
        return this.graphData.layout;
    }

    get style(): StyleConfig {
        return this.styleConfig;
    }

    get selectedElements(): SelectedGraphElements {
        return this.graphData.selectedElements;
    }

    get nodePositions(): PositionMap {
        return this.graphData.nodePositions;
    }

    protected setStyleConfig(value: StyleConfig) {
        this.styleConfig = value;
    }

    protected setGraphData(value: GraphData) {
        this.graphData = value;
    }

    get data(): GraphData {
        return this.graphData;
    }

    destroy(): void {
        this.cleanCy();
    }

    private cleanCy(): void {
        if (this.cy) {
            this.edgeLabelOffsetUpdater.disconnect();
            this.cy.destroy();
            this.cy_ = null;
        }
    }

    protected createNodes(nodesData: CyNodeData[], positions: PositionMap): CyNodeDef[] {
        return nodesData.map(nodeData => ({
            group: NODE_GROUP,
            data: nodeData,
            selected: nodeData.selected,
            position: { ...positions[nodeData.id] }
        }));
    }

    protected createEdges(edgesData: CyEdgeData[]): CyEdgeDef[] {
        return edgesData.map(edgeData => ({
            group: EDGE_GROUP,
            data: edgeData,
            selected: edgeData.selected
        }));
    }

    protected initCy(htmlContainerElement: HTMLElement, layoutConfig: LayoutConfig, cyConfig: CyConfig): void {
        // console.log('BaseCyGraph.initCy entered ...');
        this.cleanCy();
        cyConfig = cyConfig || {};
        this.cy_ = cytoscape({
            ...cyConfig,
            container: htmlContainerElement,
            elements: {
                nodes: this.createNodes(this.graphData.nodeData, this.graphData.nodePositions || {}),
                edges: this.createEdges(this.graphData.edgeData)
            },
            layout: layoutConfig,
            style: new CyStyle(this.graphData, this.styleConfig).createCyStyle(),
            wheelSensitivity: CyGraph.WHEEL_SENSITIVITY
        });

        this.edgeLabelOffsetUpdater.connectTo(this.cy);

        if (!isPresetLayoutConfig(layoutConfig)) {
            this.graphData = { ...this.graphData,
                layout: {
                    zoom: this.cy.zoom(),
                    pan: { ...this.cy.pan() }
                },
                nodePositions: this.extractNodePositionsFromGraph()
            };
        } else if (layoutConfig.zoom === undefined || !layoutConfig.pan) {
            this.graphData = { ...this.graphData,
                layout: {
                    zoom: this.cy.zoom(),
                    pan: { ...this.cy.pan() }
                }
            };
        }
        // console.log('BaseCyGraph.initCy leaving ...');
    }

    protected extractNodePositionsFromGraph(): PositionMap {
        const posMap: PositionMap = { ...this.graphData.nodePositions };
        this.cy.nodes().forEach(n => posMap[n.id()] = { ...n.position() });
        return posMap;
    }
}
