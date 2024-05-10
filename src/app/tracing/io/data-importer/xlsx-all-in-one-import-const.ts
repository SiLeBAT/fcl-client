import { ColumnConf, ColumnGroupConf, SheetNameMapping, SheetRefName, WBColumnMapping } from './xlsx-all-in-one-import-model';

const ADDITIONAL_FIELDS_COLUMN = 'Additional Fields ->';

export const expectedColumnConfiguration: { [key in SheetRefName]: (ColumnConf<key> | ColumnGroupConf<key>)[] } = {
    stations: [
        { ref: 'id' },
        { ref: 'name' },
        { ref: 'street' },
        { ref: 'streetNo' },
        { ref: 'zip' },
        { ref: 'city' },
        { ref: 'district' },
        { ref: 'state' },
        { ref: 'country' },
        { ref: 'typeOfBusiness' },
        { ref: 'addCols' }
    ],
    deliveries: [
        { ref: 'id' },
        { ref: 'source' },
        { ref: 'name' },
        { ref: 'lot' },
        { ref: 'lotAmount', subColumns: [
            { ref: 'lotAmountNumber' },
            { ref: 'lotAmountUnit' }
        ] },
        { ref: 'departureDate', subColumns: [
            { ref: 'departureDateDay' },
            { ref: 'departureDateMonth' },
            { ref: 'departureDateYear' }
        ] },
        { ref: 'arrivalDate', subColumns: [
            { ref: 'arrivalDateDay' },
            { ref: 'arrivalDateMonth' },
            { ref: 'arrivalDateYear' }
        ] },
        { ref: 'unitAmount', subColumns: [
            { ref: 'unitAmountNumber' },
            { ref: 'unitAmountUnit' }
        ] },
        { ref: 'target' },
        { ref: 'addCols' }
    ],
    dels2Dels: [
        { ref: 'from' },
        { ref: 'to' }
    ]
};

export const sheetNameMapping: Readonly<SheetNameMapping> = {
    stations: 'Stations',
    deliveries: 'Deliveries',
    dels2Dels: 'Deliveries2Deliveries'
};
Object.freeze(sheetNameMapping);

export const wbColumnMapping: WBColumnMapping = {
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
        departureDate: 'Delivery Date Departure',
        departureDateDay: 'Day',
        departureDateMonth: 'Month',
        departureDateYear: 'Year',
        arrivalDate: 'Delivery Date Arrival',
        arrivalDateDay: 'Day',
        arrivalDateMonth: 'Month',
        arrivalDateYear: 'Year',
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
