import { ColumnLabelRef, ExtJsonNames, HeaderConf, SheetNameMapping, SheetRef } from './xlsx-all-in-one-import-model';

export const GeneratedIdPropRef = 'genId';
export const SHEET_REFS: SheetRef[] = ['stations', 'deliveries', 'dels2Dels'];

function createDateColumnConf<T extends SheetRef>(ref: ColumnLabelRef<T>): HeaderConf<T> {
    return [ref, ['day','month','year']];
}

function createAmountColumnConf<T extends SheetRef>(ref: ColumnLabelRef<T>): HeaderConf<T> {
    return [ref, ['quantity', 'unit']];
}

export const expectedColumns: { [key in SheetRef]: HeaderConf<key>[] } = {
    stations: [
        'extId',
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
        'extId',
        'source',
        'name',
        'lot',
        createAmountColumnConf<'deliveries'>('lotAmount'),
        createDateColumnConf<'deliveries'>('dateOut'),
        createDateColumnConf<'deliveries'>('dateIn'),
        createAmountColumnConf<'deliveries'>('unitAmount'),
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
