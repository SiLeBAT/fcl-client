import {Injectable} from '@angular/core';
import {PositionMap, Position} from '@app/tracing/data.model';
import {Utils as UIUtils} from '../util/ui-utils';
import {
  getNearestPointOnRect,
  getEnclosingRectFromPoints,
  BoundaryRect,
  getCenterFromPoints,
} from '@app/tracing/util/geometry-utils';
import {
  CyEdgeData,
  CyNodeData,
  GraphElementData,
  GraphServiceData,
  NodeId,
} from './graph.model';
import {
  ABSOLUTE_FRAME_MARGIN,
  EMPTY_FRAME,
  REF_ZOOM,
  RELATIVE_FRAME_MARGIN,
} from './gis.constants';
import {getNonOverlayPositions} from './avoid-overlay-utils';

interface NeighbourHood {
  neighbourIds: NodeId[];
  neighbourWeights: Record<NodeId, number>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface NeighbourHoodMap extends Record<NodeId, NeighbourHood> {}

export interface PositioningData {
  nodePositions: PositionMap;
  ghostPositions: PositionMap | null;
  unknownLatLonRect: BoundaryRect | null;
  unknownLatLonRectModelBorderWidth: number;
}

@Injectable({
  providedIn: 'root',
})
export class GisPositioningService {
  private static readonly REF_MAP_SIZE = {
    width: 1200,
    height: 800,
  };
  private static readonly REF_NODE_SIZE = 20;

  private stationModelPositions: PositionMap = {};
  private boundaryNodeIds: NodeId[] = [];
  private boundaryGhostNodeIds: NodeId[] = [];
  private nodeModelPositions: PositionMap = {};
  private ghostModelPositions: PositionMap | null = null;
  private innerBoundaryRect: BoundaryRect | null = null;
  private outerBoundaryRect: BoundaryRect | null = null;
  private cachedPositioningData: PositioningData | null = null;
  private graphData: GraphServiceData | null = null;
  private modelBorderWidth = 0;

  getPositioningData(graphData: GraphServiceData) {
    const oldGraphData = this.graphData;
    this.graphData = graphData;
    if (!oldGraphData || oldGraphData.statVis !== graphData.statVis) {
      this.setPositioningData();
    } else if (oldGraphData.ghostElements !== graphData.ghostElements) {
      this.updateGhostPositions();
    }
    return this.cachedPositioningData!;
  }

  private setPositioningData(): void {
    this.initKnownStationModelPositions();
    this.initKnownNodeModelPositions();
    this.setInnerBoundaryRect();
    this.setOuterBoundaryRect();
    this.setUnknownNodeModelPositions();
    this.repositionBoundaryNodesToAvoidOverlay();
    this.updateGhostPositions();
    this.updateCache();
  }

  private updateCache(): void {
    this.cachedPositioningData = {
      nodePositions: this.nodeModelPositions,
      ghostPositions: this.ghostModelPositions,
      unknownLatLonRect:
        this.boundaryNodeIds.length > 0 || this.boundaryGhostNodeIds.length > 0
          ? this.outerBoundaryRect
          : null,
      unknownLatLonRectModelBorderWidth: this.modelBorderWidth,
    };
  }

  get nodePositions(): PositionMap {
    return this.nodeModelPositions;
  }

  private initKnownStationModelPositions(): void {
    this.stationModelPositions = {};

    for (const station of this.graphData!.stations.filter(UIUtils.hasGisInfo)) {
      this.stationModelPositions[station.id] = UIUtils.latLonToPosition(
        station.lat,
        station.lon,
        REF_ZOOM
      );
    }
    for (const stationGroup of this.graphData!.stations.filter(
      s => s.contains.length > 0
    ).filter(s => !this.stationModelPositions[s.id])) {
      const positions = stationGroup.contains
        .map(id => this.stationModelPositions[id])
        .filter(p => p !== undefined);
      if (positions.length > 0) {
        this.stationModelPositions[stationGroup.id] =
          getCenterFromPoints(positions);
      }
    }
  }

  private initKnownNodeModelPositions(): void {
    this.nodeModelPositions = {};
    this.ghostModelPositions = {};
    this.boundaryNodeIds = [];
    this.boundaryGhostNodeIds = [];
    this.setKnownNodePos(
      this.graphData!.nodeData,
      this.nodeModelPositions,
      this.boundaryNodeIds
    );
  }

  private setInnerBoundaryRect(): void {
    this.innerBoundaryRect = this.getModelPositionsIncludingRect();
  }

  private setOuterBoundaryRect(): void {
    if (this.innerBoundaryRect === null) {
      this.outerBoundaryRect = EMPTY_FRAME;
    } else {
      const margin =
        this.innerBoundaryRect.width === 0 &&
        this.innerBoundaryRect.height === 0
          ? ABSOLUTE_FRAME_MARGIN
          : Math.max(
              this.innerBoundaryRect.width * RELATIVE_FRAME_MARGIN,
              this.innerBoundaryRect.height * RELATIVE_FRAME_MARGIN
            );

      this.outerBoundaryRect = {
        left: this.innerBoundaryRect.left - margin,
        right: this.innerBoundaryRect.right + margin,
        top: this.innerBoundaryRect.top - margin,
        bottom: this.innerBoundaryRect.bottom + margin,
        width: this.innerBoundaryRect.width + 2 * margin,
        height: this.innerBoundaryRect.height + 2 * margin,
      };
    }
  }

  private createDefaultPosition(): Position {
    return {
      x: this.outerBoundaryRect!.left,
      y: (this.outerBoundaryRect!.top + this.outerBoundaryRect!.bottom) / 2,
    };
  }

  private setUnknownNodeModelPositions(): void {
    // to compute the unknown positions we create a map
    // which gives as easy access to node neighbours
    const nbhMap = this.createNeighbourHoodMap(this.graphData!);

    // to compute the unkown positions we iteratively
    // get the nodes without positions which are connected to at least one node with a known position
    // an unkown node position is set to a point on the outerBoundaryRect which has minimal distance
    // to the weighted (number of links) center of the connected nodes with positions

    const idsOfConnectedNodesWOPos = this.getNodesWoPosConnectedWithNodeWPos(
      this.graphData!.edgeData,
      this.nodeModelPositions
    );

    this.setConnectedPositions(
      idsOfConnectedNodesWOPos,
      nbhMap,
      this.nodeModelPositions
    );

    this.graphData!.nodeData.filter(
      n => this.nodeModelPositions[n.id] === undefined
    ).forEach(
      n => (this.nodeModelPositions[n.id] = this.createDefaultPosition())
    );
  }

  private getNodesWoPosConnectedWithNodeWPos(
    edgeData: CyEdgeData[],
    posMap: PositionMap
  ): Set<NodeId> {
    const nodeIds = new Set<NodeId>();

    edgeData.forEach(edge => {
      const sourcePosIsKnown = posMap[edge.source] !== undefined;
      const targetPosIsKnown = posMap[edge.target] !== undefined;
      if (sourcePosIsKnown !== targetPosIsKnown) {
        nodeIds.add(sourcePosIsKnown ? edge.target : edge.source);
      }
    });
    return nodeIds;
  }

  private getNeighboursWoPosition(
    nodeIds: Set<NodeId>,
    nbhMap: NeighbourHoodMap,
    posMap: PositionMap
  ): Set<NodeId> {
    const neighbourIds = new Set<NodeId>();
    nodeIds.forEach(nodeId =>
      nbhMap[nodeId].neighbourIds
        .filter(nId => posMap[nId] === undefined)
        .forEach(nId => neighbourIds.add(nId))
    );
    return neighbourIds;
  }

  private getGetWeightedNeighbourCenter(
    nodeId: NodeId,
    nbhMap: NeighbourHoodMap,
    posMap: PositionMap
  ): Position {
    const weightedCenter: Position = {x: 0.0, y: 0.0};
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
    return weightedCenter;
  }

  private createNeighbourHoodMap(
    graphData: GraphElementData
  ): NeighbourHoodMap {
    const nbhMap: NeighbourHoodMap = {};

    for (const node of graphData.nodeData) {
      nbhMap[node.id] = {neighbourIds: [], neighbourWeights: {}};
    }
    for (const edge of graphData.edgeData.filter(e => e.source !== e.target)) {
      const targetNBH = nbhMap[edge.target];
      if (targetNBH) {
        targetNBH.neighbourWeights[edge.source] =
          (targetNBH.neighbourWeights[edge.source] || 0) + 1;
      }
      const sourceNBH = nbhMap[edge.source];
      if (sourceNBH) {
        sourceNBH.neighbourWeights[edge.target] =
          (sourceNBH.neighbourWeights[edge.target] || 0) + 1;
      }
    }
    for (const node of graphData.nodeData) {
      const nbh = nbhMap[node.id];
      nbh.neighbourIds = Object.keys(nbh.neighbourWeights);
    }

    return nbhMap;
  }

  private updateGhostPositions(): void {
    if (this.graphData!.ghostElements) {
      this.ghostModelPositions = {};
      this.boundaryGhostNodeIds = [];
      this.setKnownNodePos(
        this.graphData!.ghostElements.nodeData,
        this.ghostModelPositions,
        this.boundaryGhostNodeIds
      );

      if (this.boundaryGhostNodeIds.length > 0) {
        this.setUnknownGhostPositions();
      }
    } else {
      this.ghostModelPositions = null;
    }
    this.updateCache();
  }

  private setKnownNodePos(
    nodesData: CyNodeData[],
    posMap: PositionMap,
    boundaryNodeIds: NodeId[]
  ): void {
    for (const nodeData of nodesData) {
      const position = this.stationModelPositions[nodeData.station.id];
      if (position !== undefined) {
        posMap[nodeData.id] = position;
      } else {
        boundaryNodeIds.push(nodeData.id);
      }
    }
  }

  private setUnknownGhostPositions(): void {
    const posMap = {...this.ghostModelPositions};
    Object.assign(posMap, this.nodeModelPositions);

    const idsOfConnectedNodesWOPos = this.getNodesWoPosConnectedWithNodeWPos(
      this.graphData!.ghostElements!.edgeData,
      posMap
    );

    const nbhMap: NeighbourHoodMap = this.createNeighbourHoodMap(
      this.graphData!.ghostElements!
    );

    this.setConnectedPositions(idsOfConnectedNodesWOPos, nbhMap, posMap);

    this.graphData!.ghostElements!.nodeData.filter(
      n => this.ghostModelPositions![n.id] === undefined
    ).forEach(n => {
      const pos = posMap[n.id];
      this.ghostModelPositions![n.id] = pos ?? this.createDefaultPosition();
    });
  }

  private setConnectedPositions(
    idsOfConnectedNodesWOPos: Set<NodeId>,
    nbhMap: NeighbourHoodMap,
    posMap: PositionMap
  ): void {
    while (idsOfConnectedNodesWOPos.size > 0) {
      const newPosMap: PositionMap = {};

      idsOfConnectedNodesWOPos.forEach(nodeId => {
        const weightedCenter = this.getGetWeightedNeighbourCenter(
          nodeId,
          nbhMap,
          posMap
        );
        newPosMap[nodeId] = getNearestPointOnRect(
          weightedCenter,
          this.outerBoundaryRect!
        );
      });

      Object.assign(posMap, newPosMap);

      idsOfConnectedNodesWOPos = this.getNeighboursWoPosition(
        idsOfConnectedNodesWOPos,
        nbhMap,
        posMap
      );
    }
  }

  private repositionBoundaryNodesToAvoidOverlay(): void {
    if (this.boundaryNodeIds.length > 0) {
      const boundaryNodes = this.boundaryNodeIds.map(
        nodeId => this.graphData!.idToNodeMap[nodeId]
      );

      const nodesRect = this.getModelPositionsIncludingRect()!;

      const estimatedZoomFit = Math.min(
        GisPositioningService.REF_MAP_SIZE.width /
          (nodesRect.width > 0
            ? nodesRect.width
            : this.outerBoundaryRect!.width),
        GisPositioningService.REF_MAP_SIZE.height /
          (nodesRect.height > 0
            ? nodesRect.height
            : this.outerBoundaryRect!.height)
      );

      this.nodeModelPositions = getNonOverlayPositions(
        boundaryNodes,
        this.nodeModelPositions,
        GisPositioningService.REF_NODE_SIZE,
        estimatedZoomFit
      );
      const nodeDistances = this.boundaryNodeIds.map(nodeId => {
        const point = this.nodeModelPositions[nodeId];
        const pointOnRect = getNearestPointOnRect(
          point,
          this.outerBoundaryRect!
        );
        return Math.max(
          Math.abs(pointOnRect.x - point.x),
          Math.abs(pointOnRect.y - point.y)
        );
      });
      const maxNodeDist = Math.max(...nodeDistances);
      this.modelBorderWidth = maxNodeDist * 2;
    }
  }

  private getModelPositionsIncludingRect(): BoundaryRect | null {
    const nodePositions = Object.values(this.nodeModelPositions);

    return nodePositions.length === 0
      ? null
      : getEnclosingRectFromPoints(nodePositions);
  }
}
