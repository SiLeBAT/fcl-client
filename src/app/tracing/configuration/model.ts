import { TableRow } from '../data.model';

export interface RowFilter<T> {
    filter(arr: TableRow[]): TableRow[];
    getSettings(): T;
}

export interface TextFilterSettings {
    filterTerm: string;
    filterProps: string[];
}

export enum TableType {
    STATIONS, DELIVERIES
}
