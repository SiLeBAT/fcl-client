import { ArrayWith2OrMoreElements, DeepReadonly, NonEmptyArray } from '@app/tracing/util/utility-types';

export type CellValue = string | number | boolean;
export type Row =  Record<number, CellValue>;

export type TypeString = 'string' | 'nonneg:number' | 'number' | 'year' | 'month' | 'day' | 'never' | 'lat' | 'lon' | 'auto';
export type TypeString2Type<T extends TypeString | undefined | unknown> = T extends 'nonneg:number' | 'number' | 'year' | 'month' ? number : T extends undefined ? CellValue : string;


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

export interface ReadTableOptions<A extends string, E extends A, M extends A> {
    offset: {
        row: number;
        col: number;
    };
    aliases: Record<A, number | undefined>;
    mandatoryValues: M[];
    uniqueValues?: (number | A)[];
    fkRelations?: Partial<Record<number, Set<any>>>;
    enforceType: Record<E, TypeString>;
    // ignoreValues?: (A | number)[];
    readHeader?: boolean; // default: true
    // eachRowCb?: (row: Row, index: number, warnings: ImportWarning[]) => void;
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

export interface ColumnInfo {
    type: Set<string>;
    index: number;
    alias?: string;
}

export interface TableBody<T extends Row> {
    columnInfos: ColumnInfo[];
    rows: T[];
}

export interface CellSpecs {
    text: string;
    col: number;
    row: number;
    colSpan: number;
    minRowSpan?: number;
}
