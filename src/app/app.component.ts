import {Component, OnInit, ViewChild} from '@angular/core';
import {MdDialog, MdSidenav} from '@angular/material';

import {GraphComponent} from './graph/graph.component';
import {TableComponent} from './table/table.component';
import {DataService} from './util/data.service';
import {DialogSelectComponent, DialogSelectData} from './dialog/dialog-select/dialog-select.component';
import {Utils} from './util/utils';
import {FclData, FclElements, TableMode} from './util/datatypes';
import {Constants} from './util/constants';

declare const Hammer;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild('graph') graph: GraphComponent;
  @ViewChild('table') table: TableComponent;
  @ViewChild('rightSidenav') rightSidenav: MdSidenav;

  tableModes = Constants.TABLE_MODES;
  showTypes = Constants.SHOW_TYPES;
  sizes = Constants.SIZES;

  elements: FclElements;
  graphSettings = DataService.getDefaultGraphSettings();
  tableSettings = DataService.getDefaultTableSettings();

  constructor(private dataService: DataService, private dialogService: MdDialog) {
    document.body.oncontextmenu = e => e.preventDefault();
  }

  ngOnInit() {
    this.dataService.setDataSource('assets/data/bbk.json');
    this.dataService.getData().then(data => {
      this.update(data);
    }).catch(error => {
      Utils.showErrorMessage(this.dialogService, error);
    });

    this.graph.onChange(() => this.table.update());
    this.table.onSelectionChange(() => this.graph.updateSelection());
    this.rightSidenav.onOpenStart.subscribe(() => this.onTableChange('width'));
    new Hammer(document.getElementById('sidenavSlider')).on('pan', event => {
      const newWidth = 1 - event.center.x / document.getElementById('mainContainer').offsetWidth;

      if (newWidth > 0 && newWidth < 1) {
        this.tableSettings.width = newWidth;
        this.onTableChange('width');
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
        document.getElementById('rightSidenav').style.width = (this.tableSettings.width * 100) + '%';
        this.table.setMode(this.tableSettings.mode);
        this.table.setStationColumns(this.tableSettings.stationColumns);
        this.table.setDeliveryColumns(this.tableSettings.deliveryColumns);
        this.table.setShowType(this.tableSettings.showType);
        break;
      case 'width':
        document.getElementById('rightSidenav').style.width = (this.tableSettings.width * 100) + '%';
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
        Utils.showErrorMessage(this.dialogService, error);
      });
    } else {
      Utils.showErrorMessage(this.dialogService, 'Please select one .json file!');
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

      Utils.openSaveDialog(url, fileName);
      window.URL.revokeObjectURL(url);
    }
  }

  onSaveImage() {
    this.graph.getCanvas().then(canvas => {
      const fileName = 'graph.png';

      if (window.navigator.msSaveOrOpenBlob != null && canvas.msToBlob != null) {
        window.navigator.msSaveOrOpenBlob(canvas.msToBlob(), fileName);
      } else {
        Utils.openSaveDialog(canvas.toDataURL('image/png'), fileName);
      }
    });
  }

  changeColumns() {
    const options: { value: string, viewValue: string, selected: boolean }[] = [];

    for (const column of Utils.getAllTableProperties(this.tableSettings.mode, this.elements)) {
      options.push({
        value: column,
        viewValue: Constants.PROPERTIES.has(column) ? Constants.PROPERTIES.get(column).name : '"' + column + '"',
        selected: Utils.getTableProperties(this.tableSettings.mode, this.tableSettings.stationColumns, this.tableSettings.deliveryColumns)
          .includes(column)
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

}
