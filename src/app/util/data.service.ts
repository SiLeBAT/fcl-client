import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {DeliveryData, FclData, FclElements, GraphSettings, ObservedType, StationData, TableSettings} from './datatypes';


import {Utils} from './utils';
import {Constants} from './constants';

@Injectable()
export class DataService {

  private dataSource: string | File;
  private data: FclData;

  static getDefaultGraphSettings(): GraphSettings {
    return {
      type: Constants.DEFAULT_GRAPH_TYPE,
      nodeSize: Constants.DEFAULT_GRAPH_NODE_SIZE,
      fontSize: Constants.DEFAULT_GRAPH_FONT_SIZE,
      mergeDeliveries: Constants.DEFAULT_GRAPH_MERGE_DELIVERIES,
      showLegend: Constants.DEFAULT_GRAPH_SHOW_LEGEND,
      showZoom: Constants.DEFAULT_GRAPH_SHOW_ZOOM
    };
  }

  static getDefaultTableSettings(): TableSettings {
    return {
      mode: Constants.DEFAULT_TABLE_MODE,
      width: Constants.DEFAULT_TABLE_WIDTH,
      stationColumns: Constants.DEFAULT_TABLE_STATION_COLUMNS.toArray(),
      deliveryColumns: Constants.DEFAULT_TABLE_DELIVERY_COLUMNS.toArray(),
      showType: Constants.DEFAULT_TABLE_SHOW_TYPE
    };
  }

  private static preprocessData(data: any): FclData {
    const containsRawData = data.hasOwnProperty('stations') && data.hasOwnProperty('deliveries')
      && data.hasOwnProperty('deliveriesRelations');
    const containsDataWithSettings = data.hasOwnProperty('elements') && data.hasOwnProperty('layout') && data.hasOwnProperty('gisLayout')
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

    return {
      elements: DataService.createElements(data.stations, data.deliveries),
      layout: null,
      gisLayout: null,
      graphSettings: DataService.getDefaultGraphSettings(),
      tableSettings: DataService.getDefaultTableSettings()
    };
  }

  private static preprocessDataWithSettings(data: any): FclData {
    const graphSettings: GraphSettings = {
      type: data.graphSettings.type != null ? data.graphSettings.type : Constants.DEFAULT_GRAPH_TYPE,
      nodeSize: data.graphSettings.nodeSize != null ? data.graphSettings.nodeSize : Constants.DEFAULT_GRAPH_NODE_SIZE,
      fontSize: data.graphSettings.fontSize != null ? data.graphSettings.fontSize : Constants.DEFAULT_GRAPH_FONT_SIZE,
      mergeDeliveries: data.graphSettings.mergeDeliveries != null
        ? data.graphSettings.mergeDeliveries : Constants.DEFAULT_GRAPH_MERGE_DELIVERIES,
      showLegend: data.graphSettings.showLegend != null ? data.graphSettings.showLegend : Constants.DEFAULT_GRAPH_SHOW_LEGEND,
      showZoom: data.graphSettings.showZoom != null ? data.graphSettings.showZoom : Constants.DEFAULT_GRAPH_SHOW_ZOOM
    };
    const tableSettings: TableSettings = {
      mode: data.tableSettings.mode != null ? data.tableSettings.mode : Constants.DEFAULT_TABLE_MODE,
      width: data.tableSettings.width != null ? data.tableSettings.width : Constants.DEFAULT_TABLE_WIDTH,
      stationColumns: data.tableSettings.stationColumns != null
        ? data.tableSettings.stationColumns : Constants.DEFAULT_TABLE_STATION_COLUMNS.toArray(),
      deliveryColumns: data.tableSettings.deliveryColumns != null
        ? data.tableSettings.deliveryColumns : Constants.DEFAULT_TABLE_DELIVERY_COLUMNS.toArray(),
      showType: data.tableSettings.showType != null ? data.tableSettings.showType : Constants.DEFAULT_TABLE_SHOW_TYPE
    };

    return {
      elements: DataService.createElements(data.elements.stations, data.elements.deliveries),
      layout: data.layout,
      gisLayout: data.gisLayout,
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

      if (id.includes(Constants.ARROW_STRING)) {
        throw new SyntaxError('ids are not allowed to contain "' + Constants.ARROW_STRING + '"');
      }

      ids.add(id);
    }

    for (const d of deliveryElements) {
      const lot: string = d.lot;

      if (lot != null && lot.includes(Constants.ARROW_STRING)) {
        throw new SyntaxError('lots are not allowed to contain "' + Constants.ARROW_STRING + '"');
      }
    }

    return {
      stations: DataService.createStations(stationElements),
      deliveries: DataService.createDeliveries(deliveryElements)
    };
  }

  private static createStations(elements: any[]): StationData[] {
    const stations: StationData[] = [];
    const defaultKeys: Set<string> = new Set(Constants.STATION_PROPERTIES.toArray());

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
        lat: e.lat != null ? e.lat : 0.0,
        lon: e.lon != null ? e.lon : 0.0,
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
        crossContamination: e.crossContamination != null ? e.crossContamination : false,
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
    const defaultKeys: Set<string> = new Set(Constants.DELIVERY_PROPERTIES.toArray());

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
