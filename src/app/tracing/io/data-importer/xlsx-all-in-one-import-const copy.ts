import { ColumnLabelRef, LabelRefGroup, ExtJsonNames, SheetNameMapping, SheetRef, WBColumnMapping } from './xlsx-all-in-one-import-model';

// const ADDITIONAL_FIELDS_COLUMN = 'Additional Fields ->';

// export const expectedColumnConfiguration: { [key in SheetRefName]: (ColumnConf<key> | ColumnGroupConf<key>)[] } = {
//     stations: [
//         { ref: 'id' },
//         { ref: 'name' },
//         { ref: 'street' },
//         { ref: 'streetNo' },
//         { ref: 'zip' },
//         { ref: 'city' },
//         { ref: 'district' },
//         { ref: 'state' },
//         { ref: 'country' },
//         { ref: 'typeOfBusiness' },
//         { ref: 'addCols' }
//     ],
//     deliveries: [
//         { ref: 'id' },
//         { ref: 'source' },
//         { ref: 'name' },
//         { ref: 'lot' },
//         { ref: 'lotAmount', subColumns: [
//             { ref: 'lotAmountNumber' },
//             { ref: 'lotAmountUnit' }
//         ] },
//         { ref: 'dateOut', subColumns: [
//             { ref: 'dateOutD' },
//             { ref: 'dateOutM' },
//             { ref: 'dateOutY' }
//         ] },
//         { ref: 'arrivalDate', subColumns: [
//             { ref: 'arrivalDateDay' },
//             { ref: 'arrivalDateMonth' },
//             { ref: 'arrivalDateYear' }
//         ] },
//         { ref: 'unitAmount', subColumns: [
//             { ref: 'unitAmountNumber' },
//             { ref: 'unitAmountUnit' }
//         ] },
//         { ref: 'target' },
//         { ref: 'addCols' }
//     ],
//     dels2Dels: [
//         { ref: 'from' },
//         { ref: 'to' }
//     ]
// };
type ArrayW2OrMoreElements<T> = [T, T, ...T[]];

type NestedColumnRefs<T> = [T, ArrayW2OrMoreElements<T | NestedColumnRefs<T>>];

type ColumnDef<T extends SheetRef> = ColumnLabelRef<T> |

function createDateColumnConf<T extends SheetRef>(ref: ColumnTopLabelRef<T>): ColumnConf<T> {

}

export const expectedColumns: { [key in SheetRef]: (
    | ColumnRef<key>
    | NestedColumnRefs<ColumnRef<key>>
)[] } = {
    stations: [
        'id',
        'name',
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
        'id',
        'source',
        'name',
        'lot',
        ['lotAmount', [
            'lotAmountNumber',
            'lotAmountUnit'
        ]],
        ['dateOut', [
            'dateOutD',
            'dateOutM',
            'dateOutY'
        ]],
        [ 'dateIn', [
            'dateInD',
            'dateInM',
            'dateInY'
        ]],
        ['unitAmount', [
            'unitAmountNumber',
            'unitAmountUnit'
        ]],
        'target',
        'addCols'
    ],
    dels2Dels: [
        'from',
        'to'
    ]
};

export const sheetNameMapping: Readonly<SheetNameMapping> = {
    stations: 'Stations',
    deliveries: 'Deliveries',
    dels2Dels: 'Deliveries2Deliveries'
};
Object.freeze(sheetNameMapping);

// export const wbColumnMapping: WBColumnMapping = {
//     stations: {
//         id: 'Company_ID',
//         name: 'Name',
//         street: 'Street',
//         streetNo: 'Street Number',
//         zip: 'Postal Code',
//         city: 'City',
//         district: 'District',
//         state: 'State',
//         country: 'Country',
//         typeOfBusiness: 'Type of business',
//         addCols: ADDITIONAL_FIELDS_COLUMN,
//         lat: 'Latitude',
//         lon: 'Longitude'
//     },
//     deliveries: {
//         id: 'DeliveryID',
//         name: 'Product Name',
//         lot: 'Lot Number',
//         source: 'Station',
//         target: 'Recipient',
//         dateOut: 'Delivery Date Departure',
//         dateOutD: 'Day',
//         dateOutM: 'Month',
//         dateOutY: 'Year',
//         dateIn: 'Delivery Date Arrival',
//         dateInD: 'Day',
//         dateInM: 'Month',
//         dateInY: 'Year',
//         lotAmount: 'Lot size',
//         lotAmountNumber: 'Quantity',
//         lotAmountUnit: 'Type / Unit',
//         unitAmount: 'Unit weigt/vol./pck.',
//         unitAmountNumber: 'Quantity',
//         unitAmountUnit: 'Type / Unit',
//         addCols: ADDITIONAL_FIELDS_COLUMN,
//         // additional columns
//         deliveryAmountNumber: 'Delivery_Amount',
//         deliveryAmountUnit: 'Delivery_Unit',
//         bestBeforeDate: 'Best before date',
//         prodDate: 'Production date'
//     },
//     dels2Dels: {
//         from: 'From DeliveryID',
//         to: 'Into DeliveryID'
//     }
// };

export const EXT_COL_NAMES: WBColumnMapping = {
    stations: {
        id: 'Company_ID',
        name: 'Name',
        street: 'Street',
        streetNo: 'Street Number',
        zip: 'Postal Code',
        city: 'City',
        district: 'District',
        state: 'State',
        country: 'Country',
        typeOfBusiness: 'Type of business',
        addCols: ADDITIONAL_FIELDS_COLUMN,
        lat: 'Latitude',
        lon: 'Longitude'
    },
    deliveries: {
        id: 'DeliveryID',
        name: 'Product Name',
        lot: 'Lot Number',
        source: 'Station',
        target: 'Recipient',
        dateOut: 'Delivery Date Departure',
        dateOutD: 'Day',
        dateOutM: 'Month',
        dateOutY: 'Year',
        dateIn: 'Delivery Date Arrival',
        dateInD: 'Day',
        dateInM: 'Month',
        dateInY: 'Year',
        lotAmount: 'Lot size',
        lotAmountNumber: 'Quantity',
        lotAmountUnit: 'Type / Unit',
        unitAmount: 'Unit weigt/vol./pck.',
        unitAmountNumber: 'Quantity',
        unitAmountUnit: 'Type / Unit',
        addCols: ADDITIONAL_FIELDS_COLUMN,
        // additional columns
        deliveryAmountNumber: 'Delivery_Amount',
        deliveryAmountUnit: 'Delivery_Unit',
        bestBeforeDate: 'Best before date',
        prodDate: 'Production date'
    },
    dels2Dels: {
        from: 'From DeliveryID',
        to: 'Into DeliveryID'
    }
};

// export const EXT_JSON_NAMES: Readonly<{
//     [sKey in SheetRefName]: Readonly<Partial<{ [pKey in PropRef<sKey>]: string | null }>>
// }> = {
export const EXT_JSON_NAMES: ExtJsonNames = {
    stations: {
        ...EXT_COL_NAMES
        id: 'ID'
    },
    deliveries: {
        id: 'ID'
    },
    dels2Dels: {
        from: 'from',
        to: 'to'
    }
};
