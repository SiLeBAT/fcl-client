import * as _ from 'lodash';
import { StationGrouper, GridCell } from './datatypes';
import { StationData } from '../../util/datatypes';
import { Utils } from './../../util/utils';

interface CellGroup {
    label: string;
    cells: GridCell[];
}

interface StationGroup {
    label: string;
    stations: StationData[];
}

class CellGrouper {
    private stationGrid: StationData[][];
    private rowCount: number;
    private columnCount: number;
    // private groupStationTogether: (s1: StationData, s2: StationData) => boolean;
    // private stationGrouper: StationGrouper;
    private groupAssignment: number[][];
    private stationGroups: StationGroup[];
    private stationToLogicalGroupIndexMap: Map<StationData, number>;
    // private groupLabel: string[];
    private visGroupToLogicalGroupIndex: number[];

    groupCells(stationGrid: StationData[][], stationGroups: StationGroup[]): CellGroup[] {
        this.stationGrid = stationGrid;
        this.stationGroups = stationGroups;
        this.initStationToGroupMap();
        this.rowCount = this.stationGrid.length;
        this.columnCount = this.stationGrid[0].length;

        this.groupAssignment = Utils.getMatrix(this.rowCount, this.columnCount, -1);

        let groupIndex = -1;

        for (let r = 0; r < this.rowCount; r++) {
            for (let c = 0; c < this.columnCount; c++) {
                if (this.stationGrid[r][c] !== null && this.groupAssignment[r][c] < 0) {
                    this.groupAssignment[r][c] = ++groupIndex;
                    this.visGroupToLogicalGroupIndex[groupIndex] = this.stationToLogicalGroupIndexMap.get(this.stationGrid[r][c]);
                    this.extendGroup(r, c);
                }
            }
        }

        return this.createGroups();
    }

    private initStationToGroupMap() {
        this.visGroupToLogicalGroupIndex = [];
        this.stationToLogicalGroupIndexMap = new Map();
        this.stationGroups.forEach((value, index) => value.stations.forEach(s => this.stationToLogicalGroupIndexMap.set(s, index)));
    }

    private areStationsInTheSameGroup(station1: StationData, station2: StationData): boolean {
        return this.stationToLogicalGroupIndexMap.get(station1) === this.stationToLogicalGroupIndexMap.get(station2);
    }

    private extendGroup(row: number, column: number) {
        if (row > 0 &&
            this.groupAssignment[row - 1][column] < 0 &&
            this.stationGrid[row - 1][column] != null &&
            this.areStationsInTheSameGroup(this.stationGrid[row][column], this.stationGrid[row - 1][column])) {
            this.groupAssignment[row - 1][column] = this.groupAssignment[row][column];
            this.extendGroup(row - 1, column);
        }
        if (column < this.columnCount - 1 &&
            this.groupAssignment[row][column + 1] < 0 &&
            this.stationGrid[row][column + 1] != null &&
            this.areStationsInTheSameGroup(this.stationGrid[row][column], this.stationGrid[row][column + 1])) {
            this.groupAssignment[row][column + 1] = this.groupAssignment[row][column];
            this.extendGroup(row, column + 1);
        }
        if (row < this.rowCount - 1 &&
            this.groupAssignment[row + 1][column] < 0 &&
            this.stationGrid[row + 1][column] != null &&
            this.areStationsInTheSameGroup(this.stationGrid[row][column], this.stationGrid[row + 1][column])) {
            this.groupAssignment[row + 1][column] = this.groupAssignment[row][column];
            this.extendGroup(row + 1, column);
        }

        if (column > 0 &&
            this.groupAssignment[row][column - 1] < 0 &&
            this.stationGrid[row][column - 1] != null &&
            this.areStationsInTheSameGroup(this.stationGrid[row][column], this.stationGrid[row][column - 1])) {
            this.groupAssignment[row][column - 1] = this.groupAssignment[row][column];
            this.extendGroup(row, column - 1);
        }
    }

    private simplifyGroups() {
        for (let r = 0; r < this.rowCount; r++) {
            for (let c = 0; c < this.columnCount; c++) {
                if (this.groupAssignment[r][c] < 0) {

                }
            }
        }
    }

    private createGroups(): CellGroup[] {
        const groups: CellGroup[] = [];
        const maxGroupIndex = Math.max(...this.groupAssignment.map(r => Math.max(...r)));

        for (let i = maxGroupIndex; i >= 0; i--) {
            groups[i] = {
                label: this.stationGroups[this.visGroupToLogicalGroupIndex[i]].label,
                cells: []
            };
        }

        for (let r = 0; r < this.rowCount; r++) {
            for (let c = 0; c < this.columnCount; c++) {
                if (this.groupAssignment[r][c] >= 0) {
                    groups[this.groupAssignment[r][c]].cells.push({row: r, column: c});
                }
            }
        }

        return groups;
    }

}

export function getCellGroups(
    stationGrid: StationData[][],
    stationGroups: StationGroup[]
    ): {label: string, cells: GridCell[]}[] {

    const cellGrouping = new CellGrouper();
    return cellGrouping.groupCells(stationGrid, stationGroups);
}
