import {
  DeliveryStoreData as DeliveryData,
  FclData,
  ObservedType,
  StationStoreData as StationData,
  Connection,
  GroupType,
  GroupData,
  ValueCondition as IntValueCondition,
  LogicalCondition as IntLogicalCondition,
  ValueType,
  OperationType,
  NodeShapeType,
  LinePatternType,
  MergeDeliveriesType,
  CrossContTraceType,
  StationId,
  DeliveryId,
  HighlightingRule,
  LabelPart as IntLabelPart,
  StationHighlightingRule as IntStationHighlightingRule,
  Color,
} from '../../data.model';
import {HttpClient} from '@angular/common/http';

import {concat, isNullish, Utils} from '../../util/non-ui-utils';
import * as ExtDataConstants from '../ext-data-constants.v1';
import {IDataImporter} from './datatypes';
import {
  isValidJson,
  checkVersionFormat,
  areMajorVersionsMatching,
  createDefaultStationAnonymizationLabelHRule,
  createDefaultStationHRules,
  createDefaultDeliveryHRules,
} from './shared';
import {importSamples} from './sample-importer-v1';
import {
  ViewData,
  DeliveryHighlightingRule as ExtDeliveryHighlightingRule,
  ValueCondition as ExtValueCondition,
  LogicalCondition as ExtLogicalCondition,
  AnonymizationRule as ExtAnonymizationRule,
  JsonData,
  VERSION,
  MetaNodeData,
} from '../ext-data-model.v1';
import * as DataMapper from './../data-mappings/data-mappings-v1';
import {InputFormatError, InputDataError} from '../io-errors';
import {getCenterFromPoints, getDifference} from '../../util/geometry-utils';
import * as _ from 'lodash';
import {Constants} from '../../util/constants';
import {PartialPick} from '@app/tracing/util/utility-types';

const JSON_SCHEMA_FILE = '../../../../assets/schema/schema-v1.json';

export class DataImporterV1 implements IDataImporter {
  constructor(private httpClient: HttpClient) {}

  async isDataFormatSupported(data: any): Promise<boolean> {
    if (
      data.version &&
      typeof data.version === 'string' &&
      checkVersionFormat(data.version) &&
      areMajorVersionsMatching(data.version, VERSION)
    ) {
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
      throw new InputFormatError();
    }
  }

  private async loadSchema(): Promise<any> {
    return Utils.getJson(JSON_SCHEMA_FILE, this.httpClient);
  }

  private convertExternalData(data: JsonData, fclData: FclData) {
    const idToStationMap: Map<string, StationData> = this.applyExternalStations(
      data,
      fclData
    );
    const idToDeliveryMap: Map<string, DeliveryData> =
      this.applyExternalDeliveries(data, fclData, idToStationMap);
    const idToGroupMap: Map<string, GroupData> = this.applyExternalGroupData(
      data,
      fclData,
      idToStationMap
    );
    this.applyExternalTracingData(
      data,
      fclData,
      idToStationMap,
      idToDeliveryMap
    );
    importSamples(data, fclData);
    this.applyExternalViewSettings(
      data,
      fclData,
      idToStationMap,
      idToGroupMap,
      idToDeliveryMap
    );
  }

  private applyExternalStations(
    jsonData: JsonData,
    fclData: FclData
  ): Map<string, StationData> {
    const extData = jsonData.data;
    const stationTable = extData.stations;
    const stationRows = stationTable.data;
    const intStations: StationData[] = [];
    const idToStationMap: Map<string, StationData> = new Map();

    const propMapper = DataMapper.getStationPropMapper(jsonData);

    for (const stationRow of stationRows) {
      const intPartStation: PartialPick<StationData, 'id'> = {
        incoming: [],
        outgoing: [],
        connections: [],
        properties: [],
      };

      propMapper.applyValuesFromTableRow(stationRow, intPartStation);

      if (intPartStation.id === undefined || intPartStation.id === null) {
        throw new InputDataError('Missing station id.');
      }

      if (idToStationMap.has(intPartStation.id)) {
        throw new InputDataError('Duplicate station id:' + intPartStation.id);
      }

      const intStation = intPartStation as StationData;

      intStations.push(intStation);
      idToStationMap.set(intStation.id, intStation);
    }

    fclData.fclElements.stations = intStations;

    fclData.source.int2ExtPropMaps.stations = Utils.createObjectFromMap(
      propMapper.getPropMap()
    );

    return idToStationMap;
  }

  private applyExternalDeliveries(
    jsonData: JsonData,
    fclData: FclData,
    idToStationMap: Map<string, StationData>
  ): Map<string, DeliveryData> {
    const deliveryRows = jsonData.data.deliveries.data;
    const intDeliveries: DeliveryData[] = [];
    const idToDeliveryMap: Map<string, DeliveryData> = new Map();

    const propMapper = DataMapper.getDeliveryPropMapper(jsonData);

    for (const deliveryRow of deliveryRows) {
      const intPartDelivery: PartialPick<
        DeliveryData,
        'id' | 'source' | 'target'
      > = {
        properties: [],
      };

      propMapper.applyValuesFromTableRow(
        deliveryRow,
        intPartDelivery as DeliveryData
      );

      if (intPartDelivery.id === undefined || intPartDelivery.id === null) {
        throw new InputDataError('Missing delivery id.');
      }

      if (idToDeliveryMap.has(intPartDelivery.id)) {
        throw new InputDataError('Duplicate delivery id:' + intPartDelivery.id);
      }

      if (
        intPartDelivery.source === undefined ||
        intPartDelivery.source === null
      ) {
        throw new InputDataError(
          'Delivery source is missing for id:' + intPartDelivery.id
        );
      }

      if (!idToStationMap.has(intPartDelivery.source)) {
        throw new InputDataError(
          'Delivery source with id "' + intPartDelivery.source + '" is unkown.'
        );
      }

      if (
        intPartDelivery.target === undefined ||
        intPartDelivery.target === null
      ) {
        throw new InputDataError(
          'Delivery target is missing for id:' + intPartDelivery.id
        );
      }

      if (!idToStationMap.has(intPartDelivery.target)) {
        throw new InputDataError(
          'Delivery target with id "' + intPartDelivery.target + '" is unkown.'
        );
      }

      const intDelivery = intPartDelivery as DeliveryData;

      intDelivery.lotKey =
        intDelivery.lotKey ??
        intDelivery.source +
          '|' +
          (intDelivery.name ?? intDelivery.id) +
          '|' +
          (intDelivery.lot ?? intDelivery.id);

      idToStationMap.get(intDelivery.source)!.outgoing.push(intDelivery.id);
      idToStationMap.get(intDelivery.target)!.incoming.push(intDelivery.id);
      intDeliveries.push(intDelivery);
      idToDeliveryMap.set(intDelivery.id, intDelivery);
    }

    fclData.fclElements.deliveries = intDeliveries;
    fclData.source.int2ExtPropMaps.deliveries = Utils.createObjectFromMap(
      propMapper.getPropMap()
    );
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
    const del2DelRows = jsonData.data.deliveryRelations.data;
    const idToConnectionMap: Map<string, Connection> = new Map();

    const propMapper = DataMapper.getDel2DelPropMapper(jsonData);

    for (const del2DelRow of del2DelRows) {
      const partConnection: PartialPick<Connection, 'source' | 'target'> = {};

      propMapper.applyValuesFromTableRow(del2DelRow, partConnection);

      if (
        partConnection.source === undefined ||
        partConnection.source === null
      ) {
        throw new InputDataError('Missing delivery to delivery source.');
      }

      if (!idToDeliveryMap.has(partConnection.source)) {
        throw new InputDataError(
          'Unkown delivery to delivery source "' + partConnection.source + '".'
        );
      }

      if (
        partConnection.target === undefined ||
        partConnection.target === null
      ) {
        throw new InputDataError('Missing delivery to delivery target.');
      }

      if (!idToDeliveryMap.has(partConnection.target)) {
        throw new InputDataError(
          'Unkown delivery to delivery target "' + partConnection.target + '".'
        );
      }

      const connection = partConnection as Connection;

      const sourceDelivery: DeliveryData = idToDeliveryMap.get(
        connection.source
      )!;
      const targetDelivery: DeliveryData = idToDeliveryMap.get(
        connection.target
      )!;

      if (sourceDelivery.target !== targetDelivery.source) {
        throw new InputDataError(
          'Invalid delivery relation: ' + JSON.stringify(del2DelRow)
        );
      }

      const conId: string = connection.source + '->' + connection.target;

      if (!idToConnectionMap.has(conId)) {
        idToConnectionMap.set(conId, connection);
        idToStationMap
          .get(idToDeliveryMap.get(connection.source)!.target)!
          .connections.push(connection);
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
        throw new InputDataError(
          'Metanode id "' + extGroup.id + '" is not unique.'
        );
      }

      for (const member of extGroup.members) {
        if (!stationIds.has(member)) {
          throw new InputDataError(
            'Unknown member "' + member + '" in group "' + extGroup.id + '".'
          );
        }
      }

      const intGroup: GroupData = {
        id: extGroup.id,
        name: extGroup.name ?? extGroup.id,
        contains: extGroup.members,
      };

      if (!isNullish(extGroup.type)) {
        if (!DataMapper.GROUPTYPE_EXT_TO_INT_MAP.has(extGroup.type)) {
          throw new SyntaxError(
            'Unknown metanode type "' +
              extGroup.type +
              '" of group "' +
              extGroup.id +
              '".'
          );
        }

        intGroup.groupType = DataMapper.GROUPTYPE_EXT_TO_INT_MAP.get(
          extGroup.type
        );
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

    return Utils.arrayToMap(fclData.groupSettings, g => g.id);
  }

  private applyExternalTracingData(
    data: any,
    fclData: FclData,
    idToStationMap: Map<string, StationData>,
    idToDeliveryMap: Map<string, DeliveryData>
  ) {
    this.initTracingData(fclData);

    const tracingData: any = this.getProperty(
      data,
      ExtDataConstants.TRACING_DATA
    );
    if (tracingData === null || tracingData === undefined) {
      return;
    }

    const stationTracings: any = this.getProperty(
      tracingData,
      ExtDataConstants.TRACING_DATA_STATIONS
    );
    if (stationTracings == null) {
      throw new InputDataError('Missing station tracing data.');
    }

    const deliveryTracings: any = this.getProperty(
      tracingData,
      ExtDataConstants.TRACING_DATA_DELIVERIES
    );
    if (deliveryTracings == null) {
      throw new InputDataError('Missing delivery tracing data.');
    }

    const statIdToTracIndexMap: Record<StationId, number> = {};
    fclData.tracingSettings.stations.forEach(
      (tracSet, index) => (statIdToTracIndexMap[tracSet.id] = index)
    );

    for (const element of stationTracings) {
      if (element.id === null) {
        throw new InputDataError(
          'Station / Metastation id is missing in tracing data.'
        );
      }

      const isSimpleStation = idToStationMap.has(element.id);

      const tracSetIndex = statIdToTracIndexMap[element.id];

      if (tracSetIndex === undefined) {
        throw new InputDataError(
          'Station / Meta station id "' + element.id + '" is unkown.'
        );
      }

      if (isSimpleStation) {
        // this is not a group
        this.checkTracingProps(
          element,
          ['crossContamination', 'observed', 'killContamination'],
          'station ' + element.id
        );
      }
      fclData.tracingSettings.stations[tracSetIndex] = {
        id: element.id,
        weight: element.weight,
        crossContamination: element.crossContamination,
        killContamination: element.killContamination,
        observed: element.observed ? ObservedType.FULL : ObservedType.NONE,
        outbreak: element.weight > 0,
      };
    }

    const delIdToTracIndexMap: Record<DeliveryId, number> = {};
    fclData.tracingSettings.deliveries.forEach(
      (tracSet, index) => (delIdToTracIndexMap[tracSet.id] = index)
    );

    for (const element of deliveryTracings) {
      if (element.id === null) {
        throw new InputDataError('Delivery id is missing in tracing data.');
      }

      const tracSetIndex = delIdToTracIndexMap[element.id];

      if (tracSetIndex === undefined) {
        throw new InputDataError(
          'Tracing-data-import: Delivery id "' + element.id + '" is unknown.'
        );
      }

      const delivery: DeliveryData = idToDeliveryMap.get(element.id)!;

      this.checkTracingProps(
        element,
        ['crossContamination', 'observed', 'killContamination'],
        'delivery ' + delivery.id
      );

      fclData.tracingSettings.deliveries[tracSetIndex] = {
        id: element.id,
        weight: element.weight,
        crossContamination: element.crossContamination,
        killContamination: element.killContamination,
        observed:
          element.observed === true ? ObservedType.FULL : ObservedType.NONE,
        outbreak: element.weight > 0,
      };
    }
  }

  private initTracingData(fclData: FclData): void {
    fclData.tracingSettings = {
      crossContTraceType: CrossContTraceType.USE_INFERED_DELIVERY_DATES_LIMITS,
      deliveries: fclData.fclElements.deliveries.map(d => ({
        id: d.id,
        weight: 0,
        observed: ObservedType.NONE,
        crossContamination: false,
        killContamination: false,
        outbreak: false,
      })),
      stations: concat(
        fclData.fclElements.stations.map(s => s.id),
        fclData.groupSettings.map(g => g.id)
      ).map(id => ({
        id: id,
        weight: 0,
        outbreak: false,
        crossContamination: false,
        killContamination: false,
        observed: ObservedType.NONE,
      })),
    };
  }

  private applyExternalViewSettings(
    jsonData: JsonData,
    fclData: FclData,
    idToStationMap: Map<string, StationData>,
    idToGroupMap: Map<string, GroupData>,
    idToDeliveryMap: Map<string, DeliveryData>
  ) {
    if (
      jsonData.settings === undefined ||
      jsonData.settings === null ||
      jsonData.settings.view === undefined ||
      jsonData.settings.view === null
    ) {
      fclData.graphSettings.highlightingSettings.stations =
        createDefaultStationHRules(true);
      fclData.graphSettings.highlightingSettings.deliveries =
        createDefaultDeliveryHRules();
      return;
    }

    const viewData = jsonData.settings.view;

    const nodeSize =
      viewData.graph?.node?.minSize ?? viewData.gis?.node?.minSize ?? null;

    // default edge width is dependent on node size
    if (nodeSize !== null) {
      fclData.graphSettings.nodeSize =
        DataMapper.NODE_SIZE_EXT_TO_INT_FUN(nodeSize);
      // reset edge default
      fclData.graphSettings.edgeWidth =
        Constants.NODE_SIZE_TO_EDGE_WIDTH_MAP.get(
          fclData.graphSettings.nodeSize
        );
    }

    const autoEdgeWidth = fclData.graphSettings.edgeWidth;

    const extEdgeWidth: number | null =
      viewData.graph?.edge?.minWidth ?? viewData.gis?.edge?.minWidth ?? null;
    if (extEdgeWidth !== null) {
      fclData.graphSettings.edgeWidth =
        DataMapper.EDGE_WIDTH_EXT_TO_INT_FUN(extEdgeWidth);
    }

    const adjustEdgeWidthToNodeSize =
      viewData.edge?.adjustEdgeWidthToNodeSize || null;
    if (adjustEdgeWidthToNodeSize !== null) {
      fclData.graphSettings.adjustEdgeWidthToNodeSize =
        adjustEdgeWidthToNodeSize;
      if (fclData.graphSettings.adjustEdgeWidthToNodeSize) {
        fclData.graphSettings.edgeWidth = autoEdgeWidth;
      }
    } else {
      fclData.graphSettings.adjustEdgeWidthToNodeSize =
        fclData.graphSettings.edgeWidth === autoEdgeWidth;
    }

    const fontSize =
      viewData.graph?.text?.fontSize ?? viewData.gis?.text?.fontSize ?? null;

    if (fontSize !== null) {
      fclData.graphSettings.fontSize =
        DataMapper.FONT_SIZE_EXT_TO_INT_FUN(fontSize);
    }

    if (
      viewData.edge.mergeDeliveriesType !== undefined &&
      viewData.edge.mergeDeliveriesType !== null
    ) {
      if (
        !DataMapper.MERGE_DEL_TYPE_EXT_TO_INT_MAP.has(
          viewData.edge.mergeDeliveriesType
        )
      ) {
        throw new InputDataError(
          `Unknown delivery merge type: ${viewData.edge.mergeDeliveriesType}`
        );
      }
      fclData.graphSettings.mergeDeliveriesType =
        DataMapper.MERGE_DEL_TYPE_EXT_TO_INT_MAP.get(
          viewData.edge.mergeDeliveriesType
        );
    } else {
      fclData.graphSettings.mergeDeliveriesType = !viewData.edge.joinEdges
        ? MergeDeliveriesType.NO_MERGE
        : MergeDeliveriesType.MERGE_ALL;
    }
    if (
      viewData.edge.showMergedDeliveriesCounts !== null &&
      viewData.edge.showMergedDeliveriesCounts !== undefined
    ) {
      fclData.graphSettings.showMergedDeliveriesCounts =
        viewData.edge.showMergedDeliveriesCounts;
    }

    const skipUnconnectedStations: any = this.getProperty(
      viewData,
      ExtDataConstants.SKIP_UNCONNECTED_STATIONS
    );
    if (skipUnconnectedStations !== null) {
      fclData.graphSettings.skipUnconnectedStations = skipUnconnectedStations;
    }

    this.convertExternalPositions(
      viewData,
      fclData,
      idToStationMap,
      idToGroupMap
    );
    this.convertExternalHighlightingSettings(viewData, fclData);
    this.importInvisibleElements(
      viewData,
      fclData,
      idToStationMap,
      idToGroupMap,
      idToDeliveryMap
    );
  }

  private importInvisibleElements(
    viewData: ViewData,
    fclData: FclData,
    idToStationMap: Map<string, StationData>,
    idToGroupMap: Map<string, GroupData>,
    idToDeliveryMap: Map<string, DeliveryData>
  ): void {
    const invStatOrGroupIds = viewData.node.invisibleNodes;
    if (invStatOrGroupIds !== undefined && invStatOrGroupIds !== null) {
      const unknownIds = invStatOrGroupIds.filter(
        id => !idToStationMap.has(id) && !idToGroupMap.has(id)
      );
      if (unknownIds.length > 0) {
        throw new InputDataError(
          'Unknown station/group id "' +
            unknownIds[0] +
            '" in "invisibleNodes".'
        );
      }
      fclData.graphSettings.highlightingSettings.invisibleStations =
        _.uniq(invStatOrGroupIds);
    }
    const invDelIds = viewData.edge.invisibleEdges;
    if (invDelIds !== undefined && invDelIds !== null) {
      const unknownIds = invDelIds.filter(id => !idToDeliveryMap.has(id));
      if (unknownIds.length > 0) {
        throw new InputDataError(
          'Unknown delivery id "' + unknownIds[0] + '" in "invisibleEdges".'
        );
      }
      fclData.graphSettings.highlightingSettings.invisibleDeliveries =
        _.uniq(invDelIds);
    }
  }

  private convertExternalHighlightingSettings(
    viewData: ViewData,
    fclData: FclData
  ): void {
    const extStatHighlightingRules =
      viewData?.node?.highlightConditions || undefined;
    const extStatAnoRule = viewData?.node?.anonymizationRule || undefined;
    const extToIntStatPropMap = this.createReverseMapFromSimpleMap(
      fclData.source.int2ExtPropMaps.stations
    );

    if (extStatHighlightingRules) {
      if (extStatHighlightingRules.length > 0) {
        fclData.graphSettings.highlightingSettings.stations =
          extStatHighlightingRules.map((extRule, extRuleIndex) => ({
            id: 'SHR' + extRuleIndex,
            name: extRule.name ?? '',
            showInLegend: extRule.showInLegend === true,
            userDisabled: extRule.disabled === true,
            autoDisabled: false,
            color: this.colorFromArray(extRule.color),
            invisible: extRule.invisible,
            adjustThickness: extRule.adjustThickness,
            labelProperty: this.mapLabelProperty(
              extRule.labelProperty,
              extToIntStatPropMap
            ),
            valueCondition: this.mapValueCondition(
              extRule.valueCondition,
              extToIntStatPropMap
            ),
            logicalConditions: this.mapLogicalConditions(
              extRule.logicalConditions,
              extToIntStatPropMap
            ),
            shape: this.mapShapeType(extRule.shape),
          }));
      }
    } else {
      fclData.graphSettings.highlightingSettings.stations =
        createDefaultStationHRules(false);
    }

    const intStatAnoHRule: IntStationHighlightingRule = extStatAnoRule
      ? {
          ...this.convertExternalAnoRule(extStatAnoRule, extToIntStatPropMap),
          shape: null,
        }
      : createDefaultStationAnonymizationLabelHRule();

    if (intStatAnoHRule.userDisabled === false) {
      fclData.graphSettings.highlightingSettings.stations.forEach(
        r => (r.autoDisabled = true)
      );
    }

    fclData.graphSettings.highlightingSettings.stations.push(intStatAnoHRule);

    if (viewData && viewData.edge && viewData.edge.highlightConditions) {
      const extDelHighlightingRules: ExtDeliveryHighlightingRule[] =
        viewData.edge.highlightConditions;

      if (extDelHighlightingRules.length > 0) {
        const extToIntPropMap = this.createReverseMapFromSimpleMap(
          fclData.source.int2ExtPropMaps.deliveries
        );

        fclData.graphSettings.highlightingSettings.deliveries =
          extDelHighlightingRules.map((extRule, extRuleIndex) => ({
            id: 'DHR' + extRuleIndex,
            name: extRule.name ?? '',
            showInLegend: extRule.showInLegend === true,
            userDisabled: extRule.disabled === true,
            autoDisabled: false,
            activationDisablesOtherRules: false,
            color: this.colorFromArray(extRule.color),
            invisible: extRule.invisible,
            adjustThickness: extRule.adjustThickness,
            labelProperty: this.mapLabelProperty(
              extRule.labelProperty,
              extToIntPropMap
            ),
            valueCondition: this.mapValueCondition(
              extRule.valueCondition,
              extToIntPropMap
            ),
            logicalConditions: this.mapLogicalConditions(
              extRule.logicalConditions,
              extToIntPropMap
            ),
            linePattern: LinePatternType.SOLID,
          }));
      }
    } else {
      fclData.graphSettings.highlightingSettings.deliveries =
        createDefaultDeliveryHRules();
    }
  }

  private colorFromArray(colorArray: number[] | null): Color | null {
    return colorArray && colorArray.length === 3
      ? {r: colorArray[0], g: colorArray[1], b: colorArray[2]}
      : null;
  }

  private convertExternalAnoRule(
    extAnoRule: ExtAnonymizationRule,
    extToIntPropMap: Map<string, string>
  ): HighlightingRule {
    const defaultIntAnoHRule = createDefaultStationAnonymizationLabelHRule();
    let labelParts = (extAnoRule.labelParts ?? []).map(
      p =>
        (p.property
          ? {prefix: p.prefix, property: extToIntPropMap.get(p.property)}
          : {prefix: p.prefix, useIndex: p.useIndex || false}) as IntLabelPart
    );
    const indexParts = labelParts.filter(p => p.useIndex !== undefined);
    if (indexParts.length === 0) {
      labelParts.push(
        ...defaultIntAnoHRule.labelParts!.filter(p => p.useIndex !== undefined)
      );
    } else if (indexParts.length > 1) {
      labelParts = _.difference(labelParts, indexParts.slice(1));
    }

    const intAnoHRule: HighlightingRule = {
      ...defaultIntAnoHRule,
      labelPrefix: extAnoRule.labelPrefix,
      userDisabled: extAnoRule.disabled === true,
      labelParts: labelParts,
      logicalConditions: this.mapLogicalConditions(
        extAnoRule.logicalConditions ?? null,
        extToIntPropMap
      ),
    };
    return intAnoHRule;
  }

  private mapLogicalConditions<
    T extends ExtLogicalCondition[][] | null,
    R extends T extends null ? null : IntLogicalCondition[][],
  >(extLogicalConditions: T, extToIntPropMap: Map<string, string>): R {
    let intLogicalConditions: IntLogicalCondition[][] | null = null;

    if (extLogicalConditions) {
      intLogicalConditions = extLogicalConditions.map(
        (andConditionList: ExtLogicalCondition[]) =>
          andConditionList.map((extCondition: ExtLogicalCondition) => {
            const propertyName = this.mapLabelProperty(
              extCondition.propertyName,
              extToIntPropMap
            );
            let operationType = this.mapOperationType(
              extCondition.operationType
            );
            let value = extCondition.value;

            if (propertyName === 'observed') {
              if (
                [
                  OperationType.REGEX_EQUAL,
                  OperationType.REGEX_EQUAL_IGNORE_CASE,
                  OperationType.REGEX_NOT_EQUAL,
                  OperationType.REGEX_NOT_EQUAL_IGNORE_CASE,
                ].indexOf(operationType) >= 0 ||
                (operationType === OperationType.LESS && !value) ||
                (operationType === OperationType.GREATER && value)
              ) {
                // eslint-disable-next-line max-len
                throw Error(
                  `Could not convert logical condition (propertyName: ${propertyName}, operationType: ${operationType}, value: ${value})`
                );
              }

              if (
                (!value && operationType === OperationType.EQUAL) ||
                (value &&
                  (operationType === OperationType.NOT_EQUAL ||
                    operationType === OperationType.LESS))
              ) {
                operationType = OperationType.EQUAL;
              } else {
                operationType = OperationType.NOT_EQUAL;
              }

              value = ObservedType.NONE as any as string;
            }
            return {
              propertyName: propertyName,
              operationType: operationType,
              value: value,
            };
          })
      );
    }

    return intLogicalConditions as R;
  }

  private mapLabelProperty<
    T extends string | null,
    R extends T extends null ? null : string,
  >(labelProperty: T, extToIntPropMap: Map<string, string>): R {
    let newLabelProperty: string | null = null;

    if (labelProperty) {
      if (extToIntPropMap.has(labelProperty)) {
        newLabelProperty = extToIntPropMap.get(labelProperty)!;
      } else {
        newLabelProperty = labelProperty;
      }
    }

    return newLabelProperty as R;
  }

  private mapValueCondition(
    extValueCondition: ExtValueCondition | null,
    extToIntPropMap: Map<string, string>
  ): IntValueCondition | null {
    let intValueCondition: IntValueCondition | null = null;

    if (extValueCondition) {
      intValueCondition = {
        propertyName: this.mapLabelProperty(
          extValueCondition.propertyName,
          extToIntPropMap
        )!,
        valueType: this.mapValueType(extValueCondition.valueType)!,
        useZeroAsMinimum: extValueCondition.useZeroAsMinimum,
      };
    }

    return intValueCondition;
  }

  private mapValueType(extValueType: string): ValueType {
    if (DataMapper.VALUE_TYPE_EXT_TO_INT_MAP.has(extValueType)) {
      const intValueType =
        DataMapper.VALUE_TYPE_EXT_TO_INT_MAP.get(extValueType);
      return intValueType;
    } else {
      throw new Error(`Invalid ValueCondition.valueType: ${extValueType}`);
    }
  }

  private mapOperationType(extOperationType: string): OperationType {
    if (DataMapper.OPERATION_TYPE_EXT_TO_INT_MAP.has(extOperationType)) {
      const intOperationType =
        DataMapper.OPERATION_TYPE_EXT_TO_INT_MAP.get(extOperationType);
      return intOperationType;
    } else {
      throw new InputDataError(
        `Invalid LogicalCondition.operationType: ${extOperationType}`
      );
    }
  }

  private mapShapeType<
    T extends string | null,
    R extends T extends null ? null : NodeShapeType,
  >(extShapeType: T): R {
    if (extShapeType !== null) {
      if (DataMapper.NODE_SHAPE_TYPE_EXT_TO_INT_MAP.has(extShapeType)) {
        const intShapeType =
          DataMapper.NODE_SHAPE_TYPE_EXT_TO_INT_MAP.get(extShapeType);
        return intShapeType as R;
      } else {
        throw new InputDataError(`Invalid shape: ${extShapeType}`);
      }
    }

    return null as R;
  }

  private convertExternalPositions(
    viewData: ViewData,
    fclData: FclData,
    idToStationMap: Map<string, StationData>,
    idToGroupMap: Map<string, GroupData>
  ) {
    const extNodePositions = viewData.graph?.node?.positions;

    if (!extNodePositions) {
      return;
    }

    for (const nodePosition of extNodePositions) {
      if (nodePosition.id == null) {
        throw new InputDataError('Node position id is missing.');
      }
      if (
        !(
          idToStationMap.has(nodePosition.id) ||
          idToGroupMap.has(nodePosition.id)
        )
      ) {
        throw new InputDataError(
          '(Meta)Station of node position "' + nodePosition.id + '" is unkown.'
        );
      }

      fclData.graphSettings.stationPositions[nodePosition.id] =
        nodePosition.position;
    }

    this.setUnsetGroupPositions(fclData);
  }

  private setUnsetGroupPositions(fclData: FclData): void {
    // Desktop App sets group positions on the fly and does not store
    // group positions in json file
    // Web app requires group positions (if known) and expects relative
    // positions of its members
    const statPos = fclData.graphSettings.stationPositions;
    for (const group of fclData.groupSettings) {
      if (statPos[group.id] === undefined) {
        const memberPositions = group.contains.map(
          memberId => statPos[memberId]
        );
        if (!memberPositions.some(p => p === null || p === undefined)) {
          const groupPos = getCenterFromPoints(memberPositions);
          group.contains.forEach((memberId, index) => {
            statPos[memberId] = getDifference(memberPositions[index], groupPos);
          });
          statPos[group.id] = groupPos;
        }
      }
    }
  }

  private getProperty(data: any, path: string): any {
    if (data != null) {
      for (const propName of path.split('.')) {
        if (Object.prototype.hasOwnProperty.call(data, propName)) {
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
      if (!Object.prototype.hasOwnProperty.call(data, propName)) {
        throw new InputDataError(
          'Property "' + propName + '" is missing in ' + context
        );
      } else if (data[propName] === null) {
        throw new InputDataError(
          'Property "' + propName + '" is null in ' + context
        );
      }
    }
  }

  private createReverseMapFromSimpleMap<T>(map: {
    [key: string]: T;
  }): Map<T, string> {
    return new Map(Object.entries(map).map(([key, value]) => [value, key]));
  }
}
