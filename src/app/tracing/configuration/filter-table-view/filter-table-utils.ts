import {
    TableColumn as NgxTableColumn,
    SortPropDir,
    SortDirection,
    orderByComparator
} from '@swimlane/ngx-datatable';
import { NodeShapeType, TableRow } from '@app/tracing/data.model';
import * as _ from 'lodash';

type SortableColumn = Pick<NgxTableColumn, 'prop' | 'comparator'>;
type RowComparator = (vA: any, vB: any, rA: TableRow, rB: TableRow, sortDir?: SortDirection) => number;
type RowOnlyComparator= (rA: TableRow, rB: TableRow) => number;

const shapePrioMap: { [key in NodeShapeType]: number } = {
    [NodeShapeType.CIRCLE]: 0,
    [NodeShapeType.TRIANGLE]: 1,
    [NodeShapeType.SQUARE]: 2,
    [NodeShapeType.DIAMOND]: 3,
    [NodeShapeType.PENTAGON]: 4,
    [NodeShapeType.HEXAGON]: 5,
    [NodeShapeType.OCTAGON]: 6,
    [NodeShapeType.STAR]: 7
};

export function visibilityComparator(
    valueA: any,
    valueB: any,
    rowA: TableRow,
    rowB: TableRow
): number {
    let result: number = 0;

    if (rowA['invisible'] === true && rowB['invisible'] === false) {
        result = -1;
    }
    if (rowA['invisible'] === false && rowB['invisible'] === true) {
        result = 1;
    }

    return result;
}

export function highlightingComparator(
    valueA: any,
    valueB: any,
    rowA: TableRow,
    rowB: TableRow
): number {

    if (rowA['invisible'] !== rowB['invisible']) {
        return rowA['invisible'] ? -1 : 1;
    } else {
        const hIA = rowA['highlightingInfo'];
        const hIB = rowB['highlightingInfo'];
        const shapeA: NodeShapeType = hIA['shape'] || NodeShapeType.CIRCLE;
        const shapeB: NodeShapeType = hIB['shape'] || NodeShapeType.CIRCLE;

        if (shapeA !== shapeB) {
            return shapePrioMap[shapeA] - shapePrioMap[shapeB];
        } else {
            const colorsA = hIA['color'];
            const colorsB = hIB['color'];
            // todo: use color priorities instead
            if (colorsA.length !== colorsB.length) {
                return colorsA.length - colorsB.length;
            } else {
                const n = colorsA.length;
                for (let i = 0; i < n; i++) {
                    for (let k = 0; k < 3; k++) {
                        if (colorsA[i][k] !== colorsB[i][k]) {
                            return colorsB[i][k] - colorsA[i][k];
                        }
                    }
                }
            }
        }
    }

    return 0;
}

function getMergedRowComparator(rowOnlyComparators: RowOnlyComparator[]): (rA: TableRow, rB: TableRow) => number {
    const nC = rowOnlyComparators.length;
    const comparator = (
        rA: TableRow,
        rB: TableRow
    ) => {
        let result = 0;
        let i = 0;

        while (result === 0 && i < nC) {
            result = rowOnlyComparators[i](rA, rB);
            i++;
        }

        return result;
    };

    return comparator;
}

function getActiveRowOnlyComparators(columns: NgxTableColumn[], sorts: SortPropDir[]): RowOnlyComparator[] {
    const prop2Comparator: Record<string, RowComparator> = {};
    columns.filter(c => c.comparator).forEach(c => prop2Comparator[c.prop] = c.comparator);
    const activeRowOnlyComparators = sorts.map(s => {
        const comparator = prop2Comparator[s.prop];

        return s.dir === SortDirection.asc ?
            (comparator ?
                (rA: TableRow, rB: TableRow) => comparator(undefined, undefined, rA, rB) :
                (rA: TableRow, rB: TableRow) => orderByComparator(rA[s.prop], rB[s.prop])
            ) :
            (comparator ?
                (rA: TableRow, rB: TableRow) => -comparator(undefined, undefined, rA, rB) :
                (rA: TableRow, rB: TableRow) => -orderByComparator(rA[s.prop], rB[s.prop])
            );
    });
    return activeRowOnlyComparators;
}

function getRefSortingComparator(refSorting: TableRow[]): RowOnlyComparator {
    const id2RefIndex: Record<string, number> = {};
    refSorting.forEach((r, i) => id2RefIndex[r.id] = i + 1);

    const comparator = (rA: TableRow, rB: TableRow) => {
        const vA = rA.id;
        const vB = rB.id;
        const iA = id2RefIndex[vA];
        const iB = id2RefIndex[vB];
        if (iA === undefined) {
            if (iB === undefined) {
                return 0;
            } else {
                return 1;
            }
        } else if (iB === undefined) {
            return -1;
        } else {
            return iA - iB;
        }
    };

    return comparator;
}

export function sortRows(
    rows: TableRow[],
    lastSorting: TableRow[],
    columns: SortableColumn[],
    sorts: SortPropDir[]
): TableRow[] {

    const activeRowOnlyComparators = getActiveRowOnlyComparators(columns, sorts);

    if (lastSorting.length > 0 && rows !== lastSorting) {
        const comparator = getRefSortingComparator(lastSorting);

        activeRowOnlyComparators.push(comparator);
    }

    if (activeRowOnlyComparators.length > 0) {
        const sortedRows = rows.slice();

        const mergedComparator = getMergedRowComparator(activeRowOnlyComparators);
        sortedRows.sort(mergedComparator);

        rows = sortedRows;
    }

    return rows;
}

export function applySorting(sortedUnfilteredRows: TableRow[], filteredRows: TableRow[]): TableRow[] {
    if (sortedUnfilteredRows.length === filteredRows.length) {
        return sortedUnfilteredRows;
    } else {
        const id2Filter: Record<string, boolean> = {};
        filteredRows.forEach(r => id2Filter[r.id] = true);
        const sortedFilteredRows = sortedUnfilteredRows.filter(r => id2Filter[r.id]);
        return sortedFilteredRows;
    }
}
