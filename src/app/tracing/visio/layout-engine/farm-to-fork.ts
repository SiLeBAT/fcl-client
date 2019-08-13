import * as _ from 'lodash';
import { StationData, DeliveryData } from '../../data.model';
import { Graph, Vertex } from '../../layout/farm-to-fork/data-structures';
import { FarmToForkLayouter } from '../../layout/farm-to-fork/farm-to-fork';
import { BusinessTypeRanker } from '../../layout/farm-to-fork/business-type-ranker';
import { Position, NodeLayoutInfo } from './datatypes';
import { Utils } from '../../util/utils';

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
    nodeInfoMap: Map<string, NodeLayoutInfo>
    ): FoodChainOrientation {

    const deliveries = data.deliveries.filter(
        d => !d.invisible && nodeInfoMap.has(d.source) && nodeInfoMap.has(d.target));
    const deltas = deliveries.map(
        d => getNormalizedDelta(Utils.difference(
            nodeInfoMap.get(d.target).position,
            nodeInfoMap.get(d.source).position
            ))).filter(d => d.x !== 0 || d.y !== 0);

    if (deltas.length > 0) {
        const meanDelta = {
            x: _.mean(deltas.map(d => d.x)),
            y: _.mean(deltas.map(d => d.y))
        };
        if (meanDelta.x > 1 / Math.sqrt(2)) {
            return FoodChainOrientation.LeftRight;
        } else {
            return null;
        }
    } else {
        return null;
    }
}

export function isFarmToForkLayout(data: FclElements, nodeInfoMap: Map<string, NodeLayoutInfo>): boolean {
    return getFoodChainOrientation(data, nodeInfoMap) === FoodChainOrientation.LeftRight;
}

/**
 * Performs a farm to fork layout and update the nodeInfoMap
 *
 * @param data
 * @param nodeInfoMap station id => layout info
 */
export function setFarmToForkPositions(data: FclElements, nodeInfoMap: Map<string, NodeLayoutInfo>) {
    const graph = new Graph();
    const vertices: Map<string, Vertex> = new Map();
    const typeRanker: BusinessTypeRanker = new BusinessTypeRanker([], [], []);
    const stations = data.stations.filter(s => nodeInfoMap.has(s.id));
    const idToStationMap: Map<string, StationData> = Utils.arrayToMap(stations, (s) => s.id);

    for (const station of data.stations.filter(s => nodeInfoMap.has(s.id))) {
        const v: Vertex = new Vertex();
        const properties = station.properties.filter(p => p.name === 'typeOfBusiness');
        if (properties.length > 0) {
            v.typeCode = typeRanker.getBusinessTypeCode(properties[0].value);
        }
        v.size = nodeInfoMap.get(station.id).size;
        v.name = station.name;
        vertices.set(station.id, v);
        graph.insertVertex(v);
    }

    const vertexDistance: number = Math.min(...graph.vertices.map(v => v.size)) / 2;

    data.deliveries.filter(
        d => !d.invisible && idToStationMap.has(d.source) && idToStationMap.has(d.target)
    ).forEach(d => {
        graph.insertEdge(
            vertices.get(d.source),
            vertices.get(d.target)
          );
    });

    // tslint:disable-next-line
    const layoutManager: FarmToForkLayouter = new FarmToForkLayouter(
        graph,
        typeRanker
    );

    layoutManager.layout(vertexDistance);
    for (let i = stations.length - 1; i >= 0; i--) {
        nodeInfoMap.get(stations[i].id).position = {
            // primary producers are supposed to be in the last layer
            x: -graph.vertices[i].layerIndex,
            y: graph.vertices[i].y
        };
    }
}
