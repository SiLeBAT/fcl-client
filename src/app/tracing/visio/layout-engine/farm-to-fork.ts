import * as _ from 'lodash';
import { StationData, DeliveryData, StationId } from '../../data.model';
import { Graph, Vertex } from '../../layout/farm-to-fork/data-structures';
import { FarmToForkLayouter } from '../../layout/farm-to-fork/farm-to-fork';
import { BusinessTypeRanker } from '../../layout/farm-to-fork/business-type-ranker';
import { Position } from './datatypes';
import { Utils } from '../../util/non-ui-utils';
import { getDifference } from '@app/tracing/util/geometry-utils';

export enum FoodChainOrientation {
    TopDown, LeftRight, BottomUp, RightLeft
}

interface FclElements {
    stations: StationData[];
    deliveries: DeliveryData[];
}

function getNormalizedDelta(delta: Position): Position {
    const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);
    if (distance === 0) {
        return delta;
    } else {
        return {
            x: delta.x / distance,
            y: delta.y / distance
        };
    }
}

/**
 * Retrieves the orientation of the food chain in the graph view, on the bases of the deliveries
 *
 * @param data
 * @param nodeInfoMap station id => layout info
 */
export function getFoodChainOrientation(
    data: FclElements,
    // nodeInfoMap: Map<string, NodeLayoutInfo>
    statIdToPosMap: Record<StationId, Position>
): FoodChainOrientation | undefined {

    const visibleStations = data.stations.filter(s => !s.invisible && !s.contained);

    if (visibleStations.some(s => statIdToPosMap[s.id] === undefined)) {
        return undefined;
    } else {
        const relevantDeliveries = data.deliveries.filter(delivery =>
            !delivery.invisible &&
            delivery.source !== delivery.target &&
            statIdToPosMap[delivery.source] !== undefined && // this is supposed to be a redundant check
            statIdToPosMap[delivery.target] !== undefined    // this is supposed to be a redundant check
        );
        const deltas = relevantDeliveries.map(
            d => getNormalizedDelta(getDifference(
                statIdToPosMap[d.target],
                statIdToPosMap[d.source]
            ))
        ).filter(d => d.x !== 0 || d.y !== 0);

        if (deltas.length > 0) {
            const meanDelta = {
                x: _.mean(deltas.map(d => d.x)),
                y: _.mean(deltas.map(d => d.y))
            };
            if (meanDelta.x > 1 / Math.sqrt(2)) {
                return FoodChainOrientation.LeftRight;
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }
}

export function isFarmToForkLayout(data: FclElements, statIdToPosMap: Record<StationId, Position>): boolean {
    return getFoodChainOrientation(data, statIdToPosMap) === FoodChainOrientation.LeftRight;
}

/**
 * Performs a farm to fork layout and update the nodeInfoMap
 *
 * @param data
 * @param statIdToPosMap station id => station position
 */
export function setFarmToForkPositions(data: FclElements, statIdToPosMap: Record<StationId, Position>) {
    const graph = new Graph();
    const vertices: Map<string, Vertex> = new Map();
    const typeRanker: BusinessTypeRanker = new BusinessTypeRanker([], [], []);
    const visibleStations = data.stations.filter(s => statIdToPosMap[s.id] !== undefined);
    const idToStationMap: Map<string, StationData> = Utils.arrayToMap(visibleStations, (s) => s.id);

    const stationSize = 20;
    const vertexDistance = stationSize;

    for (const station of visibleStations) {
        const v: Vertex = new Vertex();
        const properties = station.properties.filter(p => p.name === 'typeOfBusiness');
        if (properties.length > 0) {
            v.typeCode = typeRanker.getBusinessTypeCode(properties[0].value as string);
        }
        v.outerSize = stationSize;
        v.topPadding = v.outerSize / 2;
        v.bottomPadding = v.topPadding;
        v.innerSize = 0;
        v.name = station.name;
        vertices.set(station.id, v);
        graph.insertVertex(v);
    }

    data.deliveries.filter(
        d => !d.invisible && idToStationMap.has(d.source) && idToStationMap.has(d.target)
    ).forEach(d => {
        graph.insertEdge(
            vertices.get(d.source),
            vertices.get(d.target)
          );
    });

    const availableSpace = {
        width: undefined,
        height: undefined
    };
    // tslint:disable-next-line
    const layoutManager: FarmToForkLayouter = new FarmToForkLayouter(
        graph,
        typeRanker,
        availableSpace
    );

    layoutManager.layout(vertexDistance, availableSpace);
    for (let i = visibleStations.length - 1; i >= 0; i--) {
        statIdToPosMap[visibleStations[i].id] = {
            // primary producers are supposed to be in the last layer
            x: -graph.vertices[i].layerIndex,
            y: graph.vertices[i].y
        };
    }
}
