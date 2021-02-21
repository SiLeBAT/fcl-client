import { CyNodeData, CyEdgeData, Cy, CyNodeDef, CyEdgeDef, SelectedGraphElements, GraphGhostData, EdgeId } from '../graph.model';
import { Layout, Position, PositionMap } from '../../data.model';
import cytoscape from 'cytoscape';
import { StyleConfig, CyStyle } from './cy-style';
import _ from 'lodash';
import { EdgeLabelOffsetUpdater } from '../edge-label-offset-updater';
import { EDGE_GROUP, NODE_GROUP, PRESET_LAYOUT_NAME } from './cy.constants';
import cola from 'cytoscape-cola';
import dagre from 'cytoscape-dagre';
import spread from 'cytoscape-spread';
import { FruchtermanLayout } from '@app/tracing/layout/fruchterman-reingold';
import { FarmToForkLayout } from '@app/tracing/layout/farm-to-fork/farm-to-fork';

export function isPresetLayoutConfig(layoutConfig: LayoutConfig): boolean {
    return layoutConfig.name && !!layoutConfig.name.match(PRESET_LAYOUT_NAME);
}

const DEFAULT_CY_CONFIG = {};

export interface CyConfig {
    minZoom?: number;
    maxZoom?: number;
    zoomingEnabled?: boolean;
    userZoomingEnabled?: boolean;
    autoungrabify?: boolean;
}

export type LayoutName = string;

export interface LayoutConfig {
    name: LayoutName;
    zoom?: number;
    pan?: Position;
    fit?: boolean;
    animate?: boolean;
    ready?(): void;
    stop?(): void;
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
    ghostData: GraphGhostData;
    hoverEdges: EdgeId[];
}

export class CyGraph {

    protected static readonly DEFAULT_MIN_ZOOM = 0.1;
    protected static readonly DEFAULT_MAX_ZOOM = 100.0;
    protected static readonly WHEEL_SENSITIVITY = 0.5;
    private static CyLayoutManagerLoaded = false;

    private cy_: Cy;
    private minZoom_: number = CyGraph.DEFAULT_MIN_ZOOM;
    private maxZoom_: number = CyGraph.DEFAULT_MAX_ZOOM;

    protected edgeLabelOffsetUpdater = new EdgeLabelOffsetUpdater();

    constructor(
        htmlContainerElement: HTMLElement | undefined,
        private graphData: GraphData,
        private styleConfig: StyleConfig,
        layoutConfig: LayoutConfig,
        cyConfig?: CyConfig
    ) {
        if (!CyGraph.CyLayoutManagerLoaded) {
            CyGraph.addLayoutManagerToCytoScape();
            CyGraph.CyLayoutManagerLoaded = true;
        }
        this.initCy(htmlContainerElement, layoutConfig, cyConfig);
    }

    private static addLayoutManagerToCytoScape() {
        cytoscape.use(cola);
        cytoscape.use(dagre);
        cytoscape.use(spread);
        cytoscape('layout', 'fruchterman', FruchtermanLayout);
        cytoscape('layout', 'farm_to_fork', FarmToForkLayout);
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
        if (this.cy_) {
            this.edgeLabelOffsetUpdater.disconnect();
            this.cy_.destroy();
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

    protected initCy(
        htmlContainerElement: HTMLElement | undefined,
        layoutConfig: LayoutConfig,
        cyConfig: CyConfig | undefined = DEFAULT_CY_CONFIG
    ): void {
        this.cleanCy();
        cyConfig = cyConfig === undefined ? DEFAULT_CY_CONFIG : cyConfig;
        this.cy_ = cytoscape({
            ...cyConfig,
            container: htmlContainerElement,
            elements: {
                nodes: this.createNodes(this.graphData.nodeData, this.graphData.nodePositions || {}),
                edges: this.createEdges(this.graphData.edgeData)
            },
            layout: layoutConfig,
            style: new CyStyle(this.graphData, this.styleConfig).createCyStyle(),
            wheelSensitivity: CyGraph.WHEEL_SENSITIVITY,
            minZoom: cyConfig.minZoom,
            maxZoom: cyConfig.maxZoom,
            autoungrabify: cyConfig.autoungrabify,
            userZoomingEnabled: cyConfig.userZoomingEnabled,
            zoomingEnabled: cyConfig.zoomingEnabled
        });

        this.edgeLabelOffsetUpdater.connectTo(this.cy);

        if (!isPresetLayoutConfig(layoutConfig)) {
            this.graphData = { ...this.graphData,
                layout: this.extractViewPortFromGraph(),
                nodePositions: this.extractNodePositionsFromGraph()
            };
        } else if (layoutConfig.zoom === undefined || !layoutConfig.pan) {
            this.graphData = { ...this.graphData,
                layout: this.extractViewPortFromGraph()
            };
        }
    }

    private extractViewPortFromGraph(): Layout {
        return {
            zoom: this.cy.zoom(),
            pan: { ...this.cy.pan() }
        };
    }

    protected extractNodePositionsFromGraph(): PositionMap {
        const posMap: PositionMap = { ...this.graphData.nodePositions };
        this.cy.nodes().forEach(n => posMap[n.id()] = { ...n.position() });
        return posMap;
    }
}
