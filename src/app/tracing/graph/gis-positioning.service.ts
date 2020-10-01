import { Injectable } from '@angular/core';
import { PositionMap, Position } from '@app/tracing/data.model';
import { Utils as UIUtils } from '../util/ui-utils';
import { getNearestPointOnRect, getEnclosingRectFromPoints, BoundaryRect, getCenterFromPoints } from '@app/tracing/util/geometry-utils';
import { GraphServiceData, NodeId } from './graph.model';
import { ABSOLUTE_FRAME_MARGIN, EMPTY_FRAME, REF_ZOOM, RELATIVE_FRAME_MARGIN } from './gis.constants';

interface NeighbourHood {
    neighbourIds: NodeId[];
    neighbourWeights: Record<NodeId, number>;
}

interface NeighbourHoodMap extends Record<string, NeighbourHood> {}

export interface PositioningData {
    nodePositions: PositionMap;
    frameData: BoundaryRect | null;
}

@Injectable({
    providedIn: 'root'
})
export class GisPositioningService {

    private stationModelPositions: PositionMap = null;
    private nodeModelPositions: PositionMap = null;
    private innerBoundaryRect: BoundaryRect = null;
    private outerBoundaryRect: BoundaryRect = null;
    private cachedPositioningData: PositioningData = null;
    private graphData: GraphServiceData = null;
    private areUnknownPositionsPresent: boolean = false;
    private neighbourHoodMap: NeighbourHoodMap = null;

    getPositioningData(graphData: GraphServiceData) {
        if (!this.graphData || this.graphData.statVis !== graphData.statVis) {
            this.graphData = graphData;
            this.setPositioningData(graphData);
        }
        return this.cachedPositioningData;
    }

    private setPositioningData(graphData: GraphServiceData): void {
        this.initKnownStationModelPositions();
        this.initKnownNodeModelPositions();
        this.setInnerBoundaryRect();
        this.setOuterBoundaryRect();
        this.setUnknownNodeModelPositions();
        this.cachedPositioningData = {
            nodePositions: this.nodeModelPositions,
            frameData: this.areUnknownPositionsPresent ? this.outerBoundaryRect : null
        };
    }

    get nodePositions(): PositionMap {
        return this.nodeModelPositions;
    }

    private initKnownStationModelPositions(): void {
        this.stationModelPositions = {};

        for (const station of this.graphData.stations
            .filter(s => UIUtils.hasGisInfo(s))
        ) {
            this.stationModelPositions[station.id] = UIUtils.latLonToPosition(station.lat, station.lon, REF_ZOOM);
        }
        for (const stationGroup of this.graphData.stations
            .filter(s => s.contains.length > 0)
            .filter(s => !this.stationModelPositions[s.id])
        ) {
            const positions = stationGroup.contains
                .map(id => this.stationModelPositions[id])
                .filter(p => p !== undefined);
            if (positions.length > 0) {
                this.stationModelPositions[stationGroup.id] = getCenterFromPoints(positions);
            }
        }
    }

    private initKnownNodeModelPositions(): void {
        this.nodeModelPositions = {};
        this.areUnknownPositionsPresent = false;
        for (const nodeData of this.graphData.nodeData) {
            const position = this.stationModelPositions[nodeData.station.id];
            if (position) {
                this.nodeModelPositions[nodeData.id] = position;
            } else {
                this.areUnknownPositionsPresent = true;
            }
        }
    }

    private setInnerBoundaryRect(): void {
        const positions = Object.values(this.nodeModelPositions);

        if (positions.length === 0) {
            this.innerBoundaryRect = null;
        } else {
            this.innerBoundaryRect = getEnclosingRectFromPoints(positions);
        }
    }

    private setOuterBoundaryRect(): void {
        if (this.innerBoundaryRect === null) {
            this.outerBoundaryRect = EMPTY_FRAME;
        } else {
            const xMargin = this.innerBoundaryRect.width * RELATIVE_FRAME_MARGIN;
            const yMargin = this.innerBoundaryRect.height * RELATIVE_FRAME_MARGIN;
            let margin = Math.max(xMargin, yMargin);
            if (margin === 0) {
                margin = ABSOLUTE_FRAME_MARGIN;
            }
            this.outerBoundaryRect = {
                left: this.innerBoundaryRect.left - margin,
                right: this.innerBoundaryRect.right + margin,
                top: this.innerBoundaryRect.top - margin,
                bottom: this.innerBoundaryRect.bottom + margin,
                width: this.innerBoundaryRect.width + 2 * margin,
                height: this.innerBoundaryRect.height + 2 * margin
            };
        }
    }

    private createDefaultPosition(): Position {
        return {
            x: this.outerBoundaryRect.left,
            y: this.outerBoundaryRect.top
        };
    }

    private setUnknownNodeModelPositions(): void {
        // to compute the unknown positions we create a map
        // which gives as easy access to node neighbours
        this.setNeighbourHoodMap();

        // to compute the unkown positions we iteratively
        // get the nodes without positions which are connected to at least one node with a known position
        // an unkown node position is set to a point on the frame which has minimal distance
        // to the weighted (number of links) center of the connected nodes with positions

        let idsOfConnectedNodesWOPos = this.getNodesWoPosConnectedWithNodeWPos();

        while (idsOfConnectedNodesWOPos.size > 0) {
            const newPosMap: PositionMap = {};

            idsOfConnectedNodesWOPos.forEach(nodeId => {
                const weightedCenter = this.getGetWeightedNeighbourCenter(nodeId);
                newPosMap[nodeId] = getNearestPointOnRect(weightedCenter, this.outerBoundaryRect);
            });

            Object.assign(this.nodeModelPositions, newPosMap);

            idsOfConnectedNodesWOPos = this.getNeighboursWoPosition(idsOfConnectedNodesWOPos);
        }

        this.graphData.nodeData
            .filter(n => this.nodeModelPositions[n.id] === undefined)
            .forEach(n => this.nodeModelPositions[n.id] = this.createDefaultPosition());
    }

    private getNodesWoPosConnectedWithNodeWPos(): Set<string> {
        const nodeIds = new Set<string>();
        this.graphData.edgeData.forEach(edge => {
            const sourcePosIsKnown = this.nodeModelPositions[edge.source] !== undefined;
            const targetPosIsKnown = this.nodeModelPositions[edge.target] !== undefined;
            if (sourcePosIsKnown !== targetPosIsKnown) {
                nodeIds.add(sourcePosIsKnown ? edge.target : edge.source);
            }
            return nodeIds;
        });
        return nodeIds;
    }

    private getNeighboursWoPosition(nodeIds: Set<string>): Set<string> {
        const neighbourIds = new Set<string>();
        nodeIds.forEach(
            nodeId => this.neighbourHoodMap[nodeId].neighbourIds
                    .filter(nId => this.nodeModelPositions[nId] === undefined)
                    .forEach(nId => neighbourIds.add(nId))
        );
        return neighbourIds;
    }

    private getGetWeightedNeighbourCenter(nodeId: NodeId): Position {
        const weightedCenter: Position = { x: 0.0, y: 0.0 };
        let totalWeight = 0;
        const nbh = this.neighbourHoodMap[nodeId];
        for (const neighbourId of nbh.neighbourIds) {
            const neighbourPos = this.nodeModelPositions[neighbourId];
            if (neighbourPos) {
                const weight = nbh.neighbourWeights[neighbourId];
                weightedCenter.x += neighbourPos.x * weight;
                weightedCenter.y += neighbourPos.y * weight;
                totalWeight += weight;
            }
        }
        if (totalWeight > 0) {
            weightedCenter.x /= totalWeight;
            weightedCenter.y /= totalWeight;
        }
        return weightedCenter;
    }

    private setNeighbourHoodMap(): void {
        const nbhMap: NeighbourHoodMap = {};

        for (const node of this.graphData.nodeData) {
            nbhMap[node.id] = { neighbourIds: [], neighbourWeights: {} };
        }
        for (const edge of this.graphData.edgeData.filter(e => e.source !== e.target)) {
            const targetNBH = nbhMap[edge.target];
            if (targetNBH) {
                targetNBH.neighbourWeights[edge.source] = (targetNBH.neighbourWeights[edge.source] || 0) + 1;
            }
            const sourceNBH = nbhMap[edge.source];
            if (sourceNBH) {
                sourceNBH.neighbourWeights[edge.target] = (sourceNBH.neighbourWeights[edge.target] || 0) + 1;
            }
        }
        for (const node of this.graphData.nodeData) {
            const nbh = nbhMap[node.id];
            nbh.neighbourIds = Object.keys(nbh.neighbourWeights);
        }

        this.neighbourHoodMap = nbhMap;
    }
}
