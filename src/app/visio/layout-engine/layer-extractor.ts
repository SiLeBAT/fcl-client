import { FclElements, StationData } from '../../util/datatypes';

function getNormalizedValues(x: number[]): number[] {
    const min_x: number = Math.min(...x);
    const max_x: number = Math.max(...x);
    return x.map(v => (v - min_x) / (max_x - min_x));
}

function getLayerIndices(x: number[]): number[] {
    x = getNormalizedValues(x);
    const maxDist = 0.1;
    const layers: {x: number, index: number}[] = [];
    const iToLayer: {x: number, index: number}[] = [];
    for (let i: number = x.length - 1; i >= 0; i--) {
        let noLayer = true;
        for (let k: number = layers.length - 1; k >= 0; --k) {
            if (Math.abs(layers[k].x - x[i]) < maxDist) {
                iToLayer[i] = layers[k];
                noLayer = false;
                break;
            }
        }
        if (noLayer) {
            layers.push({
                x: x[i],
                index: null
            });
            iToLayer[i] = layers[layers.length - 1];
        }
    }
    layers.sort((L1, L2) => L1.x - L2.x);
    for (let k = layers.length - 1; k >= 0; k--) {
        layers[k].index = k;
    }
    return iToLayer.map(L => L.index);
}

export function extractLayersFromView(data: FclElements): StationData[][] {
    const stations: StationData[] = data.stations.filter(s => !s.invisible && !s.contained);
    const layers: StationData[][] = [];
    const iToLayerIndex: number[] = getLayerIndices(stations.map(s => s.position.x));
    for (let i = Math.max(...iToLayerIndex); i >= 0; i--) {
        layers[i] = [];
    }
    for (let i = iToLayerIndex.length - 1; i >= 0; i--) {
        layers[iToLayerIndex[i]].push(stations[i]);
    }
    for (const layer of layers) {
        layer.sort((station1, station2) => station1.position.y - station2.position.y);
    }

    return layers; // .reverse();
}
