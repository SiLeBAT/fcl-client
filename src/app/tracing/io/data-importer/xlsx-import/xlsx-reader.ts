import {
    concat,
    isArrayNotEmpty,
    isNullish,
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

const DEFAULT_TABLE_POSITION: CellPosition = { col: 1, row: 1 };

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
            throw new Error(`A table header could not be parsed`);
        }
        childHeaders.push(childHeader);
    }
    return childHeaders as ColumnHeaderTreeGroup;
}

function getColumnHeader(
    row: Excel.Row,
    colStartIndex: number,
): ColumnHeaderTree {
    let colEndIndex = colStartIndex;
    const firstCellOfHeader = row.getCell(colStartIndex);
    while (row.getCell(colEndIndex + 1).isMergedTo(firstCellOfHeader)) {
        colEndIndex++;
    }
    const columnCount = colEndIndex - colStartIndex + 1;
    const columnHeader: ColumnHeaderTree = {
        label: firstCellOfHeader.text.trim(),
        id: `c${colStartIndex}`,
        columnStartIndex: colStartIndex,
        columnCount: columnCount,
        rowCount: 1,
        columnLetter: row.worksheet.getColumn(colStartIndex).letter,
    };
    if (columnCount > 1) {
        const nextRow = row.worksheet.getRow(row.number + 1);
        columnHeader.id = `c${colStartIndex}-${colStartIndex + columnCount - 1}`;
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

/**
 * The tree like header structure is transformed into a 2 dimensional string array
 * (by a post order tree traversal left to right)
 */
function getLeafColumns(columnHeaders: ColumnHeaderTree[]): ColumnHeader[] {
    const leafColumns = columnHeaders.map((header) =>
        // is the header nested
        header.children
            ? // get the child columns headers and concatenate the current header label
              getLeafColumns(header.children).map((childColumns) => [
                  header.label,
                  ...childColumns,
              ])
            : // header is not nested
              [[header.label]],
    );
    return concat(...leafColumns);
}

function readTableHeader(
    workSheet: Excel.Worksheet,
    offset: CellPosition,
): TableHeader {
    const excelRow = workSheet.getRow(offset.row);
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
        columnHeaders: getLeafColumns(columnHeaders),
        rowCount: Math.max(0, ...columnHeaders.map((h) => h.rowCount)),
    };

    return tableHeader;
}

function readTableBody(
    workSheet: Excel.Worksheet,
    options: Required<ReadTableOptions>,
): TableBody {
    const tableRows: Row[] = [];
    const {
        offset: { col: columnOffset, row: rowOffset },
        maxColumnIndex,
    } = options;

    const columnIndex2Types = Array.from(
        { length: maxColumnIndex - columnOffset },
        () => new Set<BasicTypeString>(),
    );

    const startRowIndex = rowOffset;
    const maxRowIndex = workSheet.rowCount;

    for (let rowIndex = startRowIndex; rowIndex <= maxRowIndex; rowIndex++) {
        const workSheetRow = workSheet.getRow(rowIndex);
        const tableRow: Row = { rowIndex: rowIndex };
        let isRowEmpty = true;

        for (
            let colIndex = columnOffset;
            colIndex <= maxColumnIndex;
            colIndex++
        ) {
            const relativeColumnIndex = colIndex - columnOffset;
            const { col: workSheetColumn, value: cellValue } =
                workSheetRow.getCell(colIndex);

            const processedValue =
                typeof cellValue === "string"
                    ? cellValue.trim() || undefined
                    : cellValue;

            if (isNullish(processedValue)) {
                continue;
            }

            if (!isCellValueOk(processedValue)) {
                throw new Error(
                    IMPORT_ISSUES.invalidCellValue(
                        workSheetRow.number,
                        workSheetColumn,
                        workSheet.name,
                    ),
                );
            }

            if (processedValue instanceof Date) {
                tableRow[relativeColumnIndex] = processedValue.toISOString();
                columnIndex2Types[relativeColumnIndex].add("string");
            } else {
                tableRow[relativeColumnIndex] = processedValue;
                columnIndex2Types[relativeColumnIndex].add(
                    typeof processedValue as BasicTypeString,
                );
            }

            isRowEmpty = false;
        }

        if (isRowEmpty) {
            continue;
        }

        tableRows.push(tableRow);
    }

    return {
        rows: tableRows,
        columns: columnIndex2Types.map((types, index) => ({
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
    constructor(private workSheet: Excel.Worksheet) {}

    private validateHeaderCellMerging(
        colSpan: number,
        rowIndex: number,
        columnIndex: number,
        throwError: boolean,
    ): boolean {
        const topLeftCell = this.workSheet.getCell(rowIndex, columnIndex);
        if (
            // Either:
            // Cell isn't merged with colSpan-1 cells to the right of it
            // aka observed cell span is to small
            (colSpan > 1 &&
                !this.workSheet
                    .getCell(rowIndex, columnIndex + colSpan - 1)
                    .isMergedTo(topLeftCell.master)) ||
            // Cell is merged with colSpan cells to the right of it
            // aka observed colspan is to big
            this.workSheet
                .getCell(rowIndex, columnIndex + colSpan)
                .isMergedTo(topLeftCell.master)
        ) {
            if (throwError) {
                throw new XlsxInputFormatError(
                    IMPORT_ISSUES.unexpectedCellSpan(
                        rowIndex,
                        columnIndex,
                        this.workSheet.name,
                        colSpan,
                    ),
                );
            }
            return false;
        }
        return true;
    }

    private validateHeaderCellLabelMatch(
        columnHeader: ColumnLabelTree,
        throwError: boolean,
        rowIndex: number,
        columnIndex: number,
    ): boolean {
        const expectedCellLabel =
            typeof columnHeader === "string" ? columnHeader : columnHeader[0];
        const topLeftCell = this.workSheet.getCell(rowIndex, columnIndex);
        const observedCellLabel = topLeftCell.text.trim();
        // Validate Label match
        if (
            expectedCellLabel.toLocaleLowerCase() !==
            observedCellLabel.toLocaleLowerCase()
        ) {
            if (throwError) {
                throw new XlsxInputFormatError(
                    IMPORT_ISSUES.unexpectedCellText(
                        rowIndex,
                        columnIndex,
                        this.workSheet.name,
                        expectedCellLabel,
                    ),
                );
            }
            return false;
        }
        return true;
    }

    private validateHeaderCell(
        columnHeader: ColumnLabelTree,
        columnSpan: number,
        throwError: boolean,
        rowIndex: number,
        columnIndex: number,
    ) {
        return (
            this.validateHeaderCellLabelMatch(
                columnHeader,
                throwError,
                rowIndex,
                columnIndex,
            ) &&
            this.validateHeaderCellMerging(
                columnSpan,
                rowIndex,
                columnIndex,
                throwError,
            )
        );
    }

    validateTableHeader(
        columnHeaders: ColumnLabelTree[],
        throwError: boolean = false,
        offset: CellPosition = DEFAULT_TABLE_POSITION,
    ): boolean {
        let columnIndex = offset.col;
        for (const columnHeader of columnHeaders) {
            const columnSpan =
                typeof columnHeader === "string"
                    ? 1
                    : getColumnHeadersSpan(columnHeader[1]).colSpan;
            if (
                !this.validateHeaderCell(
                    columnHeader,
                    columnSpan,
                    throwError,
                    offset.row,
                    columnIndex,
                )
            ) {
                return false;
            }

            if (typeof columnHeader !== "string") {
                const childHeaders = columnHeader[1];
                if (
                    !this.validateTableHeader(childHeaders, throwError, {
                        col: columnIndex,
                        row: offset.row + 1,
                    })
                ) {
                    return false;
                }
            }

            columnIndex += columnSpan;
        }
        return true;
    }

    readTable({
        offset = DEFAULT_TABLE_POSITION,
    }: ReadTableOptions = {}): Table {
        const tableHeader = readTableHeader(this.workSheet, offset);
        const { rows, columns } = readTableBody(this.workSheet, {
            offset: { col: offset.col, row: offset.row + tableHeader.rowCount },
            maxColumnIndex: offset.col + tableHeader.columnHeaders.length,
        });

        return {
            header: tableHeader,
            rows: rows,
            columns: columns,
            offset: offset,
        };
    }
}

export class XlsxReader {
    private workBook: Excel.Workbook | undefined;

    get sheetNames(): string[] {
        return this.workBook
            ? this.workBook.worksheets.map((ws) => ws.name)
            : [];
    }

    async loadFile(file: File): Promise<void> {
        const arrayBuffer = await readFileAsArrayBuffer(file);

        const excelWB = new Excel.Workbook();
        try {
            await excelWB.xlsx.load(arrayBuffer);
        } catch (err) {
            throw new XlsxInputFormatError();
        }

        this.workBook = excelWB;
    }

    private getWorksheet(sheetName: string): Excel.Worksheet {
        const workSheet = this.workBook?.getWorksheet(sheetName);
        if (!workSheet) {
            throw new InternalError(IMPORT_ISSUES.missingSheet(sheetName));
        }
        return workSheet;
    }

    getSheetReader(sheetName: string): XlsxSheetReader {
        const sheetReader = new XlsxSheetReader(this.getWorksheet(sheetName));
        return sheetReader;
    }

    validateSheetNames(
        requiredSheetNames: string[],
        throwError: boolean = false,
    ): boolean {
        if (!this.workBook) {
            throw new InternalError(IMPORT_ISSUES.wbNotLoaded);
        }

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
