import { removeNullish } from "../../../util/non-ui-utils";
import {
    AddIssueCallback,
    ColumnMapping,
    Del2DelRow,
    ImportIssue,
    ImportResult,
    ImportTable,
    XlsxImporter,
} from "./model";
import { Row, Table, XlsxReader, XlsxSheetReader } from "./xlsx-reader";
import {
    AllInOneDeliveryRow,
    AllInOneStationRow,
    Del2DelColumn,
    DeliveryColumn,
    StationColumn,
} from "./xlsx-all-in-one-import-model";
import {
    createEmptyImportTable,
    enrichImportIssue,
    getLongUniqueDeliveryId,
    getLongUniqueStationId,
    getOptionalColumnMapping,
    getOtherColumns,
    getShortUniqueDeliveryIdFromLongId,
    getShortUniqueStationIdFromLongId,
    getStringOrUndefined,
    importAggregatedAmount,
    importReference,
    importMandatoryString,
    importPrimaryKey,
    importStringDate,
    importValue,
    getPropsFromRow,
} from "./shared";
import {
    OPTIONAL_DELIVERY_COLUMNS,
    OPTIONAL_STATION_COLUMNS,
    REQUIRED_DEL2DEL_COLUMN_HEADERS,
    REQUIRED_DELIVERY_COLUMN_HEADERS,
    REQUIRED_STATION_COLUMN_HEADERS,
    SHEET_LABELS,
} from "./xlsx-all-in-one-import-const";
import { IMPORT_ISSUES } from "./consts";
import {
    AllInOneXlsxInputFormatError,
    XlsxInputFormatError,
} from "../../io-errors";

interface SetLike {
    has: (x: string) => boolean;
}

class Register {
    private map = new Map<string, number>();

    has(id: string): boolean {
        return this.map.has(id);
    }

    private getCount(id: string): number {
        return this.map.get(id) ?? 0;
    }

    add(id: string): void {
        this.map.set(id, this.getCount(id) + 1);
    }

    isRegisteredOnce(id: string): boolean {
        return this.getCount(id) === 1;
    }
}

function importStation(
    row: Row,
    table: Table,
    optionalColumnMappings: ColumnMapping[],
    otherColumnMappings: ColumnMapping[],
    extIdRegister: Register,
    externalAddIssueCallback: AddIssueCallback,
): Partial<AllInOneStationRow> {
    // eslint-disable-next-line prefer-const
    let extId: string | undefined;

    const addIssueCallback: AddIssueCallback = (
        issue: ImportIssue,
        invalidateRow: boolean = false,
    ) => {
        externalAddIssueCallback(
            enrichImportIssue(issue, row, table, invalidateRow, extId),
            invalidateRow,
        );
    };

    extId = importPrimaryKey(
        row,
        StationColumn.EXT_ID,
        extIdRegister,
        addIssueCallback,
    );
    const statRow: Partial<AllInOneStationRow> = {
        extId: extId,
        name: getStringOrUndefined(row[StationColumn.NAME]),
        address: createStationAddress(row),
        country: getStringOrUndefined(row[StationColumn.COUNTRY]),
        typeOfBusiness: getStringOrUndefined(
            row[StationColumn.TYPE_OF_BUSINESS],
        ),
        otherProps: getPropsFromRow(row, otherColumnMappings, addIssueCallback),
        ...getPropsFromRow(row, optionalColumnMappings, addIssueCallback),
    };
    return statRow;
}

function importDelivery(
    row: Row,
    table: Table,
    optionalColumnMappings: ColumnMapping[],
    otherColumnMappings: ColumnMapping[],
    extDeliveryIdRegister: SetLike,
    extStationIdRegister: SetLike,
    externalAddIssueCallback: AddIssueCallback,
): Partial<AllInOneDeliveryRow> {
    // eslint-disable-next-line prefer-const
    let externalId: string | undefined;

    const addIssueCallback: AddIssueCallback = (
        issue: ImportIssue,
        invalidateRow: boolean = false,
    ) => {
        externalAddIssueCallback(
            enrichImportIssue(issue, row, table, invalidateRow, externalId),
            invalidateRow,
        );
    };

    externalId = importPrimaryKey(
        row,
        DeliveryColumn.EXT_ID,
        extDeliveryIdRegister,
        addIssueCallback,
    );

    return {
        extId: externalId,
        source: importReference(
            row,
            DeliveryColumn.SOURCE,
            extStationIdRegister,
            addIssueCallback,
        ),
        target: importReference(
            row,
            DeliveryColumn.TARGET,
            extStationIdRegister,
            addIssueCallback,
        ),
        productName: getStringOrUndefined(row[DeliveryColumn.PRODUCT_NAME]),
        lotNumber: importMandatoryString(
            row,
            DeliveryColumn.LOT_NUMBER,
            addIssueCallback,
        ),
        dateOut: importStringDate(
            row,
            {
                y: DeliveryColumn.DATE_OUT_YEAR,
                m: DeliveryColumn.DATE_OUT_MONTH,
                d: DeliveryColumn.DATE_OUT_DAY,
            },
            addIssueCallback,
        ),
        dateIn: importStringDate(
            row,
            {
                y: DeliveryColumn.DATE_IN_YEAR,
                m: DeliveryColumn.DATE_IN_MONTH,
                d: DeliveryColumn.DATE_IN_DAY,
            },
            addIssueCallback,
        ),
        unitAmount: importAggregatedAmount(row, {
            number: DeliveryColumn.UNIT_AMOUNT_NUMBER,
            unit: DeliveryColumn.UNIT_AMOUNT_UNIT,
        }),
        lotAmountNumber: importValue(
            row,
            DeliveryColumn.LOT_AMOUNT_NUMBER,
            "nonneg:number",
            addIssueCallback,
        ),
        lotAmountUnit: getStringOrUndefined(
            row[DeliveryColumn.LOT_AMOUNT_UNIT],
        ),
        otherProps: getPropsFromRow(row, otherColumnMappings, addIssueCallback),
        ...getPropsFromRow(row, optionalColumnMappings, addIssueCallback),
    };
}

export class AllInOneImporter implements XlsxImporter {
    private externalId2StationRow = new Map<string, AllInOneStationRow>();
    private extId2DeliveryRow = new Map<string, AllInOneDeliveryRow>();

    isTemplateFormatValid(xlsxReader: XlsxReader): boolean {
        return this.validateTemplateFormat(xlsxReader);
    }

    importTemplate(xlsxReader: XlsxReader): ImportResult {
        this.validateTemplateFormat(xlsxReader, true);

        const stationTable = this.importStations(
            xlsxReader.getSheetReader(SHEET_LABELS.stations),
        );
        const deliveryTable = this.importDeliveries(
            xlsxReader.getSheetReader(SHEET_LABELS.deliveries),
        );
        const del2DelsTable = this.importDeliveries2Deliveries(
            xlsxReader.getSheetReader(SHEET_LABELS.dels2Dels),
        );
        return {
            stations: stationTable,
            deliveries: deliveryTable,
            del2Dels: del2DelsTable,
        };
    }

    private validateTemplateFormat(
        xlsxReader: XlsxReader,
        throwError: boolean = false,
    ): boolean {
        try {
            const requiredSheetNames = Object.values(SHEET_LABELS);
            const validationResult =
                xlsxReader.validateSheetNames(requiredSheetNames, throwError) &&
                xlsxReader.validateSheetHeader(
                    SHEET_LABELS.stations,
                    REQUIRED_STATION_COLUMN_HEADERS,
                    throwError,
                ) &&
                xlsxReader.validateSheetHeader(
                    SHEET_LABELS.deliveries,
                    REQUIRED_DELIVERY_COLUMN_HEADERS,
                    throwError,
                ) &&
                xlsxReader.validateSheetHeader(
                    SHEET_LABELS.dels2Dels,
                    REQUIRED_DEL2DEL_COLUMN_HEADERS,
                    throwError,
                );
            return validationResult;
        } catch (error) {
            if (throwError) {
                if (error instanceof XlsxInputFormatError) {
                    throw new AllInOneXlsxInputFormatError(error.message);
                } else {
                    throw error;
                }
            }
            return false;
        }
    }

    private importStations(
        xlsxSheetReader: XlsxSheetReader,
    ): ImportTable<AllInOneStationRow> {
        const table = xlsxSheetReader.readTable();

        const externalIdRegister = new Register();
        const idSet = new Set<string>();
        const longUniqueId2RowIndexMap = new Map<string, number>();

        const importTable = createEmptyImportTable<AllInOneStationRow>();

        const optionalColumnMappings = getOptionalColumnMapping(
            table,
            OPTIONAL_STATION_COLUMNS,
        );
        const otherColumnMappings = getOtherColumns(
            table,
            StationColumn.ADDCOLS + 1,
            optionalColumnMappings.map((m) => m.fromIndex),
        );

        let row: Row;
        let rowIsInvalid: boolean;
        const addIssueCallback: AddIssueCallback = (
            issue: ImportIssue,
            invalidateRow: boolean = false,
        ) => {
            importTable.issues.push(
                enrichImportIssue(issue, row, table, invalidateRow),
            );
            rowIsInvalid ||= invalidateRow;
        };

        for (row of table.rows) {
            rowIsInvalid = false;

            const stationRow = importStation(
                row,
                table,
                optionalColumnMappings,
                otherColumnMappings,
                externalIdRegister,
                addIssueCallback,
            );

            if (stationRow.extId) {
                externalIdRegister.add(stationRow.extId);
            }

            if (!rowIsInvalid) {
                const longUniqueId = getLongUniqueStationId(stationRow);
                if (longUniqueId2RowIndexMap.has(longUniqueId)) {
                    addIssueCallback(
                        {
                            row: row.rowIndex,
                            msg: IMPORT_ISSUES.rowIsTooSimilar(
                                longUniqueId2RowIndexMap.get(longUniqueId)!,
                            ),
                        },
                        true,
                    );
                } else {
                    longUniqueId2RowIndexMap.set(longUniqueId, row.rowIndex);
                    stationRow.id = getShortUniqueStationIdFromLongId(
                        longUniqueId,
                        idSet,
                    );

                    idSet.add(stationRow.id);
                    importTable.rows.push(stationRow as AllInOneStationRow);
                }
            }
            // This is not a If-Else, check has to happen last, since the invalid state could still be modified in a callback.
            if (rowIsInvalid) {
                addIssueCallback({ msg: IMPORT_ISSUES.omittingRow });
            }
        }

        importTable.omittedRows = table.rows.length - importTable.rows.length;

        this.externalId2StationRow = new Map(
            importTable.rows
                .filter((row) => externalIdRegister.isRegisteredOnce(row.extId))
                .map((r) => [r.extId, r]),
        );
        return importTable;
    }

    private importDeliveries(
        xlsxSheetReader: XlsxSheetReader,
    ): ImportTable<AllInOneDeliveryRow> {
        const table = xlsxSheetReader.readTable();

        const externalIdRegister = new Register();

        const idSet = new Set<string>();
        const longUniqueId2RowIndexMap = new Map<string, number>();

        const importTable = createEmptyImportTable<AllInOneDeliveryRow>();
        let row: Row;
        let rowIsInvalid: boolean;

        const addIssueCallback: AddIssueCallback = (
            issue: ImportIssue,
            invalidateRow: boolean = false,
        ) => {
            importTable.issues.push(
                enrichImportIssue(issue, row, table, invalidateRow),
            );
            rowIsInvalid ||= invalidateRow;
        };

        const optionalColumnMappings = getOptionalColumnMapping(
            table,
            OPTIONAL_DELIVERY_COLUMNS,
        );
        const otherColumnMappings = getOtherColumns(
            table,
            DeliveryColumn.ADDCOLS + 1,
            optionalColumnMappings.map((m) => m.fromIndex),
        );

        for (row of table.rows) {
            rowIsInvalid = false;

            const deliveryRow = importDelivery(
                row,
                table,
                optionalColumnMappings,
                otherColumnMappings,
                externalIdRegister,
                this.externalId2StationRow,
                addIssueCallback,
            );

            if (deliveryRow.extId) {
                externalIdRegister.add(deliveryRow.extId);
            }

            if (!rowIsInvalid) {
                deliveryRow.source = this.externalId2StationRow.get(
                    deliveryRow.source!,
                )?.id;
                deliveryRow.target = this.externalId2StationRow.get(
                    deliveryRow.target!,
                )?.id;
                const longUniqueId = getLongUniqueDeliveryId(deliveryRow);
                if (longUniqueId2RowIndexMap.has(longUniqueId)) {
                    addIssueCallback(
                        {
                            row: row.rowIndex,
                            msg: IMPORT_ISSUES.rowIsTooSimilar(
                                longUniqueId2RowIndexMap.get(longUniqueId)!,
                            ),
                        },
                        true,
                    );
                } else {
                    longUniqueId2RowIndexMap.set(longUniqueId, row.rowIndex);
                    deliveryRow.id = getShortUniqueDeliveryIdFromLongId(
                        longUniqueId,
                        idSet,
                    );

                    idSet.add(deliveryRow.id);
                    importTable.rows.push(deliveryRow as AllInOneDeliveryRow);
                }
            }

            // This is not a If-Else, check has to happen last, since the invalid state could still be modified in a callback.
            if (rowIsInvalid) {
                addIssueCallback({ msg: IMPORT_ISSUES.omittingRow });
            }
        }

        importTable.omittedRows = table.rows.length - importTable.rows.length;

        this.extId2DeliveryRow = new Map(
            importTable.rows
                .filter(
                    (row) =>
                        row.extId !== undefined &&
                        externalIdRegister.isRegisteredOnce(row.extId),
                )
                .map((row) => [row.extId!, row]),
        );
        return importTable;
    }

    private importDeliveries2Deliveries(
        xlsxSheetReader: XlsxSheetReader,
    ): ImportTable<Del2DelRow> {
        const table = xlsxSheetReader.readTable();
        const importTable = createEmptyImportTable<Del2DelRow>();

        let row: Row;
        let rowIsInvalid: boolean;

        const addIssueCallback: AddIssueCallback = (
            issue: ImportIssue,
            invalidateRow: boolean = false,
        ) => {
            importTable.issues.push(
                enrichImportIssue(issue, row, table, invalidateRow),
            );
            rowIsInvalid ||= invalidateRow;
        };

        for (row of table.rows) {
            rowIsInvalid = false;

            const del2DelRow: Partial<Del2DelRow> = {
                from: importReference(
                    row,
                    Del2DelColumn.FROM,
                    this.extId2DeliveryRow,
                    addIssueCallback,
                ),
                to: importReference(
                    row,
                    Del2DelColumn.TO,
                    this.extId2DeliveryRow,
                    addIssueCallback,
                ),
            };

            if (!rowIsInvalid) {
                del2DelRow.from = this.extId2DeliveryRow.get(
                    del2DelRow.from!,
                )?.id;
                del2DelRow.to = this.extId2DeliveryRow.get(del2DelRow.to!)?.id;
                importTable.rows.push(del2DelRow as Del2DelRow);
            } else {
                addIssueCallback({ msg: IMPORT_ISSUES.omittingRow });
            }
        }

        importTable.omittedRows = table.rows.length - importTable.rows.length;

        return importTable;
    }
}

function conditionalJoinOrUndefined(
    arr: any[],
    sep: string,
): string | undefined {
    const filteredArr = removeNullish(arr);
    return filteredArr.length === 0 ? undefined : filteredArr.join(sep);
}

function createStationAddress(row: Row): string | undefined {
    const street = getStringOrUndefined(row[StationColumn.STREET]);
    const streetNo = getStringOrUndefined(row[StationColumn.STREET_NUMBER]);
    const streetWithNo = conditionalJoinOrUndefined([street, streetNo], " ");
    const zip = getStringOrUndefined(row[StationColumn.ZIP]);
    const city = getStringOrUndefined(row[StationColumn.CITY]);
    const zipWithCity = conditionalJoinOrUndefined([zip, city], " ");
    const address = conditionalJoinOrUndefined(
        [streetWithNo, zipWithCity],
        ", ",
    );
    return address;
}
