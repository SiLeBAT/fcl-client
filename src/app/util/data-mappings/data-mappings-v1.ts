import {
  Color,
  DeliveryData,
  GraphType,
  ShowType,
  Size,
  GroupType,
  StationData,
  Connection,
  TableMode,
  FclData,
  ObservedType
} from './../datatypes';
import { List, Map as ImmutableMap } from 'immutable';
import { Utils } from './../utils';
import { combineAll } from 'rxjs/operators';
import { analyzeAndValidateNgModules } from '@angular/compiler';

export interface ColumnInfo {
    columnId: string;
    type: string;
}

export class Constants {
    static readonly DATA: string = 'data';
    static readonly STATION_TABLE: string = 'stations';
    static readonly DELIVERY_TABLE: string = 'deliveries';
    static readonly DELIVERY_TO_DELIVERY_TABLE: string = 'deliveryRelations';
    static readonly TABLE_COLUMNS: string = 'columnProperties';
    static readonly TABLE_DATA: string = 'data';
    static readonly GROUP_DATA: string = 'settings.metaNodes';
    static readonly TRACING_DATA: string = 'tracing';
    static readonly VIEW_SETTINGS: string = 'settings.view';
    static readonly SHOW_GIS: string = 'showGis';
    static readonly SHOW_LEGEND: string = 'showLegend';
    static readonly MERGE_DELIVERIES: string = 'edge.joinEdges';
    static readonly SKIP_UNCONNECTED_STATIONS: string = 'node.skipEdgelessNodes';
    static readonly GISGRAPH_TRANSFORMATION: string = 'gis.transformation';
    static readonly SCHEMAGRAPH_TRANSFORMATION: string = 'graph.transformation';
    static readonly SCHEMAGRAPH_NODE_SIZE: string = 'graph.node.minSize';
    static readonly GISGRAPH_NODE_SIZE: string = 'gis.node.minSize';
    static readonly SCHEMAGRAPH_FONT_SIZE: string = 'graph.text.fontSize';
    static readonly GISGRAPH_FONT_SIZE: string = 'gis.text.fontSize';
    static readonly TRACING_DATA_STATIONS = 'nodes';
    static readonly TRACING_DATA_DELIVERIES = 'deliveries';
    static readonly NODE_POSITIONS = 'graph.node.positions';

    static readonly STATION_PROP_INT_TO_EXT_MAP: ImmutableMap<
    string,
    ColumnInfo
  > = ImmutableMap({
      id: { columnId: 'ID', type: 'string' },
      name: { columnId: 'Name', type: 'string' },
      lat: { columnId: 'GeocodingLatitude', type: 'double' },
      lon: {
          columnId: 'GeocodingLongitude',
          type: 'double'
      } /* ,
    lot: {name: 'Lot', color: null},
    date: {name: 'Date', color: null},
    source: {name: 'Source', color: null},
    target: {name: 'Target', color: null},
    originalSource: {name: 'Original Source', color: null},
    originalTarget: {name: 'Original Target', color: null},
    incoming: {name: 'Incoming', color: null},
    outgoing: {name: 'Outgoing', color: null},
    contains: {name: 'Contains', color: null},
    forward: {name: 'Forward Trace', color: {r: 150, g: 255, b: 75}},
    backward: {name: 'Backward Trace', color: {r: 255, g: 150, b: 75}},
    observed: {name: 'Observed', color: {r: 75, g: 150, b: 255}},
    outbreak: {name: 'Outbreak', color: {r: 255, g: 50, b: 50}},
    crossContamination: {name: 'Cross Contamination', color: {r: 150, g: 150, b: 150}},
    commonLink: {name: 'Common Link', color: {r: 255, g: 255, b: 75}},
    score: {name: 'Score', color: null}*/
  });

    static readonly DELIVERY_PROP_INT_TO_EXT_MAP: ImmutableMap<
    string,
    ColumnInfo
  > = ImmutableMap({
      id: { columnId: 'ID', type: 'string' },
      name: { columnId: 'Name', type: 'string' },
      source: { columnId: 'from', type: 'string' },
      target: { columnId: 'to', type: 'string' },
      lot: { columnId: 'Lot ID', type: 'string' }
    /* ,
    lot: {name: 'Lot', color: null},
    date: {name: 'Date', color: null},
    source: {name: 'Source', color: null},
    target: {name: 'Target', color: null},
    originalSource: {name: 'Original Source', color: null},
    originalTarget: {name: 'Original Target', color: null},
    incoming: {name: 'Incoming', color: null},
    outgoing: {name: 'Outgoing', color: null},
    contains: {name: 'Contains', color: null},
    forward: {name: 'Forward Trace', color: {r: 150, g: 255, b: 75}},
    backward: {name: 'Backward Trace', color: {r: 255, g: 150, b: 75}},
    observed: {name: 'Observed', color: {r: 75, g: 150, b: 255}},
    outbreak: {name: 'Outbreak', color: {r: 255, g: 50, b: 50}},
    crossContamination: {name: 'Cross Contamination', color: {r: 150, g: 150, b: 150}},
    commonLink: {name: 'Common Link', color: {r: 255, g: 255, b: 75}},
    score: {name: 'Score', color: null}*/
  });

    static readonly DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_ID_NEXT: ImmutableMap<
    string,
    ColumnInfo
  > = ImmutableMap({
      source: { columnId: 'ID', type: 'string' },
      target: {
          columnId: 'Next',
          type: 'string'
      } /* ,
    lot: {name: 'Lot', color: null},
    date: {name: 'Date', color: null},
    source: {name: 'Source', color: null},
    target: {name: 'Target', color: null},
    originalSource: {name: 'Original Source', color: null},
    originalTarget: {name: 'Original Target', color: null},
    incoming: {name: 'Incoming', color: null},
    outgoing: {name: 'Outgoing', color: null},
    contains: {name: 'Contains', color: null},
    forward: {name: 'Forward Trace', color: {r: 150, g: 255, b: 75}},
    backward: {name: 'Backward Trace', color: {r: 255, g: 150, b: 75}},
    observed: {name: 'Observed', color: {r: 75, g: 150, b: 255}},
    outbreak: {name: 'Outbreak', color: {r: 255, g: 50, b: 50}},
    crossContamination: {name: 'Cross Contamination', color: {r: 150, g: 150, b: 150}},
    commonLink: {name: 'Common Link', color: {r: 255, g: 255, b: 75}},
    score: {name: 'Score', color: null}*/
  });

    static readonly DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_FROM_TO: ImmutableMap<
    string,
    ColumnInfo
  > = ImmutableMap({
      source: { columnId: 'from', type: 'string' },
      target: {
          columnId: 'to',
          type: 'string'
      } /* ,
    lot: {name: 'Lot', color: null},
    date: {name: 'Date', color: null},
    source: {name: 'Source', color: null},
    target: {name: 'Target', color: null},
    originalSource: {name: 'Original Source', color: null},
    originalTarget: {name: 'Original Target', color: null},
    incoming: {name: 'Incoming', color: null},
    outgoing: {name: 'Outgoing', color: null},
    contains: {name: 'Contains', color: null},
    forward: {name: 'Forward Trace', color: {r: 150, g: 255, b: 75}},
    backward: {name: 'Backward Trace', color: {r: 255, g: 150, b: 75}},
    observed: {name: 'Observed', color: {r: 75, g: 150, b: 255}},
    outbreak: {name: 'Outbreak', color: {r: 255, g: 50, b: 50}},
    crossContamination: {name: 'Cross Contamination', color: {r: 150, g: 150, b: 150}},
    commonLink: {name: 'Common Link', color: {r: 255, g: 255, b: 75}},
    score: {name: 'Score', color: null}*/
  });

    static readonly GROUPTYPE_EXT_TO_INT_MAP: ImmutableMap<
    string,
    GroupType
  > = ImmutableMap({
      SimpleChain: GroupType.SIMPLE_CHAIN
  });

    static readonly NODE_SIZE_EXT_TO_INT_MAP: ImmutableMap<
    string,
    Size
  > = ImmutableMap({
      '4': Size.SMALL,
      '6': Size.SMALL,
      '10': Size.SMALL,
      '14': Size.MEDIUM,
      '20': Size.MEDIUM,
      '30': Size.LARGE
  });

    static readonly FONT_SIZE_EXT_TO_INT_MAP: ImmutableMap<
    string,
    Size
  > = ImmutableMap({
      '10': Size.SMALL,
      '12': Size.SMALL,
      '14': Size.MEDIUM,
      '18': Size.MEDIUM,
      '24': Size.LARGE
  });
}

/*
export function convertFromExternalData(data: any, fclData: FclData) {
    const idToStationMap: Map<string, StationData> = convertExternalStations(data, fclData);
    const idToDeliveryMap: Map<string, DeliveryData> = convertExternalDeliveries(data, fclData, idToStationMap);
    convertExternalGroupData(data, fclData, idToStationMap);
    convertExternalTracingData(data, fclData, idToStationMap, idToDeliveryMap);
    convertExternalViewSettings(data, fclData, idToStationMap);
}

function convertExternalStations(data: any, fclData: FclData): Map<string, StationData> {
    const rawData: any = data[Constants.DATA];
    const stationTable: any = rawData[Constants.STATION_TABLE];
    const extStations: any = stationTable[Constants.TABLE_DATA];
    const intStations: StationData[] = [];
    const extToIntPropMap: Map<string, string> = createReverseMap(Constants.STATION_PROP_INT_TO_EXT_MAP);

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
            invisible: null,
            contained: null,
            contains: null,
            groupType: null,
            selected: false,
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
            properties: extStation.properties
        };

        intStations.push(intStation);
        idToStationMap.set(intStation.id, intStation);
    }

    fclData.elements.stations = intStations;
    return idToStationMap;
}

function convertExternalDeliveries(data: any, fclData: FclData, idToStationMap: Map<string, StationData>): Map<string, DeliveryData> {
    const rawData: any = data[Constants.DATA];
    const deliveryTable: any = rawData[Constants.DELIVERY_TABLE];

    const extDeliveries: any = deliveryTable[Constants.TABLE_DATA];
    const intDeliveries: DeliveryData[] = [];
    const extToIntPropMap: Map<string, string> = createReverseMap(Constants.DELIVERY_PROP_INT_TO_EXT_MAP);

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
            invisible: null,
            selected: null,
            crossContamination: null,
            killContamination: null,
            observed: null,
            forward: null,
            backward: null,
            weight: null,
            score: null,
            properties: extDelivery.properties
        };

        intDeliveries.push(intDelivery);
        idToDeliveryMap.set(intDelivery.id, intDelivery);
    }

    fclData.elements.deliveries = intDeliveries;

    convertExternalDeliveryToDelivery(data, idToStationMap, idToDeliveryMap);
    return idToDeliveryMap;
}

function convertExternalDeliveryToDelivery(data: any,
    idToStationMap: Map<string, StationData>, idToDeliveryMap: Map<string, DeliveryData>) {

    const rawData: any = data[Constants.DATA];
    const delToDelTable: any = rawData[Constants.DELIVERY_TO_DELIVERY_TABLE];
    const extDelToDels: any = delToDelTable[Constants.TABLE_DATA];
    const extToIntPropMap: Map<string, string> = createReverseMap(Constants.DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP);

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

function convertExternalGroupData(data: any, fclData: FclData, idToStationMap: Map<string, StationData>) {
    const extGroups: any = getProperty(data, Constants.GROUP_DATA);
    if (extGroups == null) { return; }

    const stationIds: Set<string> = new Set(Array.from(idToStationMap.keys()));

    // const extToIntGroupTypeMap: Map<string, string> = Utils.createReverseMap(Constants.GROUPTYPE_INT_TO_EXT_MAP, (v: string) => v);

    for (const extGroup of extGroups) {
        if (extGroup.id === null) {
            throw new SyntaxError('Metanode id is missing.');
        }

        if (idToStationMap.has(extGroup.id)) {
            throw new SyntaxError('Metanode id \"' + extGroup.id + '\" is not unique.');
        }

        if (extGroup.members === null) {
            throw new SyntaxError('Missing members in group \"' + extGroup.id + '\".');
        }

        if (!Array.isArray(extGroup.members)) {
            throw new SyntaxError('Property members of group \"' + extGroup.id + '\" is not an array.');
        }

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
            if (!Constants.GROUPTYPE_EXT_TO_INT_MAP.has(extGroup.type)) { // }  extToIntGroupTypeMap.has(extGroup.type)) {
                throw new SyntaxError('Unknown metanode type \"' + extGroup.type + '\" of group \"' + extGroup.id + '\".');
            }
            // intGroup.groupType = GroupType[extToIntGroupTypeMap.get(extGroup.type) as keyof typeof GroupType];
            intGroup.groupType = Constants.GROUPTYPE_EXT_TO_INT_MAP.get(extGroup.type);
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

function convertExternalTracingData(data: any, fclData: FclData,
    idToStationMap: Map<string, StationData>, idToDeliveryMap: Map<string, DeliveryData>) {

    const tracingData: any = getProperty(data, Constants.TRACING_DATA);
    if (tracingData == null) { return; }

    const stationTracings: any = getProperty(tracingData, Constants.TRACING_DATA_STATIONS);
    const deliveryTracings: any = getProperty(tracingData, Constants.TRACING_DATA_DELIVERIES);

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
            this.checkTracingProps(element, ['weight', 'crossContamination', 'observed', 'killContamination']);
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

        if (!idToStationMap.has(element.id)) {
            throw new SyntaxError('Delivery id \"' + element.id + '\" is unkown.');
        }

        const delivery: DeliveryData = idToDeliveryMap.get(element.id);

        this.checkTracingProps(element, ['weight', 'crossContamination', 'observed', 'killContamination']);

        delivery.weight = element.weight;
        delivery.crossContamination = element.crossContamination;
        delivery.killContamination = element.killContamination;
        delivery.observed = (element.observed === true ? ObservedType.FULL : ObservedType.NONE);
    }
}

function convertExternalViewSettings(data: any, fclData: FclData, idToStationMap: Map<string, StationData>) {
    const viewData: any = getProperty(data, Constants.VIEW_SETTINGS);

    if ( viewData === null) { return; }

    let nodeSize: any = getProperty(viewData, Constants.SCHEMAGRAPH_NODE_SIZE);
    if (nodeSize === null) {
        nodeSize = getProperty(viewData, Constants.GISGRAPH_NODE_SIZE);
    }
    if (nodeSize !== null && Constants.NODE_SIZE_EXT_TO_INT_MAP.has(nodeSize)) {
        fclData.graphSettings.nodeSize = Constants.NODE_SIZE_EXT_TO_INT_MAP.get(nodeSize);
    }

    let fontSize: any = getProperty(viewData, Constants.SCHEMAGRAPH_FONT_SIZE);
    if (fontSize === null) {
        fontSize = getProperty(viewData, Constants.GISGRAPH_FONT_SIZE);
    }
    if (fontSize !== null && Constants.FONT_SIZE_EXT_TO_INT_MAP.has(fontSize)) {
        fclData.graphSettings.fontSize = Constants.FONT_SIZE_EXT_TO_INT_MAP.get(fontSize);
    }

    const mergeDeliveries: any = getProperty(viewData, Constants.MERGE_DELIVERIES);
    if (mergeDeliveries !== null) {
        fclData.graphSettings.mergeDeliveries = mergeDeliveries;
    }

    const showLegend: any = getProperty(viewData, Constants.SHOW_LEGEND);
    if (showLegend !== null) {
        fclData.graphSettings.showLegend = showLegend;
    }

    // fclData.graphSettings.showZoom =
    const skipUnconnectedStations: any = getProperty(viewData, Constants.SKIP_UNCONNECTED_STATIONS);
    if (skipUnconnectedStations !== null) {
        fclData.graphSettings.skipUnconnectedStations = skipUnconnectedStations;
    }

    const showGis: any = getProperty(viewData, Constants.SHOW_GIS);
    if (showGis !== null) {
        fclData.graphSettings.type = (showGis === true ? GraphType.GIS : GraphType.GRAPH);
    }

    fclData.gisLayout = convertExternalTransformation(getProperty(viewData, Constants.GISGRAPH_TRANSFORMATION));
    fclData.layout = convertExternalTransformation(getProperty(viewData, Constants.SCHEMAGRAPH_TRANSFORMATION));
    // fclData.tableSettings.

    convertExternalPositions(viewData, idToStationMap);
}

function convertExternalTransformation(extTransformation: any): Layout {
    const scale: any = getProperty(extTransformation, 'scale.x');
    const translation_x: any = getProperty(extTransformation, 'translation.x');
    const translation_y: any = getProperty(extTransformation, 'translation.y');

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

function convertExternalPositions(viewData: any, idToStationMap: Map<string, StationData>) {
    const nodePositions: any = getProperty(viewData, Constants.NODE_POSITIONS);
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

function createReverseMap(map: ImmutableMap<string, ColumnInfo>): Map<string, string> {
    const result: Map<string, string> = new Map();
    map.forEach((value: ColumnInfo, key: string) => result.set(value.columnId, key));
    return result;
}

function getProperty(data: any, path: string): any {

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

function checkTracingProps(data: any, propNames: string[], context: string) {
    for (const propName of propNames) {
        if (!data.hasOwnProperty(propName)) {
            throw new SyntaxError('Property \"' + propName + '\" is missing in ' + context);
        } else if (data[propName] === null) {
            throw new SyntaxError('Property \"' + propName + '\" is null in ' + context);
        }
    }
}*/
