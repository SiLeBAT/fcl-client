import * as _ from 'lodash';
import { StationData } from '../../util/datatypes';
import { Position } from './datatypes';

class ColumnAssigner {

    private layers: StationData[][];
    private connections: Map<StationData, StationData[]>;
    private stationToLayerIndexMap: Map<StationData, number>;
    private stations: StationData[];
    private positions: number[];
    private columnSwitch: boolean[];

    private static getStationToLayerIndexMap(layers: StationData[][]): Map<StationData, number> {
        const result: Map<StationData, number> = new Map();
        for (let i = layers.length - 1; i >= 0; i--) {
            for (const station of layers[i]) {
                result.set(station, i);
            }
        }
        return result;
    }

    assignToColumns(
        layers: StationData[][],
        stationToPositionMap: Map<StationData, Position>
        ): StationData[][] {

        this.stationToLayerIndexMap = ColumnAssigner.getStationToLayerIndexMap(layers);
        this.stations = [].concat(...layers);
        this.stations.sort((s1, s2) => stationToPositionMap.get(s1).x - stationToPositionMap.get(s2).x);
        this.positions = this.stations.map(s => stationToPositionMap.get(s).x);
        this.setSwitches();

        return this.createColumns();
    }

    private setSwitches() {
        this.columnSwitch = Array(this.stations.length - 1).fill(false);
        this.insertLevelNeighbourSwitch();
    }

    private insertLevelNeighbourSwitch() {
        const layerIndexSet: Set<number> = new Set();
        layerIndexSet.add(this.stationToLayerIndexMap.get(this.stations[0]));

        for (let i = 1, n = this.stations.length; i < n ; i++) {
            const layerIndex = this.stationToLayerIndexMap.get(this.stations[i]);

            this.columnSwitch[i - 1] = layerIndexSet.has(layerIndex);
            if (this.columnSwitch[i - 1]) {
                layerIndexSet.clear();
            }
            layerIndexSet.add(layerIndex);
        }
    }

    private areStationsOnSameLayer(station1: StationData, station2: StationData): boolean {
        return this.stationToLayerIndexMap.get(station1) === this.stationToLayerIndexMap.get(station2);
    }

    private insertStationCrossingSwitch() {
        let indexTo = this.stations.length - 1;
        while (indexTo > 0) {
            let indexBeforeFrom = indexTo - 1;
            while (indexBeforeFrom && !this.columnSwitch[indexBeforeFrom]) {
                indexBeforeFrom--;
            }
            this.insertSegmentSwitches(indexBeforeFrom + 1, indexTo);
            indexTo = indexBeforeFrom;
        }
    }

    private insertSegmentSwitches(indexFrom: number, indexTo: number) {
        if ((indexTo - indexFrom) > 1) {
            const distances: { distance: number, index: number}[] = [];
            for (let i = indexFrom; i < indexTo; i++) {
                distances.push({
                    distance: this.positions[i + 1] - this.positions[i],
                    index: i
                });
            }
            distances.sort((d1, d2) => d2.distance - d1.distance); // decreasing sort, because we are going to pop the smallest element

            const layerOcc: boolean[] = Array(this.layers.length).fill(false);
            while (distances.length > 0) {
                const distance = distances.pop();
                const layerIndices: number[] = [
                    this.stationToLayerIndexMap.get(this.stations[distance.index]),
                    this.stationToLayerIndexMap.get(this.stations[distance.index + 1])
                ];
                layerIndices.sort();
                for (let i = layerIndices[0]; i <= layerIndices[1]; i++) {
                    if (layerOcc[i]) {
                        this.columnSwitch[distance.index] = true;
                        this.insertSegmentSwitches(indexFrom, distance.index);
                        this.insertSegmentSwitches(distance.index + 1, indexTo);
                        return;
                    }
                }
            }
        }
    }

    private createColumns(): StationData[][] {
        const nColumnSwitches = _.sum(this.columnSwitch) + 1;
        const result: StationData[][] = [];
        for (let c = nColumnSwitches - 1; c >= 0; c--) {
            result[c] = [];
        }
        if (this.stations.length > 0) {
            result[0].push(this.stations[0]);
            let c = 0;
            // tslint:disable-next-line:one-variable-per-declaration
            for (let i = 1, n = this.stations.length; i < n; i++) {
                if (this.columnSwitch[i - 1]) {
                    c++;
                }
                result[c].push(this.stations[i]);
            }
        }
        return result;
    }
}

/**
 * Partitions the layered stations into columns respecting the specified positions, which means
 * col(station1) < col(station2) requires posX(station1) <= posX(station2)
 *
 * @param layers Layered stations (ragged array)
 * @param stationToPositionMap station => position map
 * @returns A column array (column = station array)
 */
export function assignToColumns(
    layers: StationData[][],
    stationToPositionMap: Map<StationData, Position>
    ): StationData[][] {

    const columnAssigner = new ColumnAssigner();
    return columnAssigner.assignToColumns(layers, stationToPositionMap);
}
