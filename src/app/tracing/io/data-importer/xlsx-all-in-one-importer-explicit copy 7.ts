import { DataTable as ExtDataTable, JsonData } from '../ext-data-model.v1';
import { AdditionalColRefs, CustomRefs, EXT_JSON_NAMES, LocalizedWBSpecs, LOCALIZED_WB_SPECS, MANDATORY_COL_INDEXES, OptionalSheetHeaders, OTHER_PROP_REFS, Ref2FieldIndexMap, sheetNameMapping, SHEET_REFS } from './xlsx-all-in-one-import-const';
import { ColumnRefs, SheetRef } from './xlsx-all-in-one-import-model';
import { XlsxImporter } from './xlsx-importer';
import { ColumnHeader, DatePartCols, ImportWarning, Row, Row as WSRow, TableHeader} from './xlsx-model';
import { concat, removeUndefined } from '@app/tracing/util/non-ui-utils';

import * as _ from 'lodash';

const LATITUDE_LIMITS = {
    min: -90,
    max: 90
} as const;

const LONGITUDE_LIMITS = {
    min: -180,
    max: 180
} as const;

interface Property {
    id: string;
    name: string;
    type: string;
}

interface TableColumn {
    id: string | number;
    name: string;
}

type TableRow = Record<string | number, number | string | boolean>;

interface Table {
    columns: TableColumn[];
    rows: TableRow[];
}

interface TypedStationRow {
    id: string;
    name?: string;
    address?: string;
    country?: string;
    typeOfCountry?: string;
    lat?: number;
    lon?: number;
}

interface TypedDeliveryRow {
    id: string;
    dateIn?: string;
    dateOut?: string;
    amount?: string;
}

type StationRow = TypedStationRow & TableRow;
type DeliveryRow = TypedDeliveryRow & TableRow;

function getPropValue<
    M extends boolean,
    X extends 'string' | 'number' | 'boolean',
    Y extends(X extends 'string' ? string : X extends 'number' ? number : boolean),
    R extends(M extends true ? Y: Y | undefined)
>(row: WSRow, index: string | number, reqType: X, required?: M): R {
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

function getStringValue<
    M extends boolean,
    R extends(M extends true ? string: string | undefined)
>(row: WSRow, index: number | string, required?: M): R {
    return this.popValue(row, index, 'string', required);
}

function getNumberValue<
    M extends boolean,
    R extends(M extends true ? number: number | undefined)
>(row: WSRow, index: number | string, required?: M): R {
    return getPropValue(row, index, 'number', required);
}

function hashCode(text: string): number {
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

function createDatePart(x: number | undefined, length: number): string {
    return x === undefined ? '?'.repeat(length) : String(x).padStart(length, '0');
}

// function createDate(year: number | undefined, month: number | undefined, day: number | undefined): string | undefined {
//     const strMonth = createDatePart(month, 2);
//     const strYear = createDatePart(year, 4);
//     return day !== undefined ? `${strYear}-${strMonth}-${createDatePart(day, 2)}` :
//         month !== undefined ? `${strYear}-${strMonth}` :
//             year !== undefined ? strYear :
//                 undefined;
// }

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

function getValidYear(year: any): number | undefined {
    return getValidIntegerInRange(year, 1000, 9999);
}

function getValidMonth(month: any): number | undefined {
    return getValidIntegerInRange(month, 1, 12);
}

function isLeapYear(year: number): boolean {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}

function getValidDay(day: any, month: number | undefined, year: number | undefined): number | undefined {
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

function importStrDate<T extends object>(
    row: T,
    rowIndex: number,
    dateParts: {
        yearIndex: number;
        monthIndex: number;
        dayIndex: number;
    },
    dateIndex: keyof T,
    warnings: ImportWarning[]
): string | undefined {
    const rawYear = row[dateParts.yearIndex];
    const year = getValidYear(rawYear);

    if (year === undefined) {
        if (rawYear !== undefined) {
            warnings.push({ row: rowIndex, col: dateParts.yearIndex, warning: `Year '${rawYear}' is invalid.` });
        }
        return undefined;
    } else {
        const rawMonth = row[dateParts.monthIndex];
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

function checkDay(day: any, month?: number | undefined, year?: number | undefined): boolean {
    const dayType = typeof day;
    const numDay = dayType === 'number' ? day : dayType === 'string' ? Number(day) : undefined;
    if (Number.isInteger(numDay) && numDay >= 1 && numDay <= 31) {

    }
}

function getLinearColumns(columns: ColumnHeader[]): ColumnHeader[] {
    const linearColumns = columns.map(c => c.children ? [c].concat(getLinearColumns(c.children)) : [c]);
    return concat(...linearColumns);
}

function getLeaveColumns(columns: ColumnHeader[]): ColumnHeader[] {
    const leaveColumns = columns.map(c => c.children ? getLeaveColumns(c.children) : [c]);
    return concat(...leaveColumns);
}

function getColumnLabel(column: ColumnHeader): string[] {
    const label = column.parent ? getColumnLabel(column.parent).concat(column.label!) : [column.label!];
    return label;
}

export async function importAllInOneTemplate(file: File): Promise<JsonData> {
    const xlsxImporter = new XlsxImporter();
    xlsxImporter.loadFile(file);
    // is this excel file an all in one template ?
    let matchingWbSpecs = LOCALIZED_WB_SPECS;
    matchingWbSpecs = matchingWbSpecs.filter(
        locWBSpecs => xlsxImporter.matchSheetNames(
            SHEET_REFS.map(ref => locWBSpecs.wbSpecs.sheetLabels[ref])
        )
    );
    // xlsxImporter.matchSheetNames(SHEET_REFS.map(ref => sheetNameMapping[ref]));
    // ToDo: Please consider that sheets might not be present (e.g. del2DelSheet)
    // const expectedSheetHeaders = createLocalizedHeaderConf(EXT_COL_NAMES);
    matchingWbSpecs = matchingWbSpecs.filter(locWbSpecs => {
        const availableSheetRefs = SHEET_REFS.filter(
            sheetRef => xlsxImporter.sheetNames.includes(locWbSpecs.wbSpecs.sheetLabels[sheetRef])
        );
        return availableSheetRefs.every(
            ref => xlsxImporter.matchSheetColumnHeader(locWbSpecs.wbSpecs.sheetLabels[ref], locWbSpecs.wbSpecs.mandatoryTableHeader[ref])
        );
        // return sheetRefs.every(ref => xlsxImporter.matchSheetCells(x.texts.sheetLabels[ref], x.texts.mandatorySheetCells[ref]));
    });

    const wbSpec = matchingWbSpecs[0].wbSpecs;

    const stationTable = importStationTable(xlsxImporter, wbSpec);
    const deliveryTable = importDeliveryRows(xlsxImporter, wbSpec);
    const del2DelTable = importDel2DelRows(xlsxImporter, wbSpec);

    const old2NewStationPkMap = addNewPks2StationRows(stationTable.rows, );
    applyNewFks(deliveryTable.rows, old2NewStatPkMap, MANDATORY_COL_INDEXES.deliveries.source);
    applyNewFks(deliveryTable.rows, old2NewStatPkMap, MANDATORY_COL_INDEXES.deliveries.target);

    const old2NewDeliveryPkMap = addNewPks2DeliveryRows(stationTable.rows, );
    applyNewFks(del2DelTable.rows, old2NewDeliveryPkMap, MANDATORY_COL_INDEXES.dels2Dels.from);
    applyNewFks(del2DelTable.rows, old2NewDeliveryPkMap, MANDATORY_COL_INDEXES.dels2Dels.to);

}

// desktop app del id generation
// private String getNewSerial(Lot l, Delivery d) {
// 	String newSerial = (l.getProduct() != null && l.getProduct().getStation() != null ?
// l.getProduct().getStation().getId() + ";" + l.getProduct().getName() : "null") + ";" + l.getNumber() + ";" +
// 			d.getDepartureDay() + ";" + d.getDepartureMonth() + ";" + d.getDepartureYear() + ";" +
// 			d.getArrivalDay() + ";" + d.getArrivalMonth() + ";" + d.getArrivalYear() + ";" +
// 			d.getUnitNumber() + ";" + d.getUnitUnit() + ";" + d.getReceiver().getId();
// 	return newSerial;
// }


function isValidLat(lat: any): boolean {
    return typeof lat === 'number' && !Number.isNaN(lat) && lat >= LATITUDE_LIMITS.min && lat <= LATITUDE_LIMITS.max;
}

function isValidLon(lon: any): boolean {
    return typeof lon === 'number' && !Number.isNaN(lon) && lon >= LONGITUDE_LIMITS.min && lon <= LONGITUDE_LIMITS.max;
}

// function getColHeaderBasedJsonName(columnHeader: ColumnHeader): string {
//     return columnHeader.parent ?
//         `${getColHeaderBasedJsonName(columnHeader.parent)}_${columnHeader.label}`:
//         columnHeader.label ?? '';
// }

function getColHeaderBasedJsonName(columnHeader: ColumnHeader): string {
    return columnHeader.label.join('_');
}


function createAdditionalColumns<T extends SheetRef>(
    columns: ColumnHeader[],
    colIndices: ColumnRefs<T>,
    defaultPrefix: string,
    ref2ExtName: Record<string, string>
): TableColumn[] {
    const revColIndices = createRevRecord(colIndices);
    const tableColumns: TableColumn[] = columns.map(
        column => {
            const ref = revColIndices[column.colIndex];
            const defaultExtName = `${defaultPrefix}` + getColHeaderBasedJsonName(column),
            const explicitExtName = ref ? ref2ExtName[ref] : undefined,
            return {
                id: column.colIndex,
                name: explicitExtName ?? defaultExtName
            };
        }
    );
    return tableColumns;
}

// function createDefaultStatColumns(): TableColumn[] {
//     const tableColumns: TableColumn[] = [
//         {
//             name: EXT_JSON_NAMES.stations.id,
//             id: MANDATORY_COL_INDEXES.stations.id
//         },{
//             name: EXT_JSON_NAMES.stations.name,
//             id: MANDATORY_COL_INDEXES.stations.name
//         },
//         {
//             name: EXT_JSON_NAMES.stations.address,
//             id: 'address'
//         }, {
//             name: EXT_JSON_NAMES.stations.country,
//             id: MANDATORY_COL_INDEXES.stations.country
//         }, {
//             name: EXT_JSON_NAMES.stations.typeOfBusiness,
//             id: MANDATORY_COL_INDEXES.stations.typeOfBusiness
//         },
//     ];
//     return tableColumns;
// }

function createDefaultStationColumns2(columns: ColumnHeader[], colIndices: ColumnRefs<'stations'>): TableColumn[] {
    const revColIndices = createRevRecord(colIndices);

    let sortedIndices: (keyof TypedStationRow | number)[] = [
        'id', colIndices.name, 'address'
    ];
    sortedIndices = sortedIndices.concat(_.difference(columns.map(c => c.colIndex)), sortedIndices);

    const ref2ExtLabel = EXT_JSON_NAMES.stations;
    const tableColumns = sortedIndices.map(index => {
        const ref = typeof index === 'number' ? revColIndices[index] : index;
        const extLabel = EXT_JSON_NAMES.stations[ref];
        return extLabel === undefined ? undefined : { id: index, name: extLabel };
    });
    return removeUndefined(tableColumns);
}

function createDefaultDeliveryColumns2(columns: ColumnHeader[], colIndices: ColumnRefs<'deliveries'>): TableColumn[] {
    const revColIndices = createRevRecord(colIndices);

    let sortedIndices: (keyof TypedDeliveryRow | number)[] = [
        'id', colIndices.name, colIndices.lotNo, colIndices.source, colIndices.target, 'dateIn', 'dateOut', 'amount'
    ];
    sortedIndices = sortedIndices.concat(_.difference(columns.map(c => c.colIndex)), sortedIndices);

    const tableColumns = sortedIndices.map(index => {
        const ref = typeof index === 'number' ? revColIndices[index] : index;
        const extLabel = EXT_JSON_NAMES.deliveries[ref];
        return extLabel === undefined ? undefined : { id: index, name: extLabel };
    });
    return removeUndefined(tableColumns);
}

// function createAdditionalStationColumns(columns: ColumnHeader[], colIndices: ColumnRefs<'stations'>): TableColumn[] {
//     const revColIndices = createRevRecord(colIndices);

//     let sortedIndices: (keyof TypedStationRow | number)[] = [
//         'id', colIndices.name, 'address'
//     ];
//     sortedIndices = sortedIndices.concat(_.difference(columns.map(c => c.colIndex)), sortedIndices);

//     const ref2ExtLabel = EXT_JSON_NAMES.stations;
//     const tableColumns = sortedIndices.map(index => {
//         const ref = typeof index === 'number' ? revColIndices[index] : index;
//         const extLabel = EXT_JSON_NAMES.stations[ref];
//         return extLabel === undefined ? undefined : { id: index, name: extLabel };
//     });
//     return removeUndefined(tableColumns);
// }


function createRevRecord<X extends string | number, Y extends string | number>(record: Partial<Record<X,Y>>): Record<Y, X> {
    const revRecord = {} as Record<Y,X>;
    Object.entries(record).forEach(([x, y]) => revRecord[y as Y] = x as X);
    return revRecord;
}

function createStationColumns(observedColumns: ColumnHeader[], colIndices: ColumnRefs<'stations'>): TableColumn[] {
    // const mandColIndices = MANDATORY_COL_INDEXES.stations;
    // const revColIndices = createRevRecord(colIndices);
    const addColsIndex = observedColumns.findIndex(c => c.colIndex === colIndices.addCols);
    const mandatoryColumns = observedColumns.slice(0, addColsIndex);
    const additionalColumns = observedColumns.slice(addColsIndex + 1);
    let tableColumns = [
        ...createDefaultStationColumns2(mandatoryColumns, colIndices),
        ...createAdditionalColumns(additionalColumns, colIndices, '_', EXT_JSON_NAMES.stations)
    ];

    tableColumns = _.uniqBy(tableColumns, (x) => x.name);

    return tableColumns;
}

function createDeliveryColumns(observedColumns: ColumnHeader[], colIndices: ColumnRefs<'deliveries'>): TableColumn[] {
    const addColsIndex = observedColumns.findIndex(c => c.colIndex === colIndices.addCols);
    const mandatoryColumns = observedColumns.slice(0, addColsIndex);
    const additionalColumns = observedColumns.slice(addColsIndex + 1);
    let tableColumns = [
        ...createDefaultDeliveryColumns2(mandatoryColumns, colIndices),
        ...createAdditionalColumns(additionalColumns, colIndices, '_Lieferungen.', EXT_JSON_NAMES.deliveries)
    ];

    tableColumns = _.uniqBy(tableColumns, (x) => x.name);

    return tableColumns;
}

function createDefaultDeliveryColumns(): TableColumn[] {
    const tableColumns: TableColumn[] = [
        {
            name: EXT_JSON_NAMES.deliveries.id,
            id: MANDATORY_COL_INDEXES.deliveries.id
        },
        {
            name: EXT_JSON_NAMES.deliveries.source,
            id: MANDATORY_COL_INDEXES.deliveries.source
        },
        {
            name: EXT_JSON_NAMES.deliveries.target,
            id: MANDATORY_COL_INDEXES.deliveries.target
        },
        {
            name: EXT_JSON_NAMES.deliveries.name,
            id: MANDATORY_COL_INDEXES.deliveries.name
        },
        {
            name: EXT_JSON_NAMES.deliveries.lotNo,
            id: MANDATORY_COL_INDEXES.deliveries.lotNo
        },
        {
            name: EXT_JSON_NAMES.deliveries.lotAmountQuantity,
            id: MANDATORY_COL_INDEXES.deliveries.lotAmount_quantity
        },
        {
            name: EXT_JSON_NAMES.deliveries.lotAmountUnit,
            id: MANDATORY_COL_INDEXES.deliveries.lotAmount_unit
        },
        {
            name: EXT_JSON_NAMES.deliveries.dateOut,
            id: 'dateOut'
        },
        {
            name: EXT_JSON_NAMES.deliveries.dateIn,
            id: 'dateIn'
        },
        {
            name: EXT_JSON_NAMES.deliveries.unitAmount,
            id: 'unitAmount'
        },
    ];
    return tableColumns;
}

function createDefaultDel2DelColumns(): TableColumn[] {
    const tableColumns: TableColumn[] = [
        {
            name: EXT_JSON_NAMES.dels2Dels.from,
            id: MANDATORY_COL_INDEXES.dels2Dels.from
        },
        {
            name: EXT_JSON_NAMES.dels2Dels.to,
            id: MANDATORY_COL_INDEXES.dels2Dels.to
        }
    ];
    return tableColumns;
}
/*
// the Armin way
private String generateAddress(Station s) {
    String ad = s.getStreet()==null?"":s.getStreet();
    ad += (ad.isEmpty() ? "" : " ") + (s.getNumber()==null?"":s.getNumber());
    ad = ad.trim();
    ad += (ad.isEmpty() ? "" : ", ") + (s.getZip()==null?"":s.getZip());
    ad = ad.trim();
    ad += (ad.isEmpty() ? "" : " ") + (s.getCity()==null?"":s.getCity());
    ad = ad.trim();
    if (ad.endsWith(",")) ad.substring(0, ad.length() - 1).trim();
    if (ad.isEmpty()) ad = null;
    return ad;
}
*/

function conditionalConcat(arr: (string | number | boolean | undefined)[], sep: string): string | undefined {
    arr = removeUndefined(arr);
    const filteredArr = removeUndefined(arr);
    return filteredArr.length === 0 ? undefined : filteredArr.join(sep);
}

function createStationAddress(row: StationRow): string | undefined {
    const street = getStringValue(row, MANDATORY_COL_INDEXES.stations.street);
    const streetNo = getStringValue(row, MANDATORY_COL_INDEXES.stations.streetNo);
    const streetWithNo = conditionalConcat([street, streetNo], ' ');
    const zip = getStringValue(row, MANDATORY_COL_INDEXES.stations.street);
    const city = getStringValue(row, MANDATORY_COL_INDEXES.stations.city);
    // const zipWithCity = zip !== undefined ? (city !== undefined ? `${zip} ${city}` : city) : zip;
    // const zipWithCity = zip !== undefined && city !== undefined ? `${zip} ${city}` : zip ?? city;
    const zipWithCity = conditionalConcat([zip, city], ' ');
    const address = conditionalConcat([streetWithNo, zipWithCity], ', ');
    return address;
}

function createStationId(row: TableRow): string {

}

function toString<T>(x: T): string {
    return typeof x === 'string' ? x : `${x}`;
}

function createRandomId(): string {

}

function getOptionalColIndices<T extends SheetRef>(
    observedTableHeader: TableHeader,
    optionalSheetHeaders: OptionalSheetHeaders<T>
): Partial<Record<AdditionalColRefs[T], number>> {
    const ref2Index: Partial<Record<AdditionalColRefs[T], number>> = {};
    optionalSheetHeaders.forEach(x => {
        const column = observedTableHeader.columnHeader.find(c => _.isEqual(c.label, x.labels));
        if (column) {
            ref2Index[x.ref] = column.colIndex;
        }
    });
    return ref2Index;
}


function importStationTable(
    xlsxImporter: XlsxImporter,
    wbSpecs: LocalizedWBSpecs
    // expectedHeader: HeaderConf[],
    // additionalHeaderConf: HeaderConf[]
): Table {
    // const expHeader =
    // const optionalHeaderConf = localizeHeaderConf('stations', labelMapping, additionColumnGroups.stations);

    // xlsxImporter.matchSheetColumnHeader(sheetNameMapping.stations, expectedHeader);
    const observedTableHeader = xlsxImporter.readTableHeaderFromSheet(wbSpecs.sheetLabels.stations);
    const addColsIndices = getOptionalColIndices(observedTableHeader, wbSpecs.optionalSheetHeaders!['stations']);

    const colIndices = {
        ...MANDATORY_COL_INDEXES.stations,
        ...addColsIndices
    };

    const table = xlsxImporter.readTableFromSheet(sheetNameMapping.stations, {
        offset: { row: observedTableHeader.rowCount + 1, col: 1 },
        readHeader: false,
        mandatoryValues: [
            colIndices.extId
        ],
        uniqueValues: [
            colIndices.extId
        ],
        ignoreValues: [
            colIndices.addCols
        ],
        enforceTextType: [
            colIndices.extId,
            colIndices.country,
            colIndices.name,
            colIndices.typeOfBusiness
        ],
        eachRowCb: (row: Row, index: number, warnings: ImportWarning[]) => {
            const stationRow = row as unknown as StationRow;
            stationRow.address = createStationAddress(stationRow);
            if (colIndices.lat) {
                if (row[colIndices.lat] !== undefined && !isValidLat(row[colIndices.lat])) {
                    warnings.push({ col: colIndices.lat, row: index, warning: `Value is invalid and will not be imported.` });
                    delete row[colIndices.lat];
                }
            }
            if (colIndices.lon) {
                if (row[colIndices.lon] !== undefined && !isValidLat(row[colIndices.lon])) {
                    warnings.push({ col: colIndices.lon, row: index, warning: `Value is invalid and will not be imported.` });
                    delete row[colIndices.lon];
                }
            }
        }
    });

    const tableColumns = createStationColumns(observedTableHeader.columnHeader, colIndices);

    return {
        columns: tableColumns,
        rows: table.rows
    };
}

function addNewPks<T extends TableRow>(
    rows: T[], oldPkIndex: number,
    newPkIndex: number | keyof T,
    genFun: (row: T) => string
): Map<string, string> {
    const pkSet = new Set<string>();
    const old2NewPkMap = new Map<string, string>();
    rows.forEach(row => {
        const oldPk = row[oldPkIndex] as string;
        let newPk = genFun(row);
        while (pkSet.has(newPk)) {
            newPk = `R${createRandomId()}`;
        }
        pkSet.add(newPk);
        old2NewPkMap.set(oldPk, newPk);
    });
    return old2NewPkMap;
}

function applyNewFks(rows: Row[], old2NewFks: Map<string, string>, fkFieldIndex: number): void {
    rows.forEach(row => {
        const oldFk = row[fkFieldIndex];
        if (typeof oldFk === 'string') {
            row[fkFieldIndex] = old2NewFks.get(oldFk)!;
        }
    });
}

function addNewPks2StationRows(rows: StationRow[], fieldIndices: Ref2FieldIndexMap<'stations'>): Map<string, string> {
    const old2NewPkMap = addNewPks(rows, fieldIndices.extId, fieldIndices.id, (row) => createStationId(row));
    return old2NewPkMap;
}

function addNewPks2DeliveryRows(rows: Row[], fieldIndices: Ref2FieldIndexMap<'deliveries'>): Map<string, string> {
    const old2NewPkMap = addNewPks(rows, fieldIndices.extId, fieldIndices.id, (row) => createDeliveryId(row));
    return old2NewPkMap;
}

function importDeliveryRows(
    xlsxImporter: XlsxImporter,
    wbSpecs: LocalizedWBSpecs
): Table {

    const observedTableHeader = xlsxImporter.readTableHeaderFromSheet(sheetNameMapping.deliveries);
    const addColsIndices = getOptionalColIndices(observedTableHeader, wbSpecs.optionalSheetHeaders!['deliveries']);

    const colIndices = {
        ...MANDATORY_COL_INDEXES.deliveries,
        ...addColsIndices
    };

    const table = xlsxImporter.readTableFromSheet(sheetNameMapping.deliveries, {
        offset: { row: observedTableHeader.rowCount + 1, col: 1 },
        readHeader: false,
        mandatoryValues: [
            colIndices.extId,
            colIndices.source,
            colIndices.target
        ],
        uniqueValues: [
            colIndices.extId
        ],
        ignoreValues: [
            colIndices.addCols
        ],
        // enforceTextType: [
        //     colIndices.extId,
        //     colIndices.source,
        //     colIndices.target,
        //     colIndices.name,
        //     colIndices.lotNo
        // ],
        enforceNonNegNumberType: [
            colIndices.lotAmount_quantity,
            colIndices.unitAmount_quantity
        ],

        eachRowCb: (row: Row, rowIndex: number, warnings: ImportWarning[]) => {

            const deliveryRow = row as DeliveryRow;
            importStrDate<TypedDeliveryRow>(
                deliveryRow,
                rowIndex, {
                    yearIndex: colIndices.dateOut_year,
                    monthIndex: colIndices.dateOut_month,
                    dayIndex: colIndices.dateOut_day
                },
                'dateOut',
                warnings
            );
            importStrDate<TypedDeliveryRow>(
                deliveryRow,
                rowIndex, {
                    yearIndex: colIndices.dateIn_year,
                    monthIndex: colIndices.dateIn_month,
                    dayIndex: colIndices.dateIn_day
                },
                'dateIn',
                warnings
            );
            deliveryRow.amount = conditionalConcat(
                [
                    deliveryRow[colIndices.unitAmount_quantity],
                    deliveryRow[colIndices.unitAmount_unit]
                ], ' ');
        }
    });
    const tableColumns = createDeliveryColumns(observedTableHeader.columnHeader, colIndices);

    // table.columns.forEach(column => {
    //     if (column.valueTypes.size > 1) {
    //         table.rows.forEach(row => {
    //             if (row[column.columnIndex] !== undefined) {
    //                 row[column.columnIndex] = `${row[column.columnIndex]}`;
    //             }
    //         });
    //         column.valueTypes.clear();
    //         column.valueTypes.add('string');
    //     }
    // });

    return {
        columns: tableColumns,
        rows: table.rows
    };
}

function importDel2DelRows(
    xlsxImporter: XlsxImporter,
    wbSpecs: LocalizedWBSpecs
): Table {
    // const observedTableHeader = xlsxImporter.readTableHeaderFromSheet(sheetNameMapping.dels2Dels);
    // const addColsIndices = getOptionalColIndices(observedTableHeader, wbSpecs.optionalSheetHeaders!['deliveries']);

    const colIndices = {
        ...MANDATORY_COL_INDEXES.dels2Dels
    };

    const table = xlsxImporter.readTableFromSheet(sheetNameMapping.dels2Dels, {
        offset: { col: 1, row: 1 },
        mandatoryValues: [colIndices.from, colIndices.to],
        enforceTextType: [colIndices.from, colIndices.to]
    });

    const tableColumns = createDefaultDel2DelColumns();
    // check references

    return {
        columns: tableColumns,
        rows: table.rows
    };
}

function table2ExtJsonTable(table: Table): ExtDataTable | undefined {
    if (table.rows.length > 0) {
        // const idsWithValues = new Set<string | number>();
        const id2Type = new Map<string | number, string>();
        for (const column of table.columns) {
            for (const row of table.rows) {
                if (row[column.id] !== undefined) {
                    id2Type.set(column.id, typeof row[column.id]);
                    break;
                }
            }
        }
        const columnsWithValues = table.columns.filter(c => id2Type.has(c.id));
        const extTable: ExtDataTable = {
            columnProperties: columnsWithValues.map(c => ({
                id: c.name,
                type: id2Type[c.id]
            })),
            data: table.rows.map(
                row => columnsWithValues.filter(c => row[c.id] !== undefined).map(
                    c => ({ id: c.id as string, value: row[c.id]})
                )
            )
        };
        return extTable;
    }
    return undefined;
}
