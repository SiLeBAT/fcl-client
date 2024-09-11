import {
  StationData,
  DeliveryData,
  StationId,
  DeliveryId,
  Range,
} from '../../data.model';
import {Graph, Vertex} from '../../layout/farm-to-fork/data-structures';
import {FarmToForkLayouter} from '../../layout/farm-to-fork/farm-to-fork';
import {BusinessTypeRanker} from '../../layout/farm-to-fork/business-type-ranker';
import {Position} from './datatypes';
import {Utils} from '../../util/non-ui-utils';

export enum FoodChainOrientation {
  TopDown,
  LeftRight,
  BottomUp,
  RightLeft,
}

interface FarmToForkGroups {
  forks: StationData[];
  unconnectedStations: StationData[];
  otherStations: StationData[];
}
interface FclElements {
  stations: StationData[];
  deliveries: DeliveryData[];
}

function getFarmToForkGroups(
  stations: StationData[],
  deliveries: DeliveryData[]
): FarmToForkGroups {
  const visDel: Record<DeliveryId, boolean> = {};
  deliveries.forEach(d => (visDel[d.id] = true));
  const result: FarmToForkGroups = {
    forks: [],
    unconnectedStations: [],
    otherStations: [],
  };
  for (const station of stations) {
    const hasNoInDel =
      station.incoming.filter(delId => visDel[delId]).length === 0;
    const hasNoOutDel =
      station.outgoing.filter(delId => visDel[delId]).length === 0;
    if (hasNoOutDel) {
      if (hasNoInDel) {
        result.unconnectedStations.push(station);
      } else {
        result.forks.push(station);
      }
    } else {
      result.otherStations.push(station);
    }
  }
  return result;
}

function getStationGroupXPosRanges(
  stationGroup: StationData[],
  statIdToPosMap: Record<StationId, Position>
): Range {
  if (stationGroup.length === 0) {
    return {min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY};
  } else {
    const pos = stationGroup.map(s => statIdToPosMap[s.id].x);
    return {
      min: Math.min(...pos),
      max: Math.max(...pos),
    };
  }
}

function doRangesRespectOrdering(ranges: Range[]): boolean {
  let lowerBound = Number.NEGATIVE_INFINITY;
  for (const range of ranges) {
    if (range.min <= lowerBound) {
      return false;
    }
    lowerBound = range.max;
  }

  let upperBound = Number.POSITIVE_INFINITY;
  for (const range of ranges.slice().reverse()) {
    if (range.max >= upperBound) {
      return false;
    }
    upperBound = range.min;
  }
  return true;
}

function doStationXPosRespectGroupOrdering(
  stationGroupOrderings: StationData[][][],
  statIdToPosMap: Record<StationId, Position>
): boolean {
  for (const stationGroupOrdering of stationGroupOrderings) {
    const nonEmptyGroups = stationGroupOrdering.filter(
      group => group.length > 0
    );
    const groupPosRanges = nonEmptyGroups.map(group =>
      getStationGroupXPosRanges(group, statIdToPosMap)
    );
    if (!doRangesRespectOrdering(groupPosRanges)) {
      return false;
    }
  }
  return true;
}

const MAX_LEFT_RIGHT_VIOLATION_QUOTA = 0.1;

/**
 * Retrieves the orientation of the food chain in the graph view, on the bases of the deliveries
 *
 * @param data
 * @param statIdToPosMap station id => Position
 */
export function getFoodChainOrientation(
  data: FclElements,
  statIdToPosMap: Record<StationId, Position>
): FoodChainOrientation | undefined {
  const visibleStations = data.stations.filter(
    s => !s.invisible && !s.contained
  );

  if (visibleStations.some(s => statIdToPosMap[s.id] === undefined)) {
    return undefined;
  } else {
    const relevantDeliveries = data.deliveries.filter(
      delivery =>
        !delivery.invisible &&
        delivery.source !== delivery.target &&
        statIdToPosMap[delivery.source] !== undefined && // this is supposed to be a redundant check
        statIdToPosMap[delivery.target] !== undefined // this is supposed to be a redundant check
    );

    const stationGroups = getFarmToForkGroups(
      visibleStations,
      relevantDeliveries
    );

    if (
      !doStationXPosRespectGroupOrdering(
        [
          [stationGroups.otherStations, stationGroups.forks],
          [stationGroups.otherStations, stationGroups.unconnectedStations],
        ],
        statIdToPosMap
      )
    ) {
      return undefined;
    }

    const xDeltas = relevantDeliveries.map(
      d => statIdToPosMap[d.target].x - statIdToPosMap[d.source].x
    );

    const leftRightViolationCount = xDeltas.filter(d => d < 0).length;
    const leftRightViolationQuota =
      leftRightViolationCount / (xDeltas.length === 0 ? 1 : xDeltas.length);

    if (
      xDeltas.length > 0 &&
      leftRightViolationQuota <= MAX_LEFT_RIGHT_VIOLATION_QUOTA
    ) {
      return FoodChainOrientation.LeftRight;
    } else {
      return undefined;
    }
  }
}

export function isFarmToForkLayout(
  data: FclElements,
  statIdToPosMap: Record<StationId, Position>
): boolean {
  return (
    getFoodChainOrientation(data, statIdToPosMap) ===
    FoodChainOrientation.LeftRight
  );
}

/**
 * Performs a farm to fork layout and update the nodeInfoMap
 *
 * @param data
 * @param statIdToPosMap station id => station position
 */
export function setFarmToForkPositions(
  data: FclElements,
  statIdToPosMap: Record<StationId, Position>
) {
  const graph = new Graph();
  const vertices = new Map<string, Vertex>();
  const typeRanker: BusinessTypeRanker = new BusinessTypeRanker([], [], []);
  const visibleStations = data.stations.filter(
    s => statIdToPosMap[s.id] !== undefined
  );
  const idToStationMap = Utils.arrayToMap(visibleStations, s => s.id);

  const stationSize = 20;
  const vertexDistance = stationSize;

  for (const station of visibleStations) {
    const v = new Vertex();
    const properties = station.properties.filter(
      p => p.name === 'typeOfBusiness'
    );
    if (properties.length > 0) {
      v.typeCode = typeRanker.getBusinessTypeCode(
        properties[0].value as string
      );
    }
    v.outerSize = stationSize;
    v.topPadding = v.outerSize / 2;
    v.bottomPadding = v.topPadding;
    v.innerSize = 0;
    v.name = station.name;
    vertices.set(station.id, v);
    graph.insertVertex(v);
  }

  data.deliveries
    .filter(
      d =>
        !d.invisible &&
        idToStationMap.has(d.source) &&
        idToStationMap.has(d.target)
    )
    .forEach(d => {
      graph.insertEdge(vertices.get(d.source)!, vertices.get(d.target)!);
    });

  // eslint-disable-next-line
    const layoutManager: FarmToForkLayouter = new FarmToForkLayouter(graph, typeRanker);

  layoutManager.layout(vertexDistance);
  for (let i = visibleStations.length - 1; i >= 0; i--) {
    statIdToPosMap[visibleStations[i].id] = {
      // primary producers are supposed to be in the last layer
      x: -graph.vertices[i].layerIndex,
      y: graph.vertices[i].y,
    };
  }
}
