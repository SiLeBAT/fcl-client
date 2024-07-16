import { XlsxReader } from "./xlsx-reader-S";

interface ValidationIssue {

}

interface ValidationResult {
    isValid: boolean;
    issues: ValidationIssue[];
}

export interface ImportIssue {
    col?: number;
    row?: number;
    type: 'warn' | 'info' | 'error';
    msg: string;
}

interface ImportResult {
    source: string;
    issues: ImportIssue[];
}

export interface XlsxImporter {
    validateFile(xlsxReader: XlsxReader): ValidationResult;
    importFile(xlsxReader: XlsxReader): ImportResult;
}
