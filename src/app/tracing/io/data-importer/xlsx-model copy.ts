import { ArrayWith2OrMoreElements, NonEmptyArray } from '@app/tracing/util/utility-types';

export type Row =  Record<number, string | number | boolean>;

export type HeaderConf = string | [string, ArrayWith2OrMoreElements<HeaderConf>];

// export interface ColumnHeader {
//     label?: string;
//     // id: string;
//     columnLetter: string;
//     columnIndex: number;
//     columnCount: number;
//     isEmpty: boolean;
//     rowCount: number;
//     children?: NonEmptyArray<ColumnHeader>;
//     parent?: ColumnHeader;
//     valueTypes: Set<string>;
//     valueCount: number;
// }

export interface Worksheet {
    name: string;
    columnHeaders: ColumnHeader[];
    columnGroups: ColumnHeader[];
    columns: ColumnHeader[];
    columnCount: number;
    rows: Row[];
}

export interface Table {
    columnGroups: ColumnHeader[];
    columns: ColumnHeader[];
    rows: Row[];
    warnings: ImportWarning[];
}

export interface Workbook {
    sheetNames: string[];
    sheets: Record<string, Worksheet>;
}

export interface ColumnValueConstraints {
    isMandatory?: boolean;
    isUnique?: boolean;
}

type TransformerFun = <X, Y>(x: X) => Y;

export interface ImportWarning {
    col?: number;
    row?: number;
    warning: string;
}

export interface DatePartCols {
    yearCol: number;
    monthCol: number;
    dayCol: number;
}
export interface ReadTableOptions {
    offset: {
        row: number;
        col: number;
    };
    mandatoryValues?: number[];
    alaia
    uniqueValues?: number[];
    enforceTextType?: number[];
    enforceFkRelations?: Record<number, Set<any>>;
    enforceNonNegNumberType?: number[];
    // enforceYearMonthDayType?: DatePartCols[];
    ignoreValues?: number[];
    // columnValueConstraints?: Record<number, ColumnValueConstraints>;
    readHeader?: boolean; // default: true
    eachRowCb?: (row: Row, index: number, warnings: ImportWarning[]) => void;
}

export interface CheckColumnHeaderOptions {
    silent: boolean;
    offset: {
        col: number;
        row: number;
    };
}

export interface ColumnHeader {
    label: string[];
    colIndex: number;
}

export interface TableHeader {
    columnHeader: ColumnHeader[];
    rowCount: number;
}

export interface CellSpecs {
    text: string;
    col: number;
    row: number;
    colSpan: number;
    minRowSpan?: number;
}
