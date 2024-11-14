import {
    STATION_ID,
    STATION_NAME,
    STATION_ADDRESS,
    STATION_COUNTRY,
    STATION_LAT,
    STATION_LON,
    STATION_TYPE_OF_BUSINESS_DA,
    DELIVERY_ID,
    DELIVERY_FROM,
    DELIVERY_TO,
    DELIVERY_NAME,
    DELIVERY_LOT_NUMBER,
    DELIVERY_IN_DATE,
    DELIVERY_OUT_DATE,
    DEL2DEL_FROM,
    DEL2DEL_TO,
} from "../../ext-data-constants.v1";
import { Del2DelRow, DeliveryRow, StationRow } from "./model";

type In2OutMapping<T> = Partial<Record<keyof T, string>>;

export const EXTOUT_STATION_PROP_IDS = {
    id: STATION_ID,
    name: STATION_NAME,
    address: STATION_ADDRESS,
    country: STATION_COUNTRY,
    lat: STATION_LAT,
    lon: STATION_LON,
    typeOfBusiness: STATION_TYPE_OF_BUSINESS_DA,
} as const satisfies In2OutMapping<StationRow>;

export const EXTOUT_DELIVERY_PROP_IDS = {
    id: DELIVERY_ID,
    source: DELIVERY_FROM,
    target: DELIVERY_TO,
    productName: DELIVERY_NAME,
    lotNumber: DELIVERY_LOT_NUMBER,
    dateIn: DELIVERY_IN_DATE,
    dateOut: DELIVERY_OUT_DATE,
    lotAmountNumber: "Lot Amount Number",
    lotAmountUnit: "Lot Amount Unit",
    unitAmount: "Amount",
    lotTreatment: "Treatment of product during production",
    lotBestBeforeDate: "Best before date",
    lotProductionDate: "Production date",
    lotSampling: "Sampling",
} as const satisfies In2OutMapping<DeliveryRow>;

export const EXTOUT_DEL2DEL_PROP_IDS = {
    from: DEL2DEL_FROM,
    to: DEL2DEL_TO,
} as const satisfies In2OutMapping<Del2DelRow>;

function formatCellAddress(
    row: number,
    col: number | string,
    sheet: string,
): string {
    return `(row: ${row}, column: ${col}, sheet: '${sheet}')`;
}

export const IMPORT_ISSUES = {
    wbNotLoaded: "Workbook is not loaded into Reader.",
    nonUniqueValue: "Value is not unique.",
    nonUniquePrimaryKey: "Primary key is not unique.",
    invalidValue: "Invalid value.",
    missingValue: "Missing value.",
    invalidRef: "Invalid reference.",
    omittingValue: "Value was omitted.",
    omittingRow: "Row was omitted.",
    rowIsTooSimilar: (indexOfSimilarRow: number) =>
        `Row is too similar to row ${indexOfSimilarRow}.`,
    unexpectedCellText: (
        row: number,
        col: number,
        sheet: string,
        expectedText: string,
    ) =>
        `Unexpected cell text. Text in cell ${formatCellAddress(row, col, sheet)} does not match '${expectedText}'.`,
    unexpectedCellSpan: (
        row: number,
        col: number,
        sheet: string,
        expectedSpan: number,
    ) =>
        `Cell ${formatCellAddress(row, col, sheet)} does not span ${expectedSpan} columns.`,
    missingSheet: (sheetName: string) => `Sheet '${sheetName}' is missing.`,
    invalidCellValue: (row: number, col: number | string, sheet: string) =>
        `Value in cell ${formatCellAddress(row, col, sheet)} is not valid.`,
    missingSheets: (sheetNames: [string, ...string[]]) =>
        sheetNames.length === 1
            ? `Sheet '${sheetNames[0]}' is missing.`
            : `Sheets '${sheetNames.join("', '")}' are missing.`,
} as const;

export const ISSUE_TEXT_AGGREGATORS = {
    duplicatePrimaryIDs: (
        sheets: { name: string; duplicateIds: string[] }[],
    ) => {
        if (sheets.length === 0) {
            return "";
        }
        if (sheets.length === 1) {
            return `There are duplicate IDs in the ${sheets[0].name} spreadsheet (${sheets[0].duplicateIds.join(", ")}). Data lines with Duplicate IDs were discarded and not imported.`;
        }
        return `There are duplicate IDs in the ${sheets[0].name} spreadsheet (${sheets[0].duplicateIds.join(", ")}) and in the ${sheets[1].name} spreadsheet (${sheets[1].duplicateIds.join(", ")}). Data lines with Duplicate IDs were discarded and not imported.`;
    },
};

export const IMPORT_PREFIXES = {
    stationId: "S",
    deliveryId: "D",
    otherDeliveryProp: "_Lieferungen.",
    otherStationProp: "_",
} as const;
