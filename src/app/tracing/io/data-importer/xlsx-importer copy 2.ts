import { isNotNullish } from '@app/tracing/util/non-ui-utils';
import { ArrayWith2OrMoreElements, NonEmptyArray } from '@app/tracing/util/utility-types';
import * as Excel from 'exceljs';
import * as _ from 'lodash';
import { Workbook as IntWorkbook, Worksheet as IntWorksheet, Row as WSRow, HeaderConf, ColumnHeader} from './xlsx-model';

type SheetName = string;
type CellValue = string | boolean | number | bigint;

// type ColumnHeader = string | [string, ArrayWith2OrMoreElements<ColumnHeader>];

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

export async function readExcelFile(file: File, options?: Options): Promise<IntWorkbook> {
    options = options ?? {};
    options = {
        ...options
    };
    const excelWB = new Excel.Workbook();

    const arrayBuffer = await readFileAsArrayBuffer(file);

    await excelWB.xlsx.load(arrayBuffer);

    const intWB: IntWorkbook = {
        sheetNames: [],
        sheets: {}
    };
    for (const excelWS of excelWB.worksheets) {
        const columnHeaders = getColumnHeaders(excelWS);
        const headerRowCount = Math.max(0, ...columnHeaders.map(h => h.rowCount));
        const columnCount = Math.max(0, ...columnHeaders.map(h => h.rowCount));

        const intWS: IntWorksheet = {
            name: excelWS.name,
            columnHeaders: columnHeaders,
            columnCount: columnCount,
            rows: []
        };
        let r = headerRowCount + 1;
        const aRC = excelWS.actualRowCount;
        const aCC = excelWS.actualColumnCount;
        let bolEmpty = true;
        do {
            bolEmpty = true;
            const intRow: WSRow = {};
            for (let c = 1; c <= columnCount; c++) {
                const excelCell = excelWS.getCell(r, c);
                const cellValue = excelCell.value;
                if (isNotNullish(cellValue)) {
                    bolEmpty = false;

                    if (isCellValueOk(cellValue)) {
                        if (cellValue instanceof Date) {
                            intRow[c] = cellValue.toISOString();
                        } else {
                            intRow[c] = cellValue;
                        }
                    } else {
                        throw new Error(`Value in column '${excelWS.getColumn(c).letter}' and row ${r} in sheet '${intWS.name}' is not importable.`);
                    }
                }
            }
            if (!bolEmpty) {
                intWS.rows.push(intRow);
                r++;
            }
        } while (!bolEmpty);
        // console.log(`aCC: ${aCC}, mCC: ${intWS.header.length}, aRC: ${aRC}, mRC: ${intWS.rows.length + 1}`);
        intWB.sheetNames.push(excelWS.name);
        intWB.sheets[excelWS.name] = intWS;
    }

    return intWB;
}

export class XlsxImporter {
    private wb: Excel.Workbook | undefined;
    // private columnGroups:

    async readFile(file: File): Promise<Excel.Workbook> {
        const arrayBuffer = await readFileAsArrayBuffer(file);

        const excelWB = new Excel.Workbook();
        await excelWB.xlsx.load(arrayBuffer);
        return excelWB;
    }


    // readColumnHeader(): H

    // readColumnHeader(wb)
}
