
import { ColumnLabelMapping, LabelMapping, SheetNameMapping } from './xlsx-all-in-one-import-model';

const ADDITIONAL_FIELDS_COLUMN = 'Additional Fields ->';

const sheetNameMapping: Readonly<SheetNameMapping> = {
    stations: 'Stations',
    deliveries: 'Deliveries',
    dels2Dels: 'Deliveries2Deliveries'
};
Object.freeze(sheetNameMapping);

export const LABEL_MAPPING: LabelMapping = {
    sheets: sheetNameMapping,
    stations: {
        extId: 'Company_ID',
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
        extId: 'DeliveryID',
        name: 'Product Name',
        lotNo: 'Lot Number',
        source: 'Station',
        target: 'Recipient',
        dateOut: 'Delivery Date Departure',
        dateIn: 'Delivery Date Arrival',
        lotAmount: 'Lot size',
        unitAmount: 'Unit weigt/vol./pck.',
        addCols: ADDITIONAL_FIELDS_COLUMN,
        // additional columns
        delAmountQuantity: 'Delivery_Amount',
        delAmountUnit: 'Delivery_Unit',
        itemNumber: 'Item Number',
        subUnits: 'Subunits',
        bestBeforeDate: 'Best before date',
        productionTreatment: 'Treatment of product during production',
        sampling: 'Sampling',
        value: 'Value',
        prodDate: 'Production date',
        indicator: 'Indicator'
    },
    dels2Dels: {
        from: 'From DeliveryID',
        to: 'Into DeliveryID'
    },
    shared: {
        day: 'Day',
        month: 'Month',
        year: 'Year',
        quantity: 'Quantity',
        unit: 'Type / Unit'
    }
};
