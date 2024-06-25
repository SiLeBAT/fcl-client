import { DeepReadonly } from '@app/tracing/util/utility-types';
import { DEL2DEL_FROM, DEL2DEL_TO, DELIVERY_FROM, DELIVERY_ID, DELIVERY_IN_DATE, DELIVERY_LOT_NUMBER, DELIVERY_NAME, DELIVERY_OUT_DATE, DELIVERY_TO, STATION_ADDRESS, STATION_COUNTRY, STATION_ID, STATION_LAT, STATION_LON, STATION_NAME, STATION_TYPE_OF_BUSINESS_DA } from '../ext-data-constants.v1';
import { ColumnLabelRef, HeaderConf, SheetNameMapping, SheetRef } from './xlsx-all-in-one-import-model';

export const GeneratedIdPropRef = 'genId';
export const SHEET_REFS: SheetRef[] = ['stations', 'deliveries', 'dels2Dels'];

type Aw2EoM<T> = [T, T, ...T[]];
type GHeaderConf = string | DeepReadonly<[string, Aw2EoM<string>]>;
// type RHeaderConf = string | Readonly<[string, Readonly<Aw2EoM<RHeaderConf>>]>;
// type Aw2EoM<T> = [T, T, ...T[]];

type Concat<X extends string, Y extends string> = { [xKey in X]: { [yKey in Y]: `${xKey}_${yKey}` }[Y] }[X];
// type PNEA<AE extends RHeaderConf> = Extract<AE, string> | ConcatNestedElements<Exclude<AE, string>>;
// // type Distribute<U> = U extends any ? {type: U} : never;
// type ConcatNestedElements<U extends Exclude<RHeaderConf, string>> = U extends any ? ConcatNestedElement<U> : never;

// // @ts-ignore
// type ConcatNestedElement<A extends Exclude<HeaderConf, string>> = Concat<A[0], PNEA<A[1][number]>>;

type ExtractNestedColRefs<T extends Exclude<GHeaderConf, string>> = T extends any ? Concat<T[0], T[1][number]> : never;
type ExtractColRefs<AE extends GHeaderConf> = Extract<AE, string> | ExtractNestedColRefs<Exclude<AE, string>>;

// function createDateColumnConf<T extends SheetRef>(ref: ColumnLabelRef<T>): Readonly<HeaderConf<T>> {
//     return [ref, ['day','month','year']] as const;
// }
const dateColumns = ['day', 'month', 'year'] as const;
const amountColumns = ['quantity', 'unit'] as const;

// function createAmountColumnConf<T extends SheetRef>(ref: ColumnLabelRef<T>): HeaderConf<T> {
//     return [ref as const, ['quantity', 'unit']];
// }

export const mandatoryColumnConf = {
    stations: [
        ['extId', 'extId'],
        ['name', 'name'],
        'street',
        'streetNo',
        'zip',
        'city',
        'district',
        'state',
        'country',
        'typeOfBusiness',
        'addCols'
    ],
    deliveries: [
        'extId',
        'source',
        'name',
        'lotNo',
        ['lotAmount', amountColumns],
        ['dateOut', dateColumns],
        ['dateIn', dateColumns],
        ['unitAmount', amountColumns],
        'target',
        'addCols'
    ],
    dels2Dels: [
        'from',
        'to'
    ]
} as const satisfies DeepReadonly<{ [key in SheetRef]: HeaderConf<key>[] }>;

export const additionColumnGroups = {
    stations: [
        'lat',
        'lon'
    ],
    deliveries: [
        'delAmountQuantity',
        'delAmountUnit',
        'itemNumber',
        ['subUnits', dateColumns],
        'bestBeforeDate',
        'productionTreatment',
        'sampling',
        'value',
        'prodDate',
        'indicator'
    ] as const,
    dels2Dels: []
} as const satisfies DeepReadonly<{ [key in SheetRef]: HeaderConf<key>[] }>;


export const sheetNameMapping: Readonly<SheetNameMapping> = {
    stations: 'Stations',
    deliveries: 'Deliveries',
    dels2Dels: 'Deliveries2Deliveries'
};
Object.freeze(sheetNameMapping);

type PHC<T extends string | Readonly<[string, Readonly<string[]>]>> = T extends string ? T :
        Concat<T[0], T[1][number]>;

// type Tmp = PHC<typeof mandatoryColumnGroups['deliveries'][number]>;
type MandatorySheetColRefs<T extends SheetRef> = PHC<typeof mandatoryColumnGroups[T][number]>;
export type AdditionalSheetColRefs<T extends SheetRef> = PHC<typeof additionColumnGroups[T][number]>;
export type AdditionalColRefs = { [sheetRef in SheetRef]: AdditionalSheetColRefs<sheetRef> };
// type MandatoryColIndices = { [sheetRef in SheetRef]: MandatorySheetColRefs<sheetRef>};

// type Tmp = ExtractColRefs<typeof mandatoryColumnGroups['deliveries'][number]>;

function getColumnIndices<T extends SheetRef>(headerConf: DeepReadonly<HeaderConf<T>[]>): Record<MandatorySheetColRefs<T>, number> {
    const columnKeys = headerConf.reduce(
        // (pV, hC) => typeof hC === 'string' ?
        // [...pV, hC] :
        // [...pV, ...hC[1].map(x => `${hC[0]}_${x}`)]
        (pV, hC) => Array.isArray(hC) ?
            [...pV, ...hC[1].map(x => `${hC[0]}_${x}`)] :
            typeof hC === 'string' ?
                [...pV, hC] : [...pV, `${hC}`]
        , [] as string[]
    );
    return Object.fromEntries(columnKeys.map((k,i) => [k, i + 1])) as Record<MandatorySheetColRefs<T>, number>;
}

// function mapObject<T extends object>(obj: T, mapFun: <K extends keyof T, X>(k: keyof T) => X): { []}

type MandotoryColIndices = { [sheetRef in SheetRef]: Record<MandatorySheetColRefs<sheetRef>, number> };

// export const MANDATORY_COL_INDEXES: MandotoryColIndices = Object.fromEntries(
//     Object.entries(mandatoryColumnGroups).map(
//         ([sheetRef, columnGroups]) => [sheetRef, getColumnIndices<infer sheetRef>(columnGroups)]
//     )
// );

export const MANDATORY_COL_INDEXES: DeepReadonly<MandotoryColIndices>  = {
    stations: getColumnIndices<'stations'>(mandatoryColumnGroups.stations),
    deliveries: getColumnIndices<'deliveries'>(mandatoryColumnGroups.deliveries),
    dels2Dels: getColumnIndices<'dels2Dels'>(mandatoryColumnGroups.dels2Dels)
};

// type Tmp = AddSheetColRefs<'deliveries'>;

// export const ADDPROP_COL_INDEXES: { [sheetRef in SheetRef]: Record<AddSheetColRefs<sheetRef>, number> } = Object.fromEntries(
//     Object.entries(mandatoryColumnGroups).map(
//         ([sheetRef, columnGroups]) => [sheetRef, getColumnIndices<infer sheetRef>(columnGroups)]
//     )
// );

export const EXT_JSON_NAMES = {
    stations: {
        id: STATION_ID,
        name: STATION_NAME,
        address: STATION_ADDRESS,
        country: STATION_COUNTRY,
        lat: STATION_LAT,
        lon: STATION_LON,
        typeOfBusiness: STATION_TYPE_OF_BUSINESS_DA
    },
    deliveries: {
        id: DELIVERY_ID,
        source: DELIVERY_FROM,
        target: DELIVERY_TO,
        name: DELIVERY_NAME,
        lotNo: DELIVERY_LOT_NUMBER,
        dateIn: DELIVERY_IN_DATE,
        dateOut: DELIVERY_OUT_DATE,
        lotAmountQuantity: 'Lot Amount Quantity',
        lotAmountUnit: 'Lot Amount Unit',
        unitAmount: 'Amount'
    },
    dels2Dels: {
        from: DEL2DEL_FROM,
        to: DEL2DEL_TO
    }
} as const;


export const OTHER_PROP_REFS = {
    stations: {
        id: 'id',
        address: 'address'
    },
    deliveries: {
        dateIn: 'dateIn',
        dateOut: 'dateOut'
    }
};
