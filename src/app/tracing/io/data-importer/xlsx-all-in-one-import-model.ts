import { NonEmptyArray } from '@app/tracing/util/utility-types';

export type SheetRefName = 'stations' | 'deliveries' | 'dels2Dels';
export type SheetNameMapping = Record<SheetRefName, string>;


export interface ColumnConf<T extends SheetRefName> {
    ref: keyof WBColumnMapping[T];
}

export interface ColumnGroupConf<T extends SheetRefName> {
    ref: keyof WBColumnMapping[T];
    subColumns: NonEmptyArray<ColumnConf<T> | ColumnGroupConf<T>>;
}

export type ColumnsConfiguration<T extends SheetRefName> = (ColumnConf<T> | ColumnGroupConf<T>)[];

interface StationColumnMapping {
    id: string;
    name: string;
    typeOfBusiness: string;
    country: string;
    lat: string;
    lon: string;
    street: string;
    streetNo: string;
    zip: string;
    city: string;
    district: string;
    state: string;
    addCols: string;
}

interface DeliveryColumnMapping {
    id: string;
    name: string;
    lot: string;
    source: string;
    target: string;
    departureDate: string;
    departureDateDay: string;
    departureDateMonth: string;
    departureDateYear: string;
    arrivalDate: string;
    arrivalDateDay: string;
    arrivalDateMonth: string;
    arrivalDateYear: string;
    lotAmount: string;
    lotAmountNumber: string;
    lotAmountUnit: string;
    unitAmount: string;
    unitAmountNumber: string;
    unitAmountUnit: string;
    // additional columns placeholder
    addCols: string;
    // additional columns
    deliveryAmountNumber: string;
    deliveryAmountUnit: string;
    bestBeforeDate: string;
    prodDate: string;
}

interface Dels2DelsColumnMapping {
    from: string;
    to: string;
}

export interface WBColumnMapping {
    stations: StationColumnMapping;
    deliveries: DeliveryColumnMapping;
    dels2Dels: Dels2DelsColumnMapping;
}
