import {DeliveryData, FclData, ObservedType, StationData, Connection, GroupType, Layout, GraphType} from '../datatypes';
import {Http} from '@angular/http';

import {Utils} from '../utils';
import {Constants} from '../constants';
import {Constants as JsonConstants, ColumnInfo} from './../data-mappings/data-mappings-v1';
import {List, Map as ImmutableMap} from 'immutable';

import {IDataImporter} from './datatypes';
import * as Ajv from 'ajv';
import {isValidJson} from './shared';

const JSON_SCHEMA_FILE = '../../assets/schema/schema-v1.json';

export class DataImporterV1 implements IDataImporter {

    constructor(private http: Http) {
    }

    async isDataFormatSupported(data: any): Promise<boolean> {
        /*return data.hasOwnProperty(JsonConstants.DATA) && data[JsonConstants.DATA] !== null &&
         data[JsonConstants.DATA].hasOwProperty(JsonConstants.STATION_TABLE) &&
         data[JsonConstants.DATA].hasOwProperty(JsonConstants.DELIVERY_TABLE) &&
         data[JsonConstants.DATA].hasOwProperty(JsonConstants.DELIVERY_TO_DELIVERY_TABLE);
*/
         const schema = await this.loadSchema();
         // const result = await isValidJson(schema, data);
         return await isValidJson(schema, data);
    }

    async preprocessData(data: any, fclData: FclData): Promise<void> {
        if (await this.isDataFormatSupported(data)) {
            this.convertExternalData(data, fclData);
        } else {
            throw new SyntaxError('Invalid data format');
        }
    }

    private async loadSchema(): Promise<any> {
        return await Utils.getJson(JSON_SCHEMA_FILE, this.http);
        /*return this.http.get(JSON_SCHEMA_FILE)
        .toPromise()
        .then(response => {
          return response.json();
        }).catch(error => Promise.reject(error));*/
    }

    private convertExternalData(data: any, fclData: FclData) {
        const idToStationMap: Map<string, StationData> = this.convertExternalStations(data, fclData);
        const idToDeliveryMap: Map<string, DeliveryData> = this.convertExternalDeliveries(data, fclData, idToStationMap);
        this.convertExternalGroupData(data, fclData, idToStationMap);
        this.convertExternalTracingData(data, fclData, idToStationMap, idToDeliveryMap);
        this.convertExternalViewSettings(data, fclData, idToStationMap);
    }

    private convertExternalStations(data: any, fclData: FclData): Map<string, StationData> {
        const rawData: any = data[JsonConstants.DATA];
        const stationTable: any = rawData[JsonConstants.STATION_TABLE];
        const extStations: any = stationTable[JsonConstants.TABLE_DATA];
        const intStations: StationData[] = [];
        const extToIntPropMap: Map<string, string> = this.createReverseMap(JsonConstants.STATION_PROP_INT_TO_EXT_MAP);

        const idToStationMap: Map<string, StationData> = new Map();

        for (const extStation of extStations) {
            extStation.properties = [];
            for (const property of extStation) {
                if (extToIntPropMap.has(property.id)) {
                    extStation[extToIntPropMap.get(property.id)] = property.value;
                } else {
                    extStation.properties.push({
                        name: property.id,
                        value: property.value
                    });
                }
            }

            if (extStation.id === null) {
                throw new SyntaxError('Missing station id.');
            }

            if (idToStationMap.has(extStation.id)) {
                throw new SyntaxError('Duplicate station id:' + extStation.id);
            }

            const intStation: StationData = {
                id: extStation.id,
                name: extStation.name,
                lat: extStation.lat,
                lon: extStation.lon,
                incoming: [],
                outgoing: [],
                connections: [],
                invisible: false,
                contained: false,
                contains: null,
                groupType: null,
                selected: false,
                observed: ObservedType.NONE,
                forward: null,
                backward: null,
                outbreak: false,
                weight: 0.0,
                crossContamination: false,
                killContamination: false,
                score: null,
                commonLink: null,
                position: null,
                positionRelativeTo: null,
                properties: extStation.properties
            };

            intStations.push(intStation);
            idToStationMap.set(intStation.id, intStation);
        }

        fclData.elements.stations = intStations;
        return idToStationMap;
    }

    private convertExternalDeliveries(data: any, fclData: FclData, idToStationMap: Map<string, StationData>): Map<string, DeliveryData> {
        const rawData: any = data[JsonConstants.DATA];
        const deliveryTable: any = rawData[JsonConstants.DELIVERY_TABLE];

        const extDeliveries: any = deliveryTable[JsonConstants.TABLE_DATA];
        const intDeliveries: DeliveryData[] = [];
        const extToIntPropMap: Map<string, string> = this.createReverseMap(JsonConstants.DELIVERY_PROP_INT_TO_EXT_MAP);

        // const idToStationMap: Map<string, StationData> = Utils.arrayToMap(fclData.elements.stations, (s: StationData) => s.id);
        const idToDeliveryMap: Map<string, DeliveryData> = new Map();

        for (const extDelivery of extDeliveries) {
            extDelivery.properties = [];
            for (const property of extDelivery) {
                if (extToIntPropMap.has(property.id)) {
                    extDelivery[extToIntPropMap.get(property.id)] = property.value;
                } else {
                    extDelivery.properties.push({
                        name: property.id,
                        value: property.value
                    });
                }
            }

            if (extDelivery.id === null) {
                throw new SyntaxError('Missing delivery id.');
            }

            if (idToDeliveryMap.has(extDelivery.id)) {
                throw new SyntaxError('Duplicate delivery id:' + extDelivery.id);
            }

            if (extDelivery.source === null) {
                throw new SyntaxError('Delivery source is missing for id:' + extDelivery.id);
            }

            if (!idToStationMap.has(extDelivery.source)) {
                throw new SyntaxError('Delivery source with id \"' + extDelivery.source + '\" is unkown.');
            }

            if (extDelivery.target === null) {
                throw new SyntaxError('Delivery target is missing for id:' + extDelivery.id);
            }

            if (!idToStationMap.has(extDelivery.target)) {
                throw new SyntaxError('Delivery target with id \"' + extDelivery.target + '\" is unkown.');
            }

            const intDelivery: DeliveryData = {
                id: extDelivery.id,
                name: extDelivery.name,
                lot: extDelivery.lot,
                date: extDelivery.date,
                source: extDelivery.source,
                target: extDelivery.target,
                originalSource: extDelivery.source,
                originalTarget: extDelivery.target,
                invisible: false,
                selected: false,
                crossContamination: false,
                killContamination: false,
                observed: ObservedType.NONE,
                forward: null,
                backward: null,
                weight: 0.0,
                score: null,
                properties: extDelivery.properties
            };

            idToStationMap.get(intDelivery.source).outgoing.push(intDelivery.id);
            idToStationMap.get(intDelivery.target).incoming.push(intDelivery.id);
            intDeliveries.push(intDelivery);
            idToDeliveryMap.set(intDelivery.id, intDelivery);
        }

        fclData.elements.deliveries = intDeliveries;

        this.convertExternalDeliveryToDelivery(data, idToStationMap, idToDeliveryMap);
        return idToDeliveryMap;
    }

    private convertExternalDeliveryToDelivery(data: any,
        idToStationMap: Map<string, StationData>, idToDeliveryMap: Map<string, DeliveryData>) {

        const rawData: any = data[JsonConstants.DATA];
        const delToDelTable: any = rawData[JsonConstants.DELIVERY_TO_DELIVERY_TABLE];
        const extDelToDels: any = delToDelTable[JsonConstants.TABLE_DATA];
        const colsData: any = delToDelTable[JsonConstants.TABLE_COLUMNS];
        const columnSet: Set<string> = new Set(colsData.map(col => col.id));
        const extToIntPropMap: Map<string, string> = this.createReverseMap(  
            columnSet.has('from') ? JsonConstants.DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_FROM_TO : JsonConstants.DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_ID_NEXT);

        const idToConnectionMap: Map<string, Connection> = new Map();

        for (const extDelToDel of extDelToDels) {
            for (const property of extDelToDel) {
                if (extToIntPropMap.has(property.id)) {
                    extDelToDel[extToIntPropMap.get(property.id)] = property.value;
                }
            }

            if (extDelToDel.source === null) {
                throw new SyntaxError('Missing delivery to delivery source.');
            }

            if (!idToDeliveryMap.has(extDelToDel.source)) {
                throw new SyntaxError('Unkown delivery to delivery source \"' + extDelToDel.source + '\".');
            }

            if (extDelToDel.target === null) {
                throw new SyntaxError('Missing delivery to delivery target.');
            }

            if (!idToDeliveryMap.has(extDelToDel.target)) {
                throw new SyntaxError('Unkown delivery to delivery target \"' + extDelToDel.target + '\".');
            }

            const sourceDelivery: DeliveryData = idToDeliveryMap.get(extDelToDel.source);
            const targetDelivery: DeliveryData = idToDeliveryMap.get(extDelToDel.target);

            if (sourceDelivery.target !== targetDelivery.source) {
                throw new SyntaxError('Invalid delivery relation: ' + JSON.stringify(extDelToDel));
            }

            const connection: Connection = {
                source: extDelToDel.source,
                target: extDelToDel.target
            };

            const conId: string = connection.source + '->' + connection.target;

            if (!idToConnectionMap.has(conId)) {
                idToConnectionMap.set(conId, connection);
                idToStationMap.get(idToDeliveryMap.get(connection.source).target).connections.push(connection);
            }
        }
    }

    private convertExternalGroupData(data: any, fclData: FclData, idToStationMap: Map<string, StationData>) {
        const extGroups: any = this.getProperty(data, JsonConstants.GROUP_DATA);
        if (extGroups === null) { return; }

        const stationIds: Set<string> = new Set(Array.from(idToStationMap.keys()));

        // const extToIntGroupTypeMap: Map<string, string> = Utils.createReverseMap(Constants.GROUPTYPE_INT_TO_EXT_MAP, (v: string) => v);

        for (const extGroup of extGroups) {
            /*if (extGroup.id === null) {
                throw new SyntaxError('Metanode id is missing.');
            }*/

            if (idToStationMap.has(extGroup.id)) {
                throw new SyntaxError('Metanode id \"' + extGroup.id + '\" is not unique.');
            }

            /*if (extGroup.members === null) {
                throw new SyntaxError('Missing members in group \"' + extGroup.id + '\".');
            }

            if (!Array.isArray(extGroup.members)) {
                throw new SyntaxError('Property members of group \"' + extGroup.id + '\" is not an array.');
            }*/

            for (const member of extGroup.members) {
                if (!stationIds.has(member)) {
                    throw new SyntaxError('Unknown member \"' + member + '\" in group \"' + extGroup.id + '\".');
                }
            }

            const intGroup: StationData = {
                id: extGroup.id,
                name: (extGroup.name == null ? extGroup.id : extGroup.name),
                lat: null,
                lon: null,
                incoming: null,
                outgoing: null,
                connections: null,
                invisible: null,
                contained: false,
                contains: extGroup.members,
                groupType: null,
                selected: null,
                observed: null,
                forward: null,
                backward: null,
                outbreak: null,
                weight: null,
                crossContamination: null,
                killContamination: null,
                score: null,
                commonLink: null,
                position: null,
                positionRelativeTo: null,
                properties: []
            };

            if (extGroup.type !== null) {
                if (!JsonConstants.GROUPTYPE_EXT_TO_INT_MAP.has(extGroup.type)) { // }  extToIntGroupTypeMap.has(extGroup.type)) {
                    throw new SyntaxError('Unknown metanode type \"' + extGroup.type + '\" of group \"' + extGroup.id + '\".');
                }
                // intGroup.groupType = GroupType[extToIntGroupTypeMap.get(extGroup.type) as keyof typeof GroupType];
                intGroup.groupType = JsonConstants.GROUPTYPE_EXT_TO_INT_MAP.get(extGroup.type);
            } else {

                // ToDo: temporary solution
                if (intGroup.id.startsWith('SC')) {
                    intGroup.groupType = GroupType.SIMPLE_CHAIN;
                } else if (intGroup.id.startsWith('SG:')) {
                    intGroup.groupType = GroupType.SOURCE_GROUP;
                } else if (intGroup.id.startsWith('TG:')) {
                    intGroup.groupType = GroupType.TARGET_GROUP;
                } else if (intGroup.id.startsWith('IG:')) {
                    intGroup.groupType = GroupType.ISOLATED_GROUP;
                }
            }

            fclData.elements.stations.push(intGroup);
            idToStationMap.set(intGroup.id, intGroup);
        }
    }

    private convertExternalTracingData(data: any, fclData: FclData,
        idToStationMap: Map<string, StationData>, idToDeliveryMap: Map<string, DeliveryData>) {

        const tracingData: any = this.getProperty(data, JsonConstants.TRACING_DATA);
        if (tracingData == null) { return; }

        const stationTracings: any = this.getProperty(tracingData, JsonConstants.TRACING_DATA_STATIONS);
        if (stationTracings == null) { throw new Error('Missing station tracing data.');  }

        const deliveryTracings: any = this.getProperty(tracingData, JsonConstants.TRACING_DATA_DELIVERIES);
        if (deliveryTracings == null) { throw new Error('Missing delivery tracing data.');  }

        for (const element of stationTracings) {
            if (element.id === null) {
                throw new SyntaxError('Station id is missing in tracing data.');
            }

            if (!idToStationMap.has(element.id)) {
                throw new SyntaxError('Station/Metanode id \"' + element.id + '\" is unkown.');
            }

            const station: StationData = idToStationMap.get(element.id);
            if (station.contains === null) {
                // this is not a group
                this.checkTracingProps(element, ['crossContamination', 'observed', 'killContamination'], 'station ' + station.id);
            }

            if (element.weight !== null) { station.weight = element.weight; }
            if (element.crossContamination !== null) { station.crossContamination = element.crossContamination; }
            if (element.killContamination !== null) { station.killContamination = element.killContamination; }
            if (element.observed !== null) { station.observed = (element.observed === true ? ObservedType.FULL : ObservedType.NONE); }

            station.outbreak = station.weight > 0;
        }

        for (const element of deliveryTracings) {
            if (element.id === null) {
                throw new SyntaxError('Delivery id is missing in tracing data.');
            }

            if (!idToDeliveryMap.has(element.id)) {
                // console.warn('Tracing-data-import: Delivery id \"' + element.id + '\" is unkown.');
                // continue;
                throw new SyntaxError('Tracing-data-import: Delivery id \"' + element.id + '\" is unkown.');
            }

            const delivery: DeliveryData = idToDeliveryMap.get(element.id);

            this.checkTracingProps(element, ['crossContamination', 'observed', 'killContamination'], 'delivery ' + delivery.id);

            delivery.weight = element.weight;
            delivery.crossContamination = element.crossContamination;
            delivery.killContamination = element.killContamination;
            delivery.observed = (element.observed === true ? ObservedType.FULL : ObservedType.NONE);
        }
    }

    private convertExternalViewSettings(data: any, fclData: FclData, idToStationMap: Map<string, StationData>) {
        const viewData: any = this.getProperty(data, JsonConstants.VIEW_SETTINGS);

        if ( viewData === null) { return; }

        let nodeSize: any = this.getProperty(viewData, JsonConstants.SCHEMAGRAPH_NODE_SIZE);
        if (nodeSize === null) {
            nodeSize = this.getProperty(viewData, JsonConstants.GISGRAPH_NODE_SIZE);
        }
        if (nodeSize !== null && JsonConstants.NODE_SIZE_EXT_TO_INT_MAP.has(nodeSize)) {
            fclData.graphSettings.nodeSize = JsonConstants.NODE_SIZE_EXT_TO_INT_MAP.get(nodeSize);
        }

        let fontSize: any = this.getProperty(viewData, JsonConstants.SCHEMAGRAPH_FONT_SIZE);
        if (fontSize === null) {
            fontSize = this.getProperty(viewData, JsonConstants.GISGRAPH_FONT_SIZE);
        }
        if (fontSize !== null && JsonConstants.FONT_SIZE_EXT_TO_INT_MAP.has(fontSize)) {
            fclData.graphSettings.fontSize = JsonConstants.FONT_SIZE_EXT_TO_INT_MAP.get(fontSize);
        }

        const mergeDeliveries: any = this.getProperty(viewData, JsonConstants.MERGE_DELIVERIES);
        if (mergeDeliveries !== null) {
            fclData.graphSettings.mergeDeliveries = mergeDeliveries;
        }

        const showLegend: any = this.getProperty(viewData, JsonConstants.SHOW_LEGEND);
        if (showLegend !== null) {
            fclData.graphSettings.showLegend = showLegend;
        }

        // fclData.graphSettings.showZoom =
        const skipUnconnectedStations: any = this.getProperty(viewData, JsonConstants.SKIP_UNCONNECTED_STATIONS);
        if (skipUnconnectedStations !== null) {
            fclData.graphSettings.skipUnconnectedStations = skipUnconnectedStations;
        }

        const showGis: any = this.getProperty(viewData, JsonConstants.SHOW_GIS);
        if (showGis !== null) {
            fclData.graphSettings.type = (showGis === true ? GraphType.GIS : GraphType.GRAPH);
        }

        fclData.gisLayout = this.convertExternalTransformation(this.getProperty(viewData, JsonConstants.GISGRAPH_TRANSFORMATION));
        fclData.layout = this.convertExternalTransformation(this.getProperty(viewData, JsonConstants.SCHEMAGRAPH_TRANSFORMATION));
        // fclData.tableSettings.

        this.convertExternalPositions(viewData, idToStationMap);
    }

    private convertExternalTransformation(extTransformation: any): Layout {
        const scale: any = this.getProperty(extTransformation, 'scale.x');
        const translation_x: any = this.getProperty(extTransformation, 'translation.x');
        const translation_y: any = this.getProperty(extTransformation, 'translation.y');

        if (scale !== null && translation_x !== null && translation_y !== null) {
            return {
                zoom: scale,
                pan: {
                    x: translation_x,
                    y: translation_y
                }
            };
        } else {
            return null;
        }
    }

    private convertExternalPositions(viewData: any, idToStationMap: Map<string, StationData>) {
        const nodePositions: any = this.getProperty(viewData, JsonConstants.NODE_POSITIONS);
        if (nodePositions === null) { return; }

        for (const nodePosition of nodePositions) {
            if (nodePosition.id == null) {
                throw new SyntaxError('Node position id is missing.');
            }
            if (!idToStationMap.has(nodePosition.id)) {
                throw new SyntaxError('Station of node position \"' + nodePosition.id + '\" is unkown.');
            }

            const station: StationData = idToStationMap.get(nodePosition.id);
            station.position = nodePosition.position;
        }

    }

    private createReverseMap(map: ImmutableMap<string, ColumnInfo>): Map<string, string> {
        const result: Map<string, string> = new Map();
        map.forEach((value: ColumnInfo, key: string) => result.set(value.columnId, key));
        return result;
    }

    private getProperty(data: any, path: string): any {

        if (data != null) {
            for (const propName of path.split('.')) {
                if (data.hasOwnProperty(propName)) {
                    data = data[propName];
                } else {
                    return null;
                }
                if (data === null) {
                    return null;
                }
            }
        }
        return data;
    }

    private checkTracingProps(data: any, propNames: string[], context: string) {
        for (const propName of propNames) {
            if (!data.hasOwnProperty(propName)) {
                throw new SyntaxError('Property \"' + propName + '\" is missing in ' + context);
            } else if (data[propName] === null) {
                throw new SyntaxError('Property \"' + propName + '\" is null in ' + context);
            }
        }
    }

    /*private preprocessRawData(data: any): FclData {
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

        return {
            elements: this.createElements(data.stations, data.deliveries),
            layout: null,
            gisLayout: null,
            graphSettings: DataService.getDefaultGraphSettings(),
            tableSettings: DataService.getDefaultTableSettings()
        };
    }

    private preprocessDataWithSettings(data: any): FclData {
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

        return {
            elements: this.createElements(data.elements.stations, data.elements.deliveries),
            layout: data.layout,
            gisLayout: data.gisLayout,
            graphSettings: graphSettings,
            tableSettings: tableSettings
        };
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
            deliveries: this.createDeliveries(deliveryElements)
        };
    }

    private createStations(elements: any[]): StationData[] {
        const stations: StationData[] = [];
        const defaultKeys: Set<string> = new Set(Constants.STATION_PROPERTIES.toArray());

        for (const e of elements) {
            const properties: { name: string, value: string }[] = [];

            for (const key of Object.keys(e)) {
                if (!defaultKeys.has(key)) {
                    properties.push({name: key, value: e[key]});
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
                    properties.push({name: key, value: e[key]});
                }
            }

            deliveries.push({
                id: e.id,
                name: e.name != null ? e.name : e.id,
                lot: e.lot,
                date: Utils.dateToString(Utils.stringToDate(e.date)),
                source: e.source,
                target: e.target,
                originalSource: e.originalSource != null ? e.originalSource : e.source,
                originalTarget: e.originalTarget != null ? e.originalTarget : e.target,
                invisible: e.invisible != null ? e.invisible : false,
                selected: e.selected != null ? e.selected : false,
                observed: e.observed != null ? e.observed : ObservedType.NONE,
                forward: e.forward != null ? e.forward : false,
                backward: e.backward != null ? e.backward : false,
                score: e.score != null ? e.score : 0,
                weight: e.weight != null ? e.weight : 0,
                properties: e.properties != null ? e.properties : properties
            })
            ;
        }

        return deliveries;
    }*/
}
