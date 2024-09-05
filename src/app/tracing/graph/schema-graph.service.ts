import { Injectable } from '@angular/core';
import { StationId, Position, SchemaGraphState } from '../data.model';
import { GraphService } from './graph.service';
import { CyNodeData, NodeId } from './graph.model';
import { GraphData } from './cy-graph/cy-graph';

@Injectable({
    providedIn: 'root'
})
export class SchemaGraphService {

    private static readonly DEFAULT_POSITION = { x: 0, y: 0 };

    private cachedState: SchemaGraphState | null = null;

    private cachedData: GraphData | null = null;

    constructor(
        private graphService: GraphService
    ) {}

    getData(state: SchemaGraphState): GraphData {
        this.applyState(state);
        return { ...this.cachedData! };
    }

    private applyState(state: SchemaGraphState) {
        const sharedGraphData = this.graphService.getData(state);

        const nodePositions: Record<NodeId, Position> =
            this.cachedState === null ||
            this.cachedState.stationPositions !== state.stationPositions ||
            this.cachedData === null ||
            this.cachedData.nodeData !== sharedGraphData.nodeData ?
                this.createNodePositions(state.stationPositions, sharedGraphData.nodeData, false) :
                this.cachedData.nodePositions;

        const ghostPositions: Record<NodeId, Position> =
            (
                state.ghostStation === null &&
                (state.ghostDelivery === null || sharedGraphData.ghostElements!.nodeData.length === 0)
            ) ?
                // no ghost nodes
                {} :
                // ghost nodes exist
                (
                    this.cachedState === null ||
                    this.cachedState.stationPositions !== state.stationPositions ||
                    this.cachedState.ghostStation !== state.ghostStation ||
                    this.cachedData!.ghostData === null && sharedGraphData.ghostElements!.nodeData.length > 0 ||
                    this.cachedData!.ghostData!.nodeData !== sharedGraphData.ghostElements!.nodeData
                ) ?
                    this.createNodePositions(state.stationPositions, sharedGraphData.ghostElements!.nodeData, true) :
                    this.cachedData!.ghostData!.posMap;

        const schemaGraphData: GraphData = {
            nodeData: sharedGraphData.nodeData,
            edgeData: sharedGraphData.edgeData,
            propsUpdatedFlag: sharedGraphData.nodeAndEdgePropsUpdatedFlag,
            nodePositions: nodePositions,
            layout: state.layout,
            selectedElements: sharedGraphData.selectedElements,
            ghostData:
                sharedGraphData.ghostElements == null ?
                    null :
                    ({
                        ...sharedGraphData.ghostElements,
                        posMap: ghostPositions
                    }),
            hoverEdges: sharedGraphData.hoverEdges
        };

        this.cachedState = { ...state };
        this.cachedData = schemaGraphData;
    }

    private createNodePositions(
        stationPosMap: Record<StationId, Position>,
        nodeData: CyNodeData[],
        setMissingPosAlwaysToDefault: boolean
    ): Record<NodeId, Position> {

        const nodePosMap: Record<NodeId, Position> = {};
        const nodesWoPos: NodeId[] = [];
        for (const node of nodeData) {
            const pos = stationPosMap[node.station.id];
            if (pos === undefined) {
                nodesWoPos.push(node.id);
            } else {
                nodePosMap[node.id] = pos;
            }
        }

        if (nodesWoPos.length > 0 && (nodesWoPos.length < nodeData.length || setMissingPosAlwaysToDefault)) {
            nodesWoPos.forEach(nodeId => nodePosMap[nodeId] = SchemaGraphService.DEFAULT_POSITION);
        }
        return nodePosMap;
    }

    convertNodePosToStationPositions(
        nodePositions: Record<NodeId, Position>,
        schemaGraphState: SchemaGraphState,
        graphData: GraphData
    ): Record<StationId, Position> {

        const newStationPositions: Record<StationId, Position> = { ...schemaGraphState.stationPositions };
        for (const node of graphData.nodeData) {
            newStationPositions[node.station.id] = nodePositions[node.id];
        }
        return newStationPositions;
    }
}
