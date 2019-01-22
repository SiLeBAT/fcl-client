import * as _ from 'lodash';
import {VisioGraph, VisioContainer, VisioBox, VisioReporter, StationInformation, StationGrouper, GridCell} from './datatypes';
import {LotInformation, Size, Position, SampleInformation} from './datatypes';
import {FclElements, StationData, DeliveryData} from '../../util/datatypes';
import {StationByCountryGrouper} from './station-by-country-grouper';
import { Utils } from './../../util/utils';

interface CellGroup {
    label: string;
    cells: GridCell[];
}

class CellGrouper {
    private stationGrid: StationData[][];
    private rowCount: number;
    private columnCount: number;
    // private groupStationTogether: (s1: StationData, s2: StationData) => boolean;
    private stationGrouper: StationGrouper;
    private groupAssignment: number[][];
    private groupLabel: string[];

    groupCells(stationGrid: StationData[][], stationGrouper: StationGrouper): CellGroup[] {
        this.stationGrid = stationGrid;
        this.rowCount =  this.stationGrid.length;
        this.columnCount = this.stationGrid[0].length;
        this.stationGrouper = stationGrouper;
        // this.groupStationTogether = groupStationTogether;

        this.groupAssignment = Utils.getMatrix(this.rowCount, this.columnCount, -1);
        this.groupLabel = [];

        let groupIndex = -1;

        for (let r = 0; r < this.rowCount; r++) {
            for (let c = 0; c < this.columnCount; c++) {
                if (this.stationGrid[r][c] !== null && this.groupAssignment[r][c] < 0) {
                    this.groupAssignment[r][c] = ++groupIndex;
                    this.groupLabel[groupIndex] = stationGrouper.getGroupLabel(this.stationGrid[r][c]);
                    this.extendGroup(r, c);
                }
            }
        }

        return this.createGroups();
    }

    private extendGroup(row: number, column: number) {
        if (row > 0 &&
            this.groupAssignment[row - 1][column] < 0 &&
            this.stationGrid[row - 1][column] != null &&
            this.stationGrouper.areStationsInTheSameGroup(this.stationGrid[row][column], this.stationGrid[row - 1][column])) {
            this.groupAssignment[row - 1][column] = this.groupAssignment[row][column];
            this.extendGroup(row - 1, column);
        }
        if (column < this.columnCount - 1 &&
            this.groupAssignment[row][column + 1] < 0 &&
            this.stationGrid[row][column + 1] != null &&
            this.stationGrouper.areStationsInTheSameGroup(this.stationGrid[row][column], this.stationGrid[row][column + 1])) {
            this.groupAssignment[row][column + 1] = this.groupAssignment[row][column];
            this.extendGroup(row, column + 1);
        }
        if (row < this.rowCount - 1 &&
            this.groupAssignment[row + 1][column] < 0 &&
            this.stationGrid[row + 1][column] != null &&
            this.stationGrouper.areStationsInTheSameGroup(this.stationGrid[row][column], this.stationGrid[row + 1][column])) {
            this.groupAssignment[row + 1][column] = this.groupAssignment[row][column];
            this.extendGroup(row + 1, column);
        }

        if (column > 0 &&
            this.groupAssignment[row][column - 1] < 0 &&
            this.stationGrid[row][column - 1] != null &&
            this.stationGrouper.areStationsInTheSameGroup(this.stationGrid[row][column], this.stationGrid[row][column - 1])) {
            this.groupAssignment[row][column - 1] = this.groupAssignment[row][column];
            this.extendGroup(row, column - 1);
        }
    }

    private createGroups(): CellGroup[] {
        const groups: CellGroup[] = [];
        const maxGroupIndex = Math.max(...this.groupAssignment.map(r => Math.max(...r)));

        for (let i = maxGroupIndex; i >= 0; i--) {
            groups[i] = {
                label: this.groupLabel[i],
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
    stationGrouper: StationGrouper
    ): {label: string, cells: GridCell[]}[] {

        const cellGrouping = new CellGrouper();
        return cellGrouping.groupCells(stationGrid, stationGrouper);
}
