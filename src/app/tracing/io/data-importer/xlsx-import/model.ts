import { PartialPick } from "@app/tracing/util/utility-types";
import { CellValue, Row, XlsxReader } from "./xlsx-reader";

export interface SetLike {
    has: (x: string) => boolean;
}

export type AddIssueCallback = (
    issue: PartialPick<ImportIssue, "sheet">,
    invalidateRow?: boolean,
) => void;

export type AddIssueToTable = (
    issue: PartialPick<ImportIssue, "sheet">,
    row: Row,
    invalidateRow?: boolean,
) => void;

export type MappingDef<T> = Partial<
    Readonly<
        Record<
            keyof T,
            Readonly<{ header: Readonly<string[]>; type: RefinedTypeString }>
        >
    >
>;

export type NumberTypeString = "number" | "lat" | "lon" | "nonneg:number";
export type RefinedTypeString = "string" | NumberTypeString | "boolean";

export interface ColumnMapping {
    fromIndex: number;
    type: RefinedTypeString;
    toPropId: string;
}

export interface ImportIssue {
    ref?: string | number;
    sheet: string;
    col?: number;
    colRef?: string[];
    row?: number;
    type?: "error" | "warning";
    msg: string;
    value?: CellValue;
    invalidatesRow?: boolean;
}

interface TableColumn {
    externalOutId?: string;
    externalColumnName?: string[];
    internalId?: string;
    type: string;
}

export interface ImportTable<T> {
    issues: ImportIssue[];
    columns: TableColumn[];
    rows: T[];
    omittedRows: number;
}

export type DeliveryTable = ImportTable<DeliveryRow>;

export interface RowWithOtherProps {
    otherProps: Record<string, CellValue>;
}

export interface ImportResult {
    stations: ImportTable<StationRow>;
    deliveries: ImportTable<DeliveryRow>;
    del2Dels: ImportTable<Del2DelRow>;
}

export interface StationRow extends Partial<RowWithOtherProps> {
    id: string;
    name?: string;
    address?: string;
    country?: string;
    typeOfBusiness?: string;
    lat?: number;
    lon?: number;
}

export interface DeliveryRow extends Partial<RowWithOtherProps> {
    id: string;
    source: string;
    target: string;
    productName?: string;
    lotNumber?: string;
    dateOut?: string;
    dateIn?: string;
    unitAmount?: string;
    lotAmountNumber?: number;
    lotAmountUnit?: string;
    lotTreatment?: string;
    lotSampling?: string;
    lotProductionDate?: string;
    lotBestBeforeDate?: string;
}

export interface Del2DelRow {
    from: string;
    to: string;
}

export interface XlsxImporter {
    isTemplateFormatValid(xlsxReader: XlsxReader): boolean;
    importTemplate(xlsxReader: XlsxReader): ImportResult;
}
