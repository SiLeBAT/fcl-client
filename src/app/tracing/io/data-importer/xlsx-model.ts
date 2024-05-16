import { ArrayWith2OrMoreElements, NonEmptyArray } from '@app/tracing/util/utility-types';

export type Row =  Record<number, string | number | boolean>;

export type HeaderConf = string | [string, ArrayWith2OrMoreElements<HeaderConf>];
export interface ColumnHeader {
    label?: string;
    id: string;
    columnLetter: string;
    columnIndex: number;
    columnCount: number;
    rowCount: number;
    children?: NonEmptyArray<ColumnHeader>;
    parent?: ColumnHeader;
}

export interface Worksheet {
    name: string;
    columnHeaders: ColumnHeader[];
    columnCount: number;
    rows: Row[];
}

export interface Workbook {
    sheetNames: string[];
    sheets: Record<string, Worksheet>;
}
