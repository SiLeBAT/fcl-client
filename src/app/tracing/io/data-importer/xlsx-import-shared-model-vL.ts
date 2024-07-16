import { CellValue } from "./xlsx-model-vL";

type TypeString = 'number' | 'lat' | 'lon' | 'nonneg:number' | 'string';
type TypeString2Type<T extends TypeString> =
    T extends 'number' | 'lat' | 'lon' | 'nonneg:number' ? number :
    T extends 'string' ? string : never;

interface Row {
    rowIndex: number;
    [key: number]: CellValue
}


export class MissingMandatoryValueError extends Error {
    constructor(msg?: string | undefined) {
        super(msg);
    }
}

export class InvalidFKReferenceError extends Error {
    constructor(msg?: string | undefined) {
        super(msg);
    }
}

interface StationRow {
    id: string;
    name?: string;
    country?: string;
    typeOfBusiness?: string;
    // -- additional columns
    lat?: number;
    lon?: number;
}

export interface TypedDeliveryRow {
    id: string;
    inputIdentFP: string;
    ppIdentFP: string;

    source: string;
    productName?: string;
    lotNo?: string;
    dateOut?: string;
    dateIn?: string;
    unitAmount?: string; // ??
    // unitAmount_number?: number;
    // unitAmount_unit?: string;
    target: string;
    // -- additional columns
    delAmountQuantity?: number; //??
    delAmountUnit?: string;
    itemNumber?: string;
    subUnits?: number;
    bestBeforeDate?: string;
    productionTreatment?: string;
    sampling?: string;
    value?: string;
    productionDate?: string;
    indicator?: string
}

interface Del2DelRow {
    from: string;
    to: string;
}
