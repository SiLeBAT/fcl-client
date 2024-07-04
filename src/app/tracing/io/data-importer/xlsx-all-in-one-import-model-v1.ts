import { ArrayWith2OrMoreElements, NonEmptyArray } from '@app/tracing/util/utility-types';

// type Tmp = (keyof typeof ESheetRef) & string;


type CrossType<X extends string, Y extends string> = { [xKey in X]: { [yKey in Y]: `${xKey}_${yKey}` }[Y]}[X];
type MyExclude<X, Y extends X> = Exclude<X, Y>;
type MyExtract<X, Y extends X> = Extract<X, Y>;

// export type GeneratedIdPropRef = 'genId';

export const DEL_DATE_IN = 'dateIn';
type DelDateIn = typeof DEL_DATE_IN;

type StationSheetRef = 'stations';
type DeliverySheetRef = 'deliveries';
type Del2DelSheetRef = 'dels2Dels';

type SheetLabelGroupRef = 'sheets';

type SubColLabelGroupRef = 'shared';
type SharedLabelGroupRef = 'shared';

export type SheetRef = StationSheetRef | DeliverySheetRef | Del2DelSheetRef;
export type LabelGroupRef = SheetRef | SubColLabelGroupRef | SheetLabelGroupRef;
export type SheetNameMapping = Record<SheetRef, string>;

// export type HeaderConf<T extends SheetRef> =
//     | ColumnLabelRef<T>
//     | [ColumnLabelRef<T>, ArrayWith2OrMoreElements<ColumnLabelRef<SubColLabelGroupRef>>];
export type HeaderConf<T extends SheetRef> =
    | LabelRef<T>
    | [LabelRef<T>, ArrayWith2OrMoreElements<LabelRef<SubColLabelGroupRef>>];

type DatePartColRef = 'day' | 'month' | 'year';
type AmountPartColRef = 'quantity' | 'unit';

type SubColRef = DatePartColRef | AmountPartColRef;

type RequiredStationRootColRef =
    | 'extId' | 'name' | 'typeOfBusiness'
    | 'street' | 'streetNo' | 'zip' | 'city' | 'district' | 'state' | 'country'
    | 'addCols';
export type AdditionalStationRootColRef =
    | 'lat' | 'lon';

type StationRootColRef = RequiredStationRootColRef | AdditionalStationRootColRef;

type StationColumnRef = StationRootColRef;
// type OtherStationPropRef = GeneratedIdPropRef | 'address';

type RequiredDeliveryRootColRef =
    | 'extId' | 'name' | 'lotNo'
    | 'source' | 'target'
    | 'dateOut' | 'dateIn' | 'lotAmount' | 'unitAmount'
    | 'addCols';

export type AdditionalDeliveryRootColRef =
    | 'delAmountQuantity' | 'delAmountUnit'
    | 'itemNumber' | 'subUnits'
    | 'bestBeforeDate'
    | 'productionTreatment'
    | 'sampling'
    | 'value'
    | 'prodDate'
    | 'indicator';

type DeliveryRootColRef = RequiredDeliveryRootColRef | AdditionalDeliveryRootColRef;
type NestedDeliveryRootColRef = MyExtract<DeliveryRootColRef, 'dateOut' | 'dateIn' | 'lotAmount' | 'unitAmount'>;

type DeliverySubColRef =
    | CrossType<MyExtract<NestedDeliveryRootColRef, 'dateIn' | 'dateOut'>, DatePartColRef>
    | CrossType<MyExtract<NestedDeliveryRootColRef, 'lotAmount' | 'unitAmount'>, AmountPartColRef>
    ;


type DeliveryColumnRef = MyExclude<DeliveryRootColRef | DeliverySubColRef, NestedDeliveryRootColRef>;
// type RequiredDeliveryColumnRef = MyExclude<DeliveryColumnRef, 'deliveryAmount' | 'bestBeforeDate' | 'prodDate'>;
// type OtherDeliveryPropRef = GeneratedIdPropRef;

type Del2DelRootColRef =
    | 'from' | 'to';

type Del2DelColumnRef = Del2DelRootColRef;

// export type ColumnLabelRef<T extends SheetRef | 'shared'> =
//     T extends 'stations' ? StationRootColRef :
//     T extends 'deliveries' ? DeliveryRootColRef :
//     T extends 'dels2Dels' ? Del2DelRootColRef :
//     T extends 'shared' ? SubColRef :
//     never;
export type LabelRef<T extends LabelGroupRef> =
    T extends 'stations' ? StationRootColRef :
    T extends 'deliveries' ? DeliveryRootColRef :
    T extends 'dels2Dels' ? Del2DelRootColRef :
    T extends 'shared' ? SubColRef :
    T extends 'sheets' ? SheetRef :
    never;

export type ColumnRef<T extends SheetRef>  =
    T extends 'stations' ? StationColumnRef :
    T extends 'deliveries' ? DeliveryColumnRef :
    T extends 'dels2Dels' ? Del2DelColumnRef :
    never;

// export type ColumnLabelMapping = {
//     [key in LabelGroupRef]: Record<ColumnLabelRef<key>, string>
// };

type PropRefRecord<ColRef extends string, AdditionalRootColRef extends string> = //, OtherPropRef extends string> =
        Record<Exclude<ColRef, AdditionalRootColRef>, number> &
        Partial<Record<AdditionalRootColRef, number>>;
        // Record<OtherPropRef, OtherPropRef>;

export type PropRefs<T extends SheetRef> =
    T extends 'stations' ? PropRefRecord<StationColumnRef, AdditionalStationRootColRef> : // , OtherStationPropRef> :
    T extends 'deliveries' ?  PropRefRecord<DeliveryColumnRef, AdditionalDeliveryRootColRef> : //, OtherDeliveryPropRef> :
    T extends 'dels2Dels' ? Record<Del2DelColumnRef, number> :
    never;

export type ColumnRefs<T extends SheetRef> = PropRefs<T>;

// export type LabelMapping = {
//     sheets: SheetNameMapping;
// } & ColumnLabelMapping;
export type LabelGroupMapping<T extends LabelGroupRef> = Record<LabelRef<T>, string>;
export type LabelMapping = { [T in LabelGroupRef]: LabelGroupMapping<T> };

export type ColumnLabel = string | [string, ArrayWith2OrMoreElements<ColumnLabel>];

export type LocalizedHeaderConf = string | [string, NonEmptyArray<LocalizedHeaderConf>];


type AdditionalColRef<T extends SheetRef> = T extends StationSheetRef ? AdditionalStationRootColRef :
    T extends DeliverySheetRef ? AdditionalDeliveryRootColRef : never;

export type ColumnIndices<T extends SheetRef> = Record<Exclude<ColumnRef<T>,AdditionalColRef<T>>, number> & Record<AdditionalColRef<T>, number | undefined>;
