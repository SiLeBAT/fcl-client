import { DataTable, JsonData } from '../ext-data-model.v1';
import { expectedColumns, sheetNameMapping, SHEET_REFS } from './xlsx-all-in-one-import-const';
import { ColumnLabelMapping, ColumnLabelRef, ColumnRef, LabelGroupRef, LabelMapping, SheetRef, HeaderConf as RefHeaderConf } from './xlsx-all-in-one-import-model';
import { Options, readExcelFile, XlsxImporter } from './xlsx-importer';
import { ColumnHeader, HeaderConf, Row as WSRow, Worksheet} from './xlsx-model';
import { concat } from '@app/tracing/util/non-ui-utils';
import { LABEL_MAPPING } from './xlsx-all-in-one-import-const-en';
import * as Excel from 'exceljs';



interface TableColumn {
    id: string;
    name: string;
}

type TableRow = Record<string, number | string | boolean>;
interface Table {
    columns: TableColumn[];
    row: TableRow[];
}

interface DeliveryRow {
    id: string;
    source: string;
    target: string;
    productName?: string;
    lotNo?: string;
    dateIn?: string;
    dateOut?: string;
    addProps: Record<string, number | string | boolean>;
}
interface Property {
    id: string;
    name: string;
    type: string;
}

type AllInOneSheets = Record<SheetRef, Worksheet>;

function getPropValue<
    M extends boolean,
    X extends 'string' | 'number' | 'boolean',
    Y extends(X extends 'string' ? string : X extends 'number' ? number : boolean),
    R extends(M extends true ? Y: Y | undefined)
>(row: WSRow, index: string | number, reqType: X, required?: M): R {
    const value = row[index];
    if (value === undefined) {
        if (required === true) {
            throw new Error(`Value in column ${index} is missing.`);
        } else {
            return undefined as R;
        }
    }

    const obsType = typeof value;
    if (obsType === reqType) {
        return value as R;
    // } else if (reqType === 'string') {
    //     return `${value}` as R;
    } else {
        throw new Error(`Value in column '${index}' is not of type '${reqType}'.`);
    }
}

function getStringValue<
    M extends boolean,
    R extends(M extends true ? string: string | undefined)
>(row: WSRow, index: number | string, required?: M): R {
    return this.popValue(row, index, 'string', required);
}

function getNumberValue<
    M extends boolean,
    R extends(M extends true ? number: number | undefined)
>(row: WSRow, index: number | string, required?: M): R {
    return getPropValue(row, index, 'number', required);
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

function createEmptyDataTable(): DataTable {
    return {
        columnProperties: [],
        data: []
    };
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

export async function importAllInOneTemplate(file: File): Promise<JsonData> {
    const importer = new AllInOneImporter();
    return importer.importTemplate(file);
}

function createRevRecord<X extends string, Y extends string>(record: Record<X, Y>): Record<Y, X> {
    const revRecord: Record<Y, X> = Object.fromEntries(Object.entries(record).map(([x, y]) => [y, x]));
    return revRecord;
}

function createColumnRef<T extends SheetRef>(ref: ColumnLabelRef<T>, subRefs: ColumnLabelRef<'shared'>[]): ColumnRef<T> {
    return [ref,...subRefs].join('.') as ColumnRef<T>;
}

function createColumnRef2RowKeyMap<T extends SheetRef>(
    leaveColumns: ColumnHeader[],
    revSheetColumnLabelMapping: Record<string, ColumnLabelRef<T>>,
    revSharedLabelMapping: Record<string, ColumnLabelRef<'shared'>>
): Record<ColumnRef<T>, number> {
    const ref2RowKeyMap: Partial<Record<ColumnRef<T>, number>> = {};
    leaveColumns.forEach(c => {
        const label = getColumnLabel(c);
        const headRef = revSheetColumnLabelMapping[c.label ?? ''];
        const subRefs = label.slice(1).map(x => revSharedLabelMapping[x]);
        if (headRef !== undefined && subRefs.every(r => r !== undefined)) {
            const columnRef = createColumnRef(headRef, subRefs);
            ref2RowKeyMap[columnRef] = c.columnIndex;
        }
    });
    return ref2RowKeyMap as Record<ColumnRef<T>, number>;
}

function createLocalizedHeaderConf(labelMapping: LabelMapping): Record<string, HeaderConf[]> {
    const locColumnHeader: Record<string, HeaderConf[]> = {};
    for (const sheetRef of SHEET_REFS) {
        locColumnHeader[labelMapping.sheets[sheetRef]] = expectedColumns[sheetRef].map(
            (hC: RefHeaderConf<SheetRef>) => typeof hC === 'string' ?
                labelMapping[sheetRef][hC] :
                [labelMapping[sheetRef][hC[0]], hC[1].map(k => labelMapping.shared[k])]
        );
    }
    return locColumnHeader;
}

class AllInOneImporter extends XlsxImporter {
    private importedWSs: Record<SheetRef, Worksheet> | undefined;
    private columnRefs: { [key in SheetRef]: Record<ColumnRef<key>, number> } | undefined;
    // private columnRefs: { [key in SheetRef]: Record<ColumnRef<key>, number> } | undefined;
    private properties: Record<SheetRef, Property[]> | undefined;
    private extId2StationRow: Map<string, WSRow> | undefined = undefined;
    private extId2DeliveryRow: Map<string, WSRow> | undefined = undefined;

    async importTemplate(file: File): Promise<JsonData> {

        const expectedColumnHeader = createLocalizedHeaderConf(LABEL_MAPPING);
        const sheetNames = Object.keys(expectedColumnHeader);
        const options: Options = {
            mandatorySheets: sheetNames,
            filterSheets: sheetNames,
            matchColumnHeaders: expectedColumnHeader
        };

        const intWB = await readExcelFile(
            file,
            options
        );

        this.importedWSs = {
            stations: intWB.sheets[sheetNameMapping.stations],
            deliveries: intWB.sheets[sheetNameMapping.deliveries],
            dels2Dels: intWB.sheets[sheetNameMapping.dels2Dels]
        };

        this.initColumnRefs(LABEL_MAPPING);
        this.validateDeliveries();
        this.validateDels2Dels();
        this.postProcessStations();
        this.postProcessDeliveries();

        const jsonData: JsonData = {
            version: '',
            data: {
                version: '',
                stations: createEmptyDataTable(),
                deliveries: createEmptyDataTable(),
                deliveryRelations: createEmptyDataTable()
            }
        };
        return jsonData;
    }


    private initColumnRefs(columnLabelMapping: ColumnLabelMapping): void {
        const revMaps = {
            stations: createRevRecord(columnLabelMapping.stations),
            deliveries: createRevRecord(columnLabelMapping.deliveries),
            dels2Dels: createRevRecord(columnLabelMapping.dels2Dels),
            shared: createRevRecord(columnLabelMapping.shared)
        };
        this.columnRefs = {
            stations: createColumnRef2RowKeyMap(this.importedWSs!.stations.columnHeaders, revMaps.stations, revMaps.shared),
            deliveries: createColumnRef2RowKeyMap(this.importedWSs!.deliveries.columnHeaders, revMaps.deliveries, revMaps.shared),
            dels2Dels: createColumnRef2RowKeyMap(this.importedWSs!.dels2Dels.columnHeaders, revMaps.dels2Dels, revMaps.shared)
        };
    }

    private initStationMap(): void {
        const id2StationRow = new Map<string, WSRow>();
        this.importedWSs!.stations.rows.forEach(row => {
            const extId = row[this.columnRefs!.stations.extId] as string;
            id2StationRow[extId] = row;
        });
        this.extId2StationRow = id2StationRow;
    }

    private initDeliveryMap(): void {
        const id2DeliveryRow = new Map<string, WSRow>();
        this.importedWSs!.deliveries.rows.forEach(row => {
            const extId = row[this.columnRefs!.deliveries.extId] as string;
            id2DeliveryRow[extId] = row;
        });
        this.extId2DeliveryRow = id2DeliveryRow;
    }

    private validateDeliveries(): void {
        this.initStationMap();
        // verify fk refs
        this.importedWSs!.deliveries.rows.forEach(row => {
            const extSourceId = row[this.columnRefs!.deliveries.source] as string;
            if (this.extId2StationRow!.has(extSourceId)) {
                throw new Error(`Station reference '${extSourceId}' is unknown.`);
            }
            const extTargetId = row[this.columnRefs!.deliveries.target] as string;
            if (this.extId2StationRow!.has(extTargetId)) {
                throw new Error(`Station reference '${extTargetId}' is unknown.`);
            }
        });
    }

    private validateDels2Dels(): void {
        this.initDeliveryMap();
        // verify fk refs
        const fromKey = this.columnRefs!.dels2Dels.from;
        const toKey = this.columnRefs!.dels2Dels.to;
        this.importedWSs!.deliveries.rows.forEach(row => {
            const extFromId = row[fromKey] as string;
            if (this.extId2DeliveryRow!.has(extFromId)) {
                throw new Error(`Delivery reference '${extFromId}' is unknown.`);
            }
            const extToId = row[toKey] as string;
            if (this.extId2StationRow!.has(extToId)) {
                throw new Error(`Station reference '${extToId}' is unknown.`);
            }
        });
    }

    private assignNewStationIds(): void {
        const hashRefKeys: ColumnRef<'stations'>[] = ['name', 'street', 'streetNo', 'city', 'district', 'state', 'country'];
        const hashRowKeys = hashRefKeys.map(k => this.columnRefs!.stations[k]);
        const oldIdKey = this.columnRefs!.stations.extId;
        const sourceKey = this.columnRefs!.deliveries.source;
        const targetKey = this.columnRefs!.deliveries.target;
        const newIdKey = 'newId';
        const newIds = new Set<string>();
        const old2NewId = new Map<string, string>();
        this.importedWSs!.stations.rows.forEach(row => {
            const hashValues = hashRowKeys.map(k => row[k] ?? '');
            const newId = `${hashCode(JSON.stringify(hashValues))}`;
            if (newIds.has(newId)) {
                // newId might be not unique do to lossy projection or due to
                // identical attribute values
                throw new Error(`Generated station id '${newId}' is not unqiue.`);
            }
            row[newIdKey] = newId;
            const oldId = row[oldIdKey] as string;
            old2NewId.set(oldId, newId);
            newIds.add(newId);
        });
        this.importedWSs!.deliveries.rows.forEach(row => {
            {
                const oldSourceId = row[sourceKey] as string;
                const newSourceId = old2NewId.get(oldSourceId)!;
                row[sourceKey] = newSourceId;
            }
            {
                const oldTargetId = row[targetKey] as string;
                const newTargetId = old2NewId.get(oldTargetId)!;
                row[targetKey] = newTargetId;
            }
        });
    }

    private assignNewDeliveryIds(): void {
        const hashColRefs: ColumnRef<'deliveries'>[] = [
            'name', 'lot', 'source', 'target',
            'dateOut_day', 'dateOut_month', 'dateOut_year',
            'dateIn_day', 'dateIn_month', 'dateIn_year',
            'unitAmount_quantity', 'unitAmount_unit'
        ];
        const hashPropKeys = hashColRefs.map(ref => this.columnRefs!.deliveries[ref]);
        const oldIdKey = this.columnRefs!.deliveries.extId;
        const fromKey = this.columnRefs!.dels2Dels.from;
        const toKey = this.columnRefs!.dels2Dels.to;
        const newIdKey = 'newId';
        const newIds = new Set<string>();
        const old2NewId = new Map<string, string>();
        this.importedWSs!.deliveries.rows.forEach(row => {
            const hashValues = hashPropKeys.map(k => row[k] ?? '');
            const newId = `${hashCode(JSON.stringify(hashValues))}`;
            if (newIds.has(newId)) {
                // newId might be not unique do to lossy projection or due to
                // identical attribute values
                throw new Error(`Generated delivery id '${newId}' is not unqiue.`);
            }
            row[newIdKey] = newId;
            const oldId = row[oldIdKey] as string;
            old2NewId.set(oldId, newId);
            newIds.add(newId);
        });
        this.importedWSs!.dels2Dels.rows.forEach(row => {
            {
                const oldFromId = row[fromKey] as string;
                const newFromId = old2NewId.get(oldFromId)!;
                row[fromKey] = newFromId;
            }
            {
                const oldToId = row[toKey] as string;
                const newToId = old2NewId.get(oldToId)!;
                row[toKey] = newToId;
            }
        });
    }

    private postProcessDeliveries(): void {
        this.assignNewDeliveryIds();
        // agg date
        const delColRefs = this.columnRefs!.deliveries;
        this.importedWSs!.deliveries.rows.forEach(row => {
            row[delColRefs.dateIn] = createDate(
                getNumberValue(row, delColRefs.dateIn_year),
                getNumberValue(row, delColRefs.dateIn_month),
                getNumberValue(row, delColRefs.dateIn_day)
            );
            row[delColRefs.dateOut] = createDate(
                getNumberValue(row, delColRefs.dateOut_year),
                getNumberValue(row, delColRefs.dateOut_month),
                getNumberValue(row, delColRefs.dateOut_day)
            );
        });
    }

    private postProcessStations(): void {
        this.assignNewStationIds();
    }
}

// desktop app del id generation
// private String getNewSerial(Lot l, Delivery d) {
// 	String newSerial = (l.getProduct() != null && l.getProduct().getStation() != null ?
// l.getProduct().getStation().getId() + ";" + l.getProduct().getName() : "null") + ";" + l.getNumber() + ";" +
// 			d.getDepartureDay() + ";" + d.getDepartureMonth() + ";" + d.getDepartureYear() + ";" +
// 			d.getArrivalDay() + ";" + d.getArrivalMonth() + ";" + d.getArrivalYear() + ";" +
// 			d.getUnitNumber() + ";" + d.getUnitUnit() + ";" + d.getReceiver().getId();
// 	return newSerial;
// }

interface ImportOptions {

}

function readColumnConf(ws: Excel.Worksheet): ColumnConf[] {
    throw new Error(`To implement`);
}

function getColumns(columnGroups: ColumnConf[]): ColumnConf[] {

}

function importStationTable(ws: Excel.Worksheet, mana): Table {
    ws.eachRow(row )
}

function matchWSColumnHeaders(ws: Excel.Worksheet, ColumnConf: HeaderConf[], rowIndex?: number, colIndex?: number, silent?: boolean): boolean {
    rowIndex = rowIndex ?? 1;
    colIndex = colIndex ?? 0;
    silent = silent ?? false;
    const row = ws.getRow(rowIndex);
    for (const colConf of ColumnConf) {
        colIndex++;
        const obsLabel = row.getCell(colIndex).text.trim();
        const expLabel = typeof colConf === 'string' ? colConf : colConf[0];
        if (obsLabel !== expLabel) {
            if (!silent) {
                throw new Error(`Invalid column label in sheet '${ws.name}'. Value in cell (${colIndex}, ${rowIndex}) should be '${expLabel}' but is '${obsLabel}'.`);
            }
            return false;
        }
        if ()
    }
}
