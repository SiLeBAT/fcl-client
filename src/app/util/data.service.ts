import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {FclData, FclElements, GraphSettings, ObservedType, ShowType, Size, TableMode, TableSettings} from './datatypes';

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
    [TableMode.STATIONS, ['id', 'name', 'type', 'score']],
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
    const containsDataAndSettings = data.hasOwnProperty('elements') && data.hasOwnProperty('layout')
      && data.hasOwnProperty('graphSettings') && data.hasOwnProperty('tableSettings');
    const containsRawData = data.hasOwnProperty('stations') && data.hasOwnProperty('deliveries')
      && data.hasOwnProperty('deliveriesRelations');

    if (containsDataAndSettings) {
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

      this.addMissingProperties(data.elements);

      return data;
    } else if (containsRawData) {
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
        stations: data.stations,
        deliveries: data.deliveries
      };

      this.addMissingProperties(elements);

      return {
        elements: elements,
        layout: {
          name: 'random'
        },
        graphSettings: graphSettings,
        tableSettings: tableSettings
      };
    } else {
      throw new SyntaxError('Invalid data format');
    }
  }

  private static addMissingProperties(elements: FclElements) {
    for (const s of elements.stations) {
      if (s.data.score == null) {
        s.data.score = 0;
      }

      if (s.data.invisible == null) {
        s.data.invisible = false;
      }

      if (s.data.selected == null) {
        s.data.selected = false;
      }

      if (s.data.observed == null) {
        s.data.observed = ObservedType.NONE;
      }

      if (s.data.forward == null) {
        s.data.forward = false;
      }

      if (s.data.backward == null) {
        s.data.backward = false;
      }

      if (s.data.outbreak == null) {
        s.data.outbreak = false;
      }

      if (s.data.commonLink == null) {
        s.data.commonLink = false;
      }
    }

    for (const d of elements.deliveries) {
      d.data.originalSource = d.data.source;
      d.data.originalTarget = d.data.target;

      if (d.data.score == null) {
        d.data.score = 0;
      }

      if (d.data.invisible == null) {
        d.data.invisible = false;
      }

      if (d.data.selected == null) {
        d.data.selected = false;
      }

      if (d.data.observed == null) {
        d.data.observed = ObservedType.NONE;
      }

      if (d.data.forward == null) {
        d.data.forward = false;
      }

      if (d.data.backward == null) {
        d.data.backward = false;
      }
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
