import { TableRow } from '@app/tracing/data.model';
import { concat, isNotNullish } from '@app/tracing/util/non-ui-utils';
import { ArrayWith2OrMoreElements, NonEmptyArray, RequiredPick } from '@app/tracing/util/utility-types';
import * as Excel from 'exceljs';
import * as _ from 'lodash';
import { Workbook as IntWorkbook, Worksheet as IntWorksheet, Row as WSRow, HeaderConf, ColumnHeader, ReadTableOptions, Row, TableHeader, CellSpecs, TypeString, EachRowOptions} from './xlsx-model-vL';
import { CellValue } from './xlsx-model-v0';

type RowTextPart<T extends number> = { [key in T]?: string };
type RowAmountPart<T extends number> = { [key in T]?: number };


function getColumnHeaderChildren(row: Excel.Row, colStartIndex: number, colEndIndex: number): NonEmptyArray<ColumnHeader> {
    let colIndex = colStartIndex;
    const childHeaders: ColumnHeader[] = [];
    while (colIndex <= colEndIndex) {
        const childHeader = getColumnHeader(row, colIndex);
        colIndex += childHeader.columnCount;
        if (colIndex > colEndIndex + 1) {
            throw new Error(`A table haeder could not be parsed`);
        }
        childHeaders.push(childHeader);
    }
    return childHeaders as NonEmptyArray<ColumnHeader>;
}

function getColumnHeader(row: Excel.Row, colStartIndex: number): ColumnHeader {
    let colEndIndex = colStartIndex;
    const refMaster = row.getCell(colStartIndex);
    while (row.getCell(colEndIndex + 1).isMergedTo(refMaster)) {
        colEndIndex++;
    }
    const colSpan = colEndIndex - colStartIndex + 1;
    const columnHeader: ColumnHeader = {
        label: refMaster.text,
        id: `c${colStartIndex}`,
        columnIndex: colStartIndex,
        columnCount: colSpan,
        isEmpty: true,
        valueTypes: new Set<string>(),
        rowCount: 1,
        columnLetter: row.worksheet.getColumn(colStartIndex).letter
    };
    if (colSpan > 1) {
        const nextRow = row.worksheet.getRow(row.number + 1);
        columnHeader.id = `c${colStartIndex}-${colStartIndex + colSpan - 1}`;
        columnHeader.children = getColumnHeaderChildren(nextRow, colStartIndex, colEndIndex);
        columnHeader.rowCount = Math.max(...columnHeader.children.map(c => c.rowCount));
    }
    return columnHeader;
}

function getColumnHeaders(ws: Excel.Worksheet): ColumnHeader[] {
    const excelRow = ws.getRow(1);
    const columnHeaders: ColumnHeader[] = [];

    let c = 1;
    while (c <= excelRow.cellCount) {
        const excelCell = excelRow.getCell(c);
        if (excelCell.text === '') {
            break;
        }

        const columnHeader = getColumnHeader(excelRow, c);

        columnHeaders.push(columnHeader);
        c += columnHeader.columnCount;
    }

    return columnHeaders;
}

function getLeaveColumns(columns: ColumnHeader[]): ColumnHeader[] {
    const leaveColumns = columns.map(c => c.children ? getLeaveColumns(c.children) : [c]);
    return concat(...leaveColumns);
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

function isCellValueOk(value: Excel.CellValue): value is string | boolean | number | Date {
    const type = typeof value;
    return type === 'string' || type === 'number' || type === 'boolean' || value instanceof Date;
}

function createRevRecord<X extends string | number, Y extends string | number>(record: Partial<Record<X, Y>>): Record<Y, X> {
    const revRecord: Record<Y, X> = Object.fromEntries(Object.entries(record).map(([x, y]) => [y, x]));
    return revRecord;
}

// type getCellValue(number: column):

export interface TableHeader {
    columns: ColumnHeader[],
    rowCount: number;
}

export interface ColumnInfo {
    types: Set<string>;
    columnIndex: number;
}

export interface Table {
    header: TableHeader;
    columns: ColumnInfo[];
    columnTypes: Record<number, Set<string>>;
    rows: Row[];
}

export class XlsxSheetReader {
    constructor(private ws: Excel.Worksheet) {}

    readTableHeaderFromSheet(options?: Pick<ReadTableOptions, 'offset'>): TableHeader {
        const offset = options ? options.offset : { row: 1, col: 1 };
        const columnGroups = getColumnHeaders(this.ws);
    }

}

export class XlsxReader {
    private wb: Excel.Workbook | undefined;
    // private columnGroups:

    get sheetNames(): string[] {
        return this.wb ? this.wb.worksheets.map(ws => ws.name) : [];
    }

    async loadFile(file: File): Promise<void> {
        const arrayBuffer = await readFileAsArrayBuffer(file);

        const excelWB = new Excel.Workbook();
        await excelWB.xlsx.load(arrayBuffer);
        this.wb = excelWB;
    }

    private getWorksheet(sheetName: string): Excel.Worksheet {
        const ws = this.wb?.getWorksheet(sheetName);
        if (!ws) {
            throw new Error(`Sheet '${sheetName}' does not exist.`);
        }
        return ws;
    }

    getSheetReader(sheetName: string): Excel.Worksheet {
        const sheetReader = new XlsxSheetReader(this.getWorksheet(sheetName));
        return sheetReader;
    }

    private getHeaderSpan(headerGroups: HeaderConf[]): { colSpan: number; rowSpan: number } {
        let rowSpan = 0;
        let colSpan = 0;
        for (const headerGroup of headerGroups) {
            if (typeof headerGroup === 'string') {
                rowSpan = Math.max(rowSpan, 1);
                colSpan++;
            } else {
                const headerSpan = this.getHeaderSpan(headerGroup[1]);
                rowSpan = Math.max(rowSpan, headerSpan.rowSpan + 1);
                colSpan += headerSpan.colSpan;
            }
        }
        return {
            colSpan: colSpan,
            rowSpan: rowSpan
        };
    }

    private matchColumnHeader(
        ws: Excel.Worksheet,
        headerGroups: HeaderConf[],
        offset: { col: number; row: number }
    ): void {
        let colIndex = offset.col;
        for (const headerGroup of headerGroups) {
            let colSpan = 1;
            const expLabel = typeof headerGroup === 'string' ?
                headerGroup : headerGroup[0];
            const topLeftCell =  ws.getCell(offset.row, colIndex);
            const obsLabel = topLeftCell.text.trim();
            if (expLabel !== obsLabel) {
                throw new Error(`Unexpected column header. Text in cell (r: ${offset.row}, c: ${colIndex}) does not match '${expLabel}'`);
            }
            if (typeof headerGroup !== 'string') {
                colSpan = this.getHeaderSpan(headerGroup[1]).colSpan;
                this.matchColumnHeader(
                    ws,
                    headerGroup[1],
                    { col: colIndex, row: offset.row + 1 }
                );
            }
            if (
                colSpan > 1 && !ws.getCell(offset.row, colIndex + colSpan - 1).isMergedTo(topLeftCell.master) ||
                ws.getCell(offset.row, colIndex + colSpan).isMergedTo(topLeftCell.master)
            ) {
                throw new Error(`Cell (r: ${offset.row}, c: ${colIndex}) does not span ${colSpan} columns.`);
            }
            colIndex += colSpan;
        }
    }

    matchSheetColumnHeader(sheetName: string, columnHeader: HeaderConf[]): void {
        const ws = this.getWorksheet(sheetName);
        this.matchColumnHeader(ws, columnHeader, { col: 1, row: 1});
    }

    matchSheetNames(sheetNames: string[]): boolean {
        const obsSheetNames = this.wb?.worksheets.map(ws => ws.name);
        return sheetNames.every(x => obsSheetNames?.includes(x));
    }

    matchSheetCells(sheetName: string, cellSpecs: CellSpecs[]): boolean {
        const ws = this.getWorksheet(sheetName);
        return cellSpecs.every(specs => {
            const cell = ws.getCell(specs.row, specs.col);
            // if ()
            throw new Error(`Not implemented yet.`);
        });
    }

    private readRows(ws: Excel.Worksheet, startIndex: number):  { //   columnValueConstraints: Record<number, ColumnConstraints>): Row[] {
        const tableRows: Row[] = [];
        // const uniqueFieldSets: [number | string, Set<any>][] = Object.entries(columnValueConstraints)
        //     .filter(c => c[1].isUnique)
        //     .map(c => [c[0], new Set<any>()]);

        // const mandatoryFields: (number | string)[] = Object.entries(columnValueConstraints)
        //     .filter(c => c[1].isMandatory)
        //     .map(c => c[0]);

        ws.eachRow((wsRow, rowIndex) => {
            if (rowIndex >= startIndex) {
                const tableRow: Row = {};
                let isRowEmpty = true;
                wsRow.eachCell(wsCell => {

                    const cellValue = wsCell.value;
                    if (isNotNullish(cellValue)) {
                        isRowEmpty = false;

                        if (isCellValueOk(cellValue)) {
                            if (cellValue instanceof Date) {
                                tableRow[wsCell.col] = cellValue.toISOString();
                            } else {
                                tableRow[wsCell.col] = cellValue;
                            }
                        } else {
                            throw new Error(`Value in cell (r: ${wsRow.number}, c: ${wsCell.col}) is not valid.`);
                        }
                    }
                });
                mandatoryFields.forEach(field => {
                    if (tableRow[field] === undefined) {
                        throw new Error(`Value in cell (r: ${wsRow.number}, c: ${field}) is missing.`);
                    }
                });
                uniqueFieldSets.forEach(([field, uniqueSet]) => {
                    const value = tableRow[field];
                    if (value !== undefined) {
                        if (uniqueSet.has(value)) {
                            throw new Error(`Value in cell (r: ${wsRow.number}, c: ${field}) is not unique.`);
                        }
                    }
                });
            }
        });
    }

    readTableFromSheet<TCI extends number>(sheetName: string, options: ReadTableOptions): Table {
        // options = options ?? {};
        // options = {
        //     ...options
        // };
        const ws = this.getWorksheet(sheetName);
        const columnGroups = getColumnHeaders(ws);
        const columns = getLeaveColumns(columnGroups);
        const headerRowCount = Math.max(0, ...columns.map(c => c.rowCount));
        const rows = this.readRows(ws, headerRowCount + 1, options.columnValueConstraints ?? {});
        const table: Table = {
            columnGroups: columnGroups,
            columns: columns,
            rows: rows
        };
        return table;
    }

    readRowsFromSheet(sheetName: string, startRow: number, options?: ReadTableOptions): Table[] {
        options = options ?? {};
        options = {
            readHeader: true,
            mandatoryValues: [],
            uniqueValues: [],
            enforceTextValues: [],
            columnValueConstraints: {},
            ...options
        };
        const ws = this.getWorksheet(sheetName);
        // const columnGroups = getColumnHeaders(ws);
        // const columns = getLeaveColumns(columnGroups);
        // const headerRowCount = Math.max(0, ...columns.map(c => c.rowCount));
        const rows = this.readRows(ws, startRow, options.columnValueConstraints ?? {});

        return rows;
    }

    readTableHeaderFromSheet(sheetName: string, offset?: { row: number; col: number }): TableHeader {
        offset = offset ?? { row: 1, col: 1 };
        const ws = this.getWorksheet(sheetName);
        const columnGroups = getColumnHeaders(ws);
    }
    // readColumnHeader(): H

    // readColumnHeader(wb)

    // * eachRow(sheetName: string, startRow: number): Generator<TableRow> {
    //     const ws = this.getWorksheet(sheetName);
    //     yield*
    //     // ws.getRows
    //     // ws.eachRow((row, rowNumber) => {
    //     //     if (rowNumber >= startRow) {
    //     //         yield {};
    //     //     }
    //     // } )
    // }


    eachRow(sheetName: string, cb: (rowIndex: number, row: Row) => void, options: ReadTableOptions): void {
        // const tableRows: Row[] = [];
        const
        const index2Alias = createRevRecord(options.aliases ?? {});
        const index2UValues = new Map<number, Set<any>>();
        options.uniqueValues?.forEach(ref => {
            const index: number | undefined = typeof ref === 'string' ? options.aliases[ref as Exclude<R, number>] : ref;
            if (index !== undefined) {
                index2UValues.set(index, new Set());
            }
        })
        // const uniqueFieldSets: [number | string, Set<any>][] = Object.entries(columnValueConstraints)
        //     .filter(c => c[1].isUnique)
        //     .map(c => [c[0], new Set<any>()]);
        const mandatoryFields = options.mandatoryValues.map(x => index2Alias[x as any] ?? x);

        // const mandatoryFields: (number | string)[] = Object.entries(columnValueConstraints)
        //     .filter(c => c[1].isMandatory)
        //     .map(c => c[0]);
        const ws = this.getWorksheet(sheetName);
        const startIndex = options.offset.row;

        ws.eachRow((wsRow, rowIndex) => {
            if (rowIndex >= startIndex) {
                const tableRow = {} as ImportedTableRow<R, T>;
                let isRowEmpty = true;
                wsRow.eachCell(wsCell => {
                    const cellValue = wsCell.value;
                    if (isNotNullish(cellValue)) {
                        isRowEmpty = false;

                        if (isCellValueOk(cellValue)) {
                            if (cellValue instanceof Date) {
                                tableRow[wsCell.col] = cellValue.toISOString();
                            } else {
                                tableRow[wsCell.col] = cellValue;
                            }
                        } else {
                            throw new Error(`Value in cell (r: ${wsRow.number}, c: ${wsCell.col}) is not valid.`);
                        }
                    }
                });
                mandatoryFields.forEach(field => {
                    if (tableRow[field as any] === undefined) {
                        throw new Error(`Value in cell (r: ${wsRow.number}, c: ${field}) is missing.`);
                    }
                });
                index2UValues.forEach(([field, uniqueSet]) => {
                    const value = tableRow[field];
                    if (value !== undefined) {
                        if (uniqueSet.has(value)) {
                            throw new Error(`Value in cell (r: ${wsRow.number}, c: ${field}) is not unique.`);
                        }
                    }
                });

                cb(tableRow);
            }
        });
    }
}
