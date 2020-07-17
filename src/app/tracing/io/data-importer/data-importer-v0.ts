import { FclData, GraphSettings, ObservedType, MergeDeliveriesType } from '../../data.model';

import { Utils } from './../../util/non-ui-utils';
import { Constants } from './../../util/constants';

import { IDataImporter } from './datatypes';
import { importSamples } from './sample-importer-v1';
import { createDefaultHighlights } from './shared';
import { InputFormatError, InputDataError } from '../io-errors';

export class DataImporterV0 implements IDataImporter {

    async isDataFormatSupported(data: any): Promise<boolean> {
        const containsRawData =
            data.hasOwnProperty('stations') &&
            data.hasOwnProperty('deliveries') &&
            data.hasOwnProperty('deliveriesRelations');
        const containsDataWithSettings =
            data.hasOwnProperty('elements') &&
            data.hasOwnProperty('layout') &&
            data.hasOwnProperty('gisLayout') &&
            data.hasOwnProperty('graphSettings');
        return containsRawData || containsDataWithSettings;
    }

    async preprocessData(data: any, fclData: FclData): Promise<void> {
        if (await this.isDataFormatSupported(data)) {

            const containsRawData =
                data.hasOwnProperty('stations') &&
                data.hasOwnProperty('deliveries') &&
                data.hasOwnProperty('deliveriesRelations');

            if (containsRawData) {
                this.preprocessRawData(data, fclData);
            } else {
                this.preprocessDataWithSettings(data, fclData);
            }
            importSamples(data, fclData);
            fclData.graphSettings.highlightingSettings = createDefaultHighlights();
        } else {
            throw new InputFormatError();
        }

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
            stationsById[d.source].outgoing.push(d.id);
            stationsById[d.target].incoming.push(d.id);

            deliveriesById[d.id] = d;
        }

        for (const r of data.deliveriesRelations) {
            const sourceD = deliveriesById[r.source];
            const targetD = deliveriesById[r.target];

            if (sourceD.target !== targetD.source) {
                throw new InputDataError('Invalid delivery relation: ' + JSON.stringify(r));
            }

            stationsById[sourceD.target].connections.push(r);
        }
        this.applyElements(data.stations, data.deliveries, fclData);
        return true;
    }

    private preprocessDataWithSettings(data: any, fclData: FclData): boolean {
        const graphSettings: GraphSettings = {
            ...fclData.graphSettings,
            type:  data.graphSettings.type || fclData.graphSettings.type,
            nodeSize: data.graphSettings.nodeSize || fclData.graphSettings.nodeSize,
            fontSize: data.graphSettings.fontSize || fclData.graphSettings.fontSize,
            mergeDeliveriesType: (
                data.graphSettings.mergeDeliveries !== null && data.graphSettings.mergeDeliveries !== undefined ?
                (data.graphSettings.mergeDeliveries ? MergeDeliveriesType.MERGE_ALL : MergeDeliveriesType.NO_MERGE) :
                fclData.graphSettings.mergeDeliveriesType
            ),
            skipUnconnectedStations:
                data.graphSettings.skipUnconnectedStations != null ?
                data.graphSettings.skipUnconnectedStations :
                fclData.graphSettings.skipUnconnectedStations,
            showLegend: data.graphSettings.showLegend != null ? data.graphSettings.showLegend : fclData.graphSettings.showLegend,
            showZoom: data.graphSettings.showZoom != null ? data.graphSettings.showZoom : fclData.graphSettings.showZoom,
            schemaLayout: data.layout,
            gisLayout: data.gisLayout
        };

        fclData.graphSettings = graphSettings,
        this.applyElements(data.elements.stations, data.elements.deliveries, fclData);
        return true;
    }

    private applyElements(stationElements: any[], deliveryElements: any[], fclData: FclData) {
        const ids: Set<string> = new Set();

        for (const e of stationElements.concat(deliveryElements)) {
            const id: string = e.id;

            if (ids.has(id)) {
                throw new InputDataError('Duplicate id: ' + id);
            }

            if (id.includes(Constants.ARROW_STRING)) {
                throw new InputDataError('ids are not allowed to contain "' + Constants.ARROW_STRING + '"');
            }

            ids.add(id);
        }

        for (const d of deliveryElements) {
            const lot: string = d.lot;

            if (lot != null && lot.includes(Constants.ARROW_STRING)) {
                throw new InputDataError('lots are not allowed to contain "' + Constants.ARROW_STRING + '"');
            }
        }

        this.applyStations(stationElements, fclData);
        this.applyDeliveries(deliveryElements, fclData);
    }

    private applyStations(elements: any[], fclData: FclData) {
        const defaultKeys: Set<string> = new Set(Constants.STATION_PROPERTIES.toArray());

        for (const e of elements) {
            const properties: { name: string, value: string }[] = [];

            for (const key of Object.keys(e)) {
                if (!defaultKeys.has(key)) {
                    properties.push({ name: key, value: e[key] });
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
                    properties: e.properties != null ? e.properties : properties
                });
            } else {
                fclData.groupSettings.push({
                    id: e.id,
                    name: e.name,
                    contains: e.contains,
                    groupType: null
                });
            }
            const weight = e.weight != null ? e.weight : (e.outbreak ? 1 : 0);
            fclData.tracingSettings.stations.push({
                id: e.id,
                weight: weight,
                outbreak: weight > 0,
                observed: e.observed != null ? e.observed : ObservedType.NONE,
                crossContamination: e.crossContamination != null ? e.crossContamination : false,
                killContamination: e.killContamination != null ? e.killContamination : false
            });

            if (e.invisible) {
                fclData.graphSettings.highlightingSettings.invisibleStations.push(e.id);
            }
            if (e.selected) {
                fclData.graphSettings.highlightingSettings.invisibleStations.push(e.id);
            }
            if (e.position) {
                fclData.graphSettings.stationPositions[e.id] = e.position;
            }
        }
    }

    private applyDeliveries(elements: any[], fclData: FclData) {
        const defaultKeys: Set<string> = new Set(Constants.DELIVERY_PROPERTIES.toArray());

        for (const e of elements) {
            const properties: { name: string, value: string }[] = [];

            for (const key of Object.keys(e)) {
                if (!defaultKeys.has(key)) {
                    properties.push({ name: key, value: e[key] });
                }
            }

            fclData.fclElements.deliveries.push({
                id: e.id,
                name: e.name != null ? e.name : e.id,
                lot: e.lot,
                lotKey: (e.originalSource || e.source) + '|' + (e.name || e.id) + '|' + (e.lot || e.id),
                date: Utils.dateToString(Utils.stringToDate(e.date)),
                source: e.originalSource || e.source,
                target: e.originalTarget || e.target,
                properties: e.properties != null ? e.properties : properties
            });

            fclData.tracingSettings.deliveries.push({
                id: e.id,
                weight: e.weight != null ? e.weight : 0,
                observed: e.observed != null ? e.observed : ObservedType.NONE,
                crossContamination: e.crossContamination != null ? e.crossContamination : false,
                killContamination: e.killContamination != null ? e.killContamination : false
            });

            if (e.selected) {
                fclData.graphSettings.selectedElements.deliveries.push(e.id);
            }
        }
    }
}
