import { FclElements, StationData } from './../../util/datatypes';
import { extractLayersFromPositions } from './layer-extractor';
import { assignToColumns } from './column-assigner';
import { Utils } from './../../util/utils';
import { NodeLayoutInfo, Position } from './datatypes';
import { setFarmToForkPositions, FoodChainOrientation, getFoodChainOrientation } from './farm-to-fork';

function createIndexMap<T>(arrays: T[][]): Map<T, number> {
    const result: Map<T, number> = new Map();
    for (let i = arrays.length - 1; i >= 0; i--) {
        for (const element of arrays[i]) {
            result.set(element, i);
        }
    }
    return result;
}

function createGrid(layers: StationData[][], columns: StationData[][]): StationData[][] {
    const layerMap: Map<StationData, number> = createIndexMap(layers);
    const columnMap: Map<StationData, number> = createIndexMap(columns);

    const result: StationData[][] = Utils.getMatrix(layers.length, columns.length, null as StationData);
    for (const station of [].concat(...layers)) {
        const layerIndex = layerMap.get(station);
        const columnIndex = columnMap.get(station);
        if (result[layerIndex][columnIndex] !== null) {
            throw new Error('Non unique grid mapping detected.');
        }
        result[layerIndex][columnIndex] = station;
    }
    return result;
}

/**
 * Returns a function that maps the position in the graph view to a top down position
 *
 * @param orientation orientation of the foodchain in the graph view
 * @return The mapping function: (graph view position) => top down position
 */
function getPositionMapping(orientation: FoodChainOrientation): (pos: Position) => Position {
    switch (orientation) {
        case FoodChainOrientation.LeftRight:
            return (pos: Position) => ({
                x: -pos.y,
                y: pos.x
            });
        default:
            throw new Error('Unsupported orientation');
    }
}

/**
 * Returns the mapped graph view positions
 *
 * @param data
 * @param nodeInfoMap station id => layout info map
 * @param orientation orientation of the foodchain in the graph view
 * @return A station => position map
 */
function getTopDownPositions(
    data: FclElements,
    nodeInfoMap: Map<string, NodeLayoutInfo>,
    orientation: FoodChainOrientation
    ): Map<StationData, Position> {

    const positionMapping = getPositionMapping(orientation);
    const result: Map<StationData, Position> = new Map();

    data.stations.filter(s => nodeInfoMap.has(s.id)).forEach(station => {
        result.set(station, positionMapping(nodeInfoMap.get(station.id).position));
    });
    return result;
}

/**
 * Returns a 2D array (grid) of stations (elements can be null). The positions in the grid are respecting the specified positions, but
 * if the supplied positions are not farm-to-fork-ish, farm-to-fork is performed and new computed positions are used instead.
 *
 * @param data
 * @param nodeInfoMap station id => layout info map
 * @return A 2D station array (first index is the layer index, 2nd index is the column index)
 */
export function assignToGrid(data: FclElements, nodeInfoMap: Map<string, NodeLayoutInfo>) {
    let orientation = getFoodChainOrientation(data, nodeInfoMap);
    if (orientation === null) {
        setFarmToForkPositions(data, nodeInfoMap);
        orientation = FoodChainOrientation.LeftRight;
    }
    // convert the position to a top down food chain hierarchy
    const stationToPositionMap = getTopDownPositions(data, nodeInfoMap, orientation);
    const layers = extractLayersFromPositions(data, stationToPositionMap);
    const columns = assignToColumns(layers, stationToPositionMap);
    return createGrid(layers, columns);
}
