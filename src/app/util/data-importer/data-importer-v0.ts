import { DeliveryData, FclData, FclElements, GraphSettings, ObservedType, StationData, TableSettings } from './../datatypes';

import { Utils } from './../utils';
import { Constants } from './../constants';

import { IDataImporter } from './datatypes';
import { importSamples } from './sample-importer-v1';

export class DataImporterV0 implements IDataImporter {

    async isDataFormatSupported(data: any): Promise<boolean> {
        const containsRawData = data.hasOwnProperty('stations') && data.hasOwnProperty('deliveries')
        && data.hasOwnProperty('deliveriesRelations');
        const containsDataWithSettings = data.hasOwnProperty('elements')
        && data.hasOwnProperty('layout') && data.hasOwnProperty('gisLayout')
        && data.hasOwnProperty('graphSettings') && data.hasOwnProperty('tableSettings');
        return containsRawData || containsDataWithSettings;
    }

    async preprocessData(data: any, fclData: FclData): Promise<void> {
        if (await this.isDataFormatSupported(data)) {

            const containsRawData = data.hasOwnProperty('stations') && data.hasOwnProperty('deliveries')
            && data.hasOwnProperty('deliveriesRelations');
            const containsDataWithSettings = data.hasOwnProperty('elements')
            && data.hasOwnProperty('layout') && data.hasOwnProperty('gisLayout')
            && data.hasOwnProperty('graphSettings') && data.hasOwnProperty('tableSettings');

            if (containsRawData) {
                this.preprocessRawData(data, fclData);
            } else {
                this.preprocessDataWithSettings(data, fclData);
            }
            importSamples(data, fclData);
        } else {
            throw new SyntaxError('Invalid data format');
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
                throw new SyntaxError('Invalid delivery relation: ' + JSON.stringify(r));
            }

            stationsById[sourceD.target].connections.push(r);
        }
        fclData.elements = this.createElements(data.stations, data.deliveries);
        return true;
    }

    private preprocessDataWithSettings(data: any, fclData: FclData): boolean {
        const graphSettings: GraphSettings = {
            type: data.graphSettings.type != null ? data.graphSettings.type : Constants.DEFAULT_GRAPH_TYPE,
            nodeSize: data.graphSettings.nodeSize != null ? data.graphSettings.nodeSize : Constants.DEFAULT_GRAPH_NODE_SIZE,
            fontSize: data.graphSettings.fontSize != null ? data.graphSettings.fontSize : Constants.DEFAULT_GRAPH_FONT_SIZE,
            mergeDeliveries: data.graphSettings.mergeDeliveries != null
            ? data.graphSettings.mergeDeliveries : Constants.DEFAULT_GRAPH_MERGE_DELIVERIES,
            skipUnconnectedStations: Constants.DEFAULT_SKIP_UNCONNECTED_STATIONS,
            showLegend: data.graphSettings.showLegend != null ? data.graphSettings.showLegend : Constants.DEFAULT_GRAPH_SHOW_LEGEND,
            showZoom: data.graphSettings.showZoom != null ? data.graphSettings.showZoom : Constants.DEFAULT_GRAPH_SHOW_ZOOM
        };
        const tableSettings: TableSettings = {
            mode: data.tableSettings.mode != null ? data.tableSettings.mode : Constants.DEFAULT_TABLE_MODE,
            width: data.tableSettings.width != null ? data.tableSettings.width : Constants.DEFAULT_TABLE_WIDTH,
            stationColumns: data.tableSettings.stationColumns != null
            ? data.tableSettings.stationColumns : Constants.DEFAULT_TABLE_STATION_COLUMNS.toArray(),
            deliveryColumns: data.tableSettings.deliveryColumns != null
            ? data.tableSettings.deliveryColumns : Constants.DEFAULT_TABLE_DELIVERY_COLUMNS.toArray(),
            showType: data.tableSettings.showType != null ? data.tableSettings.showType : Constants.DEFAULT_TABLE_SHOW_TYPE
        };

        fclData.elements = this.createElements(data.elements.stations, data.elements.deliveries);
        fclData.layout = data.layout,
        fclData.gisLayout = data.gisLayout,
        fclData.graphSettings = graphSettings,
        fclData.tableSettings = tableSettings;
        return true;
    }

    private createElements(stationElements: any[], deliveryElements: any[]): FclElements {
        const ids: Set<string> = new Set();

        for (const e of stationElements.concat(deliveryElements)) {
            const id: string = e.id;

            if (ids.has(id)) {
                throw new SyntaxError('Duplicate id: ' + id);
            }

            if (id.includes(Constants.ARROW_STRING)) {
                throw new SyntaxError('ids are not allowed to contain "' + Constants.ARROW_STRING + '"');
            }

            ids.add(id);
        }

        for (const d of deliveryElements) {
            const lot: string = d.lot;

            if (lot != null && lot.includes(Constants.ARROW_STRING)) {
                throw new SyntaxError('lots are not allowed to contain "' + Constants.ARROW_STRING + '"');
            }
        }

        return {
            stations: this.createStations(stationElements),
            deliveries: this.createDeliveries(deliveryElements),
            samples: null
        };
    }

    private createStations(elements: any[]): StationData[] {
        const stations: StationData[] = [];
        const defaultKeys: Set<string> = new Set(Constants.STATION_PROPERTIES.toArray());

        for (const e of elements) {
            const properties: { name: string, value: string }[] = [];

            for (const key of Object.keys(e)) {
                if (!defaultKeys.has(key)) {
                    properties.push({ name: key, value: e[key] });
                }
            }

            stations.push({
                id: e.id,
                name: e.name,
                lat: e.lat != null ? e.lat : 0.0,
                lon: e.lon != null ? e.lon : 0.0,
                incoming: e.incoming,
                outgoing: e.outgoing,
                connections: e.connections,
                invisible: e.invisible != null ? e.invisible : false,
                contained: e.contained != null ? e.contained : false,
                contains: e.contains != null ? e.contains : null,
                groupType: null,
                selected: e.selected != null ? e.selected : false,
                observed: e.observed != null ? e.observed : ObservedType.NONE,
                forward: e.forward != null ? e.forward : false,
                backward: e.backward != null ? e.backward : false,
                outbreak: e.outbreak != null ? e.outbreak : false,
                crossContamination: e.crossContamination != null ? e.crossContamination : false,
                killContamination: e.killContamination != null ? e.killContamination : false,
                weight: e.weight != null ? e.weight : 0,
                score: e.score != null ? e.score : 0,
                commonLink: e.commonLink != null ? e.commonLink : false,
                position: e.position != null ? e.position : null,
                positionRelativeTo: e.positionRelativeTo != null ? e.positionRelativeTo : null,
                properties: e.properties != null ? e.properties : properties
            });
        }

        return stations;
    }

    private createDeliveries(elements: any[]): DeliveryData[] {
        const deliveries: DeliveryData[] = [];
        const defaultKeys: Set<string> = new Set(Constants.DELIVERY_PROPERTIES.toArray());

        for (const e of elements) {
            const properties: { name: string, value: string }[] = [];

            for (const key of Object.keys(e)) {
                if (!defaultKeys.has(key)) {
                    properties.push({ name: key, value: e[key] });
                }
            }

            deliveries.push({
                id: e.id,
                name: e.name != null ? e.name : e.id,
                lot: e.lot,
                lotKey: (e.originalSource || e.source) + '|' + (e.name || e.id) + '|' + (e.lot || e.id),
                date: Utils.dateToString(Utils.stringToDate(e.date)),
                source: e.source,
                target: e.target,
                originalSource: e.originalSource != null ? e.originalSource : e.source,
                originalTarget: e.originalTarget != null ? e.originalTarget : e.target,
                invisible: e.invisible != null ? e.invisible : false,
                selected: e.selected != null ? e.selected : false,
                observed: e.observed != null ? e.observed : ObservedType.NONE,
                crossContamination: e.crossContamination != null ? e.crossContamination : false,
                killContamination: e.killContamination != null ? e.killContamination : false,
                forward: e.forward != null ? e.forward : false,
                backward: e.backward != null ? e.backward : false,
                score: e.score != null ? e.score : 0,
                weight: e.weight != null ? e.weight : 0,
                properties: e.properties != null ? e.properties : properties
            })
            ;
        }

        return deliveries;
    }
}
