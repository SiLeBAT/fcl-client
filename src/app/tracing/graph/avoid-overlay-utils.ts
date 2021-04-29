import { Position, PositionMap } from '@app/tracing/data.model';
import { CyNodeData } from './graph.model';
import * as seedrandom from 'seedrandom';
import { getDistance } from '@app/tracing/util/geometry-utils';

export function getNonOverlayPositions(
    nodes: CyNodeData[],
    posMap: PositionMap,
    nodeSize: number,
    zoom: number
): PositionMap {

    const rand = seedrandom('0');

    const newPosMap: PositionMap = { ...posMap };
    const maxMove = nodeSize / zoom;
    const stepSize = maxMove / 5.0;
    const maxNeighbourDist = maxMove * 2;

    for (const node1 of nodes) {
        const pos1 = posMap[node1.id];

        // neighbour search
        const neighborPositions: Position[] = [];
        for (const node2 of nodes) {
            if (node1 !== node2) {
                const pos2 = newPosMap[node2.id];
                if (getDistance(pos1, pos2) < maxNeighbourDist) {
                    neighborPositions.push(pos2);
                }
            }
        }
        if (neighborPositions.length > 0) {
            const randX = rand();
            const randY = rand();
            const xLeft = pos1.x - maxMove;
            const xRight = pos1.x + maxMove;
            const yTop = pos1.y - maxMove;
            const yBottom = pos1.y + maxMove;
            let bestDistance = 0.0;
            let bestPoint: Position | null = null;

            for (let x = xLeft + randX * stepSize; x <= xRight; x += stepSize) {
                for (let y = yTop + randY * stepSize; y <= yBottom; y += stepSize) {
                    let distToClosestNeighbour = Number.POSITIVE_INFINITY;
                    const newPosCandidate = { x: x, y: y };

                    for (const neighbourPos of neighborPositions) {
                        distToClosestNeighbour = Math.min(distToClosestNeighbour, getDistance(neighbourPos, newPosCandidate));
                    }

                    if (distToClosestNeighbour > bestDistance) {
                        bestDistance = distToClosestNeighbour;
                        bestPoint = newPosCandidate;
                    }
                }
            }

            newPosMap[node1.id] = bestPoint;
        }
    }

    return newPosMap;
}
