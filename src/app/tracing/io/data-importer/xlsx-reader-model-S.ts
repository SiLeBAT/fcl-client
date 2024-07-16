import { concat, isNotNullish } from '@app/tracing/util/non-ui-utils';
import { ArrayWith2OrMoreElements, NonEmptyArray, RequiredPick } from '@app/tracing/util/utility-types';
import * as _ from 'lodash';

export type CellValue = string | number | boolean;
export type Row =  Record<number, CellValue>;

export type TypeString = 'string' | 'nonneg:number' | 'number' | 'year' | 'month' | 'day' | 'never' | 'lat' | 'lon' | 'auto';
export type TypeString2Type<T extends TypeString | undefined | unknown> = T extends 'nonneg:number' | 'number' | 'year' | 'month' ? number : T extends undefined ? CellValue : string;


type GetTypeString<TM, TR> = TM extends {} ? TR extends keyof TM ? TM[TR] extends TypeString ? TM[TR] : 'auto' : 'auto' : 'auto';
type GetMandatoryFields<T> = T extends ReadTableOptions<infer A, infer TR, infer MR> ? (T['mandatoryValues'] extends Array<infer X> ? (X & A) : never) : never;
type TypedRow<T> = T extends ReadTableOptions<infer A, infer TR, infer MR> ? RequiredPick<{ [key in A]?: TypeString2Type<GetTypeString<T['enforceType'],key>> }, GetMandatoryFields<T> & A> : Row;

export type HeaderConf = string | [string, [HeaderConf, HeaderConf, ...HeaderConf[]]];

export interface ColumnHeader {
    label: string[];
    columnIndex: number;
}

export interface TableHeader {
    columns: ColumnHeader[],
    rowCount: number;
}

export interface ColumnInfo {
    types: Set<string>;
    columnIndex: number;
    alias?: string;
}

export interface TableContent<T> {
    columnInfo: ColumnInfo[];
    rows: (TypedRow<T> & Row)[];
}

export interface Table<T> extends TableContent<T> {
    header: TableHeader;
    columns: ColumnInfo[];
    rows: (TypedRow<T> & Row)[];
}

interface TableOffset {
    col: number;
    row: number;
}

export interface NGReadTableOptions {
    offset: TableOffset;
}

interface ValidationIssue {
    msg: string;
}

interface ValidationResult {
    isValid: boolean;
    issues: ValidationIssue[];
}

export interface CellSpecs {
    text: string;
    col: number;
    row: number;
    colSpan: number;
    minRowSpan?: number;
}

export interface ReadTableOptions<
    A extends string,
    TR extends string,
    MR extends string
> extends NGReadTableOptions {
    aliases?: Record<A, number | undefined>;
    mandatoryValues?: MR[];
    uniqueValues?: A[];
    fkRelations?: Partial<Record<A, Set<any>>>;
    enforceType?: Record<A, TypeString>;
}

export interface IXlsxSheetReader {
    readTableHeader(options: NGReadTableOptions): TableHeader;
    readTable<A extends string, TR extends string, MR extends string, T extends ReadTableOptions<A, TR, MR>>(options: T): Table<T>;
    readTableRows<A extends string, TR extends string, MR extends string, T extends ReadTableOptions<A, TR, MR>>(options: T): TableContent<T>;

    validateTableHeader(headerConf: HeaderConf[], offset: TableOffset): ValidationResult;
    validateCells(cellSpecs: CellSpecs): ValidationResult;
}

export interface IXlsxReader {
    get sheetNames(): string[];
    loadFile(file: File): Promise<void>;
    getSheetReader(sheetName: string): IXlsxSheetReader;
    validateSheetColumnHeader(sheetName: string, columnHeader: HeaderConf[]): ValidationResult;
    containsSheets(sheetNames: string[]): boolean;
    validateSheetCells(sheetName: string, cellSpecs: CellSpecs[]): ValidationResult;

    readTableHeaderFromSheet(sheetName: string, options: NGReadTableOptions): TableHeader;
    readTableFromSheet<A extends string, TR extends string, MR extends string, T extends ReadTableOptions<A, TR, MR>>(sheetName: string, options: T): Table<T>;
    readTableRowsFromSheet<A extends string, TR extends string, MR extends string, T extends ReadTableOptions<A, TR, MR>>(sheetName: string, options: T): TableContent<T>;
}
