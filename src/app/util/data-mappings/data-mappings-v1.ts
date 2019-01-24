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
      }
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
  });

    static readonly DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_ID_NEXT: ImmutableMap<
    string,
    ColumnInfo
  > = ImmutableMap({
      source: { columnId: 'ID', type: 'string' },
      target: {
          columnId: 'Next',
          type: 'string'
      }
  });

    static readonly DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_FROM_TO: ImmutableMap<
    string,
    ColumnInfo
  > = ImmutableMap({
      source: { columnId: 'from', type: 'string' },
      target: {
          columnId: 'to',
          type: 'string'
      }
  });

    static readonly GROUPTYPE_EXT_TO_INT_MAP: ImmutableMap<
    string,
    GroupType
  > = ImmutableMap({
      SimpleChain: GroupType.SIMPLE_CHAIN,
      SourceGroup: GroupType.TARGET_GROUP,
      TargetGroup: GroupType.TARGET_GROUP,
      IsolatedGroup: GroupType.ISOLATED_GROUP
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
