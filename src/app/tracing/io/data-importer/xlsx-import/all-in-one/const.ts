import { DeliveryRow, MappingDef, StationRow } from "../model";
import { ColumnLabelTree } from "../xlsx-reader";

const ADDITIONAL_FIELDS_COLUMN = "Additional Fields ->";
const DATE_SUB_COLUMNS: [string, string, string] = ["Day", "Month", "Year"];
const AMOUNT_SUB_COLUMNS: [string, string] = ["Quantity", "Type / Unit"];

export const REQUIRED_STATION_COLUMN_HEADERS: ColumnLabelTree[] = [
    "Company_ID",
    "Name",
    "Street",
    "Street Number",
    "Postal Code",
    "City",
    "District",
    "State",
    "Country",
    "Type of business",
    ADDITIONAL_FIELDS_COLUMN,
];

export const REQUIRED_DELIVERY_COLUMN_HEADERS: ColumnLabelTree[] = [
    "DeliveryID",
    "Station",
    "Product Name",
    "Lot Number",
    ["Lot size", AMOUNT_SUB_COLUMNS],
    ["Delivery Date Departure", DATE_SUB_COLUMNS],
    ["Delivery Date Arrival", DATE_SUB_COLUMNS],
    ["Unit weigt/vol./pck.", AMOUNT_SUB_COLUMNS],
    "Recipient",
    ADDITIONAL_FIELDS_COLUMN,
];

export const REQUIRED_DEL2DEL_COLUMN_HEADERS: ColumnLabelTree[] = [
    "From DeliveryID",
    "Into DeliveryID",
];

export const SHEET_LABELS = {
    stations: "Stations",
    deliveries: "Deliveries",
    dels2Dels: "Deliveries2Deliveries",
} as const satisfies Record<string, string>;

export const IDENTIFYING_DELIVERY_PROPS: (keyof DeliveryRow)[] = [
    "source",
    "target",
    "productName",
    "lotNumber",
    "dateOut",
    "dateIn",
    "unitAmount",
];

export const OPTIONAL_STATION_COLUMNS: MappingDef<StationRow> = {
    lat: { header: ["Latitude"], type: "lat" },
    lon: { header: ["Longitude"], type: "lon" },
};

export const OPTIONAL_DELIVERY_COLUMNS: MappingDef<DeliveryRow> = {
    lotProductionDate: { header: ["Production date"], type: "string" },
    lotBestBeforeDate: { header: ["Best before date"], type: "string" },
    lotSampling: { header: ["Sampling"], type: "string" },
    lotTreatment: {
        header: ["Treatment of product during production"],
        type: "string",
    },
};

export type OptionalStationColumn = keyof typeof OPTIONAL_STATION_COLUMNS;
export type OptionalDeliveryColumn = keyof typeof OPTIONAL_DELIVERY_COLUMNS;
