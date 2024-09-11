import {
  FclData,
  GroupType,
  ObservedType,
  GraphType,
  Layout,
  MergeDeliveriesType,
  ValueType,
  ValueCondition as IntValueCondition,
  LogicalCondition as IntLogicalCondition,
  HighlightingRule as IntHighlightingRule,
  NodeShapeType,
  OperationType,
  PropMap,
  LabelPart,
  HighlightingRule,
} from '../data.model';
import * as DataMapper from './data-mappings/data-mappings-v1';
import {Utils} from './../util/non-ui-utils';
import {createFclElements} from './fcl-elements-creator';
import {
  VERSION,
  JsonData,
  ViewData,
  ValueCondition as ExtValueCondition,
  LogicalCondition as ExtLogicalCondition,
  HighlightingRule as ExtHighlightingRule,
  AnonymizationRule as ExtAnonymizationRule,
  LabelPart as ExtLabelPart,
  Transformation as ExtViewPort,
  Data as ExtData,
} from './ext-data-model.v1';
import * as _ from 'lodash';

export class DataExporter {
  private static readonly INTERNAL_OBSERVED_ATTRIBUTE = 'observed';
  private static readonly INTERNAL_OUTBREAK_ATTRIBUTE = 'outbreak';
  private static readonly INTERNAL_WEIGHT_ATTRIBUTE = 'weight';

  static exportData(fclData: FclData, oldJsonData?: JsonData): JsonData {
    const newJsonData: JsonData = oldJsonData
      ? {
          // JSON.parse(JSON.stringify(oldJsonData));
          ..._.cloneDeep(oldJsonData),
          version: VERSION,
        }
      : {
          version: VERSION,
          data: this.createExtData(fclData),
        };

    newJsonData.settings = {
      version: VERSION,
      metaNodes: [],
    };
    this.setGroupData(fclData, newJsonData);
    this.setTracingData(fclData, newJsonData);
    this.setViewData(fclData, newJsonData);

    return newJsonData;
  }

  private static createExtData(fclData: FclData): ExtData {
    return {
      version: VERSION,
      ...createFclElements(fclData),
    };
  }

  private static setGroupData(fclData: FclData, rawData: JsonData) {
    const intToExtGroupTypeMap: Map<GroupType, string> = Utils.createReverseMap(
      DataMapper.GROUPTYPE_EXT_TO_INT_MAP
    );

    rawData.settings!.metaNodes = fclData.groupSettings.map(s => ({
      id: s.id,
      name: s.name,
      type:
        s.groupType && intToExtGroupTypeMap.has(s.groupType)
          ? intToExtGroupTypeMap.get(s.groupType)
          : null,
      members: s.contains,
    }));
  }

  private static setTracingData(fclData: FclData, rawData: JsonData) {
    rawData.tracing = {
      version: VERSION,
      nodes: fclData.tracingSettings.stations.map(s => ({
        id: s.id,
        weight: s.weight,
        crossContamination: s.crossContamination,
        killContamination: s.killContamination,
        observed: s.observed !== ObservedType.NONE,
      })),
      deliveries: fclData.tracingSettings.deliveries.map(s => ({
        id: s.id,
        weight: s.weight,
        crossContamination: s.crossContamination,
        killContamination: s.killContamination,
        observed: s.observed !== ObservedType.NONE,
      })),
    };
  }

  private static setViewData(fclData: FclData, jsonData: JsonData) {
    if (!jsonData.settings) {
      throw new Error('jsonData.settings nnot initialized');
    }
    let viewData: ViewData | undefined = jsonData.settings.view;

    viewData = {
      ...(viewData ?? {}),
      edge: viewData?.edge ?? {selectedEdges: []},
      node: viewData?.node ?? {},
      graph: viewData?.graph ?? {},
      gis: viewData?.gis ?? {},
    };

    viewData.edge!.invisibleEdges =
      fclData.graphSettings.highlightingSettings.invisibleDeliveries;
    viewData.node!.invisibleNodes =
      fclData.graphSettings.highlightingSettings.invisibleStations;

    viewData.showLegend = fclData.graphSettings.showLegend;
    viewData.node!.skipEdgelessNodes =
      fclData.graphSettings.skipUnconnectedStations;

    viewData.edge!.joinEdges =
      fclData.graphSettings.mergeDeliveriesType !==
      MergeDeliveriesType.NO_MERGE;
    viewData.edge!.mergeDeliveriesType = Utils.createReverseMap(
      DataMapper.MERGE_DEL_TYPE_EXT_TO_INT_MAP
    ).get(fclData.graphSettings.mergeDeliveriesType);
    viewData.edge!.showMergedDeliveriesCounts =
      fclData.graphSettings.showMergedDeliveriesCounts;
    viewData.edge!.adjustEdgeWidthToNodeSize =
      fclData.graphSettings.adjustEdgeWidthToNodeSize;

    viewData.showGis = fclData.graphSettings.type === GraphType.GIS;
    const gisViewPort = this.convertInt2ExtViewPort(
      fclData.graphSettings.gisLayout
    );
    viewData.gis!.transformation = gisViewPort;

    const schemaViewPort = this.convertInt2ExtViewPort(
      fclData.graphSettings.schemaLayout
    );
    viewData.graph!.transformation = schemaViewPort;

    const extNodePositions = Object.keys(
      fclData.graphSettings.stationPositions
    ).map(key => ({
      id: key,
      position: fclData.graphSettings.stationPositions[key],
    }));
    viewData.graph!.node = {
      ...(viewData.graph!.node ?? {}),
      positions: extNodePositions,
    };

    viewData.graph!.node.minSize = fclData.graphSettings.nodeSize;
    viewData.graph!.edge = viewData.graph!.edge || {};
    viewData.graph!.edge.minWidth = fclData.graphSettings.edgeWidth;
    viewData.graph!.text = viewData.graph!.text || {};
    viewData.graph!.text.fontSize = fclData.graphSettings.fontSize;

    viewData.gis!.node = viewData.gis?.node || {};
    viewData.gis!.node.minSize = fclData.graphSettings.nodeSize;
    viewData.gis!.edge = viewData.gis?.edge || {};
    viewData.gis!.edge.minWidth = fclData.graphSettings.edgeWidth;
    viewData.gis!.text = viewData.gis?.text || {};
    viewData.gis!.text.fontSize = fclData.graphSettings.fontSize;

    viewData.edge!.selectedEdges =
      fclData.graphSettings.selectedElements.deliveries.slice();
    viewData.node!.selectedNodes =
      fclData.graphSettings.selectedElements.stations.slice();

    this.setHighlightingSettings(fclData, viewData);
    jsonData.settings.view = viewData;
  }

  private static setHighlightingSettings(
    fclData: FclData,
    viewData: ViewData
  ): void {
    const intToExtValueTypeMap = Utils.createReverseMap(
      DataMapper.VALUE_TYPE_EXT_TO_INT_MAP
    );
    const intToExtOpTypeMap = Utils.createReverseMap(
      DataMapper.OPERATION_TYPE_EXT_TO_INT_MAP
    );

    const intToExtShapeMap = Utils.createReverseMap(
      DataMapper.NODE_SHAPE_TYPE_EXT_TO_INT_MAP
    );
    const intToExtStatPropMap = fclData.source.int2ExtPropMaps.stations;
    const intStatRules = fclData.graphSettings.highlightingSettings.stations;
    const exportableIntStatRules = intStatRules.filter(
      rule => !rule.labelParts
    );
    viewData.node.highlightConditions = exportableIntStatRules.map(rule => ({
      ...this.mapSharedRuleProps(
        rule,
        intToExtStatPropMap,
        intToExtValueTypeMap,
        intToExtOpTypeMap
      ),
      shape: this.mapShapeType(rule.shape, intToExtShapeMap),
    }));

    const intAnoStatRule = intStatRules.filter(rule => !!rule.labelParts).pop();
    if (intAnoStatRule) {
      const extAnoStatRule = this.mapAnoRule(
        intAnoStatRule,
        intToExtStatPropMap,
        intToExtOpTypeMap
      );
      viewData.node.anonymizationRule = extAnoStatRule;
    }
    const intToExtDelPropMap = fclData.source.int2ExtPropMaps.deliveries;
    viewData.edge!.highlightConditions =
      fclData.graphSettings.highlightingSettings.deliveries.map(rule => ({
        ...this.mapSharedRuleProps(
          rule,
          intToExtDelPropMap,
          intToExtValueTypeMap,
          intToExtOpTypeMap
        ),
        linePattern: null,
      }));
  }

  private static mapAnoRule(
    intAnoRule: HighlightingRule,
    intToExtPropMap: PropMap,
    intToExtOpTypeMap: Map<OperationType, string>
  ): ExtAnonymizationRule {
    const extLabelParts: ExtLabelPart[] = intAnoRule.labelParts!.map(
      (part: LabelPart) => {
        if (part.property) {
          return {
            prefix: part.prefix,
            property: intToExtPropMap[part.property],
          };
        } else {
          return {prefix: part.prefix, useIndex: part.useIndex};
        }
      }
    );

    const extAnoRule: ExtAnonymizationRule = {
      labelPrefix: intAnoRule.labelPrefix || '',
      labelParts: extLabelParts,
      disabled: intAnoRule.userDisabled,
      logicalConditions: this.mapLogicalConditions(
        intAnoRule.logicalConditions,
        intToExtPropMap,
        intToExtOpTypeMap
      ),
    };

    return extAnoRule;
  }

  private static mapSharedRuleProps(
    rule: IntHighlightingRule,
    intToExtPropMap: PropMap,
    intToExtValueTypeMap: Map<ValueType, string>,
    intToExtOpTypeMap: Map<OperationType, string>
  ): ExtHighlightingRule {
    return {
      name: rule.name,
      showInLegend: rule.showInLegend,
      disabled: rule.userDisabled,
      invisible: rule.invisible,
      adjustThickness: rule.adjustThickness,
      color: rule.color ? Utils.colorToRGBArray(rule.color) : null,
      labelProperty:
        rule.labelProperty === null
          ? null
          : intToExtPropMap[rule.labelProperty],
      valueCondition: this.mapValueCondition(
        rule.valueCondition,
        intToExtPropMap,
        intToExtValueTypeMap
      ),
      logicalConditions: this.mapLogicalConditions(
        rule.logicalConditions,
        intToExtPropMap,
        intToExtOpTypeMap
      ),
    };
  }

  private static mapLogicalConditions(
    intLogicalConditions: IntLogicalCondition[][] | null,
    intToExtPropMap: PropMap,
    intToExtOperationTypeMap: Map<OperationType, string>
  ): ExtLogicalCondition[][] | null {
    let extLogicalConditions: ExtLogicalCondition[][] | null = null;

    if (intLogicalConditions) {
      extLogicalConditions = intLogicalConditions.map(
        (andConditionList: IntLogicalCondition[]) =>
          andConditionList.map((intCondition: IntLogicalCondition) => {
            let propertyName = intToExtPropMap[intCondition.propertyName];
            let operationType = intToExtOperationTypeMap.get(
              intCondition.operationType
            )!;
            let value = intCondition.value;

            if (
              intCondition.propertyName === this.INTERNAL_OBSERVED_ATTRIBUTE
            ) {
              if (this.isInternalObservedType(intCondition.value)) {
                if (
                  intCondition.value === ObservedType.NONE + '' &&
                  intCondition.operationType === OperationType.NOT_EQUAL
                ) {
                  operationType = intToExtOperationTypeMap.get(
                    OperationType.EQUAL
                  )!;
                  value = '1';
                } else {
                  value =
                    intCondition.value !== ObservedType.NONE + '' ? '1' : '0';
                }
              }
            } else if (
              intCondition.propertyName === this.INTERNAL_OUTBREAK_ATTRIBUTE
            ) {
              if (
                this.isBoolean(value) &&
                (intCondition.operationType === OperationType.EQUAL ||
                  intCondition.operationType === OperationType.NOT_EQUAL)
              ) {
                propertyName = intToExtPropMap[this.INTERNAL_WEIGHT_ATTRIBUTE];
                if (
                  this.isTrue(value) ===
                  (intCondition.operationType === OperationType.EQUAL)
                ) {
                  operationType = intToExtOperationTypeMap.get(
                    OperationType.GREATER
                  )!;
                  value = '0';
                } else {
                  operationType = intToExtOperationTypeMap.get(
                    OperationType.EQUAL
                  )!;
                  value = '0';
                }
              } else {
                propertyName = intCondition.propertyName;
              }
            }

            return {
              propertyName: propertyName,
              operationType: operationType,
              value: value,
            };
          })
      );
    }

    return extLogicalConditions;
  }

  private static isInternalObservedType(value: string): boolean {
    return (
      [
        ObservedType.NONE + '',
        ObservedType.BACKWARD + '',
        ObservedType.FORWARD + '',
        ObservedType.FULL + '',
      ].indexOf(value) >= 0
    );
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
    intValueCondition: IntValueCondition | null,
    intToExtPropMap: PropMap,
    intToExtValueTypeMap: Map<ValueType, string>
  ): ExtValueCondition | null {
    return intValueCondition === null
      ? null
      : {
          propertyName: intToExtPropMap[intValueCondition.propertyName],
          valueType: intToExtValueTypeMap.get(intValueCondition.valueType)!,
          useZeroAsMinimum: intValueCondition.useZeroAsMinimum,
        };
  }

  private static mapShapeType(
    intShapeType: NodeShapeType | null,
    intToExtShapeMap: Map<NodeShapeType, string>
  ): string | null {
    return intShapeType === null ? null : intToExtShapeMap.get(intShapeType)!;
  }

  private static convertInt2ExtViewPort(
    intLayout: Layout | null
  ): ExtViewPort | undefined {
    if (!intLayout) {
      return undefined;
    }

    return {
      scale: {x: intLayout.zoom, y: intLayout.zoom},
      translation: {x: intLayout.pan.x, y: intLayout.pan.y},
    };
  }
}
