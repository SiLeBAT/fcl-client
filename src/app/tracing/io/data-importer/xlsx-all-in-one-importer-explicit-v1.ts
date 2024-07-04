import { DataTable as ExtDataTable, JsonData } from '../ext-data-model.v1';
import { AdditionalColRefs, CustomRefs, EXT_JSON_NAMES, LocalizedWBSpecs, LOCALIZED_WB_SPECS, MANDATORY_COL_INDEXES, OptionalSheetHeaders, OTHER_PROP_REFS, Ref2FieldIndexMap, sheetNameMapping, SHEET_REFS } from './xlsx-all-in-one-import-const';
import { ColumnRef, ColumnRefs, SheetRef } from './xlsx-all-in-one-import-model';
import { XlsxImporter } from './xlsx-importer-v1';
import { ColumnHeader, ImportWarning, ReadTableOptions, Row, Row as WSRow, TableHeader} from './xlsx-model-v1';
import { concat, removeUndefined } from '@app/tracing/util/non-ui-utils';

import * as _ from 'lodash';
import { ColumnIndices } from './xlsx-all-in-one-import-model-v1';
import { DeepReadonly } from '@app/tracing/util/utility-types';

const LATITUDE_LIMITS = {
    min: -90,
    max: 90
} as const;

const LONGITUDE_LIMITS = {
    min: -180,
    max: 180
} as const;

const EmptyDataTable: ExtDataTable = {
    columnProperties: [],
    data: []
};

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

export async function importAllInOneTemplate(file: File): Promise<JsonData> {
    const xlsxImporter = new XlsxImporter();
    await xlsxImporter.loadFile(file);
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
    const ext2NewStatPkMap = new Map<string, string>(
        removeUndefined(
            stationTable.rows.map(r => r.extId ? [r.extId as string, r.id as string] : undefined)
        )
    );
    const deliveryTable = importDeliveryRows(xlsxImporter, wbSpec, ext2NewStatPkMap);
    const ext2NewDelPkMap = new Map<string, string>(
        removeUndefined(
            deliveryTable.rows.map(r => r.extId ? [r.extId as string, r.id as string] : undefined)
        )
    );

    const extStatTable = createExtTable(stationTable);
    const extDelTable = createExtTable(deliveryTable);
    const extDel2DelTable = xlsxImporter.sheetNames.includes(wbSpec.sheetLabels.dels2Dels) ?
        createExtTable(importDel2DelRows(xlsxImporter, wbSpec, ext2NewDelPkMap)) :
        EmptyDataTable;

    return {
        version: '',
        data: {
            version: '',
            stations: extStatTable,
            deliveries: extDelTable,
            deliveryRelations: extDel2DelTable
        }
    };
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

function createDeliveryId(row: DeliveryRow, colIndices: ColumnRefs<'deliveries'>): string {
    const hashCode = getHashCode([
        row[colIndices.source] ?? '',
        row[colIndices.name] ?? '',
        row[colIndices.lotNo] ?? '',
        row.dateOut ?? '',
        row.dateIn ?? '',
        row[colIndices.unitAmount_quantity] ?? '',
        row[colIndices.unitAmount_unit] ?? '',
        row[colIndices.target]
    ].join(';'));
    return `${hashCode}`;
}


function isValidLat(lat: any): boolean {
    return typeof lat === 'number' && !Number.isNaN(lat) && lat >= LATITUDE_LIMITS.min && lat <= LATITUDE_LIMITS.max;
}

function isValidLon(lon: any): boolean {
    return typeof lon === 'number' && !Number.isNaN(lon) && lon >= LONGITUDE_LIMITS.min && lon <= LONGITUDE_LIMITS.max;
}

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
            const defaultExtName = `${defaultPrefix}` + getColHeaderBasedJsonName(column);
            const explicitExtName = ref ? ref2ExtName[ref] : undefined;
            return {
                id: column.colIndex,
                name: explicitExtName ?? defaultExtName
            };
        }
    );
    return tableColumns;
}

function createDefaultStationColumns(columns: ColumnHeader[], colIndices: ColumnRefs<'stations'>): TableColumn[] {
    const revColIndices = createRevRecord(colIndices);

    let sortedIndices: (keyof TypedStationRow | number)[] = [
        'id', colIndices.name, 'address'
    ];
    sortedIndices = sortedIndices.concat(_.difference(columns.map(c => c.colIndex)), sortedIndices);

    const tableColumns = sortedIndices.map(index => {
        const ref = typeof index === 'number' ? revColIndices[index] : index;
        const extLabel = EXT_JSON_NAMES.stations[ref];
        return extLabel === undefined ? undefined : { id: index, name: extLabel };
    });
    return removeUndefined(tableColumns);
}

function createDefaultDeliveryColumns(columns: ColumnHeader[], colIndices: ColumnRefs<'deliveries'>): TableColumn[] {
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

function createDel2DelColumns(): TableColumn[] {
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
    const zipWithCity = conditionalConcat([zip, city], ' ');
    const address = conditionalConcat([streetWithNo, zipWithCity], ', ');
    return address;
}

function createStationId(row: Partial<StationRow>): string {
    const hashCode = getHashCode([row.name ?? '', row.address ?? '', row.country ?? ''].join(';'));
    return `${hashCode}`;
}

function createRandomId(): string {
    const numBytes = 5;
    const bytes = crypto.getRandomValues(new Uint8Array(numBytes));
    const array = Array.from(bytes);
    const hexPairs = array.map(b => b.toString(16).padStart(2, '0'));
    return hexPairs.join('');
}

function createUniqueRandomId(ignoreIds: Set<string>): string {
    let id = createRandomId();
    while (ignoreIds.has(id)) {
        id = createRandomId();
    }
    return id;
}

function getOptionalColIndices<T extends SheetRef>(
    observedTableHeader: TableHeader,
    optionalSheetHeaders: OptionalSheetHeaders<T>
): Record<AdditionalColRefs[T], number | undefined> {
    const ref2Index = {} as Record<AdditionalColRefs[T], number | undefined> ;
    optionalSheetHeaders.forEach(x => {
        const column = observedTableHeader.columnHeader.find(c => _.isEqual(c.label, x.labels));
        //if (column) {
        ref2Index[x.ref] = column?.colIndex;
        //}
    });
    return ref2Index;
}


function importStationTable(
    xlsxImporter: XlsxImporter,
    wbSpecs: LocalizedWBSpecs
): Table {
    const observedTableHeader = xlsxImporter.readTableHeaderFromSheet(wbSpecs.sheetLabels.stations);
    const addColsIndices = getOptionalColIndices(observedTableHeader, wbSpecs.optionalSheetHeaders!['stations']);

    const colIndices = {
        ...MANDATORY_COL_INDEXES.stations,
        ...addColsIndices
    };

    const idSet = new Set<string>();

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
            stationRow.id = createStationId(stationRow);
            if (idSet.has(stationRow.id)) {
                stationRow.id = createUniqueRandomId(idSet);
                idSet.add(stationRow.id);
            }
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

function _importDeliveryRows(
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

function importDeliveryRows(
    xlsxImporter: XlsxImporter,
    wbSpecs: LocalizedWBSpecs,
    old2NewStatIdMap: Map<string, string>
): Table {

    const observedTableHeader = xlsxImporter.readTableHeaderFromSheet(sheetNameMapping.deliveries);
    const addColsIndices = getOptionalColIndices(observedTableHeader, wbSpecs.optionalSheetHeaders!['deliveries']);

    const colIndices: Readonly<ColumnIndices<'deliveries'>> = {
        ...MANDATORY_COL_INDEXES.deliveries,
        ...addColsIndices
    };

    const aliases = colIndices as { [key in ColumnRef<'deliveries'>]: number };

    const availableStatIds = new Set(old2NewStatIdMap.keys());

    const idSet = new Set<string>();

    const rows = xlsxImporter.readRowsFromSheet(
        sheetNameMapping.deliveries,
        // 3, // , )

        // sheetNameMapping.deliveries,
        // // cb
        // (row) => {
        //     const delRow: DeliveryRow = {
        //         ...row,
        //         id: createUniqueRandomId(idSet)
        //     };
        // },
        {
            offset: { row: observedTableHeader.rowCount + 1, col: 1 },
            readHeader: false,
            aliases: aliases, // as Record<ColumnRef<'deliveries'>, number>,
            enforceType: {
                assd: 'lat'
            },
            // mandatoryValues: [
            // // colIndices.extId,
            //     colIndices.source,
            //     colIndices.target
            // ],
        // uniqueValues: [
        //     colIndices.extId
        // ],
        // enforceFkRelations: {
        //     [colIndices.source]: availableStatIds,
        //     [colIndices.target]: availableStatIds
        // },
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
        ]
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
    wbSpecs: LocalizedWBSpecs,
    ext2NewDelIdMap: Map<string, string>
): Table {
    // const observedTableHeader = xlsxImporter.readTableHeaderFromSheet(sheetNameMapping.dels2Dels);
    // const addColsIndices = getOptionalColIndices(observedTableHeader, wbSpecs.optionalSheetHeaders!['deliveries']);

    const colIndices = {
        ...MANDATORY_COL_INDEXES.dels2Dels
    };

    const availableDelIds = new Set(ext2NewDelIdMap.keys());

    const table = xlsxImporter.readTableFromSheet(sheetNameMapping.dels2Dels, {
        offset: { col: 1, row: 1 },
        mandatoryValues: [colIndices.from, colIndices.to],
        enforceFkRelations: {
            [colIndices.from]: availableDelIds,
            [colIndices.to]: availableDelIds
        },
        // enforceTextType: [colIndices.from, colIndices.to]
        eachRowCb: (row, rowIndex, warnings) => {
            row[colIndices.from] = ext2NewDelIdMap.get(row[colIndices.from] as string)!;
            row[colIndices.to] = ext2NewDelIdMap.get(row[colIndices.to] as string)!;
        }
    });

    const tableColumns = createDefaultDel2DelColumns();
    // check references

    return {
        columns: tableColumns,
        rows: table.rows
    };
}

function createExtTable(table: Table): ExtDataTable {
    if (table.rows.length > 0) {

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
    return EmptyDataTable;
}
