import { ImportIssue } from "./xlsx-import-model-vL";
import { CellValue } from "./xlsx-model-vL";

type TypeString = 'number' | 'lat' | 'lon' | 'nonneg:number' | 'string';
type TypeString2Type<T extends TypeString> =
    T extends 'number' | 'lat' | 'lon' | 'nonneg:number' ? number :
    T extends 'string' ? string : never;

interface Row {
    rowIndex: number;
    [key: number]: CellValue
}

interface TableColumn {
    outId?: string;
    id?: string;
    ref?: string;
    type: string;
}

interface ImportTable<T extends {}> {
    issues: ImportIssue[];
    columns: TableColumn[];
    rows: T;
}

interface ImportSource {
    type: ImportSourceType;
    name: string;
    stations: ImportTable<StationRow>;
    deliveries: ImportTable<DeliveryRow>;
    del2Dels: ImportTable<Del2DelRow>;
}

interface Del2DelRow {
    from: string;
    to: string;
}


export class MissingMandatoryValueError extends Error {
    constructor(msg?: string | undefined) {
        super(msg);
    }
}

export class InvalidFKReferenceError extends Error {
    constructor(msg?: string | undefined) {
        super(msg);
    }
}

export interface RowDiff<T> {
    conflictingFields: T[];
    missingFields: T[];
}

export interface RowComparisonOptions<T> {
    compareFields?: T[];
    ignoreFields?: T[];
}

interface StationRow {
    id: string;
    name?: string;
    country?: string;
    typeOfBusiness?: string;
    // -- additional columns
    lat?: number;
    lon?: number;
}

export interface TypedDeliveryRow {
    rowIndex: number;
    id: string;
    inputIdentFP: string;
    ppIdentFP: string;

    source: string;
    productName?: string;
    lotNo?: string;
    dateOut?: string;
    dateIn?: string;
    unitAmount?: string; // ??
    // unitAmount_number?: number;
    // unitAmount_unit?: string;
    target: string;
    // -- additional columns
    delAmountQuantity?: number; //??
    delAmountUnit?: string;
    itemNumber?: string;
    subUnits?: number;
    bestBeforeDate?: string;
    productionTreatment?: string;
    sampling?: string;
    value?: string;
    productionDate?: string;
    indicator?: string
}

interface Del2DelRow {
    from: string;
    to: string;
}
