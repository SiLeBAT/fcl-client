import { joinNonEmptyElementsOrUndefined } from "../../../../util/non-ui-utils";
import { AddIssueCallback, ColumnMapping, ImportIssue } from "../model";
import {
    enrichImportIssue,
    getPropsFromRow,
    getStringOrUndefined,
    importPrimaryKey,
} from "../shared";
import { Row, Table } from "../xlsx-reader";
import { AllInOneStationRow, StationColumn } from "./model";
import { Register } from "./shared";

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
    const stationRow: Partial<AllInOneStationRow> = {
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
    return stationRow;
}
