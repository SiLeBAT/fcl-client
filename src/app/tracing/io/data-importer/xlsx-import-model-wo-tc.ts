import { XlsxReader } from "./xlsx-reader-S";

interface ValidationIssue {

}

interface ValidationResult {
    isValid: boolean;
    issues: ValidationIssue[];
}

export interface ImportIssue {
    ref?: string;
    col?: number;
    row?: number;
    type: 'warn' | 'info' | 'error';
    msg: string;
}

export interface Property {
    id: string;
    extId?: string;
    type: string;
}

export interface Table<T extends {}> {
    properties: Property[];
    rows: T[]
}

export interface StationData {
    extId: string;
    id: string;
    fp: string;
    name?: string;
    address?: string;
    country?: string;
}

export interface DeliveryData {
    extId: string;
    id: string;
    fp: string;
    source: string;
    target: string;
    productName?: string;
    lot?: string;
    dateIn?: string;
    dateOut?: string;
    amount?: string;
}

export interface Delivery2DeliveryData {
    from: string;
    to: string;
}

export interface ImportData {
    stations: StationData[];
    deliveries: DeliveryData[];
    issues: ImportIssue[];
    data:
}
export interface ImportResult {
    source: string;
    sourceType: string;
    issues: ImportIssue[];
    data:
}

export interface XlsxImporter {
    validateFile(xlsxReader: XlsxReader): ValidationResult;
    importFile(xlsxReader: XlsxReader): ImportResult;
}
