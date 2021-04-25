import { Position, PositionMap } from '@app/tracing/data.model';
import { CyNodeData } from '../graph.model';
import * as seedrandom from 'seedrandom';
import { getDistance } from '@app/tracing/util/geometry-utils';
import { GraphData } from './cy-graph';

export function getGraphDataWithReducedOverlay(
    graphData: GraphData,
    nodeSize: number,
    zoom: number
): GraphData {
    return {
        ...graphData,
        nodePositions: getNonOverlayPositions(graphData.nodeData, graphData.nodePositions, nodeSize, zoom),
        ghostData: (
            graphData.ghostData === null ?
            null :
                {
                    ...graphData.ghostData,
                    posMap: getNonOverlayPositions(graphData.ghostData.nodeData, graphData.ghostData.posMap, nodeSize, zoom)
                }
        )
    };
}

export function getNonOverlayPositions(
    nodes: CyNodeData[],
    posMap: PositionMap,
    nodeSize: number,
    zoom: number
): PositionMap {

    const rand = seedrandom('0');

    const newPosMap: PositionMap = { ...posMap };
    const s = nodeSize / zoom;
    const d = s / 5.0;

    for (const n1 of nodes) {
        const p1 = posMap[n1.id];
        const neighbors: Position[] = [];

        for (const n2 of nodes) {
            if (n1 !== n2) {
                const p2 = newPosMap[n2.id];
                if (getDistance(p1, p2) < 2 * s) {
                    neighbors.push(p2);
                }
            }
        }
        if (neighbors.length > 0) {
            const randX = rand();
            const randY = rand();
            const x1 = p1.x - s;
            const x2 = p1.x + s;
            const y1 = p1.y - s;
            const y2 = p1.y + s;
            let bestDistance = 0.0;
            let bestPoint: Position | null = null;

            for (let x = x1 + randX * d; x <= x2; x += d) {
                for (let y = y1 + randY * d; y <= y2; y += d) {
                    let distance = Number.POSITIVE_INFINITY;

                    for (const p of neighbors) {
                        distance = Math.min(distance, getDistance(p, { x: x, y: y }));
                    }

                    if (distance > bestDistance) {
                        bestDistance = distance;
                        bestPoint = { x: x, y: y };
                    }
                }
            }

            newPosMap[n1.id] = bestPoint;
        }
    }

    return newPosMap;
}
