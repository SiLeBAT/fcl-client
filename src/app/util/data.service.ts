import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {FclData} from './datatypes';

import 'rxjs/add/operator/toPromise';

export enum TableMode {
  STATIONS = 'Stations' as any,
  DELIVERIES = 'Deliveries' as any
}

export enum ShowType {
  ALL = 'All' as any,
  SELECTED_ONLY = 'Selected Only' as any,
  TRACE_ONLY = 'Trace Only' as any
}

export enum Size {
  SMALL = 'Small' as any,
  MEDIUM = 'Medium' as any,
  LARGE = 'Large' as any
}

@Injectable()
export class DataService {

  static GRAPH_BACKGROUND = [245, 245, 245];

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
    [TableMode.STATIONS, ['id', 'name', 'type', 'score']],
    [TableMode.DELIVERIES, ['id', 'source', 'target', 'score']]
  ]);

  static DEFAULT_GRAPH_SETTINGS = {
    nodeSize: Size.MEDIUM,
    fontSize: Size.MEDIUM,
    mergeDeliveries: false,
    showLegend: true
  };

  static DEFAULT_TABLE_SETTINGS = {
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
    if (data.hasOwnProperty('elements') && data.hasOwnProperty('layout')
      && data.hasOwnProperty('graphSettings') && data.hasOwnProperty('tableSettings')) {
      for (const prop of Object.keys(DataService.DEFAULT_GRAPH_SETTINGS)) {
        if (!data.graphSettings.hasOwnProperty(prop)) {
          data.graphSettings[prop] = JSON.parse(JSON.stringify(DataService.DEFAULT_GRAPH_SETTINGS[prop]));
        }
      }

      for (const prop of Object.keys(DataService.DEFAULT_TABLE_SETTINGS)) {
        if (!data.tableSettings.hasOwnProperty(prop)) {
          data.tableSettings[prop] = JSON.parse(JSON.stringify(DataService.DEFAULT_TABLE_SETTINGS[prop]));
        }
      }

      return data;
    } else {
      const stationsById = {};
      const deliveriesById = {};

      for (const s of data.stations) {
        s.data.isEdge = false;
        s.data.incoming = [];
        s.data.outgoing = [];
        stationsById[s.data.id] = s;
      }

      for (const d of data.deliveries) {
        stationsById[d.data.source].data.outgoing.push(d.data.id);
        stationsById[d.data.target].data.incoming.push(d.data.id);

        d.data.isEdge = true;
        d.data.incoming = [];
        d.data.outgoing = [];
        deliveriesById[d.data.id] = d;
      }

      for (const r of data.deliveriesRelations) {
        deliveriesById[r.data.source].data.outgoing.push(r.data.target);
        deliveriesById[r.data.target].data.incoming.push(r.data.source);
      }

      const graphSettings = {};
      const tableSettings = {};

      for (const prop of Object.keys(DataService.DEFAULT_GRAPH_SETTINGS)) {
        graphSettings[prop] = JSON.parse(JSON.stringify(DataService.DEFAULT_GRAPH_SETTINGS[prop]));
      }

      for (const prop of Object.keys(DataService.DEFAULT_TABLE_SETTINGS)) {
        tableSettings[prop] = JSON.parse(JSON.stringify(DataService.DEFAULT_TABLE_SETTINGS[prop]));
      }

      return {
        elements: {
          stations: data.stations,
          deliveries: data.deliveries
        },
        layout: {
          name: 'random'
        },
        graphSettings: graphSettings,
        tableSettings: tableSettings
      };
    }
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
        }).catch(error => Promise.reject(error.text()));
    } else if (this.dataSource instanceof File) {
      const file: File = this.dataSource;

      return new Promise(resolve => {
        const fileReader = new FileReader();

        fileReader.onload = (event: Event) => {
          const contents: any = event.target;

          this.data = DataService.preprocessData(JSON.parse(contents.result));

          resolve(this.data);
        };

        fileReader.readAsText(file);
      });
    } else {
      return new Promise((resolve, reject) => reject('no data source specified'));
    }
  }

}
