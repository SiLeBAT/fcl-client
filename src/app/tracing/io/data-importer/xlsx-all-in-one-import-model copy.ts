import { NonEmptyArray } from '@app/tracing/util/utility-types';

type StationSheetRef = 'stations';
type DeliverySheetRef = 'deliveries';
type Del2DelSheetRef = 'dels2Dels';

type SharedLabelGroupRef = 'shared';

export type SheetRef = StationSheetRef | DeliverySheetRef | Del2DelSheetRef;
export type LabelGroupRef = SheetRef | SharedLabelGroupRef;
export type SheetNameMapping = Record<SheetRef, string>;

type ShortColumnConf<T extends LabelGroupRef> = ColumnLabelRef<T>;

interface ExtColumnConf<T extends LabelGroupRef>{
    ref: ColumnLabelRef<T>;
    check?: (x: any) => boolean;
    transform?: <X, Y>(x: X) => Y;
}

type ChildColumnConf = ShortColumnConf<SharedLabelGroupRef> | ExtColumnConf<SharedLabelGroupRef>;

interface NestedColumnConf<T extends SheetRef> extends ExtColumnConf<T> {
    children: NonEmptyArray<ChildColumnConf>;
}

type NestedArrayColumnConf<T extends SheetRef> = [ColumnLabelRef<T>, NonEmptyArray<ChildColumnConf>];

export type ColumnConf<T extends SheetRef> =
 | ShortColumnConf<T>
 | ExtColumnConf<T>
 | NestedColumnConf<T>
 | NestedArrayColumnConf<T>;

// interface DeliveryColumnMapping {
//     id: string;
//     name: string;
//     lot: string;
//     source: string;
//     target: string;
//     dateOut: string;
//     dateOutD: string;
//     dateOutM: string;
//     dateOutY: string;
//     dateIn: string;
//     dateInD: string;
//     dateInM: string;
//     dateInY: string;
//     lotAmount: string;
//     lotAmountNumber: string;
//     lotAmountUnit: string;
//     unitAmount: string;
//     unitAmountNumber: string;
//     unitAmountUnit: string;
//     // additional columns placeholder
//     addCols: string;
//     // additional columns
//     deliveryAmountNumber: string;
//     deliveryAmountUnit: string;
//     bestBeforeDate: string;
//     prodDate: string;
// }

type DatePartLabelRef = 'day' | 'month' | 'year';
type AmountPartLabelRef = 'quantity' | 'unit';
type DatePartRef<T extends SheetRef, X extends ColumnLabelRef<T>> = { [key in DatePartLabelRef]: `${X}_${key}` }[DatePartLabelRef];
type AmountPartRef<T extends SheetRef, X extends ColumnLabelRef<T>> = { [key in AmountPartLabelRef]: `${X}_${key}` }[AmountPartLabelRef];


type LabelMapping<T extends string> =  { [key in T]: string };

type SharedColLabelRef = DatePartLabelRef | AmountPartLabelRef;
type SharedColLabelMapping = LabelMapping<SharedColLabelRef>;

type StationColHeadLabelRef =
    | 'extId' | 'name' | 'typeOfBusiness'
    | 'lat' | 'lon'
    | 'street' | 'streetNo' | 'zip' | 'city' | 'district' | 'state' | 'country'
    | 'addCols';
type StationColHeadLabelMapping = LabelMapping<StationColHeadLabelRef>;

type StationColumnRef = StationColHeadLabelRef;

type DeliveryColHeadLabelRef =
    | 'extId' | 'name' | 'lot'
    | 'source' | 'target'
    | 'dateOut' | 'dateIn' | 'lotAmount' | 'unitAmount'
    | 'addCols'
    | 'deliveryAmount'
    | 'bestBeforeDate' | 'prodDate';
type DeliveryColHeadLabelMapping = LabelMapping<DeliveryColHeadLabelRef>;

// type DeliveryColRef = 'dateInD' | 'dateInM' | 'dateInY';
type DeliveryNestedColRef =
    | DatePartRef<'deliveries', 'dateIn'>
    | DatePartRef<'deliveries','dateOut'>
    | AmountPartRef<'deliveries', 'lotAmount'>
    | AmountPartRef<'deliveries', 'unitAmount'>;

type DeliveryColumnRef = DeliveryColHeadLabelRef | DeliveryNestedColRef; // where are only top cols


type Del2DelColHeadLabelRef =
    | 'from' | 'to';

type Del2DelColumnRef = Del2DelColHeadLabelRef;

export type ColumnLabelRef<T extends SheetRef | 'shared'> =
    T extends 'stations' ? StationColHeadLabelRef :
    T extends 'deliveries' ? DeliveryColHeadLabelRef :
    T extends 'dels2Dels' ? Del2DelColHeadLabelRef :
    T extends 'shared' ? SharedColLabelRef :
    never;

export type ColumnRef<T extends SheetRef>  =
    T extends 'stations' ? StationColumnRef :
    T extends 'deliveries' ? DeliveryColumnRef :
    T extends 'dels2Dels' ? Del2DelColumnRef :
    never;

export type ColumnLabelMapping = {
    [key in LabelGroupRef]: Record<ColumnLabelRef<key>, string>
};

// interface DeliveryColumnLabelMapping {
//     id: string;
//     name: string;
//     lot: string;
//     source: string;
//     target: string;
//     dateOut: string;
//     dateOutD: string;
//     dateOutM: string;
//     dateOutY: string;
//     dateIn: string;
//     dateInD: string;
//     dateInM: string;
//     dateInY: string;
//     lotAmount: string;
//     lotAmountNumber: string;
//     lotAmountUnit: string;
//     unitAmount: string;
//     unitAmountNumber: string;
//     unitAmountUnit: string;
//     // additional columns placeholder
//     addCols: string;
//     // additional columns
//     deliveryAmountNumber: string;
//     deliveryAmountUnit: string;
//     bestBeforeDate: string;
//     prodDate: string;
// }

// interface Dels2DelsColumnMapping {
//     from: string;
//     to: string;
// }

// export type WBColumnMapping = Readonly<{
//     stations: Readonly<StationColumnMapping>;
//     deliveries: Readonly<DeliveryColumnMapping>;
//     dels2Dels: Readonly<Dels2DelsColumnMapping>;
// }>;

// export type ExpPropRef<T extends SheetRefName> = T extends 'stations' ?
//     Exclude<ColumnRef<T>, 'day' | 'month' | 'year'> : ColumnRef<T>;

// export type ExtJsonNames = {
//     [sKey in SheetRefName]: { [cKey in PropRef<sKey>]: string | null }
// };

type Ref2PropKeyMap<T extends SheetRef>
