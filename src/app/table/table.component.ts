import {Component, OnInit, ViewChild, TemplateRef} from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {DatatableComponent} from '@swimlane/ngx-datatable';
import {scrollbarWidth} from '@swimlane/ngx-datatable/release/utils/scrollbar-width';

import {DataService} from '../util/data.service';
import {UtilService} from '../util/util.service';

declare const ResizeSensor: any;

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {

  private columns: any[];
  //noinspection JSMismatchedCollectionQueryUpdate
  private rows: any[];

  private data: any;
  private mode = DataService.DEFAULT_TABLE_SETTINGS.mode;
  private stationColumns = DataService.DEFAULT_TABLE_SETTINGS.stationColumns;
  private deliveryColumns = DataService.DEFAULT_TABLE_SETTINGS.deliveryColumns;
  private showSelectedOnly = DataService.DEFAULT_TABLE_SETTINGS.showSelectedOnly;

  private resizeTimer: any;

  private changeFunction: () => void;

  @ViewChild('table') table: DatatableComponent;
  @ViewChild('selectTmpl') selectTmpl: TemplateRef<any>;

  private static getUpdatedColumns(columns: any[]): any[] {
    const selectColumnWidth = 40;
    const width = document.getElementById('tableContainer').offsetWidth - scrollbarWidth;
    const columnWidth = (width - selectColumnWidth) / (columns.length - 1);
    let first = true;

    for (const column of columns) {
      if (first) {
        column.width = selectColumnWidth;
        column.minWidth = selectColumnWidth;
        column.maxWidth = selectColumnWidth;
      } else {
        column.width = columnWidth;
        column.minWidth = columnWidth;
        column.maxWidth = columnWidth;
      }

      first = false;
    }

    return columns;
  }

  constructor() {
    const style = document.createElement('style');

    style.type = 'text/css';
    style.innerHTML = '';
    style.innerHTML += 'datatable-body-row { background-color: rgb(255, 255, 255) !important; }';

    for (const props of UtilService.getAllCombinations(Array.from(DataService.PROPERTIES.keys()))) {
      style.innerHTML += 'datatable-body-row';

      if (props.length === 1) {
        const color = UtilService.colorToCss(DataService.PROPERTIES.get(props[0]).color);

        style.innerHTML += '.' + props[0] + ' { background-color: ' + color + ' !important; }';
      } else {
        for (const prop of props) {
          style.innerHTML += '.' + prop;
        }

        style.innerHTML += ' { background: repeating-linear-gradient(90deg';

        for (let i = 0; i < props.length; i++) {
          const color = UtilService.colorToCss(DataService.PROPERTIES.get(props[i]).color);
          const from = i === 0 ? i / props.length * 100 + '%' : (i + 0.2) / props.length * 100 + '%';
          const to = i === props.length - 1 ? (i + 1) / props.length * 100 + '%' : (i + 0.8) / props.length * 100 + '%';

          style.innerHTML += ', ' + color + ' ' + from + ', ' + color + ' ' + to;
        }

        style.innerHTML += ') !important; }';
      }
    }

    document.head.appendChild(style);
  }

  ngOnInit() {
    window.onresize = () => {
      Observable.timer(500).subscribe(() => {
        this.update();
      });
    };

    new ResizeSensor(document.getElementById('tableContainer'), () => {
      if (this.resizeTimer != null) {
        this.resizeTimer.unsubscribe();
      }

      this.resizeTimer = Observable.timer(100).subscribe(() => {
        this.columns = TableComponent.getUpdatedColumns(this.columns);
        this.table.recalculate();
      });
    });
  }

  init(data: any) {
    this.data = data;
    this.update();
  }

  setMode(mode: string) {
    this.mode = mode;
    this.update();
  }

  setStationColumns(stationColumns: string[]) {
    this.stationColumns = stationColumns;
    this.update();
  }

  setDeliveryColumns(deliveryColumns: string[]) {
    this.deliveryColumns = deliveryColumns;
    this.update();
  }

  setShowSelectedOnly(showSelectedOnly: boolean) {
    this.showSelectedOnly = showSelectedOnly;
    this.update();
  }

  update() {
    const selectColumn = {
      name: ' ',
      prop: 'selected',
      resizable: false,
      cellTemplate: this.selectTmpl
    };
    let columns = DataService.TABLE_COLUMNS[this.mode].map(column => {
      return {
        name: column.name,
        prop: column.prop,
        resizeable: false,
      };
    });

    if (this.mode === 'Stations') {
      columns = columns.filter(c => this.stationColumns.includes(c.name));
    } else if (this.mode === 'Deliveries') {
      columns = columns.filter(c => this.deliveryColumns.includes(c.name));
    }

    this.columns = TableComponent.getUpdatedColumns([selectColumn].concat(columns));

    if (this.data != null) {
      let elements = [];

      if (this.mode === 'Stations') {
        elements = this.data.stations.filter(e => !e.data.contained);
      } else if (this.mode === 'Deliveries') {
        elements = this.data.deliveries;
      }

      elements = elements.filter(e => !e.data.invisible);

      if (this.showSelectedOnly) {
        elements = elements.filter(e => e.data.selected);
      }

      this.rows = elements.map(e => JSON.parse(JSON.stringify(e.data)));
    }

    this.table.recalculate();
  }

  onSelectionChange(changeFunction: () => void) {
    this.changeFunction = changeFunction;
  }

  //noinspection JSUnusedLocalSymbols,JSMethodCanBeStatic
  private getRowClass(row) {
    return {
      'selected': row.selected,
      'forward': row.forward,
      'backward': row.backward,
      'observed': row.observed === 'full' || row.observed === 'forward' || row.observed === 'backward',
      'outbreak': row.outbreak,
      'commonLink': row.commonLink
    };
  }

  //noinspection JSUnusedLocalSymbols,JSMethodCanBeStatic
  private onSelect(row) {
    if (this.mode === 'Stations') {
      this.data.stations.find(s => s.data.id === row.id).data.selected = row.selected;
    } else if (this.mode === 'Deliveries') {
      this.data.deliveries.find(d => d.data.id === row.id).data.selected = row.selected;
    }

    if (this.showSelectedOnly && !row.selected) {
      this.rows.splice(this.rows.findIndex(r => r.id === row.id), 1);
    }

    if (this.changeFunction != null) {
      this.changeFunction();
    }
  }
}
