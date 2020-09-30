import { Injectable } from '@angular/core';
import { PositionMap, Position } from '@app/tracing/data.model';
import { Utils as UIUtils } from '../util/ui-utils';
import { Utils as NonUIUtils } from '../util/non-ui-utils';
import _ from 'lodash';
import { getNearestPointOnRect, getEnclosingRectFromPoints, BoundaryRect } from '@app/tracing/util/geometry-utils';
import { GraphServiceData } from './graph.model';

interface NeighbourHood {
    neighbourIds: string[];
    neighbourWeights: { [key: string]: number };
}

interface NeighbourHoodMap {
    [key: string]: NeighbourHood;
}

export interface PositioningData {
    nodePositions: PositionMap;
    frameData: BoundaryRect;
}

@Injectable({
    providedIn: 'root'
})
export class GisPositioningService {
    private static readonly RELATIVE_FRAME_MARGIN = 0.12;
    private static readonly LAT_MAX = 90.0;
    private static readonly LAT_MIN = -90.0;
    private static readonly LON_MAX = 180.0;
    private static readonly LON_MIN = -180.0;
    private static readonly NIRVANA_BOUNDARY_RECT =
        GisPositioningService.getContainingBoundaryRect([
            UIUtils.latLonToPosition(GisPositioningService.LAT_MAX * 0.6, GisPositioningService.LON_MIN * 0.6, 1.0),
            UIUtils.latLonToPosition(GisPositioningService.LAT_MIN * 0.6, GisPositioningService.LON_MAX * 0.6, 1.0)
        ]);
    private static readonly FALLBACK_FRAME_LATLON_MARGIN = {
        lat: 8,
        lon: 8
    };
    private static readonly FALLBACK_FRAME_MARGIN = Math.max(...Object.values(
        UIUtils.latLonToPosition(
            GisPositioningService.FALLBACK_FRAME_LATLON_MARGIN.lat,
            GisPositioningService.FALLBACK_FRAME_LATLON_MARGIN.lon,
            1.0
        )
    ));

    private stationModelPositions: PositionMap;
    private nodeModelPositions: PositionMap;
    private innerBoundaryRect: BoundaryRect;
    private outerBoundaryRect: BoundaryRect;
    private cachedPositioningData: PositioningData;
    private graphData: GraphServiceData;
    private areUnknownPositionsPresent: boolean;

    private static getContainingBoundaryRect(positions: Position[]): BoundaryRect | undefined {
        return positions.length === 0 ?
            undefined :
            getEnclosingRectFromPoints(positions);
    }

    getPositioningData(graphData: GraphServiceData) {
        if (!this.graphData || this.graphData.statVis !== graphData.statVis) {
            this.setPositioningData(graphData);
        }
        return this.cachedPositioningData;
    }

    private setPositioningData(graphData: GraphServiceData): void {
        this.graphData = graphData;
        this.initKnownStationModelPositions();
        this.initKnownNodeModelPositions();
        this.setInnerBoundaryRect();
        this.setOuterBoundaryRect();
        this.setUnknownNodeModelPositions();
        this.cachedPositioningData = {
            nodePositions: this.nodeModelPositions,
            frameData: this.areUnknownPositionsPresent ? this.outerBoundaryRect : undefined
        };
    }

    get nodePositions(): PositionMap {
        return this.nodeModelPositions;
    }

    private initKnownStationModelPositions(): void {
        this.stationModelPositions = {};
        const statMap = this.graphData.statMap;
        for (const station of this.graphData.stations
            .filter(s => UIUtils.hasGisInfo(s))
        ) {
            this.stationModelPositions[station.id] = UIUtils.latLonToPosition(station.lat, station.lon, 1.0);
        }
        for (const stationGroup of this.graphData.stations
            .filter(s => s.contains && s.contains.length > 0)
            .filter(s => !this.stationModelPositions[s.id])
        ) {
            const positions = stationGroup.contains
                .map(id => this.stationModelPositions[id])
                .filter(p => !!p);
            if (positions.length > 0) {
                this.stationModelPositions[stationGroup.id] = NonUIUtils.getCenter(positions);
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
        const rect = GisPositioningService.getContainingBoundaryRect(Object.values(this.nodeModelPositions));
        if (!rect) {
            this.innerBoundaryRect = GisPositioningService.NIRVANA_BOUNDARY_RECT;
        } else {
            this.innerBoundaryRect = rect;
        }
    }

    private setOuterBoundaryRect(): void {
        const xMargin = this.innerBoundaryRect.width * GisPositioningService.RELATIVE_FRAME_MARGIN;
        const yMargin = this.innerBoundaryRect.height * GisPositioningService.RELATIVE_FRAME_MARGIN;
        let margin = Math.max(xMargin, yMargin);
        if (margin === 0) {
            margin = GisPositioningService.FALLBACK_FRAME_MARGIN;
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

    private createDefaultPosition(): Position {
        return {
            x: this.outerBoundaryRect.left,
            y: this.outerBoundaryRect.right
        };
    }

    private setUnknownNodeModelPositions(): void {
        // to compute the unknown positions we create a map
        // which gives as easy access to node neighbours
        const nbhMap = this.getNeighbourHoodMap();
        const posMap = this.nodeModelPositions;

        // to compute the unkown positions we iteratively
        // get the nodes without positions which are connected to at least one node with a known position
        // an unkown node position is set to a point on the frame which has minimal distance
        // to the weighted (number of links) center of the connected nodes with positions

        let idsOfConnectedNodesWOPos: string[] = _.uniq(this.graphData.edgeData.map(e => {
            const sourcePosIsKnown = !!posMap[e.source];
            const targetPosIsKnown = !!posMap[e.target];
            if (sourcePosIsKnown !== targetPosIsKnown) {
                return sourcePosIsKnown ? e.target : e.source;
            } else {
                return undefined;
            }
        }).filter(id => !!id));

        while (idsOfConnectedNodesWOPos.length > 0) {
            const newPosMap: PositionMap = {};
            idsOfConnectedNodesWOPos.forEach(nodeId => {
                const weightedCenter: Position = { x: 0.0, y: 0.0 };
                let totalWeight = 0;
                const nbh = nbhMap[nodeId];
                for (const neighbourId of nbh.neighbourIds) {
                    const neighbourPos = posMap[neighbourId];
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
                newPosMap[nodeId] = getNearestPointOnRect(weightedCenter, this.outerBoundaryRect);
            });
            Object.assign(posMap, newPosMap);

            idsOfConnectedNodesWOPos = _.uniq([].concat(
                ...idsOfConnectedNodesWOPos.map(id =>
                    nbhMap[id].neighbourIds.filter(nId => !posMap[nId])
                )
            ));

        }

        this.graphData.nodeData.filter(n => !posMap[n.id]).forEach(n => posMap[n.id] = this.createDefaultPosition());
    }

    private getNeighbourHoodMap(): NeighbourHoodMap {
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
            nbh.neighbourIds = _.uniq(Object.keys(nbh.neighbourWeights));
        }
        return nbhMap;
    }
}
