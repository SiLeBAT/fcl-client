import {Component, OnInit, ViewChild} from '@angular/core';
import {MdSidenav, MdDialog} from '@angular/material';

import {GraphComponent} from './graph/graph.component';
import {TableComponent} from './table/table.component';
import {DataService} from './util/data.service';
import {DialogAlertComponent} from './dialog/dialog-alert/dialog-alert.component';
import {DialogAlertData} from './dialog/dialog-alert/dialog-alert.data';
import {DialogSelectComponent} from './dialog/dialog-select/dialog-select.component';
import {DialogSelectData} from './dialog/dialog-select/dialog-select.data';

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

  //noinspection JSUnusedLocalSymbols
  private nodeSizes = DataService.NODE_SIZES;
  //noinspection JSUnusedLocalSymbols
  private fontSizes = DataService.FONT_SIZES;
  //noinspection JSUnusedLocalSymbols
  private tableModes = DataService.TABLE_MODES;

  private graphSettings = DataService.DEFAULT_GRAPH_SETTINGS;
  private tableSettings = DataService.DEFAULT_TABLE_SETTINGS;

  constructor(private dataService: DataService, private dialogService: MdDialog) {
    document.body.oncontextmenu = e => e.preventDefault();
  }

  ngOnInit() {
    this.dataService.setDataSource('assets/data/small_network.json');
    this.dataService.getData().then(data => {
      this.graphSettings = data.graphSettings;
      this.tableSettings = data.tableSettings;
      this.onGraphChange('all');
      this.onTableChange('all');
      this.graph.init(data.graphData);
      this.table.init(data.graphData.elements);
    }).catch(error => {
      this.showErrorMessage(error);
    });

    this.graph.onChange(() => this.table.update());
    this.table.onSelectionChange(() => this.graph.updateSelection());
    this.rightSidenav.onOpenStart.subscribe(() => this.updateRightSidenav());
    new Hammer(document.getElementById('sidenavSlider')).on('pan', event => {
      const newWidth = 1 - event.center.x / document.getElementById('mainContent').offsetWidth;

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
    }
  }

  onTableChange(property: string) {
    switch (property) {
      case 'all':
        this.updateRightSidenav();
        this.table.setMode(this.tableSettings.mode);
        this.table.setStationColumns(this.tableSettings.stationColumns);
        this.table.setDeliveryColumns(this.tableSettings.deliveryColumns);
        this.table.setShowSelectedOnly(this.tableSettings.showSelectedOnly);
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
      case 'showSelectedOnly':
        this.table.setShowSelectedOnly(this.tableSettings.showSelectedOnly);
        break;
    }
  }

  onLoad(event) {
    const files: FileList = event.target.files;

    if (files.length === 1) {
      this.dataService.setDataSource(files[0]);
      this.dataService.getData().then(data => {
        this.graphSettings = data.graphSettings;
        this.tableSettings = data.tableSettings;
        this.onGraphChange('all');
        this.onTableChange('all');
        this.graph.init(data.graphData);
        this.table.init(data.graphData.elements);
      }).catch(error => {
        this.showErrorMessage(error);
      });
    } else {
      this.showErrorMessage('Please select one .json file!');
    }

    (<HTMLInputElement>document.getElementById('fileInput')).value = '';
  }

  onSave() {
    const data = {
      graphData: this.graph.getJson(),
      graphSettings: this.graphSettings,
      tableSettings: this.tableSettings
    };
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.style.display = 'none';
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  changeColumns() {
    const options: [string, boolean][] = [];

    if (this.tableSettings.mode === 'Stations') {
      for (const column of DataService.TABLE_COLUMNS['Stations']) {
        options.push([column.name, this.tableSettings.stationColumns.includes(column.name)]);
      }
    } else if (this.tableSettings.mode === 'Deliveries') {
      for (const column of DataService.TABLE_COLUMNS['Deliveries']) {
        options.push([column.name, this.tableSettings.deliveryColumns.includes(column.name)]);
      }
    }

    const dialogData: DialogSelectData = {
      title: 'Input',
      options: options
    };

    this.dialogService.open(DialogSelectComponent, {data: dialogData}).afterClosed().subscribe(selections => {
      if (selections != null) {
        if (this.tableSettings.mode === 'Stations') {
          this.tableSettings.stationColumns = selections;
          this.onTableChange('stationColumns');
        } else if (this.tableSettings.mode === 'Deliveries') {
          this.tableSettings.deliveryColumns = selections;
          this.onTableChange('deliveryColumns');
        }
      }
    });
  }

  private updateRightSidenav() {
    document.getElementById('rightSidenav').style.width = (this.tableSettings.width * 100) + '%';
  }

  private showErrorMessage(message: string) {
    const dialogData: DialogAlertData = {
      title: 'Error',
      message: message
    };

    this.dialogService.open(DialogAlertComponent, {role: 'alertdialog', data: dialogData});
  }

}
