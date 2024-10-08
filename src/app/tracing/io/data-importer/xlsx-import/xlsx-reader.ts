import {
    concat,
    isArrayNotEmpty,
    isNotNullish,
} from "../../../../tracing/util/non-ui-utils";
import * as Excel from "exceljs";
import * as _ from "lodash";
import { InternalError, XlsxInputFormatError } from "../../io-errors";
import { IMPORT_ISSUES } from "./consts";

export type CellValue = number | string | boolean;
export type BasicTypeString = "string" | "number" | "boolean";
export type ColumnHeader = string[];

export interface CellPosition {
    row: number;
    col: number;
}

export interface ReadTableOptions {
    offset?: CellPosition;
    maxColumnIndex?: number;
}

interface TableBody {
    rows: Row[];
    columns: ColumnInfo[];
}

export interface Row {
    rowIndex: number;
    [x: number]: CellValue;
}

const DEFAULT_TABLE_POSITION: CellPosition = { col: 1, row: 1 };

interface ColumnHeaderTree {
    label: string;
    id: string;
    columnStartIndex: number;
    columnCount: number;
    rowCount: number;
    columnLetter: string;
    children?: ColumnHeaderTreeGroup;
}

type ColumnHeaderTreeGroup = [
    ColumnHeaderTree,
    ColumnHeaderTree,
    ...ColumnHeaderTree[],
];

export type ColumnLabelTree =
    | string
    | [string, [ColumnLabelTree, ColumnLabelTree, ...ColumnLabelTree[]]];

// TODO This file
function getColumnHeaderChildren(
    row: Excel.Row,
    colStartIndex: number,
    colEndIndex: number,
): ColumnHeaderTreeGroup {
    let colIndex = colStartIndex;
    const childHeaders: ColumnHeaderTree[] = [];
    while (colIndex <= colEndIndex) {
        const childHeader = getColumnHeader(row, colIndex);
        colIndex += childHeader.columnCount;
        if (colIndex > colEndIndex + 1) {
            throw new Error(`A table haeder could not be parsed`);
        }
        childHeaders.push(childHeader);
    }
    return childHeaders as ColumnHeaderTreeGroup; // // NonEmptyArray<ColumnHeader>;
}

function getColumnHeader(
    row: Excel.Row,
    colStartIndex: number,
): ColumnHeaderTree {
    let colEndIndex = colStartIndex;
    const refMaster = row.getCell(colStartIndex);
    while (row.getCell(colEndIndex + 1).isMergedTo(refMaster)) {
        colEndIndex++;
    }
    const colSpan = colEndIndex - colStartIndex + 1;
    const columnHeader: ColumnHeaderTree = {
        label: refMaster.text.trim(),
        id: `c${colStartIndex}`,
        columnStartIndex: colStartIndex,
        columnCount: colSpan,
        rowCount: 1,
        columnLetter: row.worksheet.getColumn(colStartIndex).letter,
    };
    if (colSpan > 1) {
        const nextRow = row.worksheet.getRow(row.number + 1);
        columnHeader.id = `c${colStartIndex}-${colStartIndex + colSpan - 1}`;
        columnHeader.children = getColumnHeaderChildren(
            nextRow,
            colStartIndex,
            colEndIndex,
        );
        columnHeader.rowCount += Math.max(
            ...columnHeader.children.map((c) => c.rowCount),
        );
    }
    return columnHeader;
}

function getColumnHeadersSpan(columnHeaders: ColumnLabelTree[]): {
    colSpan: number;
    rowSpan: number;
} {
    let rowSpan = 0;
    let colSpan = 0;
    for (const columnHeader of columnHeaders) {
        if (typeof columnHeader === "string") {
            rowSpan = Math.max(rowSpan, 1);
            colSpan++;
        } else {
            const headerSpan = this.getColumnHeadersSpan(columnHeader[1]);
            rowSpan = Math.max(rowSpan, headerSpan.rowSpan + 1);
            colSpan += headerSpan.colSpan;
        }
    }
    return {
        colSpan: colSpan,
        rowSpan: rowSpan,
    };
}

function getLeaveColumns(columnHeaders: ColumnHeaderTree[]): ColumnHeader[] {
    const leaveColumns = columnHeaders.map((c) =>
        c.children
            ? getLeaveColumns(c.children).map((childColumns) => [
                  c.label,
                  ...childColumns,
              ])
            : [[c.label]],
    );
    return concat(...leaveColumns);
}

function readTableHeader(
    ws: Excel.Worksheet,
    offset: CellPosition,
): TableHeader {
    const excelRow = ws.getRow(offset.row);
    const columnHeaders: ColumnHeaderTree[] = [];

    let columnIndex = offset.col;
    while (columnIndex <= excelRow.cellCount) {
        const excelCell = excelRow.getCell(columnIndex);
        const cellText = excelCell.text.trim() || undefined;
        if (cellText === undefined) {
            break;
        }

        const columnHeader = getColumnHeader(excelRow, columnIndex);

        columnHeaders.push(columnHeader);
        columnIndex += columnHeader.columnCount;
    }

    const tableHeader: TableHeader = {
        columnHeaders: getLeaveColumns(columnHeaders),
        rowCount: Math.max(0, ...columnHeaders.map((h) => h.rowCount)),
    };

    return tableHeader;
}

function readTableBody(
    ws: Excel.Worksheet,
    options: Required<ReadTableOptions>,
): TableBody {
    const tableRows: Row[] = [];

    const colIndex2Types: Record<number, Set<BasicTypeString>> = {};
    for (
        let colIndex = options.offset.col;
        colIndex <= options.maxColumnIndex;
        colIndex++
    ) {
        colIndex2Types[colIndex - options.offset.col] = new Set();
    }

    const startRowIndex = options.offset?.row ?? 1;
    const maxRowIndex = ws.rowCount;

    for (let rowIndex = startRowIndex; rowIndex <= maxRowIndex; rowIndex++) {
        const wsRow = ws.getRow(rowIndex);
        const tableRow: Row = { rowIndex: rowIndex };
        let isRowEmpty = true;

        for (
            let colIndex = options.offset.col;
            colIndex <= options.maxColumnIndex;
            colIndex++
        ) {
            const relColumnIndex = colIndex - options.offset.col;
            const wsCell = wsRow.getCell(colIndex);
            let cellValue = wsCell.value;
            if (isNotNullish(cellValue)) {
                if (isCellValueOk(cellValue)) {
                    if (cellValue instanceof Date) {
                        tableRow[relColumnIndex] = cellValue.toISOString();
                        colIndex2Types[relColumnIndex].add("string");
                        isRowEmpty = false;
                    } else {
                        if (typeof cellValue === "string") {
                            cellValue = cellValue.trim();
                            if (cellValue === "") {
                                cellValue = undefined;
                            }
                        }
                        if (cellValue !== undefined) {
                            tableRow[relColumnIndex] = cellValue;
                            colIndex2Types[relColumnIndex].add(
                                typeof cellValue as BasicTypeString,
                            );
                            isRowEmpty = false;
                        }
                    }
                } else {
                    throw new Error(
                        IMPORT_ISSUES.invalidCellValue(
                            wsRow.number,
                            wsCell.col,
                            ws.name,
                        ),
                    );
                }
            }
        }
        if (isRowEmpty) {
            break;
        }

        tableRows.push(tableRow);
    }

    return {
        rows: tableRows,
        columns: Object.values(colIndex2Types).map((types, index) => ({
            types: types,
            columnIndex: index,
        })),
    };
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () => {
            resolve(reader.result as ArrayBuffer);
        };
    });
}

function isCellValueOk(
    value: Excel.CellValue,
): value is string | boolean | number | Date {
    const type = typeof value;
    return (
        type === "string" ||
        type === "number" ||
        type === "boolean" ||
        value instanceof Date
    );
}

export interface TableHeader {
    columnHeaders: ColumnHeader[];
    rowCount: number;
}

export interface ColumnInfo {
    types: Set<BasicTypeString>;
    columnIndex: number;
}

export interface Table {
    header: TableHeader;
    columns: ColumnInfo[];
    rows: Row[];
    offset: CellPosition;
}

export class XlsxSheetReader {
    constructor(private ws: Excel.Worksheet) {}

    validateTableHeader(
        columnHeaders: ColumnLabelTree[],
        throwError: boolean = false,
        offset: CellPosition = DEFAULT_TABLE_POSITION,
    ): boolean {
        let colIndex = offset.col;
        for (const columnHeader of columnHeaders) {
            let colSpan = 1;
            const expectedCellLabel =
                typeof columnHeader === "string"
                    ? columnHeader
                    : columnHeader[0];
            const topLeftCell = this.ws.getCell(offset.row, colIndex);
            const observedCellLabel = topLeftCell.text.trim();
            if (expectedCellLabel !== observedCellLabel) {
                if (throwError) {
                    throw new XlsxInputFormatError(
                        IMPORT_ISSUES.unexpectedCellText(
                            offset.row,
                            colIndex,
                            this.ws.name,
                            expectedCellLabel,
                        ),
                    );
                }
                return false;
            }
            if (typeof columnHeader !== "string") {
                const childHeaders = columnHeader[1];
                colSpan = getColumnHeadersSpan(childHeaders).colSpan;
                if (
                    !this.validateTableHeader(childHeaders, throwError, {
                        col: colIndex,
                        row: offset.row + 1,
                    })
                ) {
                    return false;
                }
            }
            if (
                (colSpan > 1 &&
                    !this.ws
                        .getCell(offset.row, colIndex + colSpan - 1)
                        .isMergedTo(topLeftCell.master)) ||
                this.ws
                    .getCell(offset.row, colIndex + colSpan)
                    .isMergedTo(topLeftCell.master)
            ) {
                if (throwError) {
                    throw new XlsxInputFormatError(
                        IMPORT_ISSUES.unexpectedCellSpan(
                            offset.row,
                            colIndex,
                            this.ws.name,
                            colSpan,
                        ),
                    );
                }
                return false;
            }
            colIndex += colSpan;
        }
        return true;
    }

    readTable(options: ReadTableOptions = {}): Table {
        const offset: CellPosition = options.offset ?? DEFAULT_TABLE_POSITION;

        const tableHeader = readTableHeader(this.ws, offset);
        const tableBody = readTableBody(this.ws, {
            ...options,
            offset: { col: offset.col, row: offset.row + tableHeader.rowCount },
            maxColumnIndex: tableHeader.columnHeaders.length + offset.col,
        });
        const table: Table = {
            header: tableHeader,
            rows: tableBody.rows,
            columns: tableBody.columns,
            offset: offset,
        };
        return table;
    }
}

export class XlsxReader {
    private wb: Excel.Workbook | undefined;

    get sheetNames(): string[] {
        return this.wb ? this.wb.worksheets.map((ws) => ws.name) : [];
    }

    async loadFile(file: File): Promise<void> {
        const arrayBuffer = await readFileAsArrayBuffer(file);

        const excelWB = new Excel.Workbook();
        try {
            await excelWB.xlsx.load(arrayBuffer);
        } catch (err) {
            throw new XlsxInputFormatError();
        }

        this.wb = excelWB;
    }

    private getWorksheet(sheetName: string): Excel.Worksheet {
        const ws = this.wb?.getWorksheet(sheetName);
        if (!ws) {
            throw new InternalError(IMPORT_ISSUES.missingSheet(sheetName));
        }
        return ws;
    }

    getSheetReader(sheetName: string): XlsxSheetReader {
        const sheetReader = new XlsxSheetReader(this.getWorksheet(sheetName));
        return sheetReader;
    }

    validateSheetNames(
        requiredSheetNames: string[],
        throwError: boolean = false,
    ): boolean {
        if (this.wb) {
            const missingSheetNames = requiredSheetNames.filter(
                (sheet) => !this.sheetNames.includes(sheet),
            );
            if (isArrayNotEmpty(missingSheetNames)) {
                if (throwError) {
                    throw new XlsxInputFormatError(
                        IMPORT_ISSUES.missingSheets(missingSheetNames),
                    );
                }
                return false;
            }
            return true;
        }
        throw new InternalError(IMPORT_ISSUES.wbNotLoaded);
    }

    validateSheetHeader(
        sheetName: string,
        columnHeaders: ColumnLabelTree[],
        throwError: boolean = false,
    ): boolean {
        const sheetReader = this.getSheetReader(sheetName);
        return sheetReader.validateTableHeader(
            columnHeaders,
            throwError,
            DEFAULT_TABLE_POSITION,
        );
    }
}
