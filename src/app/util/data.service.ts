import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {
  DeliveryData, FclData, FclElements, GraphSettings, ObservedType, ShowType, Size, StationData, TableMode,
  TableSettings
} from './datatypes';

import 'rxjs/add/operator/toPromise';
import {Utils} from './utils';

@Injectable()
export class DataService {

  static ARROW_STRING = '->';
  static TABLE_MODES = [TableMode.STATIONS, TableMode.DELIVERIES];
  static SHOW_TYPES = [ShowType.ALL, ShowType.SELECTED_ONLY, ShowType.TRACE_ONLY];
  static SIZES = [Size.SMALL, Size.MEDIUM, Size.LARGE];

  static PROPERTIES: Map<string, { name: string, color: number[] }> = new Map([
    ['id', {name: 'ID', color: null}],
    ['name', {name: 'Name', color: null}],
    ['lot', {name: 'Lot', color: null}],
    ['date', {name: 'Date', color: null}],
    ['source', {name: 'Source', color: null}],
    ['target', {name: 'Target', color: null}],
    ['originalSource', {name: 'Original Source', color: null}],
    ['originalTarget', {name: 'Original Target', color: null}],
    ['incoming', {name: 'Incoming', color: null}],
    ['outgoing', {name: 'Outgoing', color: null}],
    ['contains', {name: 'Contains', color: null}],
    ['forward', {name: 'Forward Trace', color: [150, 255, 75]}],
    ['backward', {name: 'Backward Trace', color: [255, 150, 75]}],
    ['observed', {name: 'Observed', color: [75, 150, 255]}],
    ['outbreak', {name: 'Outbreak', color: [255, 50, 50]}],
    ['commonLink', {name: 'Common Link', color: [255, 255, 75]}],
    ['score', {name: 'Score', color: null}]
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
    stationColumns: ['id', 'name', 'score'],
    deliveryColumns: ['id', 'source', 'target', 'score'],
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

    return {
      elements: DataService.createElements(data.stations, data.deliveries),
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

    return {
      elements: DataService.createElements(data.elements.stations, data.elements.deliveries),
      layout: data.layout,
      graphSettings: graphSettings,
      tableSettings: tableSettings
    };
  }

  private static createElements(stationElements: any[], deliveryElements: any[]): FclElements {
    const ids: Set<string> = new Set();

    for (const e of stationElements.concat(deliveryElements)) {
      const id: string = e.id;

      if (ids.has(id)) {
        throw new SyntaxError('Duplicate id: ' + id);
      }

      if (id.includes(DataService.ARROW_STRING)) {
        throw new SyntaxError('ids are not allowed to contain "' + DataService.ARROW_STRING + '"');
      }

      ids.add(id);
    }

    for (const d of deliveryElements) {
      const lot: string = d.lot;

      if (lot != null && lot.includes(DataService.ARROW_STRING)) {
        throw new SyntaxError('lots are not allowed to contain "' + DataService.ARROW_STRING + '"');
      }
    }

    return {
      stations: DataService.createStations(stationElements),
      deliveries: DataService.createDeliveries(deliveryElements)
    };
  }

  private static createStations(elements: any[]): StationData[] {
    const stations: StationData[] = [];
    const defaultKeys: Set<string> = new Set(Utils.getStationProperties());

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
        incoming: e.incoming,
        outgoing: e.outgoing,
        connections: e.connections,
        invisible: e.invisible != null ? e.invisible : false,
        contained: e.contained != null ? e.contained : false,
        contains: e.contains != null ? e.contains : null,
        selected: e.selected != null ? e.selected : false,
        observed: e.observed != null ? e.observed : ObservedType.NONE,
        forward: e.forward != null ? e.forward : false,
        backward: e.backward != null ? e.backward : false,
        outbreak: e.outbreak != null ? e.outbreak : false,
        score: e.score != null ? e.score : 0,
        commonLink: e.commonLink != null ? e.commonLink : false,
        position: e.position != null ? e.position : null,
        positionRelativeTo: e.positionRelativeTo != null ? e.positionRelativeTo : null,
        properties: e.properties != null ? e.properties : properties
      });
    }

    return stations;
  }

  private static createDeliveries(elements: any[]): DeliveryData[] {
    const deliveries: DeliveryData[] = [];
    const defaultKeys: Set<string> = new Set(Utils.getDeliveryProperties());

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
        properties: e.properties != null ? e.properties : properties
      })
      ;
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
