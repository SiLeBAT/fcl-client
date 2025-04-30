import { joinNonEmptyElementsOrUndefined } from "../../../../util/non-ui-utils";
import { AddIssueCallback, ColumnMapping } from "../model";
import {
    enrichImportIssue,
    getPropsFromRow,
    getStringOrUndefined,
} from "../shared";
import { Row, Table } from "../xlsx-reader";
import { AllInOneStationRow, StationColumn } from "./model";

function createStationAddress(row: Row): string | undefined {
    const street = getStringOrUndefined(row[StationColumn.STREET]);
    const streetNo = getStringOrUndefined(row[StationColumn.STREET_NUMBER]);
    const streetWithNo = joinNonEmptyElementsOrUndefined(
        [street, streetNo],
        " ",
    );
    const zip = getStringOrUndefined(row[StationColumn.ZIP]);
    const city = getStringOrUndefined(row[StationColumn.CITY]);
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
        name: getStringOrUndefined(row[StationColumn.NAME]),
        address: createStationAddress(row),
        country: getStringOrUndefined(row[StationColumn.COUNTRY]),
        typeOfBusiness: getStringOrUndefined(
            row[StationColumn.TYPE_OF_BUSINESS],
        ),
        otherProps: getPropsFromRow(row, otherColumnMappings, addIssueCallback),
        ...getPropsFromRow(row, optionalColumnMappings, addIssueCallback),
    };
    return stationRow;
}
