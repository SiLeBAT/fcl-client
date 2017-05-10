import {DeliveryData, ShowType, Size, StationData, TableMode} from './datatypes';
import {List, Map} from 'immutable';

export class Constants {

  private static readonly STATION_DATA: StationData = {
    id: null, name: null, incoming: null, outgoing: null, connections: null, invisible: null, contained: null, contains: null,
    selected: null, observed: null, forward: null, backward: null, outbreak: null, score: null, commonLink: null, position: null,
    positionRelativeTo: null, properties: null
  };

  private static readonly DELIVERY_DATA: DeliveryData = {
    id: null, name: null, lot: null, date: null, source: null, target: null, originalSource: null, originalTarget: null, invisible: null,
    selected: null, observed: null, forward: null, backward: null, score: null, properties: null
  };

  static readonly ARROW_STRING = '->';

  static readonly STATION_PROPERTIES = List(Object.keys(Constants.STATION_DATA));
  static readonly DELIVERY_PROPERTIES = List(Object.keys(Constants.DELIVERY_DATA));
  static readonly PROPERTIES: Map<string, { name: string, color: number[] }> = Map({
    id: {name: 'ID', color: null},
    name: {name: 'Name', color: null},
    lot: {name: 'Lot', color: null},
    date: {name: 'Date', color: null},
    source: {name: 'Source', color: null},
    target: {name: 'Target', color: null},
    originalSource: {name: 'Original Source', color: null},
    originalTarget: {name: 'Original Target', color: null},
    incoming: {name: 'Incoming', color: null},
    outgoing: {name: 'Outgoing', color: null},
    contains: {name: 'Contains', color: null},
    forward: {name: 'Forward Trace', color: [150, 255, 75]},
    backward: {name: 'Backward Trace', color: [255, 150, 75]},
    observed: {name: 'Observed', color: [75, 150, 255]},
    outbreak: {name: 'Outbreak', color: [255, 50, 50]},
    commonLink: {name: 'Common Link', color: [255, 255, 75]},
    score: {name: 'Score', color: null}
  });
  static readonly PROPERTIES_WITH_COLORS = List(Constants.PROPERTIES.filter(p => p.color != null).keys());

  static readonly TABLE_MODES = List.of(TableMode.STATIONS, TableMode.DELIVERIES);
  static readonly SHOW_TYPES = List.of(ShowType.ALL, ShowType.SELECTED_ONLY, ShowType.TRACE_ONLY);
  static readonly SIZES = List.of(Size.SMALL, Size.MEDIUM, Size.LARGE);

  static readonly DEFAULT_GRAPH_NODE_SIZE = Size.MEDIUM;
  static readonly DEFAULT_GRAPH_FONT_SIZE = Size.MEDIUM;
  static readonly DEFAULT_GRAPH_MERGE_DELIVERIES = false;
  static readonly DEFAULT_GRAPH_SHOW_LEGEND = true;

  static readonly DEFAULT_TABLE_MODE = TableMode.STATIONS;
  static readonly DEFAULT_TABLE_WIDTH = 0.25;
  static readonly DEFAULT_TABLE_STATION_COLUMNS = List.of('id', 'name', 'score');
  static readonly DEFAULT_TABLE_DELIVERY_COLUMNS = List.of('id', 'source', 'target', 'score');
  static readonly DEFAULT_TABLE_SHOW_TYPE = ShowType.ALL;

}
