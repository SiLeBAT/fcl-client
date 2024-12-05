import {
    FclData,
    GraphSettings,
    ObservedType,
    MergeDeliveriesType,
    PropMap,
} from "../../data.model";

import { Utils } from "./../../util/non-ui-utils";
import { Constants } from "./../../util/constants";

import { IDataImporter } from "./datatypes";
import { importSamples } from "./sample-importer-v1";
import { createDefaultHighlights } from "./shared";
import { InputFormatError, InputDataError } from "../io-errors";
import {
    DENOVO_STATION_PROP_INT_TO_EXT_MAP,
    DENOVO_DELIVERY_PROP_INT_TO_EXT_MAP,
} from "../data-mappings/data-mappings-v1";
import { DELIVERY_PROP_V0_TO_V1_MAP } from "../data-mappings/data-mappings-v0-to-v1";
import { createInitialFclDataState } from "../../state/tracing.reducers";

export class DataImporterV0 implements IDataImporter {
    async isDataFormatSupported(data: any): Promise<boolean> {
        const containsRawData =
            Object.prototype.hasOwnProperty.call(data, "stations") &&
            Object.prototype.hasOwnProperty.call(data, "deliveries") &&
            Object.prototype.hasOwnProperty.call(data, "deliveriesRelations");
        const containsDataWithSettings =
            Object.prototype.hasOwnProperty.call(data, "elements") &&
            Object.prototype.hasOwnProperty.call(data, "layout") &&
            Object.prototype.hasOwnProperty.call(data, "gisLayout") &&
            Object.prototype.hasOwnProperty.call(data, "graphSettings");
        return containsRawData || containsDataWithSettings;
    }

    async importData(data: any): Promise<FclData> {
        const fclData = createInitialFclDataState();
        if (await this.isDataFormatSupported(data)) {
            const containsRawData =
                Object.prototype.hasOwnProperty.call(data, "stations") &&
                Object.prototype.hasOwnProperty.call(data, "deliveries") &&
                Object.prototype.hasOwnProperty.call(
                    data,
                    "deliveriesRelations",
                );

            if (containsRawData) {
                this.preprocessRawData(data, fclData);
            } else {
                this.preprocessDataWithSettings(data, fclData);
            }
            importSamples(data, fclData);
            fclData.graphSettings.highlightingSettings =
                createDefaultHighlights();
        } else {
            throw new InputFormatError();
        }
        return fclData;
    }

    private preprocessRawData(data: any, fclData: FclData): boolean {
        const stationsById = {};
        const deliveriesById = {};

        for (const s of data.stations) {
            s.incoming = [];
            s.outgoing = [];
            s.connections = [];
            stationsById[s.id] = s;
        }

        for (const d of data.deliveries) {
            const source = stationsById[d.source];
            if (source === undefined) {
                throw new InputDataError(
                    `The delivery with id '${d.id}' references a source (with id '${d.source}') which does not exist.`,
                );
            }
            source.outgoing.push(d.id);
            const target = stationsById[d.target];
            if (target === undefined) {
                throw new InputDataError(
                    `The delivery with id '${d.id}' references a target (with id '${d.target}') which does not exist.`,
                );
            }
            target.incoming.push(d.id);

            deliveriesById[d.id] = d;
        }

        for (const r of data.deliveriesRelations) {
            const sourceD = deliveriesById[r.source];
            if (sourceD === undefined) {
                throw new InputDataError(
                    `A delivery relation references a delivery (with id '${r.source}' which does not exist.`,
                );
            }
            const targetD = deliveriesById[r.target];
            if (targetD === undefined) {
                throw new InputDataError(
                    `A delivery relation references a delivery (with id '${r.target}' which does not exist.`,
                );
            }

            if (sourceD.target !== targetD.source) {
                throw new InputDataError(
                    "Invalid delivery relation: " + JSON.stringify(r),
                );
            }

            stationsById[sourceD.target].connections.push(r);
        }
        this.applyElements(data.stations, data.deliveries, fclData);
        return true;
    }

    private preprocessDataWithSettings(data: any, fclData: FclData): boolean {
        const graphSettings: GraphSettings = {
            ...fclData.graphSettings,
            type: data.graphSettings.type || fclData.graphSettings.type,
            nodeSize:
                data.graphSettings.nodeSize || fclData.graphSettings.nodeSize,
            fontSize:
                data.graphSettings.fontSize || fclData.graphSettings.fontSize,
            mergeDeliveriesType:
                data.graphSettings.mergeDeliveries !== null &&
                data.graphSettings.mergeDeliveries !== undefined
                    ? data.graphSettings.mergeDeliveries
                        ? MergeDeliveriesType.MERGE_ALL
                        : MergeDeliveriesType.NO_MERGE
                    : fclData.graphSettings.mergeDeliveriesType,
            skipUnconnectedStations:
                data.graphSettings.skipUnconnectedStations ??
                fclData.graphSettings.skipUnconnectedStations,
            showLegend:
                data.graphSettings.showLegend ??
                fclData.graphSettings.showLegend,
            showZoom:
                data.graphSettings.showZoom ?? fclData.graphSettings.showZoom,
            schemaLayout: data.layout,
            gisLayout: data.gisLayout,
        };

        fclData.graphSettings = graphSettings;
        this.applyElements(
            data.elements.stations,
            data.elements.deliveries,
            fclData,
        );
        return true;
    }

    private checkIds(ids: (string | number)[], context: string): void {
        const idMap: Record<string | number, boolean> = {};
        const capContext = context[0].toUpperCase() + context.slice(1);
        for (const id of ids) {
            if (id === undefined) {
                throw new InputDataError(`${capContext} id is undefined.`);
            }
            if (id === null) {
                throw new InputDataError(`${capContext} id is null.`);
            }
            if (idMap[id] !== undefined) {
                throw new InputDataError(`Duplicate ${context} id is null.`);
            }
            idMap[id] = true;
        }
    }

    private applyElements(
        stationElements: any[],
        deliveryElements: any[],
        fclData: FclData,
    ) {
        this.checkIds(
            stationElements.map((s) => s.id),
            "station",
        );
        this.checkIds(
            deliveryElements.map((d) => d.id),
            "delivery",
        );

        this.applyStations(stationElements, fclData);
        this.applyDeliveries(deliveryElements, fclData);
    }

    private applyStations(elements: any[], fclData: FclData) {
        const defaultKeys: Set<string> = new Set(
            Constants.STATION_PROPERTIES.toArray(),
        );
        const propMap: PropMap = DENOVO_STATION_PROP_INT_TO_EXT_MAP.toObject();

        for (const e of elements) {
            const properties: { name: string; value: string }[] = [];

            for (const key of Object.keys(e)) {
                const value = e[key];
                if (value !== undefined && value !== null) {
                    if (!defaultKeys.has(key)) {
                        properties.push({ name: key, value: value });
                        if (propMap[key] === undefined) {
                            propMap[key] = key;
                        }
                    }
                }
            }

            if (!e.contains || e.contains.length === 0) {
                fclData.fclElements.stations.push({
                    id: e.id,
                    name: e.name,
                    lat: e.lat,
                    lon: e.lon,
                    incoming: e.incoming,
                    outgoing: e.outgoing,
                    connections: e.connections,
                    properties: e.properties ?? properties,
                });
            } else {
                fclData.groupSettings.push({
                    id: e.id,
                    name: e.name,
                    contains: e.contains,
                });
            }
            const weight = e.weight ?? (e.outbreak ? 1 : 0);
            fclData.tracingSettings.stations.push({
                id: e.id,
                weight: weight,
                outbreak: weight > 0,
                observed: e.observed ?? ObservedType.NONE,
                crossContamination: e.crossContamination ?? false,
                killContamination: e.killContamination ?? false,
            });

            if (e.invisible) {
                fclData.graphSettings.highlightingSettings.invisibleStations.push(
                    e.id,
                );
            }
            if (e.selected) {
                fclData.graphSettings.highlightingSettings.invisibleStations.push(
                    e.id,
                );
            }
            if (e.position) {
                fclData.graphSettings.stationPositions[e.id] = e.position;
            }
        }

        fclData.source.int2ExtPropMaps.stations = propMap;
    }

    private applyDeliveries(elements: any[], fclData: FclData) {
        const v0ToV1PropMap: Record<string, string> =
            DELIVERY_PROP_V0_TO_V1_MAP.toObject();
        const v1ToV0PropMap = Utils.getReversedRecord(v0ToV1PropMap);
        const defaultKeys: Set<string> = new Set(
            Constants.DELIVERY_PROPERTIES.toArray().map(
                (p) => v1ToV0PropMap[p] ?? p,
            ),
        );
        const propMap: PropMap = DENOVO_DELIVERY_PROP_INT_TO_EXT_MAP.toObject();

        for (const e of elements) {
            const properties: { name: string; value: string }[] = [];

            for (const key of Object.keys(e)) {
                const value = e[key];
                if (value !== undefined && value !== null) {
                    if (!defaultKeys.has(key)) {
                        properties.push({ name: key, value: e[key] });
                        if (propMap[key] === undefined) {
                            propMap[key] = key;
                        }
                    }
                }
            }

            fclData.fclElements.deliveries.push({
                id: e.id,
                name: e.name ?? e.id,
                lot: e.lot,
                lotKey:
                    (e.originalSource || e.source) +
                    "|" +
                    (e.name || e.id) +
                    "|" +
                    (e.lot || e.id),
                dateOut:
                    Utils.dateToString(Utils.stringToDate(e.date)) ?? undefined,
                source: e.originalSource || e.source,
                target: e.originalTarget || e.target,
                properties: e.properties ?? properties,
            });

            const weight = (e.weight ?? 0) as number;
            fclData.tracingSettings.deliveries.push({
                id: e.id,
                weight: weight,
                observed: e.observed ?? ObservedType.NONE,
                crossContamination: e.crossContamination ?? false,
                killContamination: e.killContamination ?? false,
                outbreak: weight > 0,
            });

            if (e.selected) {
                fclData.graphSettings.selectedElements.deliveries.push(e.id);
            }
        }

        fclData.source.int2ExtPropMaps.deliveries = propMap;
    }
}
