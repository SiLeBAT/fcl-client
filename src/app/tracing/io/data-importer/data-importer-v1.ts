import {
    DeliveryStoreData as DeliveryData, FclData, ObservedType, StationStoreData as StationData,
    Connection, GroupType, Layout, GraphType, GroupData,
    ValueCondition as IntValueCondition,
    LogicalCondition as IntLogicalCondition,
    ValueType, OperationType, NodeShapeType, LinePatternType, MergeDeliveriesType
} from '../../data.model';
import { HttpClient } from '@angular/common/http';

import { Utils } from '../../util/non-ui-utils';
import { Constants as JsonConstants, ColumnInfo } from './../data-mappings/data-mappings-v1';
import { Map as ImmutableMap } from 'immutable';

import { IDataImporter } from './datatypes';
import { isValidJson, createDefaultHighlights, checkVersionFormat, compareVersions } from './shared';
import { importSamples } from './sample-importer-v1';
import {
    ViewData,
    StationHighlightingData as ExtStationHighlightingData,
    DeliveryHighlightingData as ExtDeliveryHighlightingData,
    ValueCondition as ExtValueCondition,
    LogicalCondition as ExtLogicalCondition,
    JsonData,
    VERSION as MAX_VERSION,
    MIN_VERSION,
    MetaNodeData
} from '../ext-data-model.v1';

const JSON_SCHEMA_FILE = '../../../../assets/schema/schema-v1.json';

export class DataImporterV1 implements IDataImporter {
    constructor(private httpClient: HttpClient) {}

    async isDataFormatSupported(data: any): Promise<boolean> {
        if (
            data.version &&
            typeof data.version === 'string' &&
            checkVersionFormat(data.version) &&
            compareVersions(data.version, MIN_VERSION) >= 0 &&
            compareVersions(data.version, MAX_VERSION) <= 0) {
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

    private convertExternalData(data: JsonData, fclData: FclData) {
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

    private applyExternalStations(jsonData: JsonData, fclData: FclData): Map<string, StationData> {
        const extData = jsonData.data;
        const stationTable = extData.stations;
        const extStations = stationTable.data;
        const intStations: StationData[] = [];
        const extToIntPropMap: Map<string, string> = this.createReverseMap(
            JsonConstants.STATION_PROP_INT_TO_EXT_MAP
        );

        const idToStationMap: Map<string, StationData> = new Map();

        for (const extStation of extStations) {
            const intStation: StationData = {
                id: undefined,
                incoming: [],
                outgoing: [],
                connections: [],
                properties: []
            };

            for (const property of extStation) {
                if (extToIntPropMap.has(property.id)) {
                    intStation[extToIntPropMap.get(property.id)] = property.value;
                } else {
                    intStation.properties.push({
                        name: property.id,
                        value: property.value.toString()
                    });
                }
            }

            if (intStation.id === undefined || intStation.id === null) {
                throw new SyntaxError('Missing station id.');
            }

            if (idToStationMap.has(intStation.id)) {
                throw new SyntaxError('Duplicate station id:' + intStation.id);
            }

            intStations.push(intStation);
            idToStationMap.set(intStation.id, intStation);
        }

        fclData.fclElements.stations = intStations;
        return idToStationMap;
    }

    private applyExternalDeliveries(
        jsonData: JsonData,
        fclData: FclData,
        idToStationMap: Map<string, StationData>
    ): Map<string, DeliveryData> {

        const extDeliveries = jsonData.data.deliveries.data;
        const intDeliveries: DeliveryData[] = [];
        const extToIntPropMap: Map<string, string> = this.createReverseMap(
            JsonConstants.DELIVERY_PROP_INT_TO_EXT_MAP
        );

        const idToDeliveryMap: Map<string, DeliveryData> = new Map();

        for (const extDelivery of extDeliveries) {

            const intDelivery: DeliveryData = {
                id: undefined,
                source: undefined,
                target: undefined,
                properties: []
            };

            for (const property of extDelivery) {
                if (extToIntPropMap.has(property.id)) {
                    intDelivery[extToIntPropMap.get(property.id)] = property.value;
                } else {
                    intDelivery.properties.push({
                        name: property.id,
                        value: (
                            property.value !== null && property.value !== undefined && typeof(property.value) !== 'string' ?
                            property.value.toString() :
                            property.value
                        ) as string
                    });
                }
            }

            if (intDelivery.id === undefined || intDelivery.id === null) {
                throw new SyntaxError('Missing delivery id.');
            }

            if (idToDeliveryMap.has(intDelivery.id)) {
                throw new SyntaxError('Duplicate delivery id:' + intDelivery.id);
            }

            if (intDelivery.source === undefined || intDelivery.source === null) {
                throw new SyntaxError('Delivery source is missing for id:' + intDelivery.id);
            }

            if (!idToStationMap.has(intDelivery.source)) {
                throw new SyntaxError('Delivery source with id "' + intDelivery.source + '" is unkown.');
            }

            if (intDelivery.target === undefined || intDelivery.target === null) {
                throw new SyntaxError('Delivery target is missing for id:' + intDelivery.id);
            }

            if (!idToStationMap.has(intDelivery.target)) {
                throw new SyntaxError('Delivery target with id "' + intDelivery.target + '" is unkown.');
            }

            intDelivery.lotKey = intDelivery.lotKey ||
                    (intDelivery.source + '|' + (intDelivery.name || intDelivery.id) + '|' + (intDelivery.lot || intDelivery.id));

            idToStationMap.get(intDelivery.source).outgoing.push(intDelivery.id);
            idToStationMap.get(intDelivery.target).incoming.push(intDelivery.id);
            intDeliveries.push(intDelivery);
            idToDeliveryMap.set(intDelivery.id, intDelivery);
        }

        fclData.fclElements.deliveries = intDeliveries;

        this.applyExternalDeliveryToDelivery(
            jsonData,
            idToStationMap,
            idToDeliveryMap
        );
        return idToDeliveryMap;
    }

    private applyExternalDeliveryToDelivery(
        jsonData: JsonData,
        idToStationMap: Map<string, StationData>,
        idToDeliveryMap: Map<string, DeliveryData>
    ) {
        const extDelToDels = jsonData.data.deliveryRelations.data;
        const colsData = jsonData.data.deliveryRelations.columnProperties;
        const columnSet: Set<string> = new Set(colsData.map(col => col.id));
        const extToIntPropMap: Map<string, string> = this.createReverseMap(
            columnSet.has('from')
            ? JsonConstants.DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_FROM_TO
            : JsonConstants.DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_ID_NEXT
        );

        const idToConnectionMap: Map<string, Connection> = new Map();

        for (const extDelToDel of extDelToDels) {
            const connection: Connection = {
                source: undefined,
                target: undefined
            };
            for (const property of extDelToDel) {
                if (extToIntPropMap.has(property.id)) {
                    connection[extToIntPropMap.get(property.id)] = property.value;
                }
            }

            if (connection.source === undefined || connection.source === null) {
                throw new SyntaxError('Missing delivery to delivery source.');
            }

            if (!idToDeliveryMap.has(connection.source)) {
                throw new SyntaxError('Unkown delivery to delivery source "' + connection.source + '".');
            }

            if (connection.target === undefined || connection.target === null) {
                throw new SyntaxError('Missing delivery to delivery target.');
            }

            if (!idToDeliveryMap.has(connection.target)) {
                throw new SyntaxError('Unkown delivery to delivery target "' + connection.target + '".');
            }

            const sourceDelivery: DeliveryData = idToDeliveryMap.get(connection.source);
            const targetDelivery: DeliveryData = idToDeliveryMap.get(connection.target);

            if (sourceDelivery.target !== targetDelivery.source) {
                throw new SyntaxError('Invalid delivery relation: ' + JSON.stringify(extDelToDel));
            }

            const conId: string = connection.source + '->' + connection.target;

            if (!idToConnectionMap.has(conId)) {
                idToConnectionMap.set(conId, connection);
                idToStationMap.get(idToDeliveryMap.get(connection.source).target).connections.push(connection);
            }
        }
    }

    private applyExternalGroupData(
        jsonData: JsonData,
        fclData: FclData,
        idToStationMap: Map<string, StationData>
    ): Map<string, GroupData> {

        if (!jsonData.settings || !jsonData.settings.metaNodes) {
            return new Map();
        }
        const extGroups: MetaNodeData[] = jsonData.settings.metaNodes;

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
                name: extGroup.name || extGroup.id,
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
        jsonData: JsonData,
        fclData: FclData,
        idToStationMap: Map<string, StationData>,
        idToGroupMap: Map<string, GroupData>
    ) {

        if (
            jsonData.settings === undefined ||
            jsonData.settings === null ||
            jsonData.settings.view === undefined ||
            jsonData.settings.view === null
        ) {
            return;
        }

        const viewData = jsonData.settings.view;

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

        if (
            viewData.edge.mergeDeliveriesType !== undefined &&
            viewData.edge.mergeDeliveriesType !== null
        ) {
            if (!JsonConstants.MERGE_DEL_TYPE_EXT_TO_INT_MAP.has(viewData.edge.mergeDeliveriesType)) {
                throw new SyntaxError(
                    `Unknown delivery merge type: ${viewData.edge.mergeDeliveriesType}`
                );
            }
            fclData.graphSettings.mergeDeliveriesType = JsonConstants.MERGE_DEL_TYPE_EXT_TO_INT_MAP.get(viewData.edge.mergeDeliveriesType);
        } else {
            fclData.graphSettings.mergeDeliveriesType = (
                !viewData.edge.joinEdges ? MergeDeliveriesType.NO_MERGE : MergeDeliveriesType.MERGE_ALL
            );
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

            if (extHighlightingCons.length > 0) {
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
        } else {
            fclData.graphSettings.highlightingSettings.stations = createDefaultHighlights().stations;
        }

        if (viewData && viewData.edge && viewData.edge.highlightConditions) {

            const extHighlightingCons: ExtDeliveryHighlightingData[] = viewData.edge.highlightConditions;

            if (extHighlightingCons.length > 0) {
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
        } else {
            fclData.graphSettings.highlightingSettings.deliveries = createDefaultHighlights().deliveries;
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
