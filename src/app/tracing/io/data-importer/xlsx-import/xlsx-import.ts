import {
    ColumnProperty,
    DataRow,
    DataTable,
    JsonData,
    VERSION,
} from "../../ext-data-model.v1";
import {
    EXTOUT_DEL2DEL_PROP_IDS,
    EXTOUT_DELIVERY_PROP_IDS,
    EXTOUT_STATION_PROP_IDS,
    IMPORT_PREFIXES,
} from "./consts";
import { AllInOneImporter } from "./all-in-one/importer";
import {
    Del2DelRow,
    DeliveryRow,
    ImportIssue,
    ImportResult,
    ImportTable,
    RowWithOtherProps,
    StationRow,
} from "./model";
import { XlsxReader } from "./xlsx-reader";
import {
    getKeys,
    removeUndefined,
} from "../../../../tracing/util/non-ui-utils";
import { IOState } from "../../io.reducers";

type ImportedRow = StationRow | DeliveryRow | Del2DelRow;

function collectDefaultProps<T extends ImportedRow, P extends keyof T & string>(
    importTable: ImportTable<T>,
    propIds: P[],
): ColumnProperty[] {
    const propId2Property = new Map<string, ColumnProperty>();
    let propIdsToBeChecked = propIds.slice();

    for (const row of importTable.rows) {
        propIdsToBeChecked.forEach((propId) => {
            const value = row[propId];
            if (value !== undefined) {
                propId2Property.set(propId, { id: propId, type: typeof value });
            }
        });
        propIdsToBeChecked = propIdsToBeChecked.filter(
            (propId) => !propId2Property.has(propId),
        );
        if (propIdsToBeChecked.length === 0) {
            break;
        }
    }
    return removeUndefined(
        propIds.map((propId) => propId2Property.get(propId)),
    );
}

function collectOtherProps(
    importTable: ImportTable<Partial<RowWithOtherProps>>,
): ColumnProperty[] {
    const columns: ColumnProperty[] = [];
    const foundPropIds = new Set<string>();

    importTable.rows.forEach((row) => {
        if (row.otherProps) {
            Object.entries(row.otherProps).forEach(([propId, value]) => {
                if (value !== undefined && !foundPropIds.has(propId)) {
                    foundPropIds.add(propId);
                    columns.push({ id: propId, type: typeof value });
                }
            });
        }
    });
    return columns;
}

function mapProps(
    props: ColumnProperty[],
    propMap: Map<string, string>,
): ColumnProperty[] {
    return props.map((p) => ({ id: propMap.get(p.id)!, type: p.type }));
}

function isRowWithOtherProps(
    row: RowWithOtherProps | ImportedRow,
): row is RowWithOtherProps {
    return (row as RowWithOtherProps).otherProps !== undefined;
}

function mapRows(
    rows: (DeliveryRow | StationRow | Del2DelRow)[],
    propMap: Map<string, string>,
    defaultProps: ColumnProperty[],
    otherProps?: ColumnProperty[],
): DataRow[] {
    return rows.map((row) => {
        const extRow: DataRow = [];
        defaultProps.forEach((p) => {
            const value = row[p.id];
            if (value !== undefined) {
                extRow.push({ id: propMap.get(p.id)!, value: value });
            }
        });
        if (otherProps && isRowWithOtherProps(row)) {
            otherProps.forEach((p) => {
                const value = row.otherProps[p.id];
                if (value !== undefined) {
                    extRow.push({ id: propMap.get(p.id)!, value: value });
                }
            });
        }
        return extRow;
    });
}

function convertDeliveriesToExtDataTable(
    importTable: ImportTable<DeliveryRow>,
): DataTable {
    const availableDefaultProps = collectDefaultProps(
        importTable,
        getKeysWithStringValueMapping(EXTOUT_DELIVERY_PROP_IDS),
    );
    const availableOtherProps = collectOtherProps(importTable);
    const propMap = new Map<string, string>();
    availableDefaultProps.forEach((p) =>
        propMap.set(p.id, EXTOUT_DELIVERY_PROP_IDS[p.id]),
    );
    availableOtherProps.forEach((p) =>
        propMap.set(p.id, `${IMPORT_PREFIXES.otherDeliveryProp}${p.id}`),
    );
    const extTable: DataTable = {
        columnProperties: mapProps(
            [...availableDefaultProps, ...availableOtherProps],
            propMap,
        ),
        data: mapRows(
            importTable.rows,
            propMap,
            availableDefaultProps,
            availableOtherProps,
        ),
    };
    return extTable;
}

function getKeysWithStringValueMapping<T extends Record<string, unknown>>(
    object: T,
): (keyof T & string)[] {
    return getKeys(object).filter((key) => typeof object[key] === "string");
}

function convertStationsToExtDataTable(
    importTable: ImportTable<StationRow>,
): DataTable {
    const availableDefaultProps = collectDefaultProps(
        importTable,
        getKeysWithStringValueMapping(EXTOUT_STATION_PROP_IDS),
    );
    const availableOtherProps = collectOtherProps(importTable);
    const propMap = new Map<string, string>();
    availableOtherProps.forEach((p) =>
        propMap.set(p.id, `${IMPORT_PREFIXES.otherStationProp}${p.id}`),
    );
    availableDefaultProps.forEach((p) =>
        propMap.set(p.id, EXTOUT_STATION_PROP_IDS[p.id]),
    );
    const extTable: DataTable = {
        columnProperties: mapProps(
            [...availableDefaultProps, ...availableOtherProps],
            propMap,
        ),
        data: mapRows(
            importTable.rows,
            propMap,
            availableDefaultProps,
            availableOtherProps,
        ),
    };
    return extTable;
}

function convertDel2DelsToExtDataTable(
    importTable: ImportTable<Del2DelRow>,
): DataTable {
    const availableDefaultProps = collectDefaultProps(
        importTable,
        getKeysWithStringValueMapping(EXTOUT_DEL2DEL_PROP_IDS),
    );
    const propMap = new Map<string, string>();
    availableDefaultProps.forEach((p) =>
        propMap.set(p.id, EXTOUT_DEL2DEL_PROP_IDS[p.id]),
    );

    const extTable: DataTable = {
        columnProperties: mapProps(availableDefaultProps, propMap),
        data: mapRows(importTable.rows, propMap, availableDefaultProps),
    };
    return extTable;
}

function convertImportResultToJsonData(importResult: ImportResult): JsonData {
    const data: JsonData = {
        version: VERSION,
        data: {
            version: VERSION,
            stations: convertStationsToExtDataTable(importResult.stations),
            deliveries: convertDeliveriesToExtDataTable(
                importResult.deliveries,
            ),
            deliveryRelations: convertDel2DelsToExtDataTable(
                importResult.del2Dels,
            ),
        },
    };
    return data;
}

export function getIssues(importResult: ImportResult): IOState {
    return {
        omittedRowsInImport:
            importResult.stations.omittedRows +
            importResult.deliveries.omittedRows +
            importResult.del2Dels.omittedRows,
        issuesInImport: [
            ...importResult.stations.issues,
            ...importResult.stations.issues,
            ...importResult.del2Dels.issues,
        ],
    };
}

export async function importXlsxFile(file: File): Promise<JsonData> {
    const xlsxReader = new XlsxReader();
    await xlsxReader.loadFile(file);

    const importResult = new AllInOneImporter().importTemplate(xlsxReader);

    getIssues(importResult);
    // throw these in the store I guess.

    const jsonData = convertImportResultToJsonData(importResult);

    return jsonData;
}
