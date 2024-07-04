import { ArrayWith2OrMoreElements, NonEmptyArray } from '@app/tracing/util/utility-types';

export type Row =  Record<number, string | number | boolean>;

// export type HeaderConf = string | [string, ArrayWith2OrMoreElements<HeaderConf>];

// export interface Worksheet {
//     name: string;
//     columnHeaders: ColumnHeader[];
//     columnGroups: ColumnHeader[];
//     columns: ColumnHeader[];
//     columnCount: number;
//     rows: Row[];
// }

// export interface Table {
//     columnGroups: ColumnHeader[];
//     columns: ColumnHeader[];
//     rows: Row[];
//     warnings: ImportWarning[];
// }

// export interface Workbook {
//     sheetNames: string[];
//     sheets: Record<string, Worksheet>;
// }

export interface ImportWarning {
    col?: number;
    row?: number;
    warning: string;
}


export type TypeString = 'string' | 'nonneg:number' | 'number' | 'year' | 'month' | 'day' | 'never' | 'lat' | 'lon' | 'auto';
export type TypeString2Type<T extends TypeString | undefined | unknown> = T extends 'nonneg:number' | 'number' | 'year' | 'month' ? number : string;


export interface ReadTableOptions<K extends string> {
    offset: {
        row: number;
        col: number;
    };
    aliases?: Record<K, number | undefined>;
    mandatoryValues?: Readonly<K[]>;
    uniqueValues?: K[];
    fkValues?: K[];
    enforceTypes?: Record<K, TypeString>;
    ignoreValues: number[];
    readHeader?: boolean; // default: true
    eachRowCb?: (row: Row, index: number, warnings: ImportWarning[]) => void;
}

export type EachRowOptions<T extends string> = Omit<ReadTableOptions<T>, 'eachRowCb'>;

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
