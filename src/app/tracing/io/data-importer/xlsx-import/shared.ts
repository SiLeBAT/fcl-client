import {
    getFiniteNumberOrUndefined,
    removeUndefined,
} from "../../../../tracing/util/non-ui-utils";
import { IMPORT_ISSUES, IMPORT_PREFIXES } from "./consts";
import {
    AddIssueCallback,
    ColumnMapping,
    DeliveryRow,
    ImportIssue,
    ImportTable,
    MappingDef,
    NumberTypeString,
    RefinedTypeString,
    StationRow,
} from "./model";
import { BasicTypeString, CellValue, Row, Table } from "./xlsx-reader";
import * as _ from "lodash";
import {
    isDayValid,
    isMonthValid,
    isYearValid,
} from "../../../util/date-utils";

type TypeString2Type<T extends RefinedTypeString> = T extends NumberTypeString
    ? number
    : T extends "string"
      ? string
      : T extends "boolean"
        ? boolean
        : never;

interface AmountColumns {
    number: number;
    unit: number;
}

export function createEmptyImportTable<T>(): ImportTable<T> {
    return {
        issues: [],
        columns: [],
        rows: [],
        omittedRows: 0,
    };
}

const LATITUDE_LIMITS = {
    min: -90,
    max: 90,
} as const;

const LONGITUDE_LIMITS = {
    min: -180,
    max: 180,
} as const;

export function getPropsFromRow<T = { [key: string]: CellValue }>(
    fromRow: Row,
    columnMappings: ColumnMapping[],
    addIssueCb: AddIssueCallback,
): { [key: string]: CellValue } {
    const properties: { [key: string]: CellValue } = {};
    columnMappings.forEach((columnMapping) => {
        const value = importValue(
            fromRow,
            columnMapping.fromIndex,
            columnMapping.type,
            addIssueCb,
        );
        if (value !== undefined) {
            properties[columnMapping.toPropId] = value;
        }
    });
    return properties;
}

export function enrichImportIssue(
    issue: ImportIssue,
    row: Row,
    table: Table,
    invalidateRow: boolean,
    ref?: string | undefined,
): ImportIssue {
    issue = { ...issue };
    issue.row ??= row?.rowIndex;
    if (ref !== undefined) {
        issue.ref ??= ref;
    }
    if (invalidateRow) {
        issue.invalidatesRow = true;
    }
    if (issue.col !== undefined && issue.colRef === undefined) {
        // col is supposed to be the zero based relative index in the table
        if (row[issue.col] !== undefined) {
            issue.value = row[issue.col];
        }
        issue.colRef = table.header.columnHeaders[issue.col];
        issue.col += table.offset.col;
        // col is now an absolute 1 based index
    }
    return issue;
}

function getMergedType(
    types: Set<BasicTypeString>,
): BasicTypeString | undefined {
    switch (types.size) {
        case 0:
            return undefined;
        case 1:
            return Array.from(types)[0];
        default:
            return "string";
    }
}

export function getOtherColumns(
    table: Table,
    startIndex: number,
    ignoreIndices: number[],
): ColumnMapping[] {
    const ignoreIndicesSet = new Set(ignoreIndices);
    const columnMappings = table.header.columnHeaders.map((h, index) => ({
        fromIndex: index,
        toPropId: h.join("_"),
        type: getMergedType(table.columns[index].types),
    }));

    let filteredColumnMappings = columnMappings.filter(
        (col) =>
            col.fromIndex >= startIndex &&
            !ignoreIndicesSet.has(col.fromIndex) &&
            col.type !== undefined,
    ) as ColumnMapping[];
    // filters duplicates
    filteredColumnMappings = _.uniqBy(
        filteredColumnMappings,
        (colMapping) => colMapping.toPropId,
    );
    return filteredColumnMappings;
}

export function getOptionalColumnMapping<T>(
    table: Table,
    mappingDef: MappingDef<T>,
): ColumnMapping[] {
    const columnMappings: ColumnMapping[] = [];
    const optionalColRefs = Object.keys(mappingDef) as (keyof MappingDef<T> &
        string)[];
    optionalColRefs.forEach((colRef) => {
        const expectedHeader = mappingDef[colRef]?.header;
        const columnIndex = table.header.columnHeaders.findIndex(
            (observedHeader) => _.isEqual(expectedHeader, observedHeader),
        );
        if (columnIndex >= 0) {
            if (table.columns[columnIndex].types.size > 0) {
                columnMappings.push({
                    fromIndex: columnIndex,
                    toPropId: colRef,
                    type: mappingDef[colRef]!.type,
                });
            }
        }
    });
    return columnMappings;
}

export function getCleanedStringOrUndefined(
    value: CellValue | undefined,
): string | undefined {
    if (typeof value === "string") {
        return value.trim() || undefined;
    } else if (value !== undefined) {
        return `${value}`;
    }
    return undefined;
}

function getCleanedInput(value: CellValue | undefined): CellValue | undefined {
    if (typeof value === "string") {
        return value.trim() || undefined;
    }
    return value;
}

function getLat(lat: any): number | undefined {
    const numLat = getFiniteNumberOrUndefined(lat);
    return numLat !== undefined &&
        isInRange(numLat, LATITUDE_LIMITS.min, LATITUDE_LIMITS.max)
        ? numLat
        : undefined;
}

function getLon(lon: any): number | undefined {
    const numLon = getFiniteNumberOrUndefined(lon);
    return numLon !== undefined &&
        isInRange(numLon, LONGITUDE_LIMITS.min, LONGITUDE_LIMITS.max)
        ? numLon
        : undefined;
}

function getBoolean(value: any): boolean | undefined {
    return typeof value === "boolean" ? value : undefined;
}

function getNumber(value: any): number | undefined {
    return typeof value === "number" && !Number.isNaN(value)
        ? value
        : undefined;
}

export function getStringOrUndefined(value: any): string | undefined {
    return typeof value === "string" ? value : undefined;
}

function getNonNegNumber(value: any): number | undefined {
    return typeof value === "number" && !Number.isNaN(value) && value >= 0
        ? value
        : undefined;
}

const TYPESTRING_2_FUN: {
    [T in RefinedTypeString]: (
        x: CellValue | undefined,
    ) => TypeString2Type<T> | undefined;
} = {
    lat: getLat,
    lon: getLon,
    "nonneg:number": getNonNegNumber,
    number: getNumber,
    string: getStringOrUndefined,
    boolean: getBoolean,
};

function conditionalConcat(
    arr: (string | number | boolean | undefined)[],
    sep: string,
): string | undefined {
    arr = removeUndefined(arr);
    const filteredArr = removeUndefined(arr);
    return filteredArr.length === 0 ? undefined : filteredArr.join(sep);
}

export function importValue<X extends RefinedTypeString>(
    row: Row,
    colIndex: number,
    reqType: X,
    addIssueCb: AddIssueCallback,
    required = false,
    invalidateRow = false,
): TypeString2Type<X> | undefined {
    const inputValue = getCleanedInput(row[colIndex]);
    if (inputValue !== undefined) {
        const value = TYPESTRING_2_FUN[reqType](inputValue);
        if (value === undefined) {
            addIssueCb(
                {
                    col: colIndex,
                    type: "error",
                    msg: IMPORT_ISSUES.invalidValue,
                },
                invalidateRow,
            );
        }
        return value;
    } else if (required) {
        addIssueCb(
            {
                col: colIndex,
                type: "error",
                msg: IMPORT_ISSUES.missingValue,
            },
            invalidateRow,
        );
    }
    return undefined;
}

export function importReference(
    row: Row,
    colIndex: number,
    allowedValues: { has: (x: string) => boolean },
    addIssueCb: AddIssueCallback,
): string | undefined {
    const inputValue = getCleanedStringOrUndefined(row[colIndex]);
    if (inputValue === undefined) {
        addIssueCb(
            {
                col: colIndex,
                type: "error",
                msg: IMPORT_ISSUES.missingValue,
            },
            true,
        );
    } else if (!allowedValues.has(inputValue)) {
        addIssueCb(
            {
                col: colIndex,
                type: "error",
                msg: IMPORT_ISSUES.invalidRef,
            },
            true,
        );
    }
    return inputValue;
}

export function importPrimaryKey(
    row: Row,
    colIndex: number,
    usedPks: { has: (x: string) => boolean },
    addIssueCb: AddIssueCallback,
): string | undefined {
    const inputValue = getCleanedStringOrUndefined(row[colIndex]);
    if (inputValue === undefined) {
        addIssueCb(
            {
                col: colIndex,
                type: "error",
                msg: IMPORT_ISSUES.missingValue,
            },
            true,
        );
        return undefined;
    } else if (usedPks.has(inputValue)) {
        addIssueCb(
            {
                col: colIndex,
                type: "error",
                msg: IMPORT_ISSUES.nonUniquePrimaryKey,
            },
            true,
        );
        return undefined;
    }
    return inputValue;
}

export function importMandatoryString(
    row: Row,
    colIndex: number,
    addIssueCb: AddIssueCallback,
): string | undefined {
    const inputValue = getCleanedStringOrUndefined(row[colIndex]);
    if (inputValue === undefined) {
        addIssueCb(
            {
                col: colIndex,
                type: "error",
                msg: IMPORT_ISSUES.missingValue,
            },
            true,
        );
        return undefined;
    }
    return inputValue;
}

export function importAggregatedAmount(
    row: Row,
    amountColumns: AmountColumns,
): string | undefined {
    return conditionalConcat(
        [
            getCleanedStringOrUndefined(row[amountColumns.number]),
            getCleanedStringOrUndefined(row[amountColumns.unit]),
        ],
        " ",
    );
}

export function getLongUniqueStationId(station: Partial<StationRow>): string {
    const uniqueId = JSON.stringify({
        name: station.name,
        address: station.address,
    });
    return uniqueId;
}

export function getLongUniqueDeliveryId(
    delivery: Partial<DeliveryRow>,
): string {
    const uniqueId = JSON.stringify({
        source: delivery.source,
        target: delivery.target,
        productName: delivery.productName,
        lotNumber: delivery.lotNumber,
        dateOut: delivery.dateOut,
        dateIn: delivery.dateIn,
        amount: delivery.unitAmount,
    });
    return uniqueId;
}

function getShortUniquePrefixedHash(
    text: string,
    valuesToExclude: Set<string>,
    prefix: string,
): string {
    let code = Math.abs(getHashCode(text));
    const codeToPrefixedHash = (x: number) => `${prefix}${x}`;
    let prefixedHash = codeToPrefixedHash(code);
    while (valuesToExclude.has(prefixedHash)) {
        code++;
        prefixedHash = codeToPrefixedHash(code);
    }
    return prefixedHash;
}

export function getShortUniqueDeliveryIdFromLongId(
    fullId: string,
    idsToExclude: Set<string>,
): string {
    return getShortUniquePrefixedHash(
        fullId,
        idsToExclude,
        IMPORT_PREFIXES.deliveryId,
    );
}

export function getShortUniqueStationIdFromLongId(
    fullId: string,
    idsToExclude: Set<string>,
): string {
    return getShortUniquePrefixedHash(
        fullId,
        idsToExclude,
        IMPORT_PREFIXES.stationId,
    );
}

function isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

function getValidYearOrUndefined(
    year: CellValue | undefined,
): number | undefined {
    const numYear = Number(year);
    if (isYearValid(numYear)) {
        return numYear;
    }
    return undefined;
}

function getValidMonthOrUndefined(
    month: CellValue | undefined,
): number | undefined {
    const numMonth = Number(month);
    if (isMonthValid(numMonth)) {
        return numMonth;
    }
    return undefined;
}

function getValidDayOrUndefined(
    day: CellValue | undefined,
    month: number | undefined,
    year: number | undefined,
): number | undefined {
    const numDay = Number(day);
    if (isDayValid(numDay, month, year)) {
        return numDay;
    }
    return undefined;
}

function getFormatedStrDate(
    year: number | undefined,
    month: number | undefined,
    day: number | undefined,
): string | undefined {
    const dateParts: string[] = [];
    if (year !== undefined) {
        dateParts.push(`${String(year).padStart(4, "0")}`);
        if (month !== undefined) {
            dateParts.push(`${String(month).padStart(2, "0")}`);
            if (day !== undefined) {
                dateParts.push(`${String(day).padStart(2, "0")}`);
            }
        }
    }
    return dateParts.length > 0 ? dateParts.join("-") : undefined;
}

export function importStringDate(
    row: Row,
    dateCols: {
        y: number;
        m: number;
        d: number;
    },
    addIssueCb: AddIssueCallback,
    invalidateRow = false,
): string | undefined {
    const inputYear = row[dateCols.y];
    const year = getValidYearOrUndefined(inputYear);
    const inputMonth = row[dateCols.m];
    const month = getValidMonthOrUndefined(inputMonth);
    const inputDay = row[dateCols.d];
    const day = getValidDayOrUndefined(inputDay, month, year);

    if (inputYear !== undefined && year === undefined) {
        addIssueCb(
            {
                col: dateCols.y,
                type: "error",
                msg: IMPORT_ISSUES.invalidValue,
            },
            invalidateRow,
        );
    }

    if (inputMonth !== undefined && month === undefined) {
        addIssueCb(
            {
                col: dateCols.m,
                type: "error",
                msg: IMPORT_ISSUES.invalidValue,
            },
            invalidateRow,
        );
    }

    if (inputDay !== undefined && day === undefined) {
        addIssueCb(
            {
                col: dateCols.d,
                row: row.rowIndex,
                type: "error",
                msg: IMPORT_ISSUES.invalidValue,
            },
            invalidateRow,
        );
    }

    return getFormatedStrDate(year, month, day);
}

function getHashCode(text: string): number {
    let h = 0;
    const l = text.length;
    let i = 0;
    if (l > 0) {
        while (i < l) {
            // eslint-disable-next-line no-bitwise
            h = ((h << 5) - h + text.charCodeAt(i++)) | 0;
        }
    }
    return h;
}
