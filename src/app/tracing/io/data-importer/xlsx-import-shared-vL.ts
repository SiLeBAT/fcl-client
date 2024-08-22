import { removeUndefined } from "@app/tracing/util/non-ui-utils";
import { ImportIssue } from "./xlsx-import-model-vL";
import { DELIVERY_IDENT_FIELDS } from "./xlsx-import-shared-const-vL";
import { InvalidFKReferenceError, RowComparisonOptions, RowDiff, TypedDeliveryRow } from "./xlsx-import-shared-model-vL";
import { CellValue } from "./xlsx-model-vL";

type TypeString = 'number' | 'lat' | 'lon' | 'nonneg:number' | 'string';
type TypeString2Type<T extends TypeString> =
    T extends 'number' | 'lat' | 'lon' | 'nonneg:number' ? number :
    T extends 'string' ? string : never;




interface Row {
    rowIndex: number;
    [key: number]: CellValue
}

function getPropValue<
    M extends boolean,
    X extends 'string' | 'number' | 'boolean',
    Y extends(X extends 'string' ? string : X extends 'number' ? number : boolean),
    R extends(M extends true ? Y: Y | undefined)
>(row: Row, index: string | number, reqType: X, required?: M): R {
    const value = row[index];
    if (value === undefined) {
        if (required === true) {
            throw new Error(`Value in column ${index} is missing.`);
        } else {
            return undefined as R;
        }
    }

    const obsType = typeof value;
    if (obsType === reqType) {
        return value as R;
    // } else if (reqType === 'string') {
    //     return `${value}` as R;
    } else {
        throw new Error(`Value in column '${index}' is not of type '${reqType}'.`);
    }
}

const LATITUDE_LIMITS = {
    min: -90,
    max: 90
} as const;

const LONGITUDE_LIMITS = {
    min: -180,
    max: 180
} as const;

export function getCleanedString(value: CellValue | undefined): string | undefined {
    if (typeof value === 'string') {
        value = value.trim();
        if (value === '') {
            value = undefined;
        }
    } else if (value !== undefined) {
        return `${value}`;
    }
    return value;
}

function getCleanedInput(value: CellValue | undefined): CellValue | undefined {
    if (typeof value === 'string') {
        value = value.trim();
        if (value === '') {
            value = undefined;
        }
    }
    return value;
}

function getLat(lat: any): number | undefined {
    return typeof lat === 'number' && !Number.isNaN(lat) && isInRange(lat, LATITUDE_LIMITS.min, LATITUDE_LIMITS.max) ? lat : undefined;
}

function getLon(lon: any): number | undefined {
    return typeof lon === 'number' && !Number.isNaN(lon) && isInRange(lon, LONGITUDE_LIMITS.min, LONGITUDE_LIMITS.max) ? lon : undefined;
}

function getNumber(value: any): number | undefined {
    return typeof value === 'number' && !Number.isNaN(value) ? value : undefined;
}

function getString(value: any): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

function getNonNegNumber(value: any): number | undefined {
    return typeof value === 'number' && !Number.isNaN(value) && value >= 0 ? value : undefined;
}

const TYPESTRING_2_FUN = {
    lat: getLat,
    lon: getLon,
    'nonneg:number': getNonNegNumber,
    number: getNumber,
    string: getString
} as const satisfies ({ [T in TypeString]: (x: CellValue | undefined) => TypeString2Type<T> | undefined })

const TYPESTRING_2_LABEL = {
    lat: 'latitude',
    lon: 'longitude',
    'nonneg:number': 'non negative number',
    number: 'number',
    string: 'string'
} as const satisfies ({ [T in TypeString]: string })

function conditionalConcat(arr: (string | number | boolean | undefined)[], sep: string): string | undefined {
    arr = removeUndefined(arr);
    const filteredArr = removeUndefined(arr);
    return filteredArr.length === 0 ? undefined : filteredArr.join(sep);
}

export function importValue<
    M extends boolean,
    X extends TypeString,
    Y extends TypeString2Type<X>,
    R extends(M extends true ? Y: Y | undefined)
>(row: Row, index: number, reqType: X, issues: ImportIssue[], required?: M): R {
    const inputValue = getCleanedInput(row[index]);
    if (inputValue === undefined) {
        if (required === true) {
            issues.push({
                row: row.rowIndex,
                col: index,
                type: 'error',
                msg: `Mandatory value in column ${index} is missing.`
            })
            throw new MissingMandatoryValueError(`Value in column ${index} is missing.`);
        } else {
            return undefined as R;
        }
    }
    const value = TYPESTRING_2_FUN[reqType](inputValue);
    if (value !== undefined) {
        return value as R;
    } else {
        throw new Error(`Value in column '${index}' is not of type '${TYPESTRING_2_LABEL[reqType]}'.`);
    }
}

export function importString<
    M extends boolean
    R extends(M extends true ? string: string | undefined)
>(row: Row, index: number, issues: ImportIssue[], required?: M): R {
    const inputValue = getCleanedString(row[index]);
    if (inputValue === undefined) {
        if (required === true) {
            issues.push({
                row: row.rowIndex,
                col: index,
                type: 'error',
                msg: `Mandatory value in column ${index} is missing.`
            })
            throw new MissingMandatoryValueError(`Value in column ${index} is missing.`);
        } else {
            return undefined as R;
        }
    }
    const value = TYPESTRING_2_FUN[reqType](inputValue);
    if (value !== undefined) {
        return value as R;
    } else {
        throw new Error(`Value in column '${index}' is not of type '${TYPESTRING_2_LABEL[reqType]}'.`);
    }
}

export function importAggAmount(row: Row, quantityColindex: number, unitColIndex: number, issues: ImportIssue[]): string | undefined {
    return conditionalConcat([
        getCleanedString(row[quantityColindex]),
        getCleanedString(row[unitColIndex])
    ], ' ');
}

// export function importAmountPair(row: Row, quantityColindex: number, unitColIndex: number, issues: ImportIssue[]): { quantity: number | undefined; unit: string | undefined } {
//     return conditionalConcat([
//         getCleanedString(row[quantityColindex]),
//         getCleanedString(row[unitColIndex])
//     ], ' ');
// }

// export function importLatAndLon(row: Row, latIndex: number | undefined, lonIndex: number | undefined, issues: ImportIssue[]): { lat: number; lon: number } | undefined {
//     const inputLat = latIndex === undefined ?  undefined : getCleanedInput(row[latIndex]);
//     const inputLon = lonIndex === undefined ?  undefined : getCleanedInput(row[lonIndex]);
//     const lat = getLat(inputLat);
//     const lon = getLon(inputLon);

// }

export function importAddColValue<
    I extends number | undefined,
    T extends TypeString,
    R extends (I extends undefined ? undefined : TypeString2Type<T> | undefined)
>(row: Row, index: I, type: T, issues: ImportIssue[]): R {
    if (index === undefined) {
        return undefined as R;
    } else {
        return importValue(row, index, type, issues);
    }
}

export function importFkString(row: Row, index: number, allowedFks: Set<string>, issues: ImportIssue[], foreignEntityType: string): string {
    const fk = importValue(row, index, 'string', issues, true);
    if (!allowedFks.has(fk)) {
        issues.push({
            row: row.rowIndex,
            col: index,
            type: 'warn',
            msg: `Value in column ${index} does not refer to a listed ${foreignEntityType}.`
        });
        throw new InvalidFKReferenceError();
    }
    return fk;
}

export function importUniqueString<
    M extends boolean,
    R extends(M extends true ? string: string | undefined)
>(row: Row, index: number, uniqueValues: Set<string>, issues: ImportIssue[], required?: M): R {
    const value = importValue(row, index, 'string', issues, required);
    if (value !== undefined) {
        if (uniqueValues.has(value)) {
            issues.push({
                row: row.rowIndex,
                col: index,
                type: 'warn',
                msg: `Value in column ${index} is not unique.`
            });
            throw new NonUniqueValueError();
        } else {
            uniqueValues.add(value);
        }
    }
    return value as R;
}

function isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

function getValidIntegerInRange(value: any, min: number, max: number): number | undefined {
    if (value === undefined) {
        return undefined;
    }
    const valueType = typeof value;
    const numValue = valueType === 'number' ? value : valueType === 'string' ? Number(value) : NaN;
    return (!Number.isNaN(numValue) && Number.isInteger(numValue) && isInRange(numValue, 1000, 9999)) ? numValue : undefined;
}

export function getValidYear(row: Row, colIndex: number, issues: ImportIssue[]): number | undefined {
    const inputYear = row[colIndex];
    const validYear = getValidIntegerInRange(inputYear, 1000, 9999);
    if (validYear === undefined && inputYear !== undefined) {
        issues.push({
            colIndex: colIndex,
            rowIndex: row.rowIndex,
            type: 'invalid input',
            message: `Year '${inputYear}' is invalid and will be omitted.`
        })
    }
}

export function getValidMonth(row: Row, colIndex: number, issues: ImportIssue[]): number | undefined {
    return getValidIntegerInRange(month, 1, 12);
}

function isLeapYear(year: number): boolean {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}

export function getValidDay(row: Row, colIndex: number, issuesmonth: number | undefined, year: number | undefined): number | undefined {
    const numDay = getValidIntegerInRange(day, 1, 31);
    if (numDay !== undefined) {
        if (month !== undefined) {
            if (
                month === 2 && (
                    numDay > 29 ||
                    (
                        numDay > 28 &&
                        year !== undefined &&
                        !isLeapYear(year)
                    )
                ) ||
                month > 30 && [4,6,9,11].includes(month)
            ) {
                return undefined;
            }
        }
    }
    return numDay;
}

export function importYear(row: Row, yearCol: number, issues: ImportIssue[]): number | undefined {

}

export function importStrDate(
    row: Row,
    dateCols: {
        y: number;
        m: number;
        d: number;
    },
    issues: ImportIssue[]
): string | undefined {
    const inputYear = row[dateCols.y];
    const year = getValidYear(inputYear);

    if (year === undefined) {
        if (inputYear !== undefined) {
            issues.push({ row: row.rowIndex, col: dateCols.y, warning: `Year '${inputYear}' is invalid.` });
        }
        return undefined;
    } else {
        const imputMonth = row[dateCols.m];
        const month = getValidMonth(row[dateParts.monthIndex]);

        if (month === undefined) {
            if (rawMonth !== undefined) {
                warnings.push({ row: rowIndex, col: dateParts.monthIndex, warning: `Value '${rawMonth}' is invalid.` });
            }
            row[dateIndex as any] = `${year}`;
        } else {
            const rawDay = row[dateParts.dayIndex];
            const day = getValidDay(rawDay, month, year);
            if (day === undefined) {
                if (rawDay !== undefined) {
                    warnings.push({ row: rowIndex, col: dateParts.dayIndex, warning: `Day '${rawMonth}' is invalid.` });
                }
                row[dateIndex as any] = `${year}-${String(month).padStart(2, '0')}`;
            } else {
                row[dateIndex as any] = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
    }
}

type MayBeReadonly<T> = Readonly<T> | T;

function getPartialFP<T extends {}, K extends keyof T>(row: T, keys: MayBeReadonly<(K)[]>): string {
    const record = {} as any;
    keys.forEach(k => record[k] = row[k]);
    return JSON.stringify(record);
}

export function createDeliveryPPIdentFP(delRow: TypedDeliveryRow): string {
    return getPartialFP(delRow, DELIVERY_IDENT_FIELDS);
}

function getHashCode(text: string): number {
    let h = 0;
    const l = text.length;
    let i = 0;
    if (l > 0) {
        while (i < l) {
            // eslint-disable-next-line no-bitwise
            h = (h << 5) - h + text.charCodeAt(i++) | 0;
        }
    }
    return h;
}

export function createDeliveryId(delRow: TypedDeliveryRow): string {
    const hashCode = Math.abs(getHashCode(createDeliveryPPIdentFP(delRow)));
    return `${hashCode}`;
}

export function compareRows<T extends {}, K extends (keyof T) & (string | number)>(row1: T, row2: T, options?: RowComparisonOptions<K>): RowDiff<K> {
    const compareFields = new Set(options?.compareFields ?? Object.keys(row1).concat(Object.keys(row2)) as K[]);
    const ignoreFields = new Set(options?.ignoreFields ?? []);
    const conflictingFields: K[] = [];
    const missingFields: K[] = [];
    compareFields.forEach(f => {
        const v1 = row1[f];
        const v2 = row2[f];
        if (v1 === undefined) {
            if (v2 !== undefined) {
                missingFields.push(f);
            }
        } else {
            if (v2 === undefined) {
                missingFields.push(f);
            } else if (v1 !== v2) {
                conflictingFields.push(f);
            }
        }
    });
    return {
        conflictingFields: conflictingFields,
        missingFields: missingFields
    };

}
