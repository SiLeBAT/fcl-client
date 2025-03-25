import { Injectable } from "@angular/core";
import {
    DataServiceData,
    DeliveryData,
    StationData,
    TableColumn,
    TableRow,
    DataTable,
    NodeShapeType,
    DataServiceInputState,
    ColumnSets,
    JSType,
} from "../data.model";
import * as _ from "lodash";
import { DataService } from "./data.service";
import { Constants } from "../util/constants";
import { concat, entries, isNullish, values } from "../util/non-ui-utils";
import { DELIVERY_PROP_LABELS, STATION_PROP_LABELS } from "../util/labels";

type StatColumnsFlag = "h" | "" | "a" | "ah";
type DeliveryColumnsFlag = "h" | "";

interface Cache {
    modelFlag: Record<string, never>;
    stationColumnSets: Partial<Record<StatColumnsFlag, ColumnSets>>;
    deliveryColumnSets: Partial<Record<DeliveryColumnsFlag, ColumnSets>>;
    stationProp2Type: Map<string, JSType>;
    deliveryProp2Type: Map<string, JSType>;
}

@Injectable({
    providedIn: "root",
})
export class TableService {
    private cache: Cache = this.createEmptyCache();

    constructor(private dataService: DataService) {}

    private checkCache(data: DataServiceData): void {
        if (this.cache.modelFlag !== data.modelFlag) {
            this.cache = this.createEmptyCache(data.modelFlag);
            this.cache.stationProp2Type = this.getStationProp2TypeMap(data);
            this.cache.deliveryProp2Type = this.getDeliveryProp2TypeMap(data);
        } else {
            this.updateColsDataAvailability(data);
        }
    }

    private createEmptyCache(modelFlag?: Record<string, never>): Cache {
        return {
            modelFlag: modelFlag || {},
            stationColumnSets: {},
            deliveryColumnSets: {},
            stationProp2Type: new Map(),
            deliveryProp2Type: new Map(),
        };
    }

    private getProps2TypeMap<T extends StationData | DeliveryData>(
        elements: T[],
        requiredProps: (keyof T & string)[],
        optProps: (keyof T & string)[],
    ): Map<string, JSType> {
        const prop2TypeMap = new Map<string, JSType>();

        if (elements.length >= 1) {
            const refElement = elements[0];
            requiredProps.forEach((p) => {
                const value = refElement[p];
                if (!isNullish(value)) {
                    prop2TypeMap.set(p, typeof value);
                }
            });

            for (const optProp of optProps) {
                for (const element of elements) {
                    const value = element[optProp];
                    if (!isNullish(value)) {
                        prop2TypeMap.set(optProp, typeof value);
                        break;
                    }
                }
            }

            for (const element of elements) {
                element.properties.forEach((pe) =>
                    prop2TypeMap.set(pe.name, typeof pe.value),
                );
            }
        }
        return prop2TypeMap;
    }

    private getStationProp2TypeMap(data: DataServiceData): Map<string, JSType> {
        return this.getProps2TypeMap(
            data.stations,
            [
                "id",
                "score",
                "outbreak",
                "weight",
                "crossContamination",
                "killContamination",
                "forward",
                "backward",
                "commonLink",
                "observed",
                "contained",
                "invisible",
                "isMeta",
                "selected",
            ],
            ["name", "anonymizedName", "lat", "lon"],
        );
    }

    private getDeliveryProp2TypeMap(
        data: DataServiceData,
    ): Map<string, JSType> {
        const props2TypeMap = this.getProps2TypeMap(
            data.deliveries,
            [
                "id",
                "score",
                "outbreak",
                "weight",
                "crossContamination",
                "killContamination",
                "forward",
                "backward",
                "observed",
                "invisible",
                "selected",
                "dateIn",
                "dateOut",
                "originalSource",
                "originalTarget",
                "source",
                "target",
            ],
            ["name", "lot"],
        );
        if (
            data.deliveries.some((d) => !isNullish(data.statMap[d.source].name))
        ) {
            props2TypeMap.set("source.name", "string");
        }
        if (
            data.deliveries.some((d) => !isNullish(data.statMap[d.target].name))
        ) {
            props2TypeMap.set("target.name", "string");
        }
        return props2TypeMap;
    }

    private updateDelColsDataAvailability(data: DataServiceData): void {
        const prevProp2TypeMap = new Map(this.cache.deliveryProp2Type);
        const props2Check: [keyof DeliveryData, keyof StationData, string][] = [
            ["source", "name", "source.name"],
            ["target", "name", "target.name"],
        ];
        props2Check.forEach(([dKey, sKey, p]) => {
            let type: JSType | undefined;
            for (const delivery of data.deliveries) {
                const value = data.statMap[delivery[dKey] as string][sKey];
                if (!isNullish(value)) {
                    type = typeof value;
                    break;
                }
            }
            const isCacheUpdateRequired =
                type !== this.cache.deliveryProp2Type.get(p);
            if (isCacheUpdateRequired) {
                if (type !== undefined) {
                    this.cache.deliveryProp2Type.set(p, type);
                } else {
                    this.cache.deliveryProp2Type.delete(p);
                }
            }
        });
        this.setColumnSetsDataAvailability(
            this.cache.deliveryColumnSets,
            this.cache.deliveryProp2Type,
            prevProp2TypeMap,
        );
    }

    private setColumnSetsDataAvailability<T extends string>(
        flag2ColSets: Partial<Record<T, ColumnSets>>,
        prop2TypeMap: Map<string, JSType>,
        prevProp2TypeMap: Map<string, JSType>,
    ): void {
        const propsWithChangedAvailabilities = new Set(
            concat(
                Array.from(prevProp2TypeMap.keys()).filter(
                    (p) => !prop2TypeMap.has(p),
                ),
                Array.from(prop2TypeMap.keys()).filter(
                    (p) => !prevProp2TypeMap.has(p),
                ),
            ),
        );

        if (propsWithChangedAvailabilities.size > 0) {
            for (const columnSets of values(flag2ColSets)) {
                for (const [subSetKey, cols] of entries(columnSets)) {
                    if (
                        cols.some((c) =>
                            propsWithChangedAvailabilities.has(c.id),
                        )
                    ) {
                        this.setColumnDataAvailibility(cols, prop2TypeMap);
                        columnSets[subSetKey] = cols.slice();
                    }
                }
            }
        }
    }

    private updateStatColsDataAvailability(data: DataServiceData): void {
        const prevStationProp2TypeMap = new Map(this.cache.stationProp2Type);
        const props2Check: (keyof StationData)[] = ["name", "anonymizedName"];
        props2Check.forEach((p) => {
            let type: JSType | undefined;
            for (const station of data.stations) {
                const value = station[p];
                if (!isNullish(value)) {
                    type = typeof value;
                    break;
                }
            }
            const isCacheUpdateRequired =
                type !== this.cache.stationProp2Type.get(p);
            if (isCacheUpdateRequired) {
                if (type !== undefined) {
                    this.cache.stationProp2Type.set(p, type);
                } else {
                    this.cache.stationProp2Type.delete(p);
                }
            }
        });

        this.setColumnSetsDataAvailability(
            this.cache.stationColumnSets,
            this.cache.stationProp2Type,
            prevStationProp2TypeMap,
        );
    }

    private updateColsDataAvailability(data: DataServiceData): void {
        this.updateStatColsDataAvailability(data);
        this.updateDelColsDataAvailability(data);
    }

    private setColumnDataAvailibility(
        columns: TableColumn[],
        prop2TypeMap: Map<string, JSType>,
    ): void {
        columns.forEach((c) => {
            c.dataIsUnavailable = !prop2TypeMap.has(c.id);
            c.type = prop2TypeMap.get(c.id);
        });
    }

    getDeliveryTable(
        state: DataServiceInputState,
        forHighlighting: boolean,
        deliveryIds?: string[],
    ): DataTable {
        const data = this.dataService.getData(state);

        return {
            modelFlag: data.modelFlag,
            ...this.getDeliveryColumnSets(state, data, forHighlighting),
            rows: this.getDeliveryRows(data, forHighlighting, deliveryIds),
        };
    }

    getStationTable(
        state: DataServiceInputState,
        forHighlighting: boolean,
    ): DataTable {
        const data: DataServiceData = this.dataService.getData(state);

        return {
            modelFlag: data.modelFlag,
            ...this.getStationColumnSets(state, data, forHighlighting),
            rows: this.getStationRows(data, forHighlighting),
        };
    }

    private getFavouriteStationColumns(
        data: DataServiceData,
        forHighlighting: boolean,
    ): TableColumn[] {
        let colDefs = Constants.FAVOURITE_STAT_COLUMNS.toArray();
        if (forHighlighting) {
            colDefs = colDefs.filter(
                (c) => c.availableForHighlighting !== false,
            );
        }
        const favColumns = colDefs.map((c) => ({
            id: c.id,
            name: c.name,
        })) as TableColumn[];

        this.setColumnDataAvailibility(favColumns, this.cache.stationProp2Type);

        return favColumns;
    }

    private getFavouriteDeliveryColumns(
        forHighlighting: boolean,
    ): TableColumn[] {
        const favColumns: TableColumn[] = [
            { id: "id", name: DELIVERY_PROP_LABELS.id },
            { id: "name", name: DELIVERY_PROP_LABELS.product },
            { id: "lot", name: DELIVERY_PROP_LABELS.lot },
            { id: "amount", name: DELIVERY_PROP_LABELS.amount },
            { id: "dateOut", name: DELIVERY_PROP_LABELS.dateOut },
            { id: "dateIn", name: DELIVERY_PROP_LABELS.dateIn },
            { id: "outbreak", name: DELIVERY_PROP_LABELS.outbreak },
        ];
        if (!forHighlighting) {
            favColumns.push(
                {
                    id: "source.name",
                    name: DELIVERY_PROP_LABELS["source.name"],
                    type: "string",
                },
                {
                    id: "target.name",
                    name: DELIVERY_PROP_LABELS["target.name"],
                    type: "string",
                },
            );
        }

        this.setColumnDataAvailibility(
            favColumns,
            this.cache.deliveryProp2Type,
        );

        return favColumns;
    }

    private getOtherDeliveryColumns(
        state: DataServiceInputState,
        data: DataServiceData,
        forHighlighting: boolean,
        favouriteColumns: TableColumn[],
    ): TableColumn[] {
        const otherColumns: TableColumn[] = [
            { id: "source", name: DELIVERY_PROP_LABELS.source },
            { id: "target", name: DELIVERY_PROP_LABELS.target },
            { id: "weight", name: DELIVERY_PROP_LABELS.weight },
            {
                id: "crossContamination",
                name: DELIVERY_PROP_LABELS.crossContamination,
            },
            {
                id: "killContamination",
                name: DELIVERY_PROP_LABELS.killContamination,
            },
            { id: "observed", name: DELIVERY_PROP_LABELS.traceType },
            { id: "forward", name: DELIVERY_PROP_LABELS.forward },
            { id: "backward", name: DELIVERY_PROP_LABELS.backward },
            { id: "score", name: DELIVERY_PROP_LABELS.score },
            { id: "lotAmount", name: DELIVERY_PROP_LABELS.lotAmount },
            ...(forHighlighting
                ? []
                : [
                      { id: "selected", name: DELIVERY_PROP_LABELS.selected },
                      { id: "invisible", name: DELIVERY_PROP_LABELS.invisible },
                  ]),
        ];

        this.addColumnsForProperties(
            otherColumns,
            data.deliveries,
            DELIVERY_PROP_LABELS,
        );
        this.addColumnsForOtherMappings(
            otherColumns,
            state.int2ExtPropMaps.deliveries,
            new Set(Constants.DELIVERY_PROPERTIES.toArray()),
            DELIVERY_PROP_LABELS,
        );

        const cleanedOtherColumns = this.getCleanedAndSortedOtherColumns(
            otherColumns,
            favouriteColumns,
        );

        this.setColumnDataAvailibility(
            cleanedOtherColumns,
            this.cache.deliveryProp2Type,
        );

        return cleanedOtherColumns;
    }

    getDeliveryColumnSets(
        state: DataServiceInputState,
        data: DataServiceData,
        forHighlighting: boolean,
    ): ColumnSets {
        this.checkCache(data);

        const cacheFlag = forHighlighting ? "h" : "";
        let columnSets = this.cache.deliveryColumnSets[cacheFlag];

        if (!columnSets) {
            const favouriteColumns =
                this.getFavouriteDeliveryColumns(forHighlighting);
            const otherColumns = this.getOtherDeliveryColumns(
                state,
                data,
                forHighlighting,
                favouriteColumns,
            );
            columnSets = {
                columns: concat(favouriteColumns, otherColumns),
                favouriteColumns: favouriteColumns,
                otherColumns: otherColumns,
            };
            this.cache.deliveryColumnSets[cacheFlag] = columnSets;
        }
        return columnSets;
    }

    private getOtherStationColumns(
        state: DataServiceInputState,
        data: DataServiceData,
        forHighlighting: boolean,
        favouriteColumns: TableColumn[],
    ): TableColumn[] {
        let colDefs = Constants.KNOWN_OTHER_STAT_COLUMNS.toArray();
        if (forHighlighting) {
            colDefs = colDefs.filter(
                (c) => c.availableForHighlighting !== false,
            );
        }

        const otherColumns = colDefs.map((c) => ({ id: c.id, name: c.name }));

        this.addColumnsForProperties(
            otherColumns,
            data.stations,
            STATION_PROP_LABELS,
        );
        this.addColumnsForOtherMappings(
            otherColumns,
            state.int2ExtPropMaps.stations,
            new Set(Constants.STATION_PROPERTIES.toArray()),
            STATION_PROP_LABELS,
        );

        const cleanedOtherColumns = this.getCleanedAndSortedOtherColumns(
            otherColumns,
            favouriteColumns,
        );

        this.setColumnDataAvailibility(
            cleanedOtherColumns,
            this.cache.stationProp2Type,
        );

        return cleanedOtherColumns;
    }

    getStationColumnSets(
        state: DataServiceInputState,
        data: DataServiceData,
        forHighlighting: boolean,
    ): ColumnSets {
        this.checkCache(data);

        const cacheFlag =
            (data.isStationAnonymizationActive ? "a" : "") +
            (forHighlighting ? "h" : "");
        let columnSets = this.cache.stationColumnSets[cacheFlag];

        if (!columnSets) {
            const favouriteColumns: TableColumn[] =
                this.getFavouriteStationColumns(data, forHighlighting);
            const otherColumns = this.getOtherStationColumns(
                state,
                data,
                forHighlighting,
                favouriteColumns,
            );

            columnSets = {
                columns: concat(favouriteColumns, otherColumns),
                favouriteColumns: favouriteColumns,
                otherColumns: otherColumns,
            };
            this.cache.stationColumnSets[cacheFlag] = columnSets;
        }
        return columnSets;
    }

    private sortColumns(columns: TableColumn[]): TableColumn[] {
        return _.sortBy(columns, [
            (column: TableColumn) => column.name.toLowerCase(),
        ]);
    }

    private getCleanedAndSortedOtherColumns(
        otherColumns: TableColumn[],
        favouriteColumns: TableColumn[],
    ): TableColumn[] {
        return this.sortColumns(
            otherColumns.filter(
                (ac) => !favouriteColumns.some((fc) => fc.id === ac.id),
            ),
        );
    }

    private addColumnsForProperties(
        columns: TableColumn[],
        arr: (StationData | DeliveryData)[],
        preferredLabels: Record<string, string>,
    ): void {
        const props = this.collectProps(arr);
        props.forEach((prop) => {
            if (!columns.some((c) => c.id === prop.id)) {
                columns.push({
                    id: prop.id,
                    name: preferredLabels[prop.id] ?? this.decamelize(prop.id),
                });
            }
        });
    }

    private addColumnsForOtherMappings(
        columns: TableColumn[],
        int2ExtPropMap: Record<string, string>,
        ignoreProps: Set<string>,
        preferredLabels: Record<string, string>,
    ): void {
        const mappedProps = Object.keys(int2ExtPropMap);
        mappedProps.forEach((prop) => {
            if (!ignoreProps.has(prop) && !columns.some((c) => c.id === prop)) {
                columns.push({
                    id: prop,
                    name:
                        preferredLabels[prop] ??
                        this.decamelize(int2ExtPropMap[prop]),
                });
            }
        });
    }

    private getDeliveryRows(
        data: DataServiceData,
        forHighlighting: boolean,
        deliveryIds?: string[],
    ): TableRow[] {
        return (
            deliveryIds ? data.getDelById(deliveryIds) : data.deliveries
        ).map((delivery) => {
            const row: TableRow = {
                id: delivery.id,
                highlightingInfo: {
                    color:
                        delivery.highlightingInfo!.color.length > 0
                            ? delivery.highlightingInfo!.color
                            : [{ r: 0, g: 0, b: 0 }],
                    shape: NodeShapeType.SQUARE,
                },
                name: delivery.name,
                lot: delivery.lot,
                source: delivery.source,
                target: delivery.target,
                dateOut: delivery.dateOut,
                dateIn: delivery.dateIn,
                weight: delivery.weight,
                killContamination: delivery.killContamination,
                crossContamination: delivery.crossContamination,
                observed: delivery.observed,
                forward: delivery.forward,
                backward: delivery.backward,
                score: delivery.score,
                outbreak: delivery.outbreak,
            };

            if (!forHighlighting) {
                row["source.name"] = data.statMap[delivery.source].name;
                row["target.name"] = data.statMap[delivery.target].name;
                row["selected"] = delivery.selected;
                row["invisible"] = delivery.invisible;
            }

            delivery.properties.forEach(
                (prop) => (row[prop.name] = prop.value),
            );

            return row;
        });
    }

    private getStationRows(
        data: DataServiceData,
        forHighlighting: boolean,
    ): TableRow[] {
        const rows = data.stations.map((station) => {
            const row: TableRow = {
                id: station.id,
                name: station.name,
                score: station.score,
                isMeta: station.isMeta,
                contained: station.contained,
                outbreak: station.outbreak,
                weight: station.weight,
                forward: station.forward,
                backward: station.backward,
                crossContamination: station.crossContamination,
                killContamination: station.killContamination,
                observed: station.observed,
                commonLink: station.commonLink,
                lat: station.lat,
                lon: station.lon,
                highlightingInfo: station.highlightingInfo!,
            };

            if (!forHighlighting) {
                row["selected"] = station.selected;
                row["invisible"] = station.invisible;
                if (data.isStationAnonymizationActive) {
                    row["anonymizedName"] = station.anonymizedName;
                }
            }

            station.properties.forEach((prop) => (row[prop.name] = prop.value));

            return row;
        });

        this.assignParentsToStationRows(rows, data);

        return rows;
    }

    private assignParentsToStationRows(
        rows: TableRow[],
        data: DataServiceData,
    ): void {
        const idToRowMap: Record<string, TableRow> = {};
        data.stations.forEach((station, index) => {
            if (station.contained) {
                idToRowMap[station.id] = rows[index];
            } else if (station.contains.length > 0) {
                const row = rows[index];
                for (const memberId of station.contains) {
                    const memberRow = idToRowMap[memberId];
                    memberRow.parentRow = row;
                    memberRow.parentRowId = row.id;
                }
            }
        });
    }

    private decamelize(str: string): string {
        const separator = " ";

        return str
            .replace(/([a-z\d])([A-Z])/g, "$1" + separator + "$2")
            .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, "$1" + separator + "$2")
            .replace(
                /^([a-z]+)/g,
                (match: string, p1: string) =>
                    p1.charAt(0).toUpperCase() + p1.slice(1),
            )
            .replace(
                /(^\_chargen\.)(.*)/gi,
                "Lot " + "$2".trim().charAt(0).toUpperCase() + "$2".slice(1),
            )
            .replace(
                /(^\_lieferungen\.)(.*)/gi,
                (match: string, p1: string, p2: string) =>
                    p2.charAt(0).toUpperCase() + p2.slice(1),
            )
            .replace(/lot id/gi, "Lot ID")
            .replace(/_+/, " ");
    }

    private collectProps(
        arr: (StationData | DeliveryData)[],
    ): { id: string; type: string }[] {
        const result: { id: string; type: string }[] = [];
        const props: { [key: string]: string } = {};
        arr.forEach((item) =>
            item.properties
                .filter(
                    (prop) => prop.value !== undefined || prop.value !== null,
                )
                .forEach((prop) => {
                    if (props[prop.name] === undefined) {
                        const type = typeof prop.value;
                        props[prop.name] = type;
                        result.push({
                            id: prop.name,
                            type: type,
                        });
                    }
                }),
        );
        return result;
    }
}
