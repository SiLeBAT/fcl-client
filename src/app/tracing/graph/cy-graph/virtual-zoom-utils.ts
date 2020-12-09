import { Size, PositionMap, Position } from '../../data.model';
import { GraphData } from './cy-graph';
import { CyNodeData } from '../graph.model';

export function getActivePositions(graphData: GraphData): Position[] {
    const posMap = graphData.nodePositions;
    return graphData.nodeData.map(n => posMap[n.id]);
}

export function getAvailableSpace(htmlElement: HTMLElement): Size {
    const rect = htmlElement.getBoundingClientRect();
    return {
        width: rect.width,
        height: rect.height
    };
}

export function getZoomedNodePositions(nodeData: CyNodeData[], posMap: PositionMap, zoom: number): PositionMap {
    const zoomedPosMap: PositionMap = { ...posMap };
    nodeData.forEach(n => {
        const oldPos = posMap[n.id];
        zoomedPosMap[n.id] = {
            x: oldPos.x * zoom,
            y: oldPos.y * zoom
        };
    });
    return zoomedPosMap;
}

export function getZoomedGraphData(graphData: GraphData): GraphData {
    const layout = graphData.layout || {
        zoom: 1,
        pan: { x: 0.0, y: 0.0 }
    };
    return {
        ...graphData,
        nodePositions: graphData.nodePositions !== undefined ?
            getZoomedNodePositions(graphData.nodeData, graphData.nodePositions, layout.zoom) :
            undefined,
        ghostData: graphData.ghostData === null ?
            null :
            {
                ...graphData.ghostData,
                posMap: getZoomedNodePositions(graphData.ghostData.nodeData, graphData.ghostData.posMap, layout.zoom)
            },
        layout: {
            zoom: 1,
            pan: layout.pan
        }
    };
}
