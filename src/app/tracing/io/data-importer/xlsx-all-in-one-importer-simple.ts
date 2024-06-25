import { DataTable as ExtDataTable, JsonData } from '../ext-data-model.v1';
import { AdditionalColRefs, EXT_JSON_NAMES, LocalizedWBSpecs, mandatoryColumnGroups, MANDATORY_COL_INDEXES, OptionalSheetHeaders, OTHER_PROP_REFS, sheetNameMapping, SHEET_REFS } from './xlsx-all-in-one-import-const';
import { ColumnLabelMapping, ColumnLabelRef, ColumnRef, LabelGroupRef, LabelMapping, SheetRef, HeaderConf as RefHeaderConf, ColumnLabel, AdditionalStationRootColRef } from './xlsx-all-in-one-import-model';
import { Options, XlsxImporter } from './xlsx-importer';
import { ColumnHeader, HeaderConf, Row as WSRow, Table as ImportTable, TableHeader, Worksheet} from './xlsx-model';
import { concat, removeUndefined } from '@app/tracing/util/non-ui-utils';
import { LABEL_MAPPING } from './xlsx-all-in-one-import-const-en';
import * as Excel from 'exceljs';
import { EXT_COL_NAMES } from './xlsx-all-in-one-import-const copy';
import { DeepReadonly } from '@app/tracing/util/utility-types';

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

interface StationRow {
    id: string;
    name?: string;
    address?: string;
    country?: string;
    typeOfBusiness?: string;
    rawData: TableRow;
}

interface DeliveryRow {
    id: string;
    source: string;
    target: string;
    productName?: string;
    lotNo?: string;
    lotAmount_Number: number;
    lotAmount_unit: string;
    dateOut?: string;
    dateIn?: string;
    amount?: string;
    typeOfBusiness?: string;
    rawData: TableRow;
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

function createDate(row: TableRow, yearIndex: number | string, monthIndex: number | string, dayIndex: number | string): string | undefined {
    const year = getNumberValue(row, yearIndex);
    const month = getNumberValue(row, monthIndex);
    const day = getNumberValue(row, monthIndex);
    const strMonth = createDatePart(month, 2);
    const strYear = createDatePart(year, 4);
    return day !== undefined ? `${strYear}-${strMonth}-${createDatePart(day, 2)}` :
        month !== undefined ? `${strYear}-${strMonth}` :
            year !== undefined ? strYear :
                undefined;
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
    xlsxImporter.matchSheetNames(SHEET_REFS.map(ref => sheetNameMapping[ref]));
    const expSheetHeaders = createLocalizedHeaderConf(EXT_COL_NAMES);
    xlsxImporter.matchSheetColumnHeader(sheetNameMapping.stations, expSheetHeaders.stations);
    const stationTable = xlsxImporter.readTableFromSheet(sheetNameMapping.stations, {
        columnValueConstraints: {
            [MANDATORY_COL_INDEXES.stations.extId]: { isMandatory: true, isUnique: true }
        }
    });
    xlsxImporter.matchSheetColumnHeader(sheetNameMapping.deliveries, expSheetHeaders.deliveries);
    const deliveryTable = xlsxImporter.readTableFromSheet(sheetNameMapping.deliveries, {
        columnValueConstraints: {
            [MANDATORY_COL_INDEXES.deliveries.extId]: { isMandatory: true, isUnique: true },
            [MANDATORY_COL_INDEXES.deliveries.source]: { isMandatory: true },
            [MANDATORY_COL_INDEXES.deliveries.target]: { isMandatory: true },
        }
    });

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

function createLocalizedSheetHeaderConf(sheetRef: SheetRef, labelMapping: LabelMapping): HeaderConf[] {
    const columnGroups = mandatoryColumnGroups[sheetRef];
    return columnGroups.map(
        (hC: DeepReadonly<RefHeaderConf<SheetRef>>) => typeof hC === 'string' ?
            labelMapping[sheetRef][hC] :
            [labelMapping[sheetRef][hC[0]], hC[1].map(k => labelMapping.shared[k])]
    );
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

function createId(row: TableRow, keys: (number | string)[]): string {

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

function importStationRows(
    xlsxImporter: XlsxImporter,
    expHeader: HeaderConf[]
): Table {
    // const expHeader =
    xlsxImporter.matchSheetColumnHeader(sheetNameMapping.stations, expHeader);

    const table = xlsxImporter.readTableFromSheet(sheetNameMapping.stations);

    // preprocessing
    const isLatLonValid = containsLatLonColsWithGeoCoords(table, additionalColsIndices)
    const tableColumns = [
        ...createDefaultStatColumns(),
        // column index spread sheet coords starts with 1
        ...createAdditionalColumns(table.columns.slice(MANDATORY_COL_INDEXES.stations.addCols))
    ];
    const genIds = new Set<string>();
    table.rows.forEach(row => {
        row[OTHER_PROP_REFS.stations.address] = createStationAddress(row);
        const genId = createStationId(row);
        if (genIds.has(genId)) {
            throw new Error(`Generated id for station '${row[MANDATORY_COL_INDEXES.stations.extId]}' is not unique.`);
        }
        row[genId] = genId;
        genIds.add(genId);
    });

    if (isLatLonValid) {
        tableColumns.find(c => c.id === addColsIndices.lat)!.name = EXT_JSON_NAMES.stations.lat;
        tableColumns.find(c => c.id === addColsIndices.lon)!.name = EXT_JSON_NAMES.stations.lon;
    }

    return {
        columns: tableColumns,
        rows: table.rows
    };
}

function _importDeliveryRows(
    table: ImportTable,
    addColsIndices: Partial<Record<AdditionalStationRootColRef, number>>
): Table {
    const tableColumns = [
        ...createDefaultDeliveryColumns(),
        // column index spread sheet coords starts with 1
        ...createAdditionalColumns(table.columns.slice(MANDATORY_COL_INDEXES.deliveries.addCols))
    ];

    table.rows.forEach(row => {
        row[OTHER_PROP_REFS.deliveries.dateIn] = createDate(row,
            MANDATORY_COL_INDEXES.deliveries.dateIn_year,
            MANDATORY_COL_INDEXES.deliveries.dateIn_month,
            MANDATORY_COL_INDEXES.deliveries.dateIn_day
        );
        row[OTHER_PROP_REFS.deliveries.dateIn] = createDate(row,
            MANDATORY_COL_INDEXES.deliveries.dateIn_year,
            MANDATORY_COL_INDEXES.deliveries.dateIn_month,
            MANDATORY_COL_INDEXES.deliveries.dateIn_day
        );
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

function importDeliveryRows(
    xlsxImporter: XlsxImporter,
    wbSpecs: LocalizedWBSpecs,
    old2NewStatIdMap: Map<string, string>
): Table {

    const observedTableHeader = xlsxImporter.readTableHeaderFromSheet(sheetNameMapping.deliveries);
    const addColsIndices = getOptionalColIndices(observedTableHeader, wbSpecs.optionalSheetHeaders!['deliveries']);

    const colIndices = {
        ...MANDATORY_COL_INDEXES.deliveries,
        ...addColsIndices
    };

    const availableStatIds = new Set(old2NewStatIdMap.keys());

    const idSet = new Set<string>();

    const table = xlsxImporter.readTableFromSheet(sheetNameMapping.deliveries, {
        offset: { row: observedTableHeader.rowCount + 1, col: 1 },
        readHeader: false,
        mandatoryValues: [
            // colIndices.extId,
            colIndices.source,
            colIndices.target
        ],
        uniqueValues: [
            colIndices.extId
        ],
        enforceFkRelations: {
            [colIndices.source]: availableStatIds,
            [colIndices.target]: availableStatIds
        },
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
            deliveryRow.id = createDeliveryId(deliveryRow, colIndices);
            if (idSet.has(deliveryRow.id)) {
                deliveryRow.id = createUniqueRandomId(idSet);
                idSet.add(deliveryRow.id);
            }
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
    table: ImportTable
): Table {
    const tableColumns = createDefaultDel2DelColumns();
    // check references

    return {
        columns: tableColumns,
        rows: table.rows
    };
}

function table2ExtJsonTable(table: Table): ExtDataTable {

}
