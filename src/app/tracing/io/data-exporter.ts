import {
    FclData, GroupType, ObservedType, GraphType, Layout, StationTracingSettings, MergeDeliveriesType,
    ValueType,
    ValueCondition as IntValueCondition,
    LogicalCondition as IntLogicalCondition,
    StationHighlightingData as IntStationHighlightingData,
    DeliveryHighlightingData as IntDeliveryHighlightingData,
    NodeShapeType,
    OperationType,
    PropMap
} from '../data.model';
import * as DataMapper from './data-mappings/data-mappings-v1';
import * as ExtDataConstants from './ext-data-constants.v1';
import { Utils } from './../util/non-ui-utils';
import { createFclElements } from './fcl-elements-creator';
import {
    VERSION, JsonData, ViewData,
    ValueCondition as ExtValueCondition,
    LogicalCondition as ExtLogicalCondition,
    ElementHighlightingData as ExtElementHighlightingData
} from './ext-data-model.v1';
import { createDefaultSettings } from './json-data-creator';

export class DataExporter {

    private static readonly INTERNAL_OBSERVED_ATTRIBUTE = 'observed';
    private static readonly INTERNAL_OUTBREAK_ATTRIBUTE = 'outbreak';
    private static readonly INTERNAL_WEIGHT_ATTRIBUTE = 'weight';

    static exportData(fclData: FclData, rawData: JsonData) {
        rawData.version = VERSION;
        this.setGroupData(fclData, rawData);
        this.setTracingData(fclData, rawData);
        this.setViewData(fclData, rawData);
        if (!rawData.data) {
            this.setData(fclData, rawData);
        }
    }

    private static setData(fclData: FclData, rawData: JsonData) {
        rawData.data = {
            version: VERSION,
            ...createFclElements(fclData)
        };
    }

    private static setGroupData(fclData: FclData, rawData: JsonData) {
        const intToExtGroupTypeMap: Map<GroupType, string> = Utils.createReverseMap(
            DataMapper.GROUPTYPE_EXT_TO_INT_MAP
        );

        if (!rawData.settings) {
            rawData.settings = createDefaultSettings();
        }
        rawData.settings.metaNodes = fclData.groupSettings.map(
            s => ({
                id: s.id,
                name: s.name,
                type: (intToExtGroupTypeMap.has(s.groupType) ? intToExtGroupTypeMap.get(s.groupType) : null),
                members: s.contains
            })
        );
    }

    private static getWeight(station: StationTracingSettings): number {
        const outbreakWeight: number = (station.outbreak === null ? null : (station.outbreak ? 1.0 : 0.0));
        if (station.weight === null) {
            return outbreakWeight;
        } else if (station.outbreak === null) {
            return null;
        } else if ((station.weight > 0) !== station.outbreak) {
            return outbreakWeight;
        } else {
            return station.weight;
        }
    }

    private static setTracingData(fclData: FclData, rawData: JsonData) {
        rawData.tracing = {
            version: VERSION,
            nodes: fclData.tracingSettings.stations.map(s => ({
                id: s.id,
                weight: this.getWeight(s),
                crossContamination: s.crossContamination,
                killContamination: s.killContamination,
                observed: s.observed === null ? null : s.observed !== ObservedType.NONE
            })),
            deliveries: fclData.tracingSettings.deliveries.map(s => ({
                id: s.id,
                weight: s.weight,
                crossContamination: s.crossContamination,
                killContamination: s.killContamination,
                observed: s.observed === null ? null : s.observed !== ObservedType.NONE
            }))
        };
    }

    private static setViewData(fclData: FclData, jsonData: JsonData) {
        const viewData: ViewData = jsonData.settings && jsonData.settings.view ? jsonData.settings.view : {
            edge: undefined,
            node: undefined
        };
        if (!viewData.edge) {
            viewData.edge = {
                selectedEdges: []
            };
        }
        if (!viewData.node) {
            viewData.node = {};
        }

        Utils.setProperty(viewData, ExtDataConstants.SHOW_LEGEND, fclData.graphSettings.showLegend);
        Utils.setProperty(viewData, ExtDataConstants.SKIP_UNCONNECTED_STATIONS, fclData.graphSettings.skipUnconnectedStations);

        viewData.edge.joinEdges = fclData.graphSettings.mergeDeliveriesType !== MergeDeliveriesType.NO_MERGE;
        viewData.edge.mergeDeliveriesType = Utils.createReverseMap(
            DataMapper.MERGE_DEL_TYPE_EXT_TO_INT_MAP
        ).get(fclData.graphSettings.mergeDeliveriesType);
        viewData.edge.showMergedDeliveriesCounts = fclData.graphSettings.showMergedDeliveriesCounts;

        Utils.setProperty(viewData, ExtDataConstants.SHOW_GIS, fclData.graphSettings.type === GraphType.GIS);
        Utils.setProperty(viewData, ExtDataConstants.GISGRAPH_AVOID_OVERLAY, fclData.graphSettings.avoidOverlay);

        Utils.setProperty(viewData, ExtDataConstants.GISGRAPH_TRANSFORMATION, this.convertLayout(fclData.graphSettings.gisLayout));
        Utils.setProperty(viewData, ExtDataConstants.SCHEMAGRAPH_TRANSFORMATION, this.convertLayout(fclData.graphSettings.schemaLayout));

        Utils.setProperty(viewData, ExtDataConstants.NODE_POSITIONS, Object.keys(fclData.graphSettings.stationPositions).map(key => ({
            id: key,
            position: fclData.graphSettings.stationPositions[key]
        })));

        viewData.edge.selectedEdges = fclData.graphSettings.selectedElements.deliveries.slice();
        viewData.node.selectedNodes = fclData.graphSettings.selectedElements.stations.slice();

        this.setHighlightingSettings(fclData, viewData);
        jsonData.settings.view = viewData;
    }

    private static setHighlightingSettings(fclData: FclData, viewData: ViewData): void {
        const intToExtValueTypeMap = Utils.createReverseMap(DataMapper.VALUE_TYPE_EXT_TO_INT_MAP);
        const intToExtOpTypeMap = Utils.createReverseMap(DataMapper.OPERATION_TYPE_EXT_TO_INT_MAP);

        const intToExtShapeMap = Utils.createReverseMap(DataMapper.NODE_SHAPE_TYPE_EXT_TO_INT_MAP);
        const intToExtStatPropMap = fclData.source.propMaps.stationPropMap;
        viewData.node.highlightConditions = fclData.graphSettings.highlightingSettings.stations.map(rule => ({
            ...this.mapSharedRuleProps(rule, intToExtStatPropMap, intToExtValueTypeMap, intToExtOpTypeMap),
            shape: this.mapShapeType(rule.shape, intToExtShapeMap)
        }));

        const intToExtDelPropMap = fclData.source.propMaps.deliveryPropMap;
        viewData.edge.highlightConditions = fclData.graphSettings.highlightingSettings.deliveries.map(rule => ({
            ...this.mapSharedRuleProps(rule, intToExtDelPropMap, intToExtValueTypeMap, intToExtOpTypeMap),
            linePattern: null
        }));
    }

    private static mapSharedRuleProps(
        rule: IntStationHighlightingData | IntDeliveryHighlightingData,
        intToExtPropMap: PropMap,
        intToExtValueTypeMap: Map<ValueType, string>,
        intToExtOpTypeMap: Map<OperationType, string>
    ): ExtElementHighlightingData {
        return {
            name: rule.name,
            showInLegend: rule.showInLegend,
            disabled: rule.disabled,
            invisible: rule.invisible,
            adjustThickness: rule.adjustThickness,
            color: rule.color,
            labelProperty: rule.labelProperty === null ? null : intToExtPropMap[rule.labelProperty],
            valueCondition: this.mapValueCondition(rule.valueCondition, intToExtPropMap, intToExtValueTypeMap),
            logicalConditions: this.mapLogicalConditions(rule.logicalConditions, intToExtPropMap, intToExtOpTypeMap)
        };
    }

    private static mapLogicalConditions(
        intLogicalConditions: IntLogicalCondition[][],
        intToExtPropMap: PropMap,
        intToExtOperationTypeMap: Map<OperationType, string>
    ): ExtLogicalCondition[][] {
        let extLogicalConditions: ExtLogicalCondition[][] = null;

        if (intLogicalConditions) {
            extLogicalConditions = intLogicalConditions.map((andConditionList: IntLogicalCondition[]) =>
                andConditionList.map((intCondition: IntLogicalCondition) => {
                    if (intCondition.propertyName === 'weight') {
                        const tmp = 3;
                    }
                    let propertyName = intToExtPropMap[intCondition.propertyName];
                    let operationType = intToExtOperationTypeMap.get(intCondition.operationType);
                    let value = intCondition.value;

                    if (intCondition.propertyName === this.INTERNAL_OBSERVED_ATTRIBUTE) {
                        if (this.isInternalObservedType(intCondition.value)) {
                            if (
                                intCondition.value === (ObservedType.NONE + '') &&
                                intCondition.operationType === OperationType.NOT_EQUAL
                            ) {
                                operationType = intToExtOperationTypeMap.get(OperationType.EQUAL);
                                value = '1';
                            } else {
                                value = intCondition.value !== (ObservedType.NONE + '') ? '1' : '0';
                            }
                        }
                    } else if (intCondition.propertyName === this.INTERNAL_OUTBREAK_ATTRIBUTE) {
                        if (
                            this.isBoolean(value) &&
                            (
                                intCondition.operationType === OperationType.EQUAL ||
                                intCondition.operationType === OperationType.NOT_EQUAL
                            )
                        ) {
                            propertyName = intToExtPropMap[this.INTERNAL_WEIGHT_ATTRIBUTE];
                            if (this.isTrue(value) === (intCondition.operationType === OperationType.EQUAL)) {
                                operationType = intToExtOperationTypeMap.get(OperationType.GREATER);
                                value = '0';
                            } else {
                                operationType = intToExtOperationTypeMap.get(OperationType.EQUAL);
                                value = '0';
                            }
                        } else {
                            propertyName = intCondition.propertyName;
                        }

                    }

                    return {
                        propertyName: propertyName,
                        operationType: operationType,
                        value: value
                    };
                })
            );
        }

        return extLogicalConditions;
    }

    private static isInternalObservedType(value: string): boolean {
        return [
            ObservedType.NONE + '',
            ObservedType.BACKWARD + '',
            ObservedType.FORWARD + '',
            ObservedType.FULL + ''
        ].indexOf(value) >= 0;
    }

    private static isBoolean(value: string): boolean {
        return this.isTrue(value) || this.isFalse(value);
    }

    private static isTrue(value: string): boolean {
        return value === '1' || value.toLowerCase() === 'true';
    }

    private static isFalse(value: string): boolean {
        return value === '0' || value.toLowerCase() === 'false';
    }

    private static mapValueCondition(
        intValueCondition: IntValueCondition,
        intToExtPropMap: PropMap,
        intToExtValueTypeMap: Map<ValueType, string>
    ): ExtValueCondition {
        return intValueCondition === null ?
            null :
            {
                propertyName: intToExtPropMap[intValueCondition.propertyName],
                valueType: intToExtValueTypeMap.get(intValueCondition.valueType),
                useZeroAsMinimum: intValueCondition.useZeroAsMinimum
            };
    }

    private static mapShapeType(intShapeType: NodeShapeType, intToExtShapeMap: Map<NodeShapeType, string>): string {
        return intShapeType === null ? null : intToExtShapeMap.get(intShapeType);
    }

    private static convertLayout(intLayout: Layout): any {
        if (intLayout === null) { return null; }

        return {
            scale: { x: intLayout.zoom, y: intLayout.zoom },
            translation: { x: intLayout.pan.x, y: intLayout.pan.y }
        };
    }

}
