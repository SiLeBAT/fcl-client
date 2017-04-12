import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {FclData} from './datatypes';

import 'rxjs/add/operator/toPromise';

export enum ShowType {
  ALL = 'All' as any,
  SELECTED_ONLY = 'Selected Only' as any,
  TRACE_ONLY = 'Trace Only' as any
}

@Injectable()
export class DataService {

  static GRAPH_BACKGROUND = [245, 245, 245];

  static NODE_SIZES = [
    {value: 50, viewValue: 'Small'},
    {value: 100, viewValue: 'Large'}
  ];

  static FONT_SIZES = [
    {value: 12, viewValue: 'Small'},
    {value: 18, viewValue: 'Large'}
  ];

  static PROPERTIES: Map<string, { name: string, color: number[] }> = new Map([
    ['forward', {name: 'Forward Trace', color: [150, 255, 75]}],
    ['backward', {name: 'Backward Trace', color: [255, 150, 75]}],
    ['observed', {name: 'Observed', color: [75, 150, 255]}],
    ['outbreak', {name: 'Outbreak', color: [255, 50, 50]}],
    ['commonLink', {name: 'Common Link', color: [255, 255, 75]}]
  ]);

  static TABLE_MODES = ['Stations', 'Deliveries'];

  static TABLE_COLUMNS = {
    'Stations': [
      {name: 'ID', prop: 'id'},
      {name: 'Name', prop: 'name'},
      {name: 'Type', prop: 'type'},
      {name: 'Score', prop: 'score'}
    ],
    'Deliveries': [
      {name: 'ID', prop: 'id'},
      {name: 'Source', prop: 'source'},
      {name: 'Target', prop: 'target'},
      {name: 'Score', prop: 'score'}
    ]
  };

  static DEFAULT_GRAPH_SETTINGS = {
    nodeSize: DataService.NODE_SIZES[0].value,
    fontSize: DataService.FONT_SIZES[0].value,
    mergeDeliveries: false,
    showLegend: true
  };

  static DEFAULT_TABLE_SETTINGS = {
    mode: DataService.TABLE_MODES[0],
    width: 0.25,
    stationColumns: DataService.TABLE_COLUMNS['Stations'].map(c => c.name),
    deliveryColumns: DataService.TABLE_COLUMNS['Deliveries'].map(c => c.name),
    showType: ShowType.ALL
  };

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
