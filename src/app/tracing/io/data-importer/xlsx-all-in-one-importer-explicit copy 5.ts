import { DataTable as ExtDataTable, JsonData } from '../ext-data-model.v1';
import { AdditionalColRefs, additionColumnGroups, ColRef2IndexMap, CustomRefs, EXT_JSON_NAMES, LocalizedWBSpecs, LOCALIZED_TEXTS, mandatoryColumnGroups, MANDATORY_COL_INDEXES, OptionalSheetHeaders, OTHER_PROP_REFS, Ref2FieldIndexMap, sheetNameMapping, SHEET_REFS } from './xlsx-all-in-one-import-const';
import { ColumnRef, LabelMapping, SheetRef, HeaderConf as RefHeaderConf, AdditionalStationRootColRef, AdditionalDeliveryRootColRef } from './xlsx-all-in-one-import-model';
import { Options, XlsxImporter } from './xlsx-importer';
import { ColumnHeader, DatePartCols, HeaderConf, ImportWarning, Row, Row as WSRow, Table as ImportTable, TableHeader, Worksheet} from './xlsx-model';
import { concat, removeUndefined } from '@app/tracing/util/non-ui-utils';
import { LABEL_MAPPING } from './xlsx-all-in-one-import-const-en';
import * as Excel from 'exceljs';
import { EXT_COL_NAMES } from './xlsx-all-in-one-import-const copy';
import { DeepReadonly } from '@app/tracing/util/utility-types';
import * as _ from 'lodash';

const LATITUDE_MIN = -90;
const LATITUDE_MAX = 90;
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

type AllInOneSheets = Record<SheetRef, Worksheet>;

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
    let matchingLocTexts = LOCALIZED_TEXTS;
    matchingLocTexts = matchingLocTexts.filter(
        x => xlsxImporter.matchSheetNames(
            SHEET_REFS.map(ref => x.texts.sheetLabels[ref])
        )
    );
    // xlsxImporter.matchSheetNames(SHEET_REFS.map(ref => sheetNameMapping[ref]));
    // ToDo: Please consider that sheets might not be present (e.g. del2DelSheet)
    // const expectedSheetHeaders = createLocalizedHeaderConf(EXT_COL_NAMES);
    matchingLocTexts = matchingLocTexts.filter(x => {
        const availableSheetRefs = SHEET_REFS.filter(sheetRef => xlsxImporter.sheetNames.includes(x.texts.sheetLabels[sheetRef]));
        return availableSheetRefs.every(
            ref => xlsxImporter.matchSheetColumnHeader(x.texts.sheetLabels[ref], x.texts.mandatoryTableHeader[ref])
        );
        // return sheetRefs.every(ref => xlsxImporter.matchSheetCells(x.texts.sheetLabels[ref], x.texts.mandatorySheetCells[ref]));
    });
    // SHEET_REFS.forEach(ref => xlsxImporter.matchSheetColumnHeader(sheetNameMapping[ref], expectedSheetHeaders[ref]));
    //


    const stationTable = importStationTable(xlsxImporter, null);
    const deliveryTable = importDeliveryRows(xlsxImporter, null);
    const del2DelTable = importDel2DelRows(xlsxImporter, null);

    const old2NewStationPkMap = addNewPks2StationRows(stationTable.rows, );
    applyNewFks(deliveryTable.rows, old2NewStatPkMap, MANDATORY_COL_INDEXES.deliveries.source);
    applyNewFks(deliveryTable.rows, old2NewStatPkMap, MANDATORY_COL_INDEXES.deliveries.target);

    const old2NewDeliveryPkMap = addNewPks2DeliveryRows(stationTable.rows, );
    applyNewFks(del2DelTable.rows, old2NewDeliveryPkMap, MANDATORY_COL_INDEXES.dels2Dels.from);
    applyNewFks(del2DelTable.rows, old2NewDeliveryPkMap, MANDATORY_COL_INDEXES.dels2Dels.to);

}

function createRevRecord<X extends string, Y extends string>(record: Record<X, Y>): Record<Y, X> {
    const revRecord: Record<Y, X> = Object.fromEntries(Object.entries(record).map(([x, y]) => [y, x]));
    return revRecord;
}

function createColumnRef<T extends SheetRef>(ref: ColumnLabelRef<T>, subRefs: ColumnLabelRef<'shared'>[]): ColumnRef<T> {
    return [ref,...subRefs].join('.') as ColumnRef<T>;
}

function createColumnRef2RowKeyMap<T extends SheetRef>(
    leaveColumns: ColumnHeader[],
    revSheetColumnLabelMapping: Record<string, ColumnLabelRef<T>>,
    revSharedLabelMapping: Record<string, ColumnLabelRef<'shared'>>
): Record<ColumnRef<T>, number> {
    const ref2RowKeyMap: Partial<Record<ColumnRef<T>, number>> = {};
    leaveColumns.forEach(c => {
        const label = getColumnLabel(c);
        const headRef = revSheetColumnLabelMapping[c.label ?? ''];
        const subRefs = label.slice(1).map(x => revSharedLabelMapping[x]);
        if (headRef !== undefined && subRefs.every(r => r !== undefined)) {
            const columnRef = createColumnRef(headRef, subRefs);
            ref2RowKeyMap[columnRef] = c.columnIndex;
        }
    });
    return ref2RowKeyMap as Record<ColumnRef<T>, number>;
}

function createLocalizedHeaderConf(labelMapping: LabelMapping): Record<SheetRef, HeaderConf[]> {
    const locColumnHeader: Record<string, HeaderConf[]> = {};
    for (const sheetRef of SHEET_REFS) {
        locColumnHeader[labelMapping.sheets[sheetRef]] = mandatoryColumnGroups[sheetRef].map(
            (hC: DeepReadonly<RefHeaderConf<SheetRef>>) => typeof hC === 'string' ?
                labelMapping[sheetRef][hC] :
                [labelMapping[sheetRef][hC[0]], hC[1].map(k => labelMapping.shared[k])]
        );
    }
    return locColumnHeader;
}

// function localizeHeaderConf<T extends SheetRef>(
//     sheetRef: SheetRef,
//     labelMapping: LabelMapping,
//     headerRefConf: DeepReadonly<RefHeaderConf<SheetRef>>): HeaderConf {
//     return typeof headerRefConf === 'string' ?
//         labelMapping[sheetRef][headerRefConf] :
//         [labelMapping[sheetRef][headerRefConf[0]], headerRefConf[1].map(k => labelMapping.shared[k])];
// }

function localizeHeaderConf<T extends SheetRef>(
    sheetRef: T,
    labelMapping: LabelMapping,
    headerRefConf: DeepReadonly<RefHeaderConf<T>>[]): HeaderConf[] {
    return headerRefConf.map(
        hC => {
            if (typeof hC === 'string') {
                return labelMapping[sheetRef][hC];
            } else if (Array.isArray(hC)) {
                return [labelMapping[sheetRef][hC[0]], hC[1].map(k => labelMapping.shared[k])];
            }
            return '';
        }
        // (hC: DeepReadonly<RefHeaderConf<T>>) => typeof hC === 'string' ?
        //     labelMapping[sheetRef][hC] :
        //     [labelMapping[sheetRef][hC[0]], hC[1].map(k => labelMapping.shared[k])]
    );
}

// function createLocalizedSheetHeaderConf(sheetRef: SheetRef, labelMapping: LabelMapping): HeaderConf[] {
//     const columnGroups = mandatoryColumnGroups[sheetRef];
//     return columnGroups.map(
//         (hC: DeepReadonly<RefHeaderConf<SheetRef>>) => typeof hC === 'string' ?
//             labelMapping[sheetRef][hC] :
//             [labelMapping[sheetRef][hC[0]], hC[1].map(k => labelMapping.shared[k])]
//     );
// }


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

function createStationAddress(row: TableRow): string | undefined {
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

function containsLatLonColsWithGeoCoords(
    table: ImportTable,
    addColsIndices: Partial<Record<AdditionalStationRootColRef, number>>
): boolean {
    const isLatLonValid =
        addColsIndices.lat !== undefined &&
        addColsIndices.lon !== undefined &&
        // indices are not zero based
        !table.columns[addColsIndices.lat! - 1].isEmpty &&
        !table.columns[addColsIndices.lon! - 1].isEmpty &&
        !table.rows.some(row => {
            //
            const extLat = row[addColsIndices.lat!];
            const extLon = row[addColsIndices.lon!];
            const latLonConflictExists =
                extLat === undefined !== extLon !== undefined ||
                extLat !== undefined && !(
                    isValidLat(extLat) && isValidLon(extLon)
                );
            return latLonConflictExists;
        });
    return isLatLonValid;
}

function toString<T>(x: T): string {
    return typeof x === 'string' ? x : `${x}`;
}

function checkLatLonColumns(
    table: ImportTable,
    latColIndex: number | undefined,
    lonColIndex: number | undefined,
    warnings: ImportWarning[]
): boolean {
    const isLatLonValid =
        latColIndex !== undefined &&
        lonColIndex !== undefined &&
        // indices are not zero based
        !table.columns[latColIndex - 1].isEmpty &&
        !table.columns[lonColIndex! - 1].isEmpty &&
        // exists invalid data
        !table.rows.some(row => {
            //
            const extLat = row[latColIndex];
            const extLon = row[lonColIndex];
            if (extLat !== undefined && !isValidLat(extLat)) {
                warnings.push({ col: latColIndex, warning: `Lat is not valid.` });
                return true;
            } else if (extLon !== undefined && !isValidLon(extLon)) {
                warnings.push({ col: lonColIndex, warning: `Lon is not valid.` });
            }


            const latLonConflictExists =
                extLat === undefined !== extLon !== undefined ||
                extLat !== undefined && !(
                    isValidLat(extLat) && isValidLon(extLon)
                );
            return latLonConflictExists;
        });
    if (isLatLonValid) {
        table.columns.find(c => c.id === latColIndex)!.name = EXT_JSON_NAMES.stations.lat;
        tableColumns.find(c => c.id === addColsIndices.lon)!.name = EXT_JSON_NAMES.stations.lon;
    }
}

function renameLatAndLonColumnsIfAppropriate(table: Table, latColIndex: number | undefined, lonColIndex: number | undefined): void {

    const isLatLonValid =
        addColsIndices.lat !== undefined &&
        addColsIndices.lon !== undefined &&
        // indices are not zero based
        !table.columns[addColsIndices.lat! - 1].isEmpty &&
        !table.columns[addColsIndices.lon! - 1].isEmpty &&
        !table.rows.some(row => {
            //
            const extLat = row[addColsIndices.lat!];
            const extLon = row[addColsIndices.lon!];
            const latLonConflictExists =
                extLat === undefined !== extLon !== undefined ||
                extLat !== undefined && !(
                    isValidLat(extLat) && isValidLon(extLon)
                );
            return latLonConflictExists;
        });
    if (isLatLonValid) {
        tableColumns.find(c => c.id === addColsIndices.lat)!.name = EXT_JSON_NAMES.stations.lat;
        tableColumns.find(c => c.id === addColsIndices.lon)!.name = EXT_JSON_NAMES.stations.lon;
    }
}

function getRef2IndexMap<T extends SheetRef>()

function createRandomId(): string {

}

function getColumnIndex(observedTableHeader: TableHeader, searchLabels: string[]): number | undefined {
    return observedTableHeader.columnHeader.find(h => _.isEqual(h.label, searchLabels))?.colIndex;
}

function getOptionalColIndices<T extends SheetRef>(
    sheetRef: T,
    observedTableHeader: TableHeader,
    locWBSpecs: LocalizedWBSpecs
): Partial<Record<AdditionalColRefs[T], number>> {
    const ref2Index: Partial<Record<AdditionalColRefs[T], number>> = {};
    locWBSpecs.optionalSheetHeaders![sheetRef].forEach(x => {
        const column = observedTableHeader.columnHeader.find(c => _.isEqual(c.label, x.labels));
        if (column) {
            ref2Index[x.ref] = column.colIndex;
        }
    });
    return ref2Index;
}

function getOptionalColIndices2<T extends SheetRef>(
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
    const addColsIndices = getOptionalColIndices2(observedTableHeader, wbSpecs.optionalSheetHeaders!['stations']);

    // const colIndices: ColRef2IndexMap<'stations'> = {
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
            row[OTHER_PROP_REFS.stations.address] = createStationAddress(row);
            if (addColsIndices.lat) {
                if (row[addColsIndices.lat] !== undefined && !isValidLat(row[addColsIndices.lat])) {
                    warnings.push({ col: addColsIndices.lat, row: index, warning: `Value is invalid and will not be imported.` });
                    delete row[addColsIndices.lat];
                }
            }
            if (addColsIndices.lon) {
                if (row[addColsIndices.lon] !== undefined && !isValidLat(row[addColsIndices.lon])) {
                    warnings.push({ col: addColsIndices.lon, row: index, warning: `Value is invalid and will not be imported.` });
                    delete row[addColsIndices.lon];
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
    // additionalHeaderConf: HeaderConf[]
    //,
    // addColsIndices: Partial<Record<AdditionalStationRootColRef, number>>
): Table {

    const observedTableHeader = xlsxImporter.readTableHeaderFromSheet(sheetNameMapping.deliveries);
    const addColsIndices = getOptionalColIndices2(observedTableHeader, wbSpecs.optionalSheetHeaders!['deliveries']);

    // const colIndices: ColRef2IndexMap<'stations'> = {
    const colIndices = {
        ...MANDATORY_COL_INDEXES.deliveries,
        ...addColsIndices
    };

    const date2PartCols: Partial<Record<CustomRefs<'deliveries'>, DatePartCols>> = {
        'dateIn': {
            yearCol: colIndices.dateIn_year,
            monthCol: colIndices.dateIn_month,
            dayCol: colIndices.dateIn_day
        },
        'dateOut': {
            yearCol: colIndices.dateOut_year,
            monthCol: colIndices.dateOut_month,
            dayCol: colIndices.dateOut_day
        }
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
        enforceYearMonthDayType: Object.values(date2PartCols),
        eachRowCb: (row: Row, index: number, warnings: ImportWarning[]) => {
        //     // enforceDate(row, index, yearIndex, monthIndex, dayIndex, warnings);
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

    table.rows.forEach(row => {
        // Object.entries(date2PartCols).forEach(([ref, datePartCols]) => {
        //     row[ref] = importStrDate(row, index, datePartCols, warnings);
        //         MANDATORY_COL_INDEXES.deliveries.dateIn_year,
        //         MANDATORY_COL_INDEXES.deliveries.dateIn_month,
        //         MANDATORY_COL_INDEXES.deliveries.dateIn_day
        //     );
        // })

        // row[OTHER_PROP_REFS.deliveries.dateIn] = createStrDate(row, index,
        //     MANDATORY_COL_INDEXES.deliveries.dateIn_year,
        //     MANDATORY_COL_INDEXES.deliveries.dateIn_month,
        //     MANDATORY_COL_INDEXES.deliveries.dateIn_day
        // );
        // row[OTHER_PROP_REFS.deliveries.dateIn] = createStrDate(row,
        //     { yearCol: colIndices.dateOut_year, monthCol: colIndices.dateOut_month, dayCol: colIndices.dateOut_day }
        //     MANDATORY_COL_INDEXES.deliveries.dateIn_year,
        //     MANDATORY_COL_INDEXES.deliveries.dateIn_month,
        //     MANDATORY_COL_INDEXES.deliveries.dateIn_day
        // );
    });

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
    xlsxImporter: XlsxImporter
): Table {
    const colIndices: ColRef2IndexMap<'dels2Dels'> = {
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
