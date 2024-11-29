import {
    AddIssueCallback,
    AddIssueToTable,
    Del2DelRow,
    ImportIssue,
    ImportResult,
    ImportTable,
    XlsxImporter,
} from "../model";
import { Row, Table, XlsxReader, XlsxSheetReader } from "../xlsx-reader";
import {
    AllInOneDeliveryRow,
    AllInOneStationRow,
    Del2DelColumn,
    DeliveryColumn,
    StationColumn,
} from "./model";
import {
    createEmptyImportTable,
    enrichImportIssue,
    getLongUniqueDeliveryId,
    getLongUniqueStationId,
    getOptionalColumnMapping,
    getOtherColumns,
    getShortUniqueDeliveryIdFromLongId,
    getShortUniqueStationIdFromLongId,
    importMandatoryString,
    importReference,
} from "../shared";
import {
    OPTIONAL_DELIVERY_COLUMNS,
    OPTIONAL_STATION_COLUMNS,
    REQUIRED_DEL2DEL_COLUMN_HEADERS,
    REQUIRED_DELIVERY_COLUMN_HEADERS,
    REQUIRED_STATION_COLUMN_HEADERS,
    SHEET_LABELS,
} from "./const";
import { IMPORT_ISSUES } from "../consts";
import {
    AllInOneXlsxInputFormatError,
    XlsxInputFormatError,
} from "../../../io-errors";
import { importStation } from "./station-import";
import { importDelivery } from "./delivery-import";
import { Register } from "./shared";

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

        const addIssueToTable: AddIssueToTable = (
            issue,
            row,
            invalidateRow = false,
        ) => {
            importTable.issues.push(
                enrichImportIssue(issue, row, table, invalidateRow),
            );
        };

        const { rowIndexToExternalIds, externalIdRegister } =
            registerExternalIds(table, addIssueToTable, StationColumn.EXT_ID);

        for (const row of table.rows) {
            let rowIsInvalid = false;
            const addIssueCallback: AddIssueCallback = (
                issue,
                invalidateRow = false,
            ) => {
                addIssueToTable(issue, row, invalidateRow);
                rowIsInvalid ||= invalidateRow;
            };

            const externalId = rowIndexToExternalIds.get(row.rowIndex);
            rowIsInvalid ||= externalId === undefined;

            const stationRow = importStation(
                row,
                table,
                externalId,
                optionalColumnMappings,
                otherColumnMappings,
                addIssueCallback,
            );

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

        const idSet = new Set<string>();
        const longUniqueId2RowIndexMap = new Map<string, number>();

        const importTable = createEmptyImportTable<AllInOneDeliveryRow>();

        const addIssueToTable: AddIssueToTable = (
            issue,
            row,
            invalidateRow = false,
        ) => {
            importTable.issues.push(
                enrichImportIssue(issue, row, table, invalidateRow),
            );
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

        const { rowIndexToExternalIds, externalIdRegister } =
            registerExternalIds(table, addIssueToTable, DeliveryColumn.EXT_ID);

        for (const row of table.rows) {
            let rowIsInvalid = false;
            const addIssueCallback: AddIssueCallback = (
                issue,
                invalidateRow = false,
            ) => {
                addIssueToTable(issue, row, invalidateRow);
                rowIsInvalid ||= invalidateRow;
            };
            const externalId = rowIndexToExternalIds.get(row.rowIndex);
            rowIsInvalid ||= externalId === undefined;

            const deliveryRow = importDelivery(
                row,
                table,
                externalId,
                optionalColumnMappings,
                otherColumnMappings,
                this.externalId2StationRow,
                addIssueCallback,
            );

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
            issue,
            invalidateRow = false,
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

function registerExternalIds(
    table: Table,
    addIssueCallback: AddIssueToTable,
    externalIdColumnIndex: number,
) {
    const externalIdRegister = new Register();
    const rowIndexToExternalIds = new Map<number, string>();

    const hasDuplicateId = (row: Row) =>
        rowIndexToExternalIds.get(row.rowIndex) !== undefined &&
        !externalIdRegister.isRegisteredOnce(
            rowIndexToExternalIds.get(row.rowIndex)!,
        );

    for (const row of table.rows) {
        const id = importMandatoryString(
            row,
            externalIdColumnIndex,
            (issue, invalidateRow) =>
                addIssueCallback(
                    {
                        ...issue,
                    },
                    row,
                    invalidateRow,
                ),
        );
        if (id !== undefined) {
            rowIndexToExternalIds.set(row.rowIndex, id);
            externalIdRegister.add(id);
        }
    }

    for (const row of table.rows) {
        if (hasDuplicateId(row)) {
            rowIndexToExternalIds.delete(row.rowIndex);
            addIssueCallback(
                {
                    col: externalIdColumnIndex,
                    type: "error",
                    msg: IMPORT_ISSUES.nonUniquePrimaryKey,
                },
                row,
                true,
            );
        }
    }
    return { rowIndexToExternalIds, externalIdRegister };
}
