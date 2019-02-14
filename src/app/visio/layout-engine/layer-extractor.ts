import { FclElements, StationData } from '../../util/datatypes';
import { Position } from './datatypes';

function getNormalizedValues(values: number[]): number[] {
    const minValue: number = Math.min(...values);
    const maxValue: number = Math.max(...values);
    const valueRange = maxValue - minValue;
    return values.map(v => (v - minValue) / valueRange);
}

function getLayerIndices(y: number[]): number[] {
    y = getNormalizedValues(y);
    const maxDist = 0.1;
    const layers: {y: number, index: number}[] = [];
    const iToLayer: {y: number, index: number}[] = [];
    for (let i: number = y.length - 1; i >= 0; i--) {
        let noLayer = true;
        for (let k: number = layers.length - 1; k >= 0; --k) {
            if (Math.abs(layers[k].y - y[i]) < maxDist) {
                iToLayer[i] = layers[k];
                noLayer = false;
                break;
            }
        }
        if (noLayer) {
            layers.push({
                y: y[i],
                index: null
            });
            iToLayer[i] = layers[layers.length - 1];
        }
    }
    layers.sort((L1, L2) => L1.y - L2.y);
    for (let k = layers.length - 1; k >= 0; k--) {
        layers[k].index = k;
    }
    return iToLayer.map(L => L.index);
}

/**
 * Partitions the stations into layers respecting the specified positions, which means
 * layer(station1) < layer(station2) requires posY(station1) < posY(station2)
 *
 * @param data
 * @param stationToPositionMap station => position map
 * @returns A layer array (layer = station array)
 */
export function extractLayersFromPositions(
    data: FclElements,
    stationToPositionMap: Map<StationData, Position>
    ): StationData[][] {

    const stations: StationData[] = data.stations.filter(s => stationToPositionMap.has(s));
    const layers: StationData[][] = [];
    const iToLayerIndex: number[] = getLayerIndices(stations.map(s => stationToPositionMap.get(s).y));
    for (let i = Math.max(...iToLayerIndex); i >= 0; i--) {
        layers[i] = [];
    }
    for (let i = iToLayerIndex.length - 1; i >= 0; i--) {
        layers[iToLayerIndex[i]].push(stations[i]);
    }
    for (const layer of layers) {
        layer.sort((station1, station2) => stationToPositionMap.get(station1).x - stationToPositionMap.get(station2).x);
    }

    return layers;
}
