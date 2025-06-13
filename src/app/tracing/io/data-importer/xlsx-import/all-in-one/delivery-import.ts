import { AddIssueCallback, ColumnMapping, SetLike } from "../model";
import {
    enrichImportIssue,
    getPropsFromRow,
    toStringOrUndefined,
    importAmount,
    importReference,
    importStringDate,
} from "../shared";
import { Row, Table } from "../xlsx-reader";
import { AllInOneDeliveryRow, DeliveryColumn } from "./model";

function importLotAmount(
    row: Row,
    addIssueCb: AddIssueCallback,
): Pick<
    AllInOneDeliveryRow,
    "lotAmountNumber" | "lotAmountUnit" | "lotAmount"
> {
    const amount = importAmount(
        row,
        {
            number: DeliveryColumn.LOT_AMOUNT_NUMBER,
            unit: DeliveryColumn.LOT_AMOUNT_UNIT,
        },
        addIssueCb,
    );
    return {
        lotAmount: amount.text,
        lotAmountNumber: amount.number,
        lotAmountUnit: amount.unit,
    };
}

function importDeliveryAmount(
    row: Row,
    addIssueCb: AddIssueCallback,
): Pick<
    AllInOneDeliveryRow,
    "unitAmountNumber" | "unitAmountUnit" | "unitAmount"
> {
    const amount = importAmount(
        row,
        {
            number: DeliveryColumn.UNIT_AMOUNT_NUMBER,
            unit: DeliveryColumn.UNIT_AMOUNT_UNIT,
        },
        addIssueCb,
    );
    return {
        unitAmount: amount.text,
        unitAmountNumber: amount.number,
        unitAmountUnit: amount.unit,
    };
}

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
        productName: toStringOrUndefined(row[DeliveryColumn.PRODUCT_NAME]),
        lotNumber: toStringOrUndefined(row[DeliveryColumn.LOT_NUMBER]),
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
        ...importLotAmount(row, addIssueCallback),
        ...importDeliveryAmount(row, addIssueCallback),
        otherProps: getPropsFromRow(row, otherColumnMappings, addIssueCallback),
        ...getPropsFromRow(row, optionalColumnMappings, addIssueCallback),
    };
}
