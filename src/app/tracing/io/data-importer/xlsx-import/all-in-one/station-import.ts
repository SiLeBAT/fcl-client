import { joinNonEmptyElementsOrUndefined } from "../../../../util/non-ui-utils";
import { AddIssueCallback, ColumnMapping } from "../model";
import {
    enrichImportIssue,
    getPropsFromRow,
    toStringOrUndefined,
} from "../shared";
import { Row, Table } from "../xlsx-reader";
import { AllInOneStationRow, StationColumn } from "./model";

export function createStationAddress(row: Row): string | undefined {
    const street = toStringOrUndefined(row[StationColumn.STREET]);
    const streetNo = toStringOrUndefined(row[StationColumn.STREET_NUMBER]);
    const streetWithNo = joinNonEmptyElementsOrUndefined(
        [street, streetNo],
        " ",
    );
    const zip = toStringOrUndefined(row[StationColumn.ZIP]);
    const city = toStringOrUndefined(row[StationColumn.CITY]);
    const zipWithCity = joinNonEmptyElementsOrUndefined([zip, city], " ");
    const address = joinNonEmptyElementsOrUndefined(
        [streetWithNo, zipWithCity],
        ", ",
    );
    return address;
}

export function importStation(
    row: Row,
    table: Table,
    externalId: string | undefined,
    optionalColumnMappings: ColumnMapping[],
    otherColumnMappings: ColumnMapping[],
    externalAddIssueCallback: AddIssueCallback,
): Partial<AllInOneStationRow> {
    const addIssueCallback: AddIssueCallback = (
        issue,
        invalidateRow = false,
    ) => {
        externalAddIssueCallback(
            enrichImportIssue(issue, row, table, invalidateRow, externalId),
            invalidateRow,
        );
    };

    const stationRow: Partial<AllInOneStationRow> = {
        extId: externalId,
        name: toStringOrUndefined(row[StationColumn.NAME]),
        address: createStationAddress(row),
        country: toStringOrUndefined(row[StationColumn.COUNTRY]),
        typeOfBusiness: toStringOrUndefined(
            row[StationColumn.TYPE_OF_BUSINESS],
        ),
        otherProps: getPropsFromRow(row, otherColumnMappings, addIssueCallback),
        ...getPropsFromRow(row, optionalColumnMappings, addIssueCallback),
    };
    return stationRow;
}
