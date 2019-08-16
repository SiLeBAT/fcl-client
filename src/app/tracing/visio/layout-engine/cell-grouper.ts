import * as _ from 'lodash';
import { GridCell } from './datatypes';
import { StationData } from '../../data.model';
import { Utils } from './../../util/non-ui-utils';
import { CellGapCloser } from './cellgap-closer';

interface CellGroup {
    label: string;
    cells: GridCell[];
}

interface StationGroup {
    label: string;
    stations: StationData[];
}

class CellGrouper {

    private rowCount: number;
    private columnCount: number;
    private visGroupAssignment: number[][];
    private logGroupAssignment: number[][];
    private stationGroups: StationGroup[];
    private visGroupToLogicalGroupIndex: number[];

    groupCells(stationGrid: StationData[][], stationGroups: StationGroup[]): CellGroup[] {

        this.rowCount = stationGrid.length;
        this.columnCount = stationGrid[0].length;
        this.stationGroups = stationGroups;
        this.initStationToGroupMap(stationGrid);

        this.visGroupAssignment = Utils.getMatrix(this.rowCount, this.columnCount, -1);

        let groupIndex = -1;

        for (let r = 0; r < this.rowCount; r++) {
            for (let c = 0; c < this.columnCount; c++) {
                if (this.logGroupAssignment[r][c] >= 0 && this.visGroupAssignment[r][c] < 0) {
                    this.visGroupAssignment[r][c] = ++groupIndex;
                    this.visGroupToLogicalGroupIndex[groupIndex] = this.logGroupAssignment[r][c];
                    this.extendGroup(r, c);
                }
            }
        }

        return this.createGroups();
    }

    private initStationToGroupMap(stationGrid: StationData[][]) {
        const stationToLogicalGroupIndexMap: Map<StationData, number> = new Map();
        this.visGroupToLogicalGroupIndex = [];
        this.stationGroups.forEach((value, index) => value.stations.forEach(s => stationToLogicalGroupIndexMap.set(s, index)));

        this.logGroupAssignment = Utils.getMatrix(this.rowCount, this.columnCount, -1);
        for (let r = 0; r < this.rowCount; r++) {
            for (let c = 0; c < this.columnCount; c++) {
                if (stationGrid[r][c] !== null) {
                    this.logGroupAssignment[r][c] = stationToLogicalGroupIndexMap.get(stationGrid[r][c]);
                }
            }
        }
        this.logGroupAssignment = CellGapCloser.closeGaps(this.logGroupAssignment);
    }

    private extendGroup(row: number, column: number) {
        if (row > 0 &&
            this.visGroupAssignment[row - 1][column] < 0 &&
            this.logGroupAssignment[row - 1][column] === this.logGroupAssignment[row][column]) {
            this.visGroupAssignment[row - 1][column] = this.visGroupAssignment[row][column];
            this.extendGroup(row - 1, column);
        }
        if (column < this.columnCount - 1 &&
            this.visGroupAssignment[row][column + 1] < 0 &&
            this.logGroupAssignment[row][column + 1] === this.logGroupAssignment[row][column]) {
            this.visGroupAssignment[row][column + 1] = this.visGroupAssignment[row][column];
            this.extendGroup(row, column + 1);
        }
        if (row < this.rowCount - 1 &&
            this.visGroupAssignment[row + 1][column] < 0 &&
            this.logGroupAssignment[row + 1][column] === this.logGroupAssignment[row][column]) {
            this.visGroupAssignment[row + 1][column] = this.visGroupAssignment[row][column];
            this.extendGroup(row + 1, column);
        }
        if (column > 0 &&
            this.visGroupAssignment[row][column - 1] < 0 &&
            this.logGroupAssignment[row][column - 1] === this.logGroupAssignment[row][column]) {
            this.visGroupAssignment[row][column - 1] = this.visGroupAssignment[row][column];
            this.extendGroup(row, column - 1);
        }
    }

    private createGroups(): CellGroup[] {
        const groups: CellGroup[] = [];
        const maxGroupIndex = Math.max(...this.visGroupAssignment.map(r => Math.max(...r)));

        for (let i = maxGroupIndex; i >= 0; i--) {
            groups[i] = {
                label: this.stationGroups[this.visGroupToLogicalGroupIndex[i]].label,
                cells: []
            };
        }

        for (let r = 0; r < this.rowCount; r++) {
            for (let c = 0; c < this.columnCount; c++) {
                if (this.visGroupAssignment[r][c] >= 0) {
                    groups[this.visGroupAssignment[r][c]].cells.push({ row: r, column: c });
                }
            }
        }

        return groups.filter(g => g.cells.length > 0);
    }

}

export function getCellGroups(
    stationGrid: StationData[][],
    stationGroups: StationGroup[]
    ): {label: string, cells: GridCell[]}[] {

    const cellGrouping = new CellGrouper();
    return cellGrouping.groupCells(stationGrid, stationGroups);
}
