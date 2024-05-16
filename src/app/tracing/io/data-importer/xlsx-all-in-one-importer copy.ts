import { DeliveryStoreData, FclData, PropertyEntry, StationStoreData } from '@app/tracing/data.model';
import { createInitialFclDataState } from '@app/tracing/state/tracing.reducers';
import { expectedColumnConfiguration, sheetNameMapping, wbColumnMapping } from './xlsx-all-in-one-import-const';
import { ColumnsConfiguration, SheetRefName, WBColumnMapping } from './xlsx-all-in-one-import-model';
import { readExcelFile } from './xlsx-importer';
import { ColumnTree, Row as WSRow, Worksheet} from './xlsx-model';

// const REQUIRED_INT_SHEET_NAMES: IntSheetName[] = ['stations'];
// const internal_sheet_names = Object.keys(sheetNameMapping) as IntSheetName[];

// function getIntSheetName(extSheetName: string, sheetNameMapping: SheetNameMapping): IntSheetName | undefined {
//     return internal_sheet_names.find(intName => sheetNameMapping[intName] === extSheetName);
// }

type ColumnRefs<T extends SheetRefName> = keyof WBColumnMapping[T];
// type StationColumnRefs = ColumnRefs<'stations'>;
// type DeliveryColumnRefs = ColumnRefs<'deliveries'>;
type Ref2Index<T extends SheetRefName> = Partial<Record<ColumnRefs<T>, number>>;


class PropAccessor<T extends SheetRefName>{
    constructor(
        private ref2Column: Record<ColumnRefs<T>, ColumnTree>,
        private columnMapping: Record<ColumnRefs<T>, string>) {
    }

    popValue<
        M extends boolean,
        X extends 'string' | 'number' | 'boolean',
        Y extends(X extends 'string' ? string : X extends 'number' ? number : boolean),
        R extends(M extends true ? Y: Y | undefined)
    >(row: WSRow, key: ColumnRefs<T>, reqType: X, required: M): R {
        const column = this.ref2Column[key];
        if (column === undefined) {
            if (required === true) {
                throw new Error(`Column ${this.columnMapping[key]} is missing.`);
            } else {
                return undefined as R;
            }
        }
        const value = row[column.index];
        if (value === undefined) {
            if (required === true) {
                throw new Error(`Value in column ${column.letter} is missing.`);
            } else {
                return undefined as R;
            }
        }

        delete row[column.index];
        const obsType = typeof value;
        if (obsType === reqType) {
            return value as R;
        } else if (reqType === 'string') {
            return `${value}` as R;
        } else {
            throw new Error(`Value in column '${column.letter}' is not of type '${reqType}'.`)
        }
    }

    popString<
        M extends boolean,
        R extends(M extends true ? string: string | undefined)
    >(row: WSRow, key: ColumnRefs<T>, required: M): R {
        return this.popValue(row, key, 'string', required);
    }

    popNumber<
        M extends boolean,
        R extends(M extends true ? number: number | undefined)
    >(row: WSRow, key: ColumnRefs<T>, required: M): R {
        return this.popValue(row, key, 'number', required);
    }
}

function createStation(
    row: IntRow,
    idSet: Set<string>,
    propAccessor: PropAccessor<'stations'>
    // colRef2ColIndex: Ref2Index<'stations'>
): StationStoreData {
    const columnMapping = wbColumnMapping['stations'];
    const station: StationStoreData = {
        id: propAccessor.popString(row, 'id', true),
        name: propAccessor.popString(row, 'name', false),
        incoming: [],
        outgoing: [],
        connections: [],
        properties: []
    };
    if (idSet.has(station.id)) {
        throw new Error(`The ${columnMapping.id} '${station.id}' is not unique.`);
    }
    idSet.add(station.id);
    return station;
}

function createDatePart(x: number | undefined, length: number): string {
    return x === undefined ? '?'.repeat(length) : String(x).padStart(length, '0');
}

function createDate(year: number | undefined, month: number | undefined, day: number | undefined): string | undefined {
    const strMonth = createDatePart(month, 2);
    const strYear = createDatePart(year, 4);
    return day !== undefined ? `${strYear}-${strMonth}-${createDatePart(day, 2)}` :
        month !== undefined ? `${strYear}-${strMonth}` :
            year !== undefined ? strYear :
                undefined;
}

function addProperties<T extends SheetRefName>(element: { properties: PropertyEntry[] }, row: WSRow): void {
    const indices = Object.keys(row).map(Number) as (keyof WSRow)[];

}

function createDelivery(
    row: WSRow,
    idSet: Set<string>,
    stationIdSet: Set<string>,
    propAccessor: PropAccessor<'deliveries'>
): DeliveryStoreData {
    const columnMapping = wbColumnMapping['deliveries'];

    const delivery: DeliveryStoreData = {
        id: propAccessor.popString(row, 'id', true),
        name: propAccessor.popString(row, 'name', false),
        source: propAccessor.popString(row, 'source', true),
        target: propAccessor.popString(row, 'target', true),
        dateOut: createDate(
            propAccessor.popNumber(row, 'departureDateYear', false),
            propAccessor.popNumber(row, 'departureDateMonth', false),
            propAccessor.popNumber(row, 'departureDateDay', false)
        ),
        dateIn: createDate(
            propAccessor.popNumber(row, 'arrivalDateYear', false),
            propAccessor.popNumber(row, 'arrivalDateMonth', false),
            propAccessor.popNumber(row, 'arrivalDateDay', false),
        ),
        lot: propAccessor.popString(row, 'lot', false),
        properties: []
    };

    if (idSet.has(delivery.id)) {
        throw new Error(`The ${columnMapping.id} '${delivery.id}' is not unique.`);
    }
    if (!stationIdSet.has(delivery.source)) {
        throw new Error(`The value '${delivery.source}' in column '${columnMapping.source}' refers to an unknown station.`);
    }
    if (!stationIdSet.has(delivery.target)) {
        throw new Error(`The value '${delivery.target}' in column '${columnMapping.target}' refers to an unknown station.`);
    }
    idSet.add(delivery.id);
    return delivery;
}

function isColumnGroup(conf: any): conf is { subColumns: unknown[] } {
    return (conf as any).subColumns !== undefined;
}

function getColRef2ColIndexMapping<T extends SheetRefName>(
    obsColumns: Worksheet['columns'],
    expColumns: ColumnsConfiguration<T>,
    columnMapping: Record<ColumnRefs<T>, string>
): Partial<Record<ColumnRefs<T>, number>> {
    const extColName2ColConf: Record<string,Worksheet['columns'][0]> = {};
    let colRef2ColIndex: Partial<Record<ColumnRefs<T>, number>> = {};
    obsColumns.forEach(c => {
        if (c.name !== undefined) {
            extColName2ColConf[c.name] = c;
        }
    });
    for (const expColumn of expColumns) {
        const obsColumn = extColName2ColConf[columnMapping[expColumn.ref]];
        if (obsColumn) {
            if (isColumnGroup(obsColumn) && isColumnGroup(expColumn)) {
                colRef2ColIndex = {
                    ...colRef2ColIndex,
                    ...getColRef2ColIndexMapping(obsColumn.subColumns, expColumn.subColumns, columnMapping)
                };
            } else {
                colRef2ColIndex[expColumn.ref] = obsColumn.index;
            }
            colRef2ColIndex[expColumn.ref] = obsColumn.index;
        }
    }
    return colRef2ColIndex;
}

export async function importAllInOneTemplate(file: File): Promise<FclData> {

    const intWB = await readExcelFile(
        file
        // ,
        // {
        //     mandatorySheets: ['stations'],
        //     filterSheets: ['stations', 'deliveries', 'dels2Dels']
        // }
    );

    const stationsWS = intWB.sheets[sheetNameMapping['stations']];
    const deliveriesWS = intWB.sheets[sheetNameMapping['deliveries']];
    const dels2DelsWS = intWB.sheets[sheetNameMapping['dels2Dels']];
    const stationIdSet = new Set<string>();
    const deliveryIdSet = new Set<string>();

    const stationColRefs2ColIndex = getColRef2ColIndexMapping(
        stationsWS.columns,
        expectedColumnConfiguration.stations,
        wbColumnMapping.stations
    );
    const stations = stationsWS.rows.map((row, rowIndex) => {
        try {
            return createStation(row, stationIdSet, stationColRefs2ColIndex);
        } catch (ex) {
            throw new Error(`The station in row ${rowIndex + 2} in sheet '${stationsWS.name}' could not be imported. ${ex.message}`);
        }
    });

    const deliveryColRefs2ColIndex = getColRef2ColIndexMapping(
        deliveriesWS.columns,
        expectedColumnConfiguration.deliveries,
        wbColumnMapping.deliveries
    );
    const deliveries = deliveriesWS.rows.map((row, rowIndex) => {
        try {
            return createDelivery(row, deliveryIdSet, stationIdSet, deliveryColRefs2ColIndex);
        } catch (ex) {
            throw new Error(`The delivery in row ${rowIndex + 2} in sheet '${deliveriesWS.name}' could not be imported. ${ex.message}`);
        }
    });

    const fclData = createInitialFclDataState();
    return fclData;
    // return {
    //     stations: [],
    //     deliveries: [],
    //     samples: []
    // };
    // if (stationsWS.rows.length === 0) {
    //     throw new Error(`Sheet '${sheetNameMapping['stations']}' does not contain any station.`);
    // }

}
