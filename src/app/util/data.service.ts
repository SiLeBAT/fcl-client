import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {
  DeliveryData, FclData, FclElements, GraphSettings, ObservedType, ShowType, Size, StationData, TableMode,
  TableSettings
} from './datatypes';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class DataService {

  static TABLE_MODES = [TableMode.STATIONS, TableMode.DELIVERIES];
  static SHOW_TYPES = [ShowType.ALL, ShowType.SELECTED_ONLY, ShowType.TRACE_ONLY];
  static SIZES = [Size.SMALL, Size.MEDIUM, Size.LARGE];

  static PROPERTIES: Map<string, { name: string, color: number[] }> = new Map([
    ['id', {name: 'ID', color: null}],
    ['name', {name: 'Name', color: null}],
    ['type', {name: 'Type', color: null}],
    ['source', {name: 'Source', color: null}],
    ['target', {name: 'Target', color: null}],
    ['forward', {name: 'Forward Trace', color: [150, 255, 75]}],
    ['backward', {name: 'Backward Trace', color: [255, 150, 75]}],
    ['observed', {name: 'Observed', color: [75, 150, 255]}],
    ['outbreak', {name: 'Outbreak', color: [255, 50, 50]}],
    ['commonLink', {name: 'Common Link', color: [255, 255, 75]}],
    ['score', {name: 'Score', color: null}]
  ]);

  static TABLE_COLUMNS: Map<TableMode, string[]> = new Map([
    [TableMode.STATIONS, ['id', 'name', 'score']],
    [TableMode.DELIVERIES, ['id', 'source', 'target', 'score']]
  ]);

  static DEFAULT_GRAPH_SETTINGS: GraphSettings = {
    nodeSize: Size.MEDIUM,
    fontSize: Size.MEDIUM,
    mergeDeliveries: false,
    showLegend: true
  };

  static DEFAULT_TABLE_SETTINGS: TableSettings = {
    mode: TableMode.STATIONS,
    width: 0.25,
    stationColumns: DataService.TABLE_COLUMNS.get(TableMode.STATIONS),
    deliveryColumns: DataService.TABLE_COLUMNS.get(TableMode.DELIVERIES),
    showType: ShowType.ALL
  };

  static PROPERTIES_WITH_COLORS = Array.from(DataService.PROPERTIES).filter(p => p[1].color != null).map(p => p[0]);

  private dataSource: string | File;
  private data: FclData;

  private static preprocessData(data: any): FclData {
    const containsRawData = data.hasOwnProperty('stations') && data.hasOwnProperty('deliveries')
      && data.hasOwnProperty('deliveriesRelations');
    const containsDataWithSettings = data.hasOwnProperty('elements') && data.hasOwnProperty('layout')
      && data.hasOwnProperty('graphSettings') && data.hasOwnProperty('tableSettings');

    if (containsRawData) {
      return DataService.preprocessRawData(data);
    } else if (containsDataWithSettings) {
      return DataService.preprocessDataWithSettings(data);
    } else {
      throw new SyntaxError('Invalid data format');
    }
  }

  private static preprocessRawData(data: any): FclData {
    const stationsById = {};
    const deliveriesById = {};

    for (const s of data.stations) {
      s.data.incoming = [];
      s.data.outgoing = [];
      stationsById[s.data.id] = s;
    }

    for (const d of data.deliveries) {
      stationsById[d.data.source].data.outgoing.push(d.data.id);
      stationsById[d.data.target].data.incoming.push(d.data.id);

      d.data.incoming = [];
      d.data.outgoing = [];
      deliveriesById[d.data.id] = d;
    }

    for (const r of data.deliveriesRelations) {
      deliveriesById[r.data.source].data.outgoing.push(r.data.target);
      deliveriesById[r.data.target].data.incoming.push(r.data.source);
    }

    const graphSettings: GraphSettings = {
      nodeSize: DataService.DEFAULT_GRAPH_SETTINGS.nodeSize,
      fontSize: DataService.DEFAULT_GRAPH_SETTINGS.fontSize,
      mergeDeliveries: DataService.DEFAULT_GRAPH_SETTINGS.mergeDeliveries,
      showLegend: DataService.DEFAULT_GRAPH_SETTINGS.showLegend
    };
    const tableSettings: TableSettings = {
      mode: DataService.DEFAULT_TABLE_SETTINGS.mode,
      width: DataService.DEFAULT_TABLE_SETTINGS.width,
      stationColumns: Array.from(DataService.DEFAULT_TABLE_SETTINGS.stationColumns),
      deliveryColumns: Array.from(DataService.DEFAULT_TABLE_SETTINGS.deliveryColumns),
      showType: DataService.DEFAULT_TABLE_SETTINGS.showType
    };
    const elements: FclElements = {
      stations: DataService.createStations(data.stations),
      deliveries: DataService.createDeliveries(data.deliveries)
    };

    return {
      elements: elements,
      layout: {
        name: 'random'
      },
      graphSettings: graphSettings,
      tableSettings: tableSettings
    };
  }

  private static preprocessDataWithSettings(data: any): FclData {
    const graphSettings: GraphSettings = {
      nodeSize: data.graphSettings.nodeSize != null ? data.graphSettings.nodeSize : DataService.DEFAULT_GRAPH_SETTINGS.nodeSize,
      fontSize: data.graphSettings.fontSize != null ? data.graphSettings.fontSize : DataService.DEFAULT_GRAPH_SETTINGS.fontSize,
      mergeDeliveries: data.graphSettings.mergeDeliveries != null
        ? data.graphSettings.mergeDeliveries : DataService.DEFAULT_GRAPH_SETTINGS.mergeDeliveries,
      showLegend: data.graphSettings.showLegend != null ? data.graphSettings.showLegend : DataService.DEFAULT_GRAPH_SETTINGS.showLegend
    };
    const tableSettings: TableSettings = {
      mode: data.tableSettings.mode != null ? data.tableSettings.mode : DataService.DEFAULT_TABLE_SETTINGS.mode,
      width: data.tableSettings.width != null ? data.tableSettings.width : DataService.DEFAULT_TABLE_SETTINGS.width,
      stationColumns: data.tableSettings.stationColumns != null
        ? data.tableSettings.stationColumns : Array.from(DataService.DEFAULT_TABLE_SETTINGS.stationColumns),
      deliveryColumns: data.tableSettings.deliveryColumns != null
        ? data.tableSettings.deliveryColumns : Array.from(DataService.DEFAULT_TABLE_SETTINGS.deliveryColumns),
      showType: data.tableSettings.showType != null ? data.tableSettings.showType : DataService.DEFAULT_TABLE_SETTINGS.showType
    };
    const elements: FclElements = {
      stations: DataService.createStations(data.elements.stations),
      deliveries: DataService.createDeliveries(data.elements.deliveries)
    };

    return {
      elements: elements,
      layout: data.layout,
      graphSettings: graphSettings,
      tableSettings: tableSettings
    };
  }

  private static createStations(elements: any[]): { data: StationData }[] {
    const stations: { data: StationData }[] = [];

    for (const e of elements) {
      stations.push({
        data: {
          id: e.data.id,
          name: e.data.name,
          incoming: e.data.incoming,
          outgoing: e.data.outgoing,
          invisible: e.data.invisible != null ? e.data.invisible : false,
          contained: e.data.contained != null ? e.data.contained : false,
          contains: e.data.contains != null ? e.data.contains : null,
          selected: e.data.selected != null ? e.data.selected : false,
          observed: e.data.observed != null ? e.data.observed : ObservedType.NONE,
          forward: e.data.forward != null ? e.data.forward : false,
          backward: e.data.backward != null ? e.data.backward : false,
          outbreak: e.data.outbreak != null ? e.data.outbreak : false,
          score: e.data.score != null ? e.data.score : 0,
          commonLink: e.data.commonLink != null ? e.data.commonLink : false,
          position: e.data.position != null ? e.data.position : null,
          positionRelativeTo: e.data.positionRelativeTo != null ? e.data.positionRelativeTo : null
        }
      });
    }

    return stations;
  }

  private static createDeliveries(elements: any[]): { data: DeliveryData }[] {
    const deliveries: { data: DeliveryData }[] = [];

    for (const e of elements) {
      deliveries.push({
        data: {
          id: e.data.id,
          source: e.data.source,
          target: e.data.target,
          originalSource: e.data.source,
          originalTarget: e.data.target,
          incoming: e.data.incoming,
          outgoing: e.data.outgoing,
          invisible: e.data.invisible != null ? e.data.invisible : false,
          selected: e.data.selected != null ? e.data.selected : false,
          observed: e.data.observed != null ? e.data.observed : ObservedType.NONE,
          forward: e.data.forward != null ? e.data.forward : false,
          backward: e.data.backward != null ? e.data.backward : false,
          score: e.data.score != null ? e.data.score : 0
        }
      });
    }

    return deliveries;
  }

  constructor(private http: Http) {
  }

  setDataSource(source: string | File) {
    delete this.data;
    this.dataSource = source;
  }

  getData(): Promise<FclData> {
    if (this.data != null) {
      return new Promise((resolve, reject) => resolve(this.data));
    } else if (typeof this.dataSource === 'string') {
      return this.http.get(this.dataSource)
        .toPromise()
        .then(response => {
          this.data = DataService.preprocessData(response.json());

          return this.data;
        }).catch(error => Promise.reject(error));
    } else if (this.dataSource instanceof File) {
      const file: File = this.dataSource;

      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.onload = (event: Event) => {
          const contents: any = event.target;

          try {
            this.data = DataService.preprocessData(JSON.parse(contents.result));
            resolve(this.data);
          } catch (e) {
            reject(e);
          }
        };

        fileReader.readAsText(file);
      });
    } else {
      return new Promise((resolve, reject) => reject('no data source specified'));
    }
  }

}
