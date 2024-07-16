export type CellValue = number | string | boolean;

export type Row = {
    rowIndex: number;
    [x: number]: CellValue;
}

export interface ImportWarning {
    col?: number;
    row?: number;
    warning: string;
}

export interface ReadTableOptions {
    offset: {
        row: number;
        col: number;
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


export interface ColumnInfo {
    extJsonId?: string;
    columnIndex?: number;
}
export interface Table<T = Row> {
    header: TableHeader;
    columns: ColumnInfo[];
    rows: T[];
}
