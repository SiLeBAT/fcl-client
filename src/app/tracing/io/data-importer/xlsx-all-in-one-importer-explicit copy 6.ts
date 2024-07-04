import { DataTable as ExtDataTable, JsonData } from '../ext-data-model.v1';
import { AdditionalColRefs, CustomRefs, EXT_JSON_NAMES, LocalizedWBSpecs, LOCALIZED_WB_SPECS, MANDATORY_COL_INDEXES, OptionalSheetHeaders, OTHER_PROP_REFS, Ref2FieldIndexMap, sheetNameMapping, SHEET_REFS } from './xlsx-all-in-one-import-const';
import { SheetRef } from './xlsx-all-in-one-import-model';
import { XlsxImporter } from './xlsx-importer-v0';
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

function importStrDate(
    row: TableRow,
    rowIndex: number,
    datePartCols: DatePartCols,
    warnings: ImportWarning[]
): string | undefined {
    const year = getValidYear(row[datePartCols.yearCol]);
    const month = getValidMonth(row[datePartCols.monthCol]);
    const day = getValidDay(row[datePartCols.dayCol], month, year);

    if (year === undefined) {
        return undefined;
    } else {
        let strDate = `${year}`;
        if (month !== undefined) {
            strDate += `-${('' + month).padStart(2, '0')}`;
            if (day !== undefined) {
                strDate += `-${('' + day).padStart(2, '0')}`;
            }
        }
        return strDate;
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

function getColHeaderBasedJsonName(columnHeader: ColumnHeader): string {
    return columnHeader.parent ?
        `${getColHeaderBasedJsonName(columnHeader.parent)}_${columnHeader.label}`:
        columnHeader.label ?? '';
}


function createAdditionalColumns(columns: ColumnHeader[]): TableColumn[] {
    const tableColumns: TableColumn[] = columns.map(
        column => ({
                name: '_' + getColHeaderBasedJsonName(column),
                id: column.columnIndex
        })
    );
    return tableColumns;
}

function createDefaultStatColumns(): TableColumn[] {
    const tableColumns: TableColumn[] = [
        {
            name: EXT_JSON_NAMES.stations.id,
            id: MANDATORY_COL_INDEXES.stations.id
        },{
            name: EXT_JSON_NAMES.stations.name,
            id: MANDATORY_COL_INDEXES.stations.name
        },
        {
            name: EXT_JSON_NAMES.stations.address,
            id: 'address'
        }, {
            name: EXT_JSON_NAMES.stations.country,
            id: MANDATORY_COL_INDEXES.stations.country
        }, {
            name: EXT_JSON_NAMES.stations.typeOfBusiness,
            id: MANDATORY_COL_INDEXES.stations.typeOfBusiness
        },
    ];
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

function conditionalConcat(arr: (string | undefined)[], sep: string): string | undefined {
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
    const ref2Field = {
        ...MANDATORY_COL_INDEXES.stations,
        ...addColsIndices,
        ...OTHER_PROP_REFS.stations
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
            const stationRow = row as unknown as TypedStationRow;
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

    const tableColumns = [
        ...createDefaultStatColumns(),
        // column index spread sheet coords starts with 1
        ...createAdditionalColumns(table.columns.slice(MANDATORY_COL_INDEXES.stations.addCols))
    ];

    return {
        columns: tableColumns,
        rows: table.rows
    };
}

function addNewPks(rows: Row[], oldPkIndex: number, newPkIndex: number, genFun: (row: Row) => string): Map<string, string> {
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

function addNewPks2StationRows(rows: Row[], fieldIndices: Ref2FieldIndexMap<'stations'>): Map<string, string> {
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

    // const date2PartCols: Partial<Record<CustomRefs<'deliveries'>, DatePartCols>> = {
    //     'dateIn': {
    //         yearCol: colIndices.dateIn_year,
    //         monthCol: colIndices.dateIn_month,
    //         dayCol: colIndices.dateIn_day
    //     },
    //     'dateOut': {
    //         yearCol: colIndices.dateOut_year,
    //         monthCol: colIndices.dateOut_month,
    //         dayCol: colIndices.dateOut_day
    //     }
    // };

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
        enforceTextType: [
            colIndices.extId,
            colIndices.source,
            colIndices.target,
            colIndices.name,
            colIndices.lotNo
        ],
        enforceNonNegNumberType: [
            colIndices.lotAmount_quantity,
            colIndices.unitAmount_quantity
        ],
        //enforceYearMonthDayType: Object.values(date2PartCols),
        eachRowCb: (row: Row, index: number, warnings: ImportWarning[]) => {
        //     // enforceDate(row, index, yearIndex, monthIndex, dayIndex, warnings);
            const deliveryRow = row as DeliveryRow;
            // importStrDate()
            Object.entries(date2PartCols).forEach(([ref, datePartCols]) => {
                row[ref] = importStrDate(row, index, datePartCols, warnings);
            });
        }
    });
    const tableColumns = [
        ...createDefaultDeliveryColumns(),
        // column index spread sheet coords starts with 1
        ...createAdditionalColumns(table.columns.slice(MANDATORY_COL_INDEXES.deliveries.addCols))
    ];

    table.columns.forEach(column => {
        if (column.valueTypes.size > 1) {
            table.rows.forEach(row => {
                if (row[column.columnIndex] !== undefined) {
                    row[column.columnIndex] = `${row[column.columnIndex]}`;
                }
            });
            column.valueTypes.clear();
            column.valueTypes.add('string');
        }
    });

    return {
        columns: tableColumns,
        rows: table.rows
    };
}

function importDel2DelRows(
    xlsxImporter: XlsxImporter,
    wbSpecs: LocalizedWBSpecs
): Table {
    const observedTableHeader = xlsxImporter.readTableHeaderFromSheet(sheetNameMapping.dels2Dels);
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

function table2ExtJsonTable(table: Table): ExtDataTable {

}
