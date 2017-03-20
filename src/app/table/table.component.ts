import {Component, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {DatatableComponent} from '@swimlane/ngx-datatable';
import {scrollbarWidth} from '@swimlane/ngx-datatable/release/utils/scrollbar-width';

import {DataService} from '../util/data.service';

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

  @ViewChild('table') table: DatatableComponent;

  private static getUpdatedColumns(columns: any[]): any[] {
    const width = document.getElementById('tableContainer').offsetWidth - scrollbarWidth;
    const columnWidth = (width - 5) / (columns.length - 1);
    let first = true;

    for (const column of columns) {
      if (first) {
        column.width = 5;
        column.minWidth = 5;
        column.maxWidth = 5;
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
      name: '',
      prop: '',
      resizable: false
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
        elements = this.data.stations;
      } else if (this.mode === 'Deliveries') {
        elements = this.data.deliveries;
      }

      if (this.showSelectedOnly) {
        elements = elements.filter(e => e.data.selected);
      }

      this.rows = elements.map(e => JSON.parse(JSON.stringify(e.data)));
    }

    this.table.recalculate();
  }

  //noinspection JSUnusedLocalSymbols,JSMethodCanBeStatic
  private getRowClass(row) {
    return {
      'selected': row.selected,
      'green': row.forward,
      'orange': row.backward,
      'blue': row.observed === 'full' || row.observed === 'forward' || row.observed === 'backward',
      'yellow': row.commonLink,
      'red': row.outbreak
    };
  }

}
