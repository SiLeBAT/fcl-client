import { DataTable as ExtDataTable, JsonData } from '../ext-data-model.v1';
import { AdditionalColRefs, CustomRefs, EXT_JSON_NAMES, LocalizedWBSpecs, LOCALIZED_WB_SPECS, MANDATORY_COL_INDEXES, OptionalSheetHeaders, OTHER_PROP_REFS, Ref2FieldIndexMap, sheetNameMapping, SHEET_REFS } from './xlsx-all-in-one-import-const-vL';
import { concat, removeUndefined } from '@app/tracing/util/non-ui-utils';

import * as _ from 'lodash';
import { DeliveryRow } from './xlsx-all-in-one-import-model-vL';
import { ImportIssue } from './xlsx-import-model-vL';
import { compareRows, createDeliveryId, createDeliveryPPIdentFP, getCleanedString, getCleanedStringOrUndefined, importAddColValue, importAggAmount, importFkString, importStrDate, importUniqueString, importValue } from './xlsx-import-shared-vL';
import { PartialPick, RequiredPick } from '@app/tracing/util/utility-types';
import { CellValue, Row } from './xlsx-model-vL';
import { XlsxReader } from './xlsx-reader-L';

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

type GetInterfaceFromIndex2TypeMap<TM> = TM extends {} ? { [key in Extract<keyof TM, number>]?: TM[key] } : {};
type MPick<T,A> = T extends {} ? A extends Array<infer MI> ? RequiredPick<T, Extract<MI, keyof T>> : T : T;
// type GetInterfaceFromIndex2TypeMap<TM> = TM extends { [key in (infer TI)]: (infer V) } ? K extends keyof T['enforceType'] & (string | number) ? T['enforceType'][K] : undefined : undefined : undefined;
type GetMandatoryFields<T> = T extends ReadTableOptions<infer A, infer N, infer TR, infer MR> ? T['mandatoryValues'] extends Array<infer X> ? X extends A | N ? X : never : never : never;
type ImportedRow<T> = T extends ReadTableOptions<infer A, infer N, infer TR, infer MR> ? RequiredPick<{ [key in A | N]?: TypeString2Type<GetEnforcedTypeString<T, key>> }, GetMandatoryFields<T>> : Row;


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

function createStationAddress(row: Row, importIssues: ImportIssue[]): string | undefined {
    const street = importValue(row, MANDATORY_COL_INDEXES.stations.street, 'string', importIssues);
    const streetNo = importValue(row, MANDATORY_COL_INDEXES.stations.streetNo, 'string', importIssues);
    const streetWithNo = conditionalConcat([street, streetNo], ' ');
    const zip = importValue(row, MANDATORY_COL_INDEXES.stations.zip, 'string', importIssues);
    const city = importValue(row, MANDATORY_COL_INDEXES.stations.city, 'string', importIssues);
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

function getDefaultExtDeliveryName(label: string[]): string {
    return `_Lieferungen.${label.join('_')}`;
}



function compareDeliveries<T>(delRow1: DeliveryRow, delRow2: DeliveryRow, options?: RowComparisonOptions): DeliveryDiff {

}

function cleanRows<T>(table: Table): Table {

}

type TypedRow<TI extends number, MI extends number, M extends <>> =

function getTypedRows(table: Table, ):

function importDeliveryRows(
    xlsxReader: XlsxReader,
    wbSpecs: LocalizedWBSpecs,
    old2NewStatIdMap: Map<string, string>
): ImportTable {

    // const observedTableHeader = xlsxReader.readTableHeaderFromSheet(sheetNameMapping.deliveries);
    const table = xlsxReader.readTableFromSheet(sheetNameMapping.deliveries, { offset: { col: 1, row: 1 }});
    // const knownAdditionalColsIndices = getOptionalColIndices(observedTableHeader, wbSpecs.optionalSheetHeaders!['deliveries']);
    const knownAdditionalColsIndices = getOptionalColIndices(table.header, wbSpecs.optionalSheetHeaders!['deliveries']);
    // const additionalCols = observedTableHeader.columnHeader.filter(h => h.colIndex > colIndices.addCols);
    const additionalCols = table.header.columnHeader.filter(h => h.colIndex > colIndices.addCols);
    // const additionalColIndices = observedTableHeader
    // const knownAdditionalCols = Object.entries(additionalColsIndices).filter(([key, index]))

    const colIndices = {
        ...MANDATORY_COL_INDEXES.deliveries,
        ...knownAdditionalColsIndices
    };

    const index2Ref = createRevRecord(colIndices);

    const availableStatIds = new Set(old2NewStatIdMap.keys());

    const extIdSet = new Set<string>();
    const idSet = new Set<string>();
    const identFP2Del = new Map<string, DeliveryRow>();
    const ignoredIds = new Set<string>();
    const old2NewId = new Map<string, string>();

    // const table = xlsxReader.readTableFromSheet(sheetNameMapping.deliveries, { offset: { row: 1, col: 1 } });

    const importIssues: ImportIssue[] = [];
    const rows: DeliveryRow[] = [];

    // const explicedTypedColumns = [Object.keys(MANDATORY_COL_INDEXES)];
    const columnsToReset = new Set(table.columns.filter(c => c.types.size > 2).map(c => c.columnIndex));

    // v1
    table.rows.forEach(row => {

        row
        const delRow: RequiredPick<Partial<DeliveryRow>, 'rowIndex'> = {
        };
        try {
            const extId =
        }
        catch {}

        const Row: RequiredPick<Partial<DeliveryRow>, 'rowIndex'> = {
            rowIndex: row.rowIndex,
            extId: ,
            source: getCleanedStringOrUndefined(row[colIndices.source]),
            target: getCleanedStringOrUndefined(row[colIndices.target])
        };
    }

    table.rows.forEach(row => {

            const tmpRow: RequiredPick<Partial<DeliveryRow>, 'rowIndex'> = {
                rowIndex: row.rowIndex,
                extId: getCleanedStringOrUndefined(row[colIndices.extId]),
                source: getCleanedStringOrUndefined(row[colIndices.source]),
                target: getCleanedStringOrUndefined(row[colIndices.target])
            };

            if (tmpRow.extId === undefined) {
                importIssues.push({
                    col: colIndices.extId,
                    row: row.rowIndex,
                    msg: 'Missing. Ignoring '
                })
            }



            try {
                const delRow: PartialDeliveryRow = {
                    rowIndex: row.rowIndex,
                    id: '',
                    // extId: importUniqueString(row, colIndices.extId, extIdSet, importIssues),
                    extId: importString(row, colIndices.extId, 'string', importIssues, true), // should be unique, only if required as ref
                    productName: importValue(row, colIndices.name, 'string', importIssues),
                    lotNo: importValue(row, colIndices.lotNo, 'string', importIssues), // recommended
                    source: importFkString(row, colIndices.source, availableStatIds, importIssues, 'station'), // required
                    target: importFkString(row, colIndices.target, availableStatIds, importIssues, 'station'),
                    dateOut: importStrDate(row, { y: colIndices.dateOut_year, m: colIndices.dateOut_month, d: colIndices.dateOut_day}, importIssues),
                    dateIn: importStrDate(row, { y: colIndices.dateIn_year, m: colIndices.dateIn_month, d: colIndices.dateIn_day}, importIssues),
                    unitAmount: importAggAmount(row, colIndices.unitAmount_quantity, colIndices.unitAmount_unit, importIssues),
                    lotAmount_number: importValue(row, colIndices.lotAmount_quantity, 'nonneg:number', importIssues),
                    lotAmount_unit: importValue(row, colIndices.lotAmount_unit, 'string', importIssues),
                    // additional known columns
                    // delAmountQuantity: importAddColValue(row, colIndices.delAmountQuantity, 'nonneg:number', importIssues),
                    // delAmountUnit: importAddColValue(row, colIndices.delAmountUnit, 'string', importIssues),
                }

                additionalCols.forEach(c => {
                    const ref = index2Ref[c.colIndex];
                    const id = ref ?? getDefaultExtDeliveryName(c.label);
                    let value = row[c.colIndex];
                    if (columnsToReset.has(c.colIndex) && value !== undefined) {
                        value = `${value}`;
                    }
                    delRow[id] = value;
                });

                // delRow.inputIdentFP = createDeliveryInputIdentFP(delRow);
                delRow.ppIdentFP = createDeliveryPPIdentFP(delRow);
                const existingDel = identFP2Del.get(delRow.ppIdentFP);
                if (existingDel) {
                    const delRowsDiff = compareRows(delRow, existingDel, { ignoreFields: ['extId', 'id'] });
                    if (delRowsDiff.conflictingFields.length > 0) {
                        importIssues.push({
                            row: delRow.rowIndex,
                            type: 'warn',
                            msg: `Ignoring delivery in row ${delRow.rowIndex} because of conflicts with row ${existingDel.rowIndex}.`
                        });
                        if (delRow.extId !== undefined) {
                            ignoredIds.add(delRow.extId);
                        }
                    } else if (delRowsDiff.missingFields.length > 0) {
                        importIssues.push({
                            row: delRow.rowIndex,
                            type: 'warn',
                            msg: `Merging delivery in row ${delRow.rowIndex} with delivery in row ${existingDel.rowIndex}.`
                        });
                        delRowsDiff.missingFields.forEach(f => {
                            existingDel[f as any] = existingDel[f] ?? delRow[f];
                        });
                        if (delRow.extId !== undefined) {
                            old2NewId.set(delRow.extId, existingDel.id);
                        }
                    } else {
                        importIssues.push({
                            row: delRow.rowIndex,
                            type: 'warn',
                            msg: `Ignoring delivery in row ${delRow.rowIndex} because it is a duplicate of row ${existingDel.rowIndex}.`
                        });
                        if (delRow.extId !== undefined) {
                            ignoredIds.add(delRow.extId);
                        }
                    }
                } else {
                    delRow.id = createDeliveryId(delRow);
                    idSet.add(delRow.id);
                    rows.push(delRow);
                }
            } catch(err: Error) {

            }
        })
    }


    // const table = xlsxImporter.eachRow<ColumnRef<'deliveries'>,'dataIn'>(
    //     sheetNameMapping.deliveries,
    //     // cb
    //     (row) => {
    //         const delRow: DeliveryRow = {
    //             ...row,
    //             id: createUniqueRandomId(idSet)
    //         };
    //     },
    //     {
    //     offset: { row: observedTableHeader.rowCount + 1, col: 1 },
    //     readHeader: false,
    //     aliases: colIndices,
    //     mandatoryValues: [
    //         // colIndices.extId,
    //         colIndices.source,
    //         colIndices.target
    //     ],
    //     uniqueValues: [
    //         colIndices.extId
    //     ],
    //     enforceFkRelations: {
    //         [colIndices.source]: availableStatIds,
    //         [colIndices.target]: availableStatIds
    //     },
    //     ignoreValues: [
    //         colIndices.addCols
    //     ],
    //     aggValues: [
    //         { ref: 'date', type: 'sdsd', input: {}}
    //     ]
    //     // enforceTextType: [
    //     //     colIndices.extId,
    //     //     colIndices.source,
    //     //     colIndices.target,
    //     //     colIndices.name,
    //     //     colIndices.lotNo
    //     // ],
    //     enforceNonNegNumberType: [
    //         colIndices.lotAmount_quantity,
    //         colIndices.unitAmount_quantity
    //     ],

    //     eachRowCb: (row: Row, rowIndex: number, warnings: ImportWarning[]) => {

    //         const deliveryRow = row as DeliveryRow;
    //         importStrDate<TypedDeliveryRow>(
    //             deliveryRow,
    //             rowIndex, {
    //                 yearIndex: colIndices.dateOut_year,
    //                 monthIndex: colIndices.dateOut_month,
    //                 dayIndex: colIndices.dateOut_day
    //             },
    //             'dateOut',
    //             warnings
    //         );
    //         importStrDate<TypedDeliveryRow>(
    //             deliveryRow,
    //             rowIndex, {
    //                 yearIndex: colIndices.dateIn_year,
    //                 monthIndex: colIndices.dateIn_month,
    //                 dayIndex: colIndices.dateIn_day
    //             },
    //             'dateIn',
    //             warnings
    //         );
    //         deliveryRow.amount = conditionalConcat(
    //             [
    //                 deliveryRow[colIndices.unitAmount_quantity],
    //                 deliveryRow[colIndices.unitAmount_unit]
    //             ], ' ');
    //         deliveryRow.id = createDeliveryId(deliveryRow, colIndices);
    //         if (idSet.has(deliveryRow.id)) {
    //             deliveryRow.id = createUniqueRandomId(idSet);
    //             idSet.add(deliveryRow.id);
    //         }
    //     }
    // });
    // const tableColumns = createDeliveryColumns(observedTableHeader.columnHeader, colIndices);

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
