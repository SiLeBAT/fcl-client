import {
    DeliveryStoreData as DeliveryData, FclData, ObservedType, StationStoreData as StationData,
    Connection, GroupType, Layout, GraphType, GroupData,
    ValueCondition as IntValueCondition,
    LogicalCondition as IntLogicalCondition,
    ValueType, OperationType, NodeShapeType, LinePatternType
} from '../../data.model';
import { HttpClient } from '@angular/common/http';

import { Utils } from '../../util/non-ui-utils';
import { Constants as JsonConstants, ColumnInfo } from './../data-mappings/data-mappings-v1';
import { Map as ImmutableMap } from 'immutable';

import { IDataImporter } from './datatypes';
import { isValidJson } from './shared';
import { importSamples } from './sample-importer-v1';
import {
    ViewData,
    StationHighlightingData as ExtStationHighlightingData,
    DeliveryHighlightingData as ExtDeliveryHighlightingData,
    ValueCondition as ExtValueCondition,
    LogicalCondition as ExtLogicalCondition

} from '../ext-data-model.v1';

const JSON_SCHEMA_FILE = '../../../../assets/schema/schema-v1.json';

export class DataImporterV1 implements IDataImporter {
    constructor(private httpClient: HttpClient) {}

    async isDataFormatSupported(data: any): Promise<boolean> {
        if (data.version && typeof data.version === 'string' && data.version === '1.0.0') {
            const schema = await this.loadSchema();
            return isValidJson(schema, data, true);
        } else {
            return false;
        }
    }

    async preprocessData(data: any, fclData: FclData): Promise<void> {
        if (await this.isDataFormatSupported(data)) {
            this.convertExternalData(data, fclData);
        } else {
            throw new SyntaxError('Invalid data format');
        }
    }

    private async loadSchema(): Promise<any> {
        return Utils.getJson(JSON_SCHEMA_FILE, this.httpClient);
    }

    private convertExternalData(data: any, fclData: FclData) {
        const idToStationMap: Map<string, StationData> = this.applyExternalStations(data, fclData);
        const idToDeliveryMap: Map<string, DeliveryData> = this.applyExternalDeliveries(data, fclData, idToStationMap);
        const idToGroupMap: Map<string, GroupData> = this.applyExternalGroupData(data, fclData, idToStationMap);
        this.applyExternalTracingData(
            data,
            fclData,
            idToStationMap,
            idToGroupMap,
            idToDeliveryMap
        );
        importSamples(data, fclData);
        this.applyExternalViewSettings(data, fclData, idToStationMap, idToGroupMap);
    }

    private applyExternalStations(data: any, fclData: FclData): Map<string, StationData> {
        const rawData: any = data[JsonConstants.DATA];
        const stationTable: any = rawData[JsonConstants.STATION_TABLE];
        const extStations: any = stationTable[JsonConstants.TABLE_DATA];
        const intStations: StationData[] = [];
        const extToIntPropMap: Map<string, string> = this.createReverseMap(
            JsonConstants.STATION_PROP_INT_TO_EXT_MAP
        );

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
                properties: extStation.properties
            };

            intStations.push(intStation);
            idToStationMap.set(intStation.id, intStation);
        }

        fclData.fclElements.stations = intStations;
        return idToStationMap;
    }

    private applyExternalDeliveries(
        data: any,
        fclData: FclData,
        idToStationMap: Map<string, StationData>
    ): Map<string, DeliveryData> {

        const rawData: any = data[JsonConstants.DATA];
        const deliveryTable: any = rawData[JsonConstants.DELIVERY_TABLE];

        const extDeliveries: any = deliveryTable[JsonConstants.TABLE_DATA];
        const intDeliveries: DeliveryData[] = [];
        const extToIntPropMap: Map<string, string> = this.createReverseMap(
            JsonConstants.DELIVERY_PROP_INT_TO_EXT_MAP
        );

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
                throw new SyntaxError('Delivery source with id "' + extDelivery.source + '" is unkown.');
            }

            if (extDelivery.target === null) {
                throw new SyntaxError('Delivery target is missing for id:' + extDelivery.id);
            }

            if (!idToStationMap.has(extDelivery.target)) {
                throw new SyntaxError('Delivery target with id "' + extDelivery.target + '" is unkown.');
            }

            const intDelivery: DeliveryData = {
                id: extDelivery.id,
                name: extDelivery.name,
                lot: extDelivery.lot,
                lotKey: extDelivery.lotKey ||
                    (extDelivery.source + '|' + (extDelivery.name || extDelivery.id) + '|' + (extDelivery.lot || extDelivery.id)),
                date: extDelivery.date,
                source: extDelivery.source,
                target: extDelivery.target,
                properties: extDelivery.properties
            };

            idToStationMap.get(intDelivery.source).outgoing.push(intDelivery.id);
            idToStationMap.get(intDelivery.target).incoming.push(intDelivery.id);
            intDeliveries.push(intDelivery);
            idToDeliveryMap.set(intDelivery.id, intDelivery);
        }

        fclData.fclElements.deliveries = intDeliveries;

        this.applyExternalDeliveryToDelivery(
            data,
            idToStationMap,
            idToDeliveryMap
        );
        return idToDeliveryMap;
    }

    private applyExternalDeliveryToDelivery(
        data: any,
        idToStationMap: Map<string, StationData>,
        idToDeliveryMap: Map<string, DeliveryData>
    ) {
        const rawData: any = data[JsonConstants.DATA];
        const delToDelTable: any = rawData[JsonConstants.DELIVERY_TO_DELIVERY_TABLE];
        const extDelToDels: any = delToDelTable[JsonConstants.TABLE_DATA];
        const colsData: any = delToDelTable[JsonConstants.TABLE_COLUMNS];
        const columnSet: Set<string> = new Set(colsData.map(col => col.id));
        const extToIntPropMap: Map<string, string> = this.createReverseMap(
            columnSet.has('from')
            ? JsonConstants.DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_FROM_TO
            : JsonConstants.DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_ID_NEXT
        );

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
                throw new SyntaxError('Unkown delivery to delivery source "' + extDelToDel.source + '".');
            }

            if (extDelToDel.target === null) {
                throw new SyntaxError('Missing delivery to delivery target.');
            }

            if (!idToDeliveryMap.has(extDelToDel.target)) {
                throw new SyntaxError('Unkown delivery to delivery target "' + extDelToDel.target + '".');
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

    private applyExternalGroupData(
        data: any,
        fclData: FclData,
        idToStationMap: Map<string, StationData>
    ): Map<string, GroupData> {

        const extGroups: any = this.getProperty(data, JsonConstants.GROUP_DATA);
        if (extGroups === null) {
            return new Map();
        }

        const idToGroupMap: Map<string, GroupData> = new Map();

        const stationIds: Set<string> = new Set(Array.from(idToStationMap.keys()));

        for (const extGroup of extGroups) {

            if (idToStationMap.has(extGroup.id) || idToGroupMap.has(extGroup.id)) {
                throw new SyntaxError('Metanode id "' + extGroup.id + '" is not unique.');
            }

            for (const member of extGroup.members) {
                if (!stationIds.has(member)) {
                    throw new SyntaxError('Unknown member "' + member + '" in group "' + extGroup.id + '".');
                }
            }

            const intGroup: GroupData = {
                id: extGroup.id,
                name: extGroup.name,
                contains: extGroup.members,
                groupType: null
            };

            if (extGroup.type !== null) {
                if (!JsonConstants.GROUPTYPE_EXT_TO_INT_MAP.has(extGroup.type)) {
                    throw new SyntaxError(
                        'Unknown metanode type "' +
                        extGroup.type +
                        '" of group "' +
                        extGroup.id +
                        '".'
                    );
                }

                intGroup.groupType = JsonConstants.GROUPTYPE_EXT_TO_INT_MAP.get(extGroup.type);
            } else {
                // TODO: temporary solution
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

            fclData.groupSettings.push(intGroup);
        }

        return Utils.arrayToMap(fclData.groupSettings, (g) => g.id);
    }

    private applyExternalTracingData(
        data: any,
        fclData: FclData,
        idToStationMap: Map<string, StationData>,
        idToGroupMap: Map<string, GroupData>,
        idToDeliveryMap: Map<string, DeliveryData>
    ) {
        const tracingData: any = this.getProperty(data, JsonConstants.TRACING_DATA);
        if (tracingData == null) {
            return;
        }

        const stationTracings: any = this.getProperty(tracingData, JsonConstants.TRACING_DATA_STATIONS);
        if (stationTracings == null) {
            throw new Error('Missing station tracing data.');
        }

        const deliveryTracings: any = this.getProperty(tracingData, JsonConstants.TRACING_DATA_DELIVERIES);
        if (deliveryTracings == null) {
            throw new Error('Missing delivery tracing data.');
        }

        for (const element of stationTracings) {
            if (element.id === null) {
                throw new SyntaxError('Station id is missing in tracing data.');
            }

            const isSimpleStation = idToStationMap.has(element.id);

            if (!(isSimpleStation || idToGroupMap.has(element.id))) {
                throw new SyntaxError('Station/Metanode id "' + element.id + '" is unkown.');
            }

            if (isSimpleStation) {
                // this is not a group
                this.checkTracingProps(
                    element,
                    ['crossContamination', 'observed', 'killContamination'],
                    'station ' + element.id
                );
            }
            fclData.tracingSettings.stations.push({
                id: element.id,
                weight: element.weight,
                crossContamination: element.crossContamination,
                killContamination: element.killContamination,
                observed: (element.observed ? ObservedType.FULL : ObservedType.NONE),
                outbreak: element.weight > 0
            });
        }

        for (const element of deliveryTracings) {
            if (element.id === null) {
                throw new SyntaxError('Delivery id is missing in tracing data.');
            }

            if (!idToDeliveryMap.has(element.id)) {
                throw new SyntaxError('Tracing-data-import: Delivery id "' + element.id + '" is unkown.');
            }

            const delivery: DeliveryData = idToDeliveryMap.get(element.id);

            this.checkTracingProps(
                element,
                ['crossContamination', 'observed', 'killContamination'],
                'delivery ' + delivery.id
            );

            fclData.tracingSettings.deliveries.push({
                id: element.id,
                weight: element.weight,
                crossContamination: element.crossContamination,
                killContamination: element.killContamination,
                observed: element.observed === true ? ObservedType.FULL : ObservedType.NONE
            });
        }
    }

    private applyExternalViewSettings(
        data: any,
        fclData: FclData,
        idToStationMap: Map<string, StationData>,
        idToGroupMap: Map<string, GroupData>
    ) {

        const viewData: any = this.getProperty(data, JsonConstants.VIEW_SETTINGS);

        if (viewData === null) {
            return;
        }

        let nodeSize: any = this.getProperty(viewData, JsonConstants.SCHEMAGRAPH_NODE_SIZE);
        if (nodeSize === null) {
            nodeSize = this.getProperty(viewData, JsonConstants.GISGRAPH_NODE_SIZE);
        }
        if (
            nodeSize !== null &&
            JsonConstants.NODE_SIZE_EXT_TO_INT_MAP.has(nodeSize)
        ) {
            fclData.graphSettings.nodeSize = JsonConstants.NODE_SIZE_EXT_TO_INT_MAP.get(nodeSize);
        }

        let fontSize: any = this.getProperty(viewData, JsonConstants.SCHEMAGRAPH_FONT_SIZE);
        if (fontSize === null) {
            fontSize = this.getProperty(viewData, JsonConstants.GISGRAPH_FONT_SIZE);
        }
        if (
            fontSize !== null &&
            JsonConstants.FONT_SIZE_EXT_TO_INT_MAP.has(fontSize)
        ) {
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

        const skipUnconnectedStations: any = this.getProperty(viewData, JsonConstants.SKIP_UNCONNECTED_STATIONS);
        if (skipUnconnectedStations !== null) {
            fclData.graphSettings.skipUnconnectedStations = skipUnconnectedStations;
        }

        const showGis: any = this.getProperty(viewData, JsonConstants.SHOW_GIS);
        if (showGis !== null) {
            fclData.graphSettings.type = showGis === true ? GraphType.GIS : GraphType.GRAPH;
        }

        fclData.graphSettings.gisLayout = this.convertExternalTransformation(
            this.getProperty(viewData, JsonConstants.GISGRAPH_TRANSFORMATION)
        );
        fclData.graphSettings.schemaLayout = this.convertExternalTransformation(
            this.getProperty(viewData, JsonConstants.SCHEMAGRAPH_TRANSFORMATION)
        );

        this.convertExternalPositions(viewData, fclData, idToStationMap, idToGroupMap);
        this.convertExternalHighlightingSettings(viewData, fclData);
    }

    private convertExternalHighlightingSettings(viewData: ViewData, fclData: FclData): void {
        if (viewData && viewData.node && viewData.node.highlightConditions) {
            const extHighlightingCons: ExtStationHighlightingData[] = viewData.node.highlightConditions;
            const extToIntPropMap: Map<string, string> = this.createReverseMap(
                JsonConstants.STATION_PROP_INT_TO_EXT_MAP
            );

            fclData.graphSettings.highlightingSettings.stations = extHighlightingCons.map(extCon => (
                {
                    name: extCon.name,
                    showInLegend: extCon.showInLegend,
                    color: extCon.color,
                    invisible: extCon.invisible,
                    adjustThickness: extCon.adjustThickness,
                    labelProperty: this.mapLabelProperty(extCon.labelProperty, extToIntPropMap),
                    valueCondition: this.mapValueCondition(extCon.valueCondition, extToIntPropMap),
                    logicalConditions: this.mapLogicalConditions(extCon.logicalConditions, extToIntPropMap),
                    shape: this.mapShapeType(extCon.shape)
                }
            ));
        }

        if (viewData && viewData.edge && viewData.edge.highlightConditions) {
            const extHighlightingCons: ExtDeliveryHighlightingData[] = viewData.edge.highlightConditions;
            const extToIntPropMap: Map<string, string> = this.createReverseMap(
                JsonConstants.DELIVERY_PROP_INT_TO_EXT_MAP
            );

            fclData.graphSettings.highlightingSettings.deliveries = extHighlightingCons.map(extCon => (
                {
                    name: extCon.name,
                    showInLegend: extCon.showInLegend,
                    color: extCon.color,
                    invisible: extCon.invisible,
                    adjustThickness: extCon.adjustThickness,
                    labelProperty: this.mapLabelProperty(extCon.labelProperty, extToIntPropMap),
                    valueCondition: this.mapValueCondition(extCon.valueCondition, extToIntPropMap),
                    logicalConditions: this.mapLogicalConditions(extCon.logicalConditions, extToIntPropMap),
                    linePattern: LinePatternType.SOLID
                }
            ));
        }
    }

    private mapLogicalConditions(
        extLogicalConditions: ExtLogicalCondition[][],
        extToIntPropMap: Map<string, string>
    ): IntLogicalCondition[][] {
        let intLogicalConditions: IntLogicalCondition[][] = null;

        if (extLogicalConditions) {
            intLogicalConditions = extLogicalConditions.map((andConditionList: ExtLogicalCondition[]) =>
                andConditionList.map((extCondition: ExtLogicalCondition) => {
                    const propertyName = this.mapLabelProperty(extCondition.propertyName, extToIntPropMap);
                    let operationType = this.mapOperationType(extCondition.operationType);
                    let value = extCondition.value;

                    if (propertyName === 'observed') {

                        if (
                            ([
                                OperationType.REGEX_EQUAL,
                                OperationType.REGEX_EQUAL_IGNORE_CASE,
                                OperationType.REGEX_NOT_EQUAL,
                                OperationType.REGEX_NOT_EQUAL_IGNORE_CASE
                            ].indexOf(operationType) >= 0) ||
                            (operationType === OperationType.LESS && !value) ||
                            (operationType === OperationType.GREATER && value)) {
                            // tslint:disable-next-line:max-line-length
                            throw Error(`Could not convert logical condition (propertyName: ${propertyName}, operationType: ${operationType}, value: ${value})`);
                        }

                        if ((!value && operationType === OperationType.EQUAL) ||
                            (value && (operationType === OperationType.NOT_EQUAL || operationType === OperationType.LESS))) {
                            operationType = OperationType.EQUAL;
                        } else {
                            operationType = OperationType.NOT_EQUAL;
                        }

                        value = (ObservedType.NONE as any) as string;

                    }
                    return {
                        propertyName: propertyName,
                        operationType: operationType,
                        value: value
                    };
                }));
        }

        return intLogicalConditions;
    }

    private mapLabelProperty(labelProperty: string, extToIntPropMap: Map<string, string>): string {
        let newLabelProperty: string = null;

        if (labelProperty) {
            if (extToIntPropMap.has(labelProperty)) {
                newLabelProperty = extToIntPropMap.get(labelProperty);
            } else {
                newLabelProperty = labelProperty;
            }
        }

        return newLabelProperty;
    }

    private mapValueCondition(extValueCondition: ExtValueCondition, extToIntPropMap: Map<string, string>): IntValueCondition {
        let intValueCondition: IntValueCondition = null;

        if (extValueCondition) {
            intValueCondition = {
                propertyName: this.mapLabelProperty(extValueCondition.propertyName, extToIntPropMap),
                valueType: this.mapValueType(extValueCondition.valueType),
                useZeroAsMinimum: extValueCondition.useZeroAsMinimum
            };
        }

        return intValueCondition;
    }

    private mapValueType(extValueType: string): ValueType {
        let intValueType: ValueType = null;

        if (JsonConstants.VALUE_TYPE_EXT_TO_INT_MAP.has(extValueType)) {
            intValueType = JsonConstants.VALUE_TYPE_EXT_TO_INT_MAP.get(extValueType);
        } else {
            throw new Error(`Invalid ValueCondition.valueType: ${extValueType}`);
        }

        return intValueType;
    }

    private mapOperationType(extOperationType: string): OperationType {
        let intOperationType: OperationType = null;

        if (JsonConstants.OPERATION_TYPE_EXT_TO_INT_MAP.has(extOperationType)) {
            intOperationType = JsonConstants.OPERATION_TYPE_EXT_TO_INT_MAP.get(extOperationType);
        } else {
            throw new Error(`Invalid LogicalCondition.operationType: ${extOperationType}`);
        }

        return intOperationType;
    }

    private mapShapeType(extShapeType: string): NodeShapeType {
        let intShapeType: NodeShapeType = null;

        if (extShapeType) {
            if (JsonConstants.NODE_SHAPE_TYPE_EXT_TO_INT_MAP.has(extShapeType)) {
                intShapeType = JsonConstants.NODE_SHAPE_TYPE_EXT_TO_INT_MAP.get(extShapeType);
            } else {
                throw new Error(`Invalid shape: ${extShapeType}`);
            }
        }

        return intShapeType;
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

    private convertExternalPositions(
        viewData: any,
        fclData: FclData,
        idToStationMap: Map<string, StationData>,
        idToGroupMap: Map<string, GroupData>
    ) {
        const nodePositions: any = this.getProperty(viewData, JsonConstants.NODE_POSITIONS);
        if (nodePositions === null) {
            return;
        }

        for (const nodePosition of nodePositions) {
            if (nodePosition.id == null) {
                throw new SyntaxError('Node position id is missing.');
            }
            if (!(idToStationMap.has(nodePosition.id) || idToGroupMap.has(nodePosition.id))) {
                throw new SyntaxError('(Meta)Station of node position "' + nodePosition.id + '" is unkown.');
            }

            fclData.graphSettings.stationPositions[nodePosition.id] = nodePosition.position;
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
                throw new SyntaxError('Property "' + propName + '" is missing in ' + context);
            } else if (data[propName] === null) {
                throw new SyntaxError('Property "' + propName + '" is null in ' + context);
            }
        }
    }
}
