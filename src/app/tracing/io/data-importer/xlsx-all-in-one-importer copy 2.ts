import { NonEmptyArray, PartialPick } from '@app/tracing/util/utility-types';
import { ColumnProperty, DataTable, JsonData } from '../ext-data-model.v1';
import { expectedColumnHeaders, EXT_COL_NAMES, sheetNameMapping } from './xlsx-all-in-one-import-const';
import { ColumnRef, ColumnsConfiguration, SheetRefName, WBColumnMapping } from './xlsx-all-in-one-import-model';
import { readExcelFile } from './xlsx-importer-v0';
import { ColumnHeader, Row as WSRow, Worksheet} from './xlsx-model';
import * as crypto from 'crypto';
import { concat } from '@app/tracing/util/non-ui-utils';

// type ColumnRefs<T extends SheetRefName> = keyof WBColumnMapping[T];
// type Ref2Index<T extends SheetRefName> = Partial<Record<ColumnRefs<T>, number>>;
type ExtId = string;
type NewId = string;
type TorNonEmptyArrOfT<T> = T | NonEmptyArray<T>;

interface Property {
    id: string;
    name: string;
    type: string;
};

type AllInOneSheets = Record<SheetRefName, Worksheet>;
type ExtAllInOneSheets = { [key in SheetRefName]: ExtendedWorksheet<key> };


interface ExtendedWorksheet<T extends SheetRefName> extends Worksheet {
    cId2ColumnMap: Map<string, ColumnHeader>;
    cId2Ref: Map<string, string>;
    ref2ColumnMap: Map<ColumnRef<T>, ColumnHeader>;
    properties: Property[];
    id2Property: Map<string, Property>;
}

class PropAccessor<T extends SheetRefName>{
    constructor(
        private ref2ColHeader: Record<ColumnRefs<T>, ColumnHeader>,
        private columnMapping: Record<ColumnRefs<T>, string>) {
    }

    popValue<
        M extends boolean,
        X extends 'string' | 'number' | 'boolean',
        Y extends(X extends 'string' ? string : X extends 'number' ? number : boolean),
        R extends(M extends true ? Y: Y | undefined)
    >(row: WSRow, key: ColumnRefs<T>, reqType: X, required: M): R {
        const colHeader = this.ref2ColHeader[key];
        if (colHeader === undefined) {
            if (required === true) {
                throw new Error(`Column ${this.columnMapping[key]} is missing.`);
            } else {
                return undefined as R;
            }
        }
        const value = row[colHeader.columnIndex];
        if (value === undefined) {
            if (required === true) {
                throw new Error(`Value in column ${colHeader.columnLetter} is missing.`);
            } else {
                return undefined as R;
            }
        }

        delete row[colHeader.columnIndex];
        const obsType = typeof value;
        if (obsType === reqType) {
            return value as R;
        } else if (reqType === 'string') {
            return `${value}` as R;
        } else {
            throw new Error(`Value in column '${colHeader.columnLetter}' is not of type '${reqType}'.`);
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


function hashCode(text: string): number {
    let h = 0;
    const l = text.length;
    let i = 0;
    if (l > 0) {
        while (i < l) {
            // eslint-disable-next-line no-bitwise
            h = (h << 5) - h + text.charCodeAt(i++) | 0;
        }
    }
    return h;
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

function getColRef2ColIndexMap<T extends SheetRefName>(
    obsColHeaders: ColumnHeader[],
    expColumns: ColumnsConfiguration<T>,
    columnMapping: Record<ColumnRef<T>, string>
): Partial<Record<ColumnRef<T>, number>> {
    const extLabel2ColHeader: Record<string, ColumnHeader> = {};
    let colRef2ColIndex: Partial<Record<ColumnRefs<T>, number>> = {};
    obsColHeaders.forEach(h => {
        if (h.label !== undefined) {
            extLabel2ColHeader[h.label] = h;
        }
    });
    for (const expColumn of expColumns) {
        const obsColumn = extLabel2ColHeader[columnMapping[expColumn.ref]];
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

function getColRef2ColHeaderMap<T extends SheetRefName>(
    obsColHeaders: ColumnHeader[],
    expColumns: ColumnsConfiguration<T>,
    columnMapping: Record<ColumnRefs<T>, string>
): Partial<Record<ColumnRefs<T>, ColumnHeader>> {
    // const extColName2ColConf: Record<string,Worksheet['columns'][0]> = {};
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

// function createColRef2IndexMapping<T extends SheetRefName>(col: Re )

function mapHeaderLeaves2Names(columnHeaders: ColumnHeader[], prefix?: string): string[] {
    return columnHeaders.reduce((pV, cV, cI, arr) => {
        const label = `${prefix ?? ''}${cV.label}}`;
        if (cV.children) {
            pV.concat(mapHeaderLeaves2Names(cV.children, label));
        } else {
            pV.push(label);
        }
        return pV;
    }, [] as string[]);
}

function createDefaultMapping(ws: Worksheet): Record<number, string> {
    const labels = mapHeaderLeaves2Names(ws.columnHeaders);
    const map: Record<number, string> = {};
    labels.forEach((label, index) => map[index + 1] = label);
    return map;
}

function createStationMapping(ws: Worksheet): Record<number, string> {
    const map = createDefaultMapping(ws);

    return map;
}

function createMapping(colHeaders: ColumnHeader[]): Record<number, string> {}


function createPropNameMap(ws: Worksheet): void {

}

function convertWS2ExtTable(ws: Worksheet): DataTable {
    const table: DataTable = {
        columnProperties: [],
        data: []
    };

    throw new Error(`not fully implemented yet!`);
    return table;
}
// function getColRef2IdMap(obsColHeaders: ColumnHeader[], extColNames: )
function getColumn<T extends SheetRefName>(
    obsColumns: ColumnHeader[],
    key: ColumnRef<T> | NonEmptyArray<ColumnRef<T>>,
    ref2ColName: Record<ColumnRef<T>, string>
): ColumnHeader | undefined {
    const keyArray = Array.isArray(key) ? key : [key];
    const firstKey = keyArray[0];
    const label = ref2ColName[firstKey];
    const column = obsColumns.filter(c => c.label === label).pop();
    if (column) {
        const subKey = keyArray.slice(1) as NonEmptyArray<ColumnRef<T>>;
        if (subKey.length > 0) {
            if (!column.children) {
                // column does not contain sub columns
                return undefined;
            } else {
                return getColumn(column.children, subKey, ref2ColName);
            }
        } else {
            return column;
        }
    } else {
        return undefined;
    }
}
//function createFKCheck<T extends SheetRefName, V>(ref: ColumnRef<T>, valueSet: Set<V>, violationMsgFun: (value: ))
function validateStationsInput(ws: ExtendedWorksheet<'stations'>): void {
    // refs
    // const extIdCol = getColumn<'stations'>(ws.columnHeaders, 'extId', extColNames)!;
    const extIdCol = ws.ref2ColumnMap.get('extId')!;
    const idSet = new Set<string>();
    ws.rows.forEach((row, rowIndex) => {
        const extId = row[extIdCol.id];
        if (!idSet.has(extId)) {
            throw new Error(
                `The station '${extId}' is not unique.`
            );
        }
    });
}

function postprocessStationsInput(ws: ExtendedWorksheet<'stations'>): void {
    // createNewId
    const hashRefs: ColumnRef<'stations'>[] = [];
    const hashCIds = hashRefs.map(ref => ws.ref2ColumnMap.get(ref)!.id);
    const latCol = ws.ref2ColumnMap.get('lat');
    const lonCol = ws.ref2ColumnMap.get('lon');
    const newIdSet = new Set<string>();
    ws.rows.forEach((row, rowIndex) => {

        const hashValues = hashCIds.map(cId => row[cId]);
        // hashcode
        const newId = `${hashCode(JSON.stringify(hashValues))}`;
        if (newIdSet.has(newId)) {
            const oldId = ws.ref2ColumnMap.get('extId')!.id;
            throw new Error(
                `Generated id '${newId}' for station with id '${oldId}' is not unique.`
            );
        }
    });
}


function validateDeliveriesInput(ws: ExtendedWorksheet<'deliveries'>, id2StatMap: Map<string, string>): void {
    // refs
    // const colRef2Id = new Map<string, string>();
    // validate fk references
    // const ref2Prop: Record<ColumnRef<'deliveries'>, string> = {};
    // const sourceCol = getColumn<'deliveries'>(ws.columnHeaders, 'source', extColNames)!;
    // const targetCol = getColumn<'deliveries'>(ws.columnHeaders, 'target', extColNames)!;
    const sourceCol = ws.ref2ColumnMap.get('source')!;
    const targetCol = ws.ref2ColumnMap.get('source')!;
    ws.rows.forEach((row, rowIndex) => {
        const sourceId = row[sourceCol.id];
        if (!id2StatMap.has(sourceId)) {
            throw new Error(
                `The value '${sourceId}' in delivery '${sourceCol.columnLetter}' is not a listed...`
            );
        }
        const targetId = row[targetCol.id];
        if (!id2StatMap.has(row[targetCol.id])) {
            throw new Error(
                `The value '${targetId}' in column '${targetCol.columnLetter}' is not a listed...`
            );
        }
    });
}

function postprocessDeliveriesInput(ws: ExtendedWorksheet, id2StatMap: Map<string, string>): void {
    // createNewId
    ws.rows.forEach((row, rowIndex) => {
        if (!extStatIds.has(row[sourceCol.id])) {
            throw new Error(
                `The value '${row[sourceCol.id]}' in column '${sourceCol.columnLetter}' is not a listed...`
            );
        }
        if (!extStatIds.has(row[targetCol.id])) {
            throw new Error(
                `The value '${row[targetCol.id]}' in column '${targetCol.columnLetter}' is not a listed...`
            );
        }
        setValue
    });
}

function reassignIds(ws: ExtendedWorksheet): void {

}

function getLinearColumns(columns: ColumnHeader[]): ColumnHeader[] {
    const linearColumns = columns.map(c => c.children ? [c].concat(getLinearColumns(c.children)) : [c]);
    return concat(...linearColumns);
}

function getLeaveColumns(columns: ColumnHeader[]): ColumnHeader[] {
    const leaveColumns = columns.map(c => c.children ? getLeaveColumns(c.children) : [c]);
    return concat(...leaveColumns);
}

function getColumnLabel(column: ColumnHeader): string[] {
    const label = column.parent ? getColumnLabel(column.parent).concat(column.label!) : [column.label!];
    return label;
}

function createExtendedWS(importedSheets: AllInOneSheets, extColNames: WBColumnMapping): ExtAllInOneSheets {
    const entries = Object.entries(importedSheets) as [SheetRefName, Worksheet][];
    const extEntries = entries.map(([key , ws]) => {
        const leaveColumns = getLeaveColumns(ws.columnHeaders);
        const linearColumns = getLinearColumns(ws.columnHeaders);
        const properties: PartialPick<Property, 'type'>[] = leaveColumns.map(c => ({ id: c.id, name: getColumnLabel(c).join('_') }));
        const addColsIndex = leaveColumns.findIndex(c => c.id === 'addCols');
        if (addColsIndex >= 0) {
            for (let i = addColsIndex + 1; i < properties.length; i++) {
                properties[i].name = `_${properties[i].name}`;
            }
        }
        const extWS: ExtendedWorksheet = {
            ...ws,
            ref2Column
        }
    });
}
// function convert2ColumnEntries()

export async function importAllInOneTemplate(file: File): Promise<JsonData> {

    const intWB = await readExcelFile(
        file
        // ,
        // {
        //     mandatorySheets: ['stations'],
        //     filterSheets: ['stations', 'deliveries', 'dels2Dels']
        // }
    );

    const importedWSs: AllInOneSheets = {
        stations: intWB.sheets[sheetNameMapping.stations],
        deliveries: intWB.sheets[sheetNameMapping.deliveries],
        dels2Dels: intWB.sheets[sheetNameMapping.dels2Dels]
    };
    // const extendedWSs: ExtAllInOneSheets = {
    //     stations: extendWS,
    //     deliveries: intWB.sheets[sheetNameMapping.deliveries],
    //     dels2Dels: intWB.sheets[sheetNameMapping.dels2Dels]
    // }

    // const stationsWS = intWB.sheets[sheetNameMapping.stations];
    // const deliveriesWS = intWB.sheets[sheetNameMapping.deliveries];
    // const dels2DelsWS = intWB.sheets[sheetNameMapping.dels2Dels];
    validateDeliveriesInput(deliveriesWS);
    postprocessDeliveriesInput(deliveriesWS);

    const stationsTable = convertWS2ExtTable(
        stationsWS,
        [addUniqKey]
    );
    const deliveriesTable = convertWS2ExtTable(
        deliveriesWS);
    const dels2DelsTable = convertWS2ExtTable(dels2DelsWS);

    const jsonData: JsonData = {
        version: '',
        data: {
            version: '',
            stations: stationsTable,
            deliveries: deliveriesTable,
            deliveryRelations: dels2DelsTable
        }
    };
    return jsonData;
}
