import { FclElements, Position, StationData } from './../../util/datatypes';
import { extractLayersFromView } from './layer-extractor';
import { assignToColumns } from './column-assigner';
import { Utils } from './../../util/utils';

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

    const result: StationData[][] = Utils.getMatrix(layers.length, columns.length, <StationData>null);
    for (const station of [].concat(...layers)) {
        result[layerMap.get(station)][columnMap.get(station)] = station;
    }
    return result;
}

export function assignToGrid(data: FclElements) {
    const layers = extractLayersFromView(data);
    const columns = assignToColumns(layers);
    return createGrid(layers, columns);
}
