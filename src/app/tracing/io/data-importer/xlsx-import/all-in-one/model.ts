import { DeliveryRow, ImportTable, StationRow } from "../model";
import { CellValue } from "../xlsx-reader";

export enum StationColumn {
    EXT_ID,
    NAME,
    STREET,
    STREET_NUMBER,
    ZIP,
    CITY,
    DISTRICT,
    STATE,
    COUNTRY,
    TYPE_OF_BUSINESS,
    ADDCOLS,
}

export enum DeliveryColumn {
    EXT_ID,
    SOURCE,
    PRODUCT_NAME,
    LOT_NUMBER,
    LOT_AMOUNT_NUMBER,
    LOT_AMOUNT_UNIT,
    DATE_OUT_DAY,
    DATE_OUT_MONTH,
    DATE_OUT_YEAR,
    DATE_IN_DAY,
    DATE_IN_MONTH,
    DATE_IN_YEAR,
    UNIT_AMOUNT_NUMBER,
    UNIT_AMOUNT_UNIT,
    TARGET,
    ADDCOLS,
}

export enum Del2DelColumn {
    FROM,
    TO,
}

export interface AllInOneDeliveryRow extends DeliveryRow {
    extId?: string;
    otherProps: Record<string, CellValue>;
}

export interface AllInOneStationRow extends StationRow {
    extId: string;
    typeOfBusiness?: string;
    otherProps: Record<string, CellValue>;
}

export type AllInOneDeliveryTable = ImportTable<AllInOneDeliveryRow>;
