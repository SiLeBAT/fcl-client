import { AddIssueCallback, ColumnMapping, SetLike } from "../model";
import {
    enrichImportIssue,
    getPropsFromRow,
    getStringOrUndefined,
    importAggregatedAmount,
    importMandatoryString,
    importReference,
    importStringDate,
    importValue,
} from "../shared";
import { Row, Table } from "../xlsx-reader";
import { AllInOneDeliveryRow, DeliveryColumn } from "./model";

export function importDelivery(
    row: Row,
    table: Table,
    externalId: string | undefined,
    optionalColumnMappings: ColumnMapping[],
    otherColumnMappings: ColumnMapping[],
    extStationIdRegister: SetLike,
    externalAddIssueCallback: AddIssueCallback,
): Partial<AllInOneDeliveryRow> {
    const addIssueCallback: AddIssueCallback = (
        issue,
        invalidateRow = false,
    ) => {
        externalAddIssueCallback(
            enrichImportIssue(issue, row, table, invalidateRow, externalId),
            invalidateRow,
        );
    };

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
