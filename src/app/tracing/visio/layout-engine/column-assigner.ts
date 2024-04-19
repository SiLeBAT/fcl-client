import { concat } from '@app/tracing/util/non-ui-utils';
import * as _ from 'lodash';
import { StationData } from '../../data.model';
import { Position } from './datatypes';

class ColumnAssigner {

    private stationToLayerIndexMap: Map<StationData, number>;
    private stations: StationData[];
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
        this.stations = concat(...layers);
        if (this.stations.length === 0) {
            return [];
        }
        this.stations.sort((s1, s2) => stationToPositionMap.get(s1)!.x - stationToPositionMap.get(s2)!.x);
        this.setSwitches();

        return this.createColumns();
    }

    private setSwitches() {
        this.columnSwitch = Array(this.stations.length - 1).fill(false);
        this.insertLevelNeighbourSwitch();
    }

    private insertLevelNeighbourSwitch() {
        const layerIndexSet = new Set<number>();
        layerIndexSet.add(this.stationToLayerIndexMap.get(this.stations[0])!);

        for (let i = 1, n = this.stations.length; i < n ; i++) {
            const layerIndex = this.stationToLayerIndexMap.get(this.stations[i])!;

            this.columnSwitch[i - 1] = layerIndexSet.has(layerIndex);
            if (this.columnSwitch[i - 1]) {
                layerIndexSet.clear();
            }
            layerIndexSet.add(layerIndex);
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
            // eslint-disable-next-line one-var
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
