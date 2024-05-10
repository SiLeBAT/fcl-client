import { isNotNullish } from '@app/tracing/util/non-ui-utils';
import { NonEmptyArray } from '@app/tracing/util/utility-types';
import * as Excel from 'exceljs';
import * as _ from 'lodash';
import { Workbook as IntWorkbook, Worksheet as IntWorksheet, Row as WSRow, ColumnTree} from './xlsx-model';

export interface Options {
    firstRowIsHeader?: boolean;
    filterSheets?: string[];
    mandatorySheets?: string[];
    mandatoryColumns?: Record<string, string[]>;
    mandatoryValues?: Record<string, string[]>;
}

function getColumnCount(columnTree: ColumnTree): number {
    return columnTree.subColumns ?
        _.sum(columnTree.subColumns.map(t => getColumnCount(t))) :
        1;
}

function getColumnTreeHeight(columnTree: ColumnTree): number {
    return columnTree.subColumns ?
        (1 + Math.max(...columnTree.subColumns.map(t => getColumnTreeHeight(t)))) :
        1;
}

function getColumnTrees(row: Excel.Row, colStartIndex: number, colEndIndex: number): NonEmptyArray<ColumnTree> {
    let colIndex = colStartIndex;
    const columnTrees: ColumnTree[] = [];
    while (colIndex <= colEndIndex) {
        const columnTree = getColumnTree(row, colIndex);
        colIndex += getColumnCount(columnTree);
        if (colIndex > colEndIndex + 1) {
            throw new Error(`A table haeder could not be parsed`);
        }
        columnTrees.push(columnTree);
    }
    return columnTrees as NonEmptyArray<ColumnTree>;
}

function getColumnTree(row: Excel.Row, colStartIndex: number): ColumnTree {
    let colEndIndex = colStartIndex;
    const refMaster = row.getCell(colStartIndex);
    while (row.getCell(colEndIndex + 1).isMergedTo(refMaster)) {
        colEndIndex++;
    }
    const colSpan = colEndIndex - colStartIndex + 1;
    const columnTree: ColumnTree = {
        name: refMaster.text,
        index: colStartIndex
    };
    if (colSpan > 1) {
        const nextRow = row.worksheet.getRow(row.number + 1);
        columnTree.subColumns = getColumnTrees(nextRow, colStartIndex, colEndIndex);
    }
    return columnTree;
}

function getHeader(ws: Excel.Worksheet): { columns: ColumnTree[] } {
    const excelRow = ws.getRow(1);
    const columnTrees: ColumnTree[] = [];

    let c = 1;
    while (c <= excelRow.cellCount) {
        const excelCell = excelRow.getCell(c);
        if (excelCell.text === '') {
            break;
        }

        const columnTree = getColumnTree(excelRow, c);

        columnTrees.push(columnTree);
        c += getColumnCount(columnTree);
    }

    return { columns: columnTrees };
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
        firstRowIsHeader: true,
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
        const header = getHeader(excelWS);
        const headerHeight = Math.max(0, ...header.columns.map(t => getColumnTreeHeight(t)));
        const columnCount = _.sum(header.columns.map(t => getColumnCount(t)));
        const intWS: IntWorksheet = {
            name: excelWS.name,
            columns: header.columns,
            rows: []
        };
        let r = headerHeight + 1;
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
