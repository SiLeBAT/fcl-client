import { NonEmptyArray } from '@app/tracing/util/utility-types';

export type Row =  Record<number, string | number | boolean>;

export interface ColumnConf {
    name?: string;
    index: number;
}

export type SingleColumn = ColumnConf;
// export type ColumnTree = SingleColumn | ColumnGroupConf;

export interface ColumnTree {
    name?: string;
    index: number;
    subColumns?: NonEmptyArray<ColumnTree>;
}

export interface ColumnGroupConf {
    name?: string;
    index: number;
    subColumns: NonEmptyArray<ColumnConf | ColumnGroupConf>
}

export interface Worksheet {
    name: string;
    columns: (ColumnConf | ColumnGroupConf)[];
    // columnTypes: ('string' | 'number')[];
    rows: Row[];
}

export interface Workbook {
    sheetNames: string[];
    sheets: Record<string, Worksheet>;
}
