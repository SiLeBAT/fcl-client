import * as _ from 'lodash';
import {
    VisioBox, GridCell, Polygon, CustomBoxShape,
    VisioLabel, GraphLayer, BoxType, Position, Size
} from './datatypes';
import { GraphSettings } from './graph-settings';
import { Utils } from '../../util/non-ui-utils';
import { getDifference } from '@app/tracing/util/geometry-utils';

type CellPolygon = GridCell[];

export class GroupContainerCreator {

    private rowTop: number[];
    private columnLeft: number[];
    private columnWidth: number[];
    private groupHeaderHeight: number;
    private boxGrid: VisioBox[][];
    private xMargin: number;
    private topMargin: number;
    private bottomMargin: number;

    createGroupBoxes(
        boxGrid: VisioBox[][],
        cellGroups: {label: VisioLabel; cells: GridCell[]}[],
        graphLayers: GraphLayer[]
    ): VisioBox[] {

        if (boxGrid.length === 0) {
            return [];
        }
        this.boxGrid = boxGrid;
        this.setRowAndColumnHeights(cellGroups, graphLayers);
        return cellGroups.map(group => this.createGroup(group.label, group.cells));
    }

    private createGroup(label: VisioLabel, cells: GridCell[]): VisioBox {
        const elements: VisioBox[] = [];
        const minRow = Math.min(...cells.map(cell => cell.row));
        const minColumn = Math.min(...cells.map(cell => cell.column));

        const labelCell = this.getLabelCell(cells, minRow);

        cells.filter(c => this.boxGrid[c.row][c.column] !== null).forEach(cell => {
            const box = this.boxGrid[cell.row][cell.column];
            box.relPosition = {
                x: this.columnLeft[cell.column] - this.columnLeft[minColumn] +
                    (this.columnWidth[cell.column] - GraphSettings.GRID_MARGIN - box.size.width) / 2,
                y: this.rowTop[cell.row] - this.rowTop[minRow] +
                    GraphSettings.GROUP_MARGIN + GraphSettings.GROUP_HEADER_HEIGHT
            };
            elements.push(box);
        });

        label.relPosition = {
            x: this.columnLeft[labelCell.column] - this.columnLeft[minColumn] + GraphSettings.GROUP_MARGIN,
            y: this.rowTop[labelCell.row] - this.rowTop[minRow] + GraphSettings.GROUP_MARGIN
        };

        const position = {
            x: this.columnLeft[minColumn] + GraphSettings.GRID_MARGIN,
            y: this.rowTop[minRow] + GraphSettings.GRID_MARGIN
        };

        const shape = this.createGroupShape(cells, { row: minRow, column: minColumn });

        return {
            type: BoxType.StationGroup,
            relPosition: position,
            position: null,
            elements: elements,
            size: this.getSize(shape.outerBoundary),
            ports: [],
            label: label,
            shape: shape
        };
    }

    private getSize(polygon: Polygon): Size {
        const x = polygon.map(p => p.x);
        const y = polygon.map(p => p.y);
        return {
            width: Math.max(...x) - Math.min(...x),
            height: Math.max(...y) - Math.min(...y)
        };
    }

    private getLabelCell(cells: GridCell[], minRow: number): GridCell {
        cells = cells.filter(cell => cell.row === minRow);
        const minColumn = Math.min(...cells.map(cell => cell.column));
        return cells.find(cell => cell.column === minColumn);
    }

    private setRowAndColumnHeights(cellGroups: {label: VisioLabel; cells: GridCell[]}[], graphLayers: GraphLayer[]) {

        this.groupHeaderHeight = Math.max(...cellGroups.map(g => g.label.size.height)) + GraphSettings.SECTION_DISTANCE;
        this.bottomMargin = GraphSettings.GRID_MARGIN + GraphSettings.GROUP_MARGIN;
        this.topMargin = this.bottomMargin + this.groupHeaderHeight;
        this.xMargin = GraphSettings.GRID_MARGIN + GraphSettings.GROUP_MARGIN;

        const rowHeight: number[] = this.boxGrid.map(r =>
            Math.max(...r.map(c => (c === null ? 0 : c.size.height))) + this.topMargin + this.bottomMargin
        );

        this.columnWidth = this.boxGrid[0].map((r, i) =>
            Math.max(...this.boxGrid.map(r2 => (r2[i] === null ? 0 : r2[i].size.width))) + 2 * this.xMargin);

        this.rowTop = [].concat(
            [0],
            this.aggValues(rowHeight)
        );
        this.columnLeft = [].concat(
            [0],
            this.aggValues(this.columnWidth)
        );

        graphLayers.forEach((gL, index) => gL.height = rowHeight[index]);
    }

    private createGroupShape(cells: GridCell[], refCell: GridCell): CustomBoxShape {
        const rows: number[] = cells.map(c => c.row);
        const columns: number[] = cells.map(c => c.column);
        const rowOffset: number = Math.min(...rows) - 1;
        const columnOffset: number = Math.min(...columns) - 1;
        const rowCount: number = Math.max(...rows) - rowOffset + 2;
        const columnCount: number = Math.max(...columns) - columnOffset + 2;

        const matrix = Utils.getMatrix(rowCount, columnCount, false);
        const transCells = cells.map(c => ({
            row: c.row - rowOffset,
            column: c.column - columnOffset
        }));
        this.markCells(matrix, transCells);

        const outerBoundary: CellPolygon = [{
            row: transCells[0].row,
            column: transCells[0].column
        } ];
        this.parseOuterBoundary(matrix, outerBoundary);
        this.markOuterArea(matrix, 0, 0, rowCount - 1, columnCount - 1);

        const holes = this.parseHoles(matrix);

        const reTrans: (GridCell) => GridCell = (c) => ({ row: c.row + rowOffset, column: c.column + columnOffset });

        const refPos = {
            x: this.columnLeft[refCell.column] + GraphSettings.GRID_MARGIN,
            y: this.rowTop[refCell.row] + GraphSettings.GRID_MARGIN
        };

        return {
            outerBoundary: this.getRelativePolygon(this.convertCellPolygon(outerBoundary.map(c => reTrans(c)), false), refPos),
            holes: holes.map(h => this.getRelativePolygon(this.convertCellPolygon(h.map(c => reTrans(c)), true), refPos))
        };
    }

    private parseHoles(matrix: boolean[][]): CellPolygon[] {
        const holes: CellPolygon[] = [];
        const rowCount = matrix.length;
        const columnCount = matrix[0].length;

        for (let r = 0; r < rowCount; r++) {
            for (let c = 0; c < columnCount; c++) {
                if (!matrix[r][c]) {
                    holes.push([{ row: r, column: c }]);
                    this.parseOuterBoundary(matrix, _.last(holes));
                }
            }
        }
        return holes;
    }

    private markCells(matrix: boolean[][], cells: GridCell[]) {
        for (const cell of cells) {
            matrix[cell.row][cell.column] = true;
        }
    }

    private markOuterArea(matrix: boolean[][], row: number, column: number, maxRowIndex: number, maxColumnIndex: number) {
        if (!matrix[row][column]) {
            matrix[row][column] = true;
            if (row > 0) {
                this.markOuterArea(matrix, row - 1, column, maxRowIndex, maxColumnIndex);
            }
            if (row < maxRowIndex) {
                this.markOuterArea(matrix, row + 1, column, maxRowIndex, maxColumnIndex);
            }
            if (column > 0) {
                this.markOuterArea(matrix, row, column - 1, maxRowIndex, maxColumnIndex);
            }
            if (column < maxColumnIndex) {
                this.markOuterArea(matrix, row, column + 1, maxRowIndex, maxColumnIndex);
            }
        }
    }

    private parseOuterBoundary(matrix: boolean[][], polygon: CellPolygon) {
        const lastCell: GridCell = polygon[polygon.length - 1];

        if (polygon.length === 1) {
            if (matrix[lastCell.row][lastCell.column + 1] === matrix[lastCell.row][lastCell.column]) {
                polygon.push({ row: lastCell.row, column: lastCell.column + 1 });
                this.parseOuterBoundary(matrix, polygon);
            } else if (matrix[lastCell.row + 1][lastCell.column] === matrix[lastCell.row][lastCell.column]) {
                polygon.push({ row: lastCell.row + 1, column: lastCell.column });
                this.parseOuterBoundary(matrix, polygon);
            }
        } else {

            const secondLastCell: GridCell = polygon[polygon.length - 2];
            const lastMove: GridCell = {
                row: Math.sign(lastCell.row - secondLastCell.row),
                column: Math.sign(lastCell.column - secondLastCell.column)
            };

            if (
                lastCell.column !== polygon[0].column || lastCell.row !== polygon[0].row || // not the start cell
                (
                    Math.sign(lastMove.row) >= 0 && // start cell, but the last move is not going upwards
                    matrix[lastCell.row + 1][lastCell.column] === matrix[lastCell.row][lastCell.column]
                    // start cell, but going down is available
                )
            ) {

                // check left
                const leftCell: GridCell = {
                    row: lastCell.row - lastMove.column * (1 - Math.abs(lastMove.row)),
                    column: lastCell.column + lastMove.row * (1 - Math.abs(lastMove.column))
                };
                if (matrix[lastCell.row][lastCell.column] === matrix[leftCell.row][leftCell.column]) {
                    polygon.push(leftCell);
                    this.parseOuterBoundary(matrix, polygon);
                } else {
                    // check straight
                    const straightCell = { row: lastCell.row + lastMove.row, column: lastCell.column + lastMove.column };
                    if (matrix[lastCell.row][lastCell.column] === matrix[straightCell.row][straightCell.column]) {
                        polygon.pop();
                        polygon.push(straightCell);
                        this.parseOuterBoundary(matrix, polygon);
                    } else {
                        // check right
                        const rightCell = {
                            row: lastCell.row + lastMove.column * (1 - Math.abs(lastMove.row)),
                            column: lastCell.column - lastMove.row * (1 - Math.abs(lastMove.column))
                        };
                        if (matrix[lastCell.row][lastCell.column] === matrix[rightCell.row][rightCell.column]) {
                            polygon.push(rightCell);
                            this.parseOuterBoundary(matrix, polygon);
                        } else {
                            // check back
                            polygon.push({ row: lastCell.row - lastMove.row, column: lastCell.column - lastMove.column });
                            this.parseOuterBoundary(matrix, polygon);
                        }
                    }
                }
            }

        }

        matrix[lastCell.row][lastCell.column] = true;
    }

    private getRelativePolygon(polygon: Polygon, relativePosition: Position): Polygon {
        return polygon.map(p => getDifference(p, relativePosition));
    }

    private convertCellPolygon(polygon: CellPolygon, invert: boolean): Polygon {
        const margin = (invert ? -GraphSettings.GRID_MARGIN : GraphSettings.GRID_MARGIN);

        if (polygon.length === 1) {
            return [
                {
                    x: this.columnLeft[polygon[0].column] + margin ,
                    y: this.rowTop[polygon[0].row] + margin
                },
                {
                    x: this.columnLeft[polygon[0].column + 1] - margin,
                    y: this.rowTop[polygon[0].row] + margin
                },
                {
                    x: this.columnLeft[polygon[0].column + 1] - margin,
                    y: this.rowTop[polygon[0].row + 1] - margin
                },
                {
                    x: this.columnLeft[polygon[0].column] + margin,
                    y: this.rowTop[polygon[0].row + 1] - margin
                },
                {
                    x: this.columnLeft[polygon[0].column] + margin,
                    y: this.rowTop[polygon[0].row] + margin
                }
            ];
        } else {
            const result: Polygon = [];
            for (let i = 0, n = polygon.length; i < n; i++) {

                const lastMove: GridCell = (i > 0 ?
                    { row: polygon[i].row - polygon[i - 1].row, column: polygon[i].column - polygon[i - 1].column } :
                    { row: -1, column: 0 }
                );
                const nextMove: GridCell = (i < n - 1 ?
                    { row: polygon[i + 1].row - polygon[i].row, column: polygon[i + 1].column - polygon[i].column } :
                    { row: polygon[1].row - polygon[0].row, column: polygon[1].column - polygon[0].column }
                );

                if (this.areMovesReverse(lastMove, nextMove)) {
                    // U-turn
                    const tempMove: GridCell = { row: (lastMove.column - nextMove.column) / 2, column: (nextMove.row - lastMove.row) / 2 };

                    result.push(this.convertCellToPoint(polygon[i], lastMove, tempMove, margin));
                    result.push(this.convertCellToPoint(polygon[i], tempMove, nextMove, margin));
                } else {
                    // simple turn
                    result.push(this.convertCellToPoint(polygon[i], lastMove, nextMove, margin));
                }
            }
            return result;
        }
    }

    private areMovesReverse(moveA: GridCell, moveB: GridCell): boolean {
        return Math.sign(moveA.column) === -Math.sign(moveB.column) && Math.sign(moveA.row) === -Math.sign(moveB.row);
    }

    private convertCellToPoint(cell: GridCell, lastMove: GridCell, nextMove: GridCell, margin: number): Position {

        const x: number = lastMove.row < 0 || nextMove.row < 0 ?
            this.columnLeft[cell.column] + margin :
            this.columnLeft[cell.column + 1] - margin;

        const y: number = lastMove.column > 0 || nextMove.column > 0 ?
            this.rowTop[cell.row] + margin :
            this.rowTop[cell.row + 1] - margin;

        return { x: x, y: y };
    }

    private aggValues(arr: number[]): number[] {
        const result: number[] = arr.slice();
        for (let i = 1, n = arr.length; i < n; i++) {
            result[i] += result[i - 1];
        }
        return result;
    }
}
