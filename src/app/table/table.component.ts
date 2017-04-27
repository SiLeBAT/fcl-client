import {Component, OnInit, ViewChild, TemplateRef} from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {DatatableComponent} from '@swimlane/ngx-datatable';
import {ScrollbarHelper} from '@swimlane/ngx-datatable/release/services/scrollbar-helper.service';

import {DataService} from '../util/data.service';
import {UtilService} from '../util/util.service';
import {DeliveryData, FclElements, ObservedType, ShowType, StationData, TableMode} from '../util/datatypes';

declare const ResizeSensor: any;

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {

  columns: any[];
  rows: any[];

  private data: FclElements;
  private mode = DataService.DEFAULT_TABLE_SETTINGS.mode;
  private stationColumns = DataService.DEFAULT_TABLE_SETTINGS.stationColumns;
  private deliveryColumns = DataService.DEFAULT_TABLE_SETTINGS.deliveryColumns;
  private showType = DataService.DEFAULT_TABLE_SETTINGS.showType;

  private resizeTimer: any;

  private changeFunction: () => void;

  @ViewChild('table') table: DatatableComponent;
  @ViewChild('selectTmpl') selectTmpl: TemplateRef<any>;

  constructor(private scrollbarHelper: ScrollbarHelper) {
    const style = document.createElement('style');

    style.type = 'text/css';
    style.innerHTML = '';
    style.innerHTML += 'datatable-body-row { background-color: rgb(255, 255, 255) !important; }';

    for (const props of UtilService.getAllCombinations(DataService.PROPERTIES_WITH_COLORS)) {
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
        if (this.columns != null) {
          this.columns = this.getUpdatedColumns(this.columns);
          this.table.recalculate();
        }
      });
    });

    this.table.onColumnReorder = () => void(0);
  }

  init(data: FclElements) {
    this.data = data;
    this.update();
  }

  setMode(mode: TableMode) {
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

  setShowType(showType: ShowType) {
    this.showType = showType;
    this.update();
  }

  update() {
    const selectColumn: any = {
      name: ' ',
      prop: 'selected',
      resizable: false,
      draggable: false,
      cellTemplate: this.selectTmpl
    };
    let columns: string[];

    if (this.mode === TableMode.STATIONS) {
      columns = this.stationColumns;
    } else if (this.mode === TableMode.DELIVERIES) {
      columns = this.deliveryColumns;
    }

    this.columns = this.getUpdatedColumns([selectColumn].concat(columns.map(prop => {
      return {
        name: DataService.PROPERTIES.has(prop) ? DataService.PROPERTIES.get(prop).name : prop,
        prop: prop,
        resizeable: false,
        draggable: false,
      };
    })));

    if (this.data != null) {
      let elements: (StationData | DeliveryData)[] = [];

      if (this.mode === TableMode.STATIONS) {
        elements = this.data.stations.filter(s => !s.invisible && !s.contained);
      } else if (this.mode === TableMode.DELIVERIES) {
        elements = this.data.deliveries.filter(d => !d.invisible);
      }

      if (this.showType === ShowType.SELECTED_ONLY) {
        elements = elements.filter(e => e.selected);
      } else if (this.showType === ShowType.TRACE_ONLY) {
        elements = elements.filter(e => e.forward || e.backward || e.observed !== ObservedType.NONE);
      }

      this.rows = elements.map(e => {
        const copy = JSON.parse(JSON.stringify(e));

        for (const prop of e.properties) {
          copy[prop.name] = prop.value;
        }

        return copy;
      });
    }

    this.table.recalculate();
  }

  onSelectionChange(changeFunction: () => void) {
    this.changeFunction = changeFunction;
  }

  //noinspection JSMethodCanBeStatic
  getRowClass(row) {
    return {
      'selected': row.selected,
      'forward': row.forward,
      'backward': row.backward,
      'observed': row.observed !== ObservedType.NONE,
      'outbreak': row.outbreak,
      'commonLink': row.commonLink
    };
  }

  onSelect(row) {
    if (this.mode === TableMode.STATIONS) {
      this.data.stations.find(s => s.id === row.id).selected = row.selected;
    } else if (this.mode === TableMode.DELIVERIES) {
      this.data.deliveries.find(d => d.id === row.id).selected = row.selected;
    }

    if (this.showType === ShowType.SELECTED_ONLY && !row.selected) {
      this.rows.splice(this.rows.findIndex(r => r.id === row.id), 1);
    }

    if (this.changeFunction != null) {
      this.changeFunction();
    }
  }

  private getUpdatedColumns(columns: any[]): any[] {
    const selectColumnWidth = 40;
    const width = document.getElementById('tableContainer').offsetWidth - this.scrollbarHelper.width;
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
}
