import {Component, OnInit, ViewChild} from '@angular/core';
import {MdSidenav, MdDialog} from '@angular/material';

import {GraphComponent} from './graph/graph.component';
import {TableComponent} from './table/table.component';
import {DataService} from './util/data.service';
import {DialogSelectComponent, DialogSelectData} from './dialog/dialog-select/dialog-select.component';
import {UtilService} from './util/util.service';
import {FclData, FclElements, TableMode} from './util/datatypes';

declare const Hammer: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild('graph') graph: GraphComponent;
  @ViewChild('table') table: TableComponent;
  @ViewChild('rightSidenav') rightSidenav: MdSidenav;

  tableModes = DataService.TABLE_MODES;
  showTypes = DataService.SHOW_TYPES;
  sizes = DataService.SIZES;

  elements: FclElements;
  graphSettings = DataService.DEFAULT_GRAPH_SETTINGS;
  tableSettings = DataService.DEFAULT_TABLE_SETTINGS;

  constructor(private dataService: DataService, private dialogService: MdDialog) {
    document.body.oncontextmenu = e => e.preventDefault();
  }

  ngOnInit() {
    this.dataService.setDataSource('assets/data/bbk.json');
    this.dataService.getData().then(data => {
      this.update(data);
    }).catch(error => {
      UtilService.showErrorMessage(this.dialogService, error);
    });

    this.graph.onChange(() => this.table.update());
    this.table.onSelectionChange(() => this.graph.updateSelection());
    this.rightSidenav.onOpenStart.subscribe(() => this.updateRightSidenav());
    new Hammer(document.getElementById('sidenavSlider')).on('pan', event => {
      const newWidth = 1 - event.center.x / document.getElementById('mainContainer').offsetWidth;

      if (newWidth > 0 && newWidth < 1) {
        this.tableSettings.width = newWidth;
        this.updateRightSidenav();
      }
    });
  }

  onGraphChange(property: string) {
    switch (property) {
      case 'all':
        this.graph.setNodeSize(this.graphSettings.nodeSize);
        this.graph.setFontSize(this.graphSettings.fontSize);
        this.graph.setMergeDeliveries(this.graphSettings.mergeDeliveries);
        this.graph.setShowLegend(this.graphSettings.showLegend);
        break;
      case 'nodeSize':
        this.graph.setNodeSize(this.graphSettings.nodeSize);
        break;
      case 'fontSize':
        this.graph.setFontSize(this.graphSettings.fontSize);
        break;
      case 'mergeDeliveries':
        this.graph.setMergeDeliveries(this.graphSettings.mergeDeliveries);
        break;
      case 'showLegend':
        this.graph.setShowLegend(this.graphSettings.showLegend);
        break;
    }
  }

  onTableChange(property: string) {
    switch (property) {
      case 'all':
        this.updateRightSidenav();
        this.table.setMode(this.tableSettings.mode);
        this.table.setStationColumns(this.tableSettings.stationColumns);
        this.table.setDeliveryColumns(this.tableSettings.deliveryColumns);
        this.table.setShowType(this.tableSettings.showType);
        break;
      case 'width':
        break;
      case 'mode':
        this.table.setMode(this.tableSettings.mode);
        break;
      case 'stationColumns':
        this.table.setStationColumns(this.tableSettings.stationColumns);
        break;
      case 'deliveryColumns':
        this.table.setDeliveryColumns(this.tableSettings.deliveryColumns);
        break;
      case 'showType':
        this.table.setShowType(this.tableSettings.showType);
        break;
    }
  }

  onLoad(event) {
    const files: FileList = event.target.files;

    if (files.length === 1) {
      this.dataService.setDataSource(files[0]);
      this.dataService.getData().then(data => {
        this.update(data);
      }).catch(error => {
        UtilService.showErrorMessage(this.dialogService, error);
      });
    } else {
      UtilService.showErrorMessage(this.dialogService, 'Please select one .json file!');
    }

    (<HTMLInputElement>document.getElementById('fileInput')).value = '';
  }

  onSave() {
    const data: FclData = {
      elements: this.elements,
      layout: this.graph.getLayout(),
      graphSettings: this.graphSettings,
      tableSettings: this.tableSettings
    };
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const fileName = 'data.json';

    if (window.navigator.msSaveOrOpenBlob != null) {
      window.navigator.msSaveOrOpenBlob(blob, fileName);
    } else {
      const url = window.URL.createObjectURL(blob);

      UtilService.openSaveDialog(url, fileName);
      window.URL.revokeObjectURL(url);
    }
  }

  onSaveImage() {
    this.graph.getCanvas().then(canvas => {
      const fileName = 'graph.png';

      if (window.navigator.msSaveOrOpenBlob != null && canvas.msToBlob != null) {
        window.navigator.msSaveOrOpenBlob(canvas.msToBlob(), fileName);
      } else {
        UtilService.openSaveDialog(canvas.toDataURL('image/png'), fileName);
      }
    });
  }

  changeColumns() {
    const options: { value: string, viewValue: string, selected: boolean }[] = [];

    for (const column of UtilService.getTableProperties(this.tableSettings.mode, this.elements)) {
      let selected;

      if (this.tableSettings.mode === TableMode.STATIONS) {
        selected = this.tableSettings.stationColumns.includes(column);
      } else if (this.tableSettings.mode === TableMode.DELIVERIES) {
        selected = this.tableSettings.deliveryColumns.includes(column);
      }

      options.push({
        value: column,
        viewValue: DataService.PROPERTIES.has(column) ? DataService.PROPERTIES.get(column).name : column,
        selected: selected
      });
    }

    const dialogData: DialogSelectData = {
      title: 'Input',
      options: options
    };

    this.dialogService.open(DialogSelectComponent, {data: dialogData}).afterClosed().subscribe(selections => {
      if (selections != null) {
        if (this.tableSettings.mode === TableMode.STATIONS) {
          this.tableSettings.stationColumns = selections;
          this.onTableChange('stationColumns');
        } else if (this.tableSettings.mode === TableMode.DELIVERIES) {
          this.tableSettings.deliveryColumns = selections;
          this.onTableChange('deliveryColumns');
        }
      }
    });
  }

  private update(data: FclData) {
    this.elements = data.elements;
    this.graphSettings = data.graphSettings;
    this.tableSettings = data.tableSettings;
    this.onGraphChange('all');
    this.onTableChange('all');
    this.graph.init(data.elements, data.layout);
    this.table.init(data.elements);
  }

  private updateRightSidenav() {
    document.getElementById('rightSidenav').style.width = (this.tableSettings.width * 100) + '%';
  }

}
