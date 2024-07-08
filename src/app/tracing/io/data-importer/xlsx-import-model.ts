import { XlsxReader } from "./xlsx-reader";

interface ValidationIssue {

}

interface ValidationResult {
    isValid: boolean;
    issues: ValidationIssue[];
}

interface ImportIssue {

}

interface ImportResult {
    source: string;
    issues: ImportIssue[];
}

export interface XlsxImporter {
    validateFile(xlsxReader: XlsxReader): ValidationResult;
    importFile(xlsxReader: XlsxReader): ImportResult;
}
