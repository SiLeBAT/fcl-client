import { TableRow } from '@app/tracing/data.model';
import { concat, isNotNullish } from '@app/tracing/util/non-ui-utils';
import { ArrayWith2OrMoreElements, NonEmptyArray, RequiredPick } from '@app/tracing/util/utility-types';
import * as Excel from 'exceljs';
import * as _ from 'lodash';
import { Workbook as IntWorkbook, Worksheet as IntWorksheet, Row as WSRow, HeaderConf, ColumnHeader, ReadTableOptions, Table, CheckColumnHeaderOptions, Row, TableHeader, CellSpecs, TypeString, TypeString2Type, TableBody} from './xlsx-model-v2';

type SheetName = string;
type CellValue = string | boolean | number | bigint;

// type ColumnHeader = string | [string, ArrayWith2OrMoreElements<ColumnHeader>];
// type GetEnforcedTypeString<T, K> = T extends ReadTableOptions<infer A, infer N, infer TR, infer MR> ? T['enforceType'] extends {} ? K extends keyof T['enforceType'] & (string | number) ? T['enforceType'][K] : undefined : undefined : undefined;
// type GetMandatoryFields<T> = T extends ReadTableOptions<infer A, infer N, infer TR, infer MR> ? T['mandatoryValues'] extends Array<infer X> ? X extends A | N ? X : never : never : never;
// type ImportedRow<T> = T extends ReadTableOptions<infer A, infer N, infer TR, infer MR> ? RequiredPick<{ [key in A | N]?: TypeString2Type<GetEnforcedTypeString<T, key>> }, GetMandatoryFields<T>> : Row;

type ImportedRow<A extends string, E extends A, M extends A, T extends ReadTableOptions<A, E, M>> = RequiredPick<{ [key in A]?: TypeString2Type<key extends E ? T['enforceType'][key] : undefined> }, A & GetMandatoryFields<T['mandatoryValues']>> & Row;
type GetMandatoryFields<T> = T extends Array<infer E> ? E : never;
type GetIgnoredFields<T extends Record<string, TypeString>> = { [key in keyof T]: T[key] extends 'never' ? key : never }[keyof T];
// type ImportedTableRow<A extends string, T extends Record<string, TypeString>> = Omit<{ [key in A]?: TypeString2Type<T[key]> }, GetIgnoredFields<T>>;


type GetTypedRow<A extends string, E extends A, T> = T extends Record<E, TypeString>;
// type GetPartialObjectType<A extends string, E extends A, T extends Record<E, TypeString>> = { [key in A]?: key extends E ? TypeString2Type<T[key]> : CellValue };
// type ImportedTableRow<T> = T extends ReadTableOptions<infer A, infer E, infer M> ? Omit<GetPartialObjectType<A, E, T['enforceType']>, GetIgnoredFields<T['enforceType']>> : {};
type GetPartialObjectType<AM, TM> = AM extends Record<infer A extends string, number | undefined> ? TM extends Record<infer R extends A, infer T extends TypeString> ? { [key in A]?: key extends R ? TypeString2Type<TM[key]> : CellValue } : {} : {};
type ImportedR<T> = T extends ReadTableOptions<infer A, infer E, infer M> ? GetPartialObjectType<T['aliases'], T['enforceType']> : {};


export interface ColumnConstraints {
    isMandatory?: boolean; // default: false
    isUnique?: boolean; // default: false
    transformer?: <T, K>(value: T) => K;
}

export interface Options {
    // firstRowIsHeader?: boolean;
    // expectedColumnConf
    filterSheets?: string[];
    mandatorySheets?: string[];
    matchColumnHeaders?: Record<string, HeaderConf[]>;
    // columnConstraints?: Record<string, Record<number, ColumnConstraints>>;
    // mandatoryColumns?: Record<SheetName, string[]>;
    // requiredTypes?: Record<string,
}

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

function createRevRecord<X extends string | number, Y extends string | number >(rec: Record<X, Y | undefined>): Record<Y, X> {
    return Object.fromEntries(Object.entries(rec).map(([x, y]) => [y, x]).filter(([y, x]) => y !== undefined)) as Record<Y, X>;
}

function createReadTableOptions<
    A extends string,
    N extends number,
    TR extends A | N,
    MR extends A | N>(options: ReadTableOptions<A, N, TR, MR>): Required<ReadTableOptions<A, N, TR, MR>> {
    let result = {} as Required<ReadTableOptions<A, N, TR, MR>>;
    result = {
        ...result,
        aliases: options.aliases ?? {},
        enforceType: options.enforceType ?? {},


    }
    return result;
}

export class XlsxImporter {
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

    getWorksheet(sheetName: string): Excel.Worksheet {
        const ws = this.wb?.getWorksheet(sheetName);
        if (!ws) {
            throw new Error(`Sheet '${sheetName}' does not exist.`);
        }
        return ws;
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
        });
    }

    private getFieldNumIndex(fieldIndex: string | number, aliases: Record<string, number | undefined>): number {

    }

    private readRows<
        A extends string
    >(
        ws: Excel.Worksheet,
        options: ReadTableOptions<A>
    ): ImportedRow<ReadTableOptions<A>>[] {
        const tableRows: ImportedRow<ReadTableOptions<A>>[] = [];
        const aliases = options.aliases ?? {};
        const revAliases = createRevRecord(aliases);
        const uniqueFieldSets = new Map<number, Set<any>>();
        (options.uniqueValues ?? []).forEach(uF => uniqueFieldSets.set(uF as string, new Set()));

        const mandatoryFields: (number | string)[] = options.mandatoryValues ?? [];
        const myRec: Record<number, string> = {
            NaN:
        }

        const enfTypes = new Map<number, TypeString>();
        Object.keys(options.enforceType ?? {}).forEach(fieldIndex => {
            const numIndex
        });
            Object.entries(options.enforceType ?? {}).map(([field, typeStr]) => {
                if (typeof field === 'number') {

                }
            })
        )

        ws.eachRow((wsRow, rowIndex) => {
            if (rowIndex >= options.offset.row) {
                const tableRow: Row = {};
                let isRowEmpty = true;
                wsRow.eachCell(wsCell => {
                    const cellValue = wsCell.value;
                    if (isNotNullish(cellValue)) {
                        isRowEmpty = false;
                        let value: CellValue = wsCell.text;

                        if (isCellValueOk(cellValue)) {
                            if (cellValue instanceof Date) {
                                // do nothing
                                // tableRow[wsCell.col] = cellValue.toISOString();
                            } else {
                                value = cellValue;
                                // tableRow[wsCell.col] = cellValue;
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
        return tableRows;
    }

    readTableFromSheet<A extends string, SR extends A, NR extends number>(sheetName: string, options?: Partial<ReadTableOptions<A, SR, NR>>): Table {
        options = options ?? {};
        options = {
            readHeader: true,
            ...options
        };
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

    readRowsFromSheet<A extends string, E extends A, M extends A>(
        sheetName: string,
        options?: ReadTableOptions<A, E, M>
    ): ImportedR<ReadTableOptions<A, E, M>>[] {
        // options = options ?? {};
        // const fullOptions: Required<ReadTableOptions> = {
        //     readHeader: true,
        //     mandatoryValues: [],
        //     uniqueValues: [],

        //     ...(options ?? {})
        // };
        const ws = this.getWorksheet(sheetName);
        // const columnGroups = getColumnHeaders(ws);
        // const columns = getLeaveColumns(columnGroups);
        // const headerRowCount = Math.max(0, ...columns.map(c => c.rowCount));
        // const rows = this.readRows(ws, options ?? { offset: { col: 1, row: 1 }}) as ImportedRow<ReadTableOptions<A, N, TR, MR>>[];
        const rows = {} as ImportedR<ReadTableOptions<A, E, M>>[];

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

    eachRow(sheetName: string, startRow: number, cb: (row: TableRow) => void): void {

    }
}
