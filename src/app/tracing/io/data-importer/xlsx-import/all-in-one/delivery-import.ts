import {
    AddIssueCallback,
    ColumnMapping,
    ImportIssue,
    SetLike,
} from "../model";
import {
    enrichImportIssue,
    getPropsFromRow,
    getStringOrUndefined,
    importAggregatedAmount,
    importMandatoryString,
    importPrimaryKey,
    importReference,
    importStringDate,
    importValue,
} from "../shared";
import { Row, Table } from "../xlsx-reader";
import { AllInOneDeliveryRow, DeliveryColumn } from "./model";

export function importDelivery(
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
