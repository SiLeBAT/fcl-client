import {Component, OnInit, ViewChild} from '@angular/core';
import {MdDialog, MdSidenav} from '@angular/material';

import {GraphComponent} from './graph/graph.component';
import {TableComponent} from './table/table.component';
import {DataService} from './util/data.service';
import {DialogSelectComponent, DialogSelectData} from './dialog/dialog-select/dialog-select.component';
import {Utils} from './util/utils';
import {FclData, FclElements, GraphType, TableMode} from './util/datatypes';
import {Constants} from './util/constants';
import {GisComponent} from './gis/gis.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild('graph') graph: GraphComponent;
  @ViewChild('gis') gis: GisComponent;
  @ViewChild('table') table: TableComponent;
  @ViewChild('rightSidenav') rightSidenav: MdSidenav;

  graphTypes = Constants.GRAPH_TYPES;
  graphType = GraphType.GRAPH;
  gisType = GraphType.GIS;
  tableModes = Constants.TABLE_MODES;
  showTypes = Constants.SHOW_TYPES;
  sizes = Constants.SIZES;

  data: FclData = {
    elements: null,
    layout: null,
    gisLayout: null,
    graphSettings: DataService.getDefaultGraphSettings(),
    tableSettings: DataService.getDefaultTableSettings()
  };

  constructor(private dataService: DataService, private dialogService: MdDialog) {
    document.body.oncontextmenu = e => e.preventDefault();
  }

  ngOnInit() {
    this.dataService.setDataSource('assets/data/bbk.json');
    this.dataService.getData().then(data => {
      this.data = data;
      this.updateComponents();
    }).catch(error => {
      Utils.showErrorMessage(this.dialogService, error);
    });

    this.rightSidenav.onOpenStart.subscribe(() => this.onTableChange('width'));
    new Hammer(document.getElementById('sidenavSlider')).on('pan', event => {
      const newWidth = 1 - event.center.x / document.getElementById('mainContainer').offsetWidth;

      if (newWidth > 0 && newWidth < 1) {
        this.data.tableSettings.width = newWidth;
        this.onTableChange('width');
      }
    });
  }

  onGraphChange(property: string) {
    switch (property) {
      case 'type':
        switch (this.data.graphSettings.type) {
          case GraphType.GRAPH:
            this.data.gisLayout = this.gis.getLayout();
            break;
          case GraphType.GIS:
            this.data.layout = this.graph.getLayout();
            break;
        }

        this.updateComponents();
        break;
      case 'nodeSize':
        this.getCurrentGraph().setNodeSize(this.data.graphSettings.nodeSize);
        break;
      case 'fontSize':
        this.getCurrentGraph().setFontSize(this.data.graphSettings.fontSize);
        break;
      case 'mergeDeliveries':
        this.getCurrentGraph().setMergeDeliveries(this.data.graphSettings.mergeDeliveries);
        break;
      case 'showLegend':
        this.getCurrentGraph().setShowLegend(this.data.graphSettings.showLegend);
        break;
      case 'showZoom':
        this.getCurrentGraph().setShowZoom(this.data.graphSettings.showZoom);
        break;
    }
  }

  onTableChange(property: string) {
    switch (property) {
      case 'width':
        document.getElementById('rightSidenav').style.width = (this.data.tableSettings.width * 100) + '%';
        break;
      case 'mode':
        this.table.setMode(this.data.tableSettings.mode);
        break;
      case 'stationColumns':
        this.table.setStationColumns(this.data.tableSettings.stationColumns);
        break;
      case 'deliveryColumns':
        this.table.setDeliveryColumns(this.data.tableSettings.deliveryColumns);
        break;
      case 'showType':
        this.table.setShowType(this.data.tableSettings.showType);
        break;
    }
  }

  onLoad(event) {
    const files: FileList = event.target.files;

    if (files.length === 1) {
      this.dataService.setDataSource(files[0]);
      this.dataService.getData().then(data => {
        this.data = data;
        this.updateComponents();
      }).catch(error => {
        Utils.showErrorMessage(this.dialogService, error);
      });
    } else {
      Utils.showErrorMessage(this.dialogService, 'Please select one .json file!');
    }

    (<HTMLInputElement>document.getElementById('fileInput')).value = '';
  }

  onSave() {
    switch (this.data.graphSettings.type) {
      case GraphType.GRAPH:
        this.data.layout = this.graph.getLayout();
        break;
      case GraphType.GIS:
        this.data.gisLayout = this.gis.getLayout();
        break;
    }

    const blob = new Blob([JSON.stringify(this.data)], {type: 'application/json'});
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
    this.getCurrentGraph().getCanvas().then(canvas => {
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

    for (const column of Utils.getAllTableProperties(this.data.tableSettings.mode, this.data.elements)) {
      options.push({
        value: column,
        viewValue: Constants.PROPERTIES.has(column) ? Constants.PROPERTIES.get(column).name : '"' + column + '"',
        selected: Utils.getTableProperties(this.data.tableSettings.mode, this.data.tableSettings.stationColumns,
          this.data.tableSettings.deliveryColumns).includes(column)
      });
    }

    const dialogData: DialogSelectData = {
      title: 'Input',
      options: options
    };

    this.dialogService.open(DialogSelectComponent, {data: dialogData}).afterClosed().subscribe(selections => {
      if (selections != null) {
        switch (this.data.tableSettings.mode) {
          case TableMode.STATIONS:
            this.data.tableSettings.stationColumns = selections;
            this.onTableChange('stationColumns');
            break;
          case TableMode.DELIVERIES:
            this.data.tableSettings.deliveryColumns = selections;
            this.onTableChange('deliveryColumns');
            break;
        }
      }
    });
  }

  private updateComponents() {
    document.getElementById('rightSidenav').style.width = (this.data.tableSettings.width * 100) + '%';

    switch (this.data.graphSettings.type) {
      case GraphType.GRAPH:
        const waitForGraph = () => {
          if ((<HTMLElement>document.getElementsByTagName('app-graph')[0]).offsetParent == null) {
            setTimeout(waitForGraph, 50);
          } else {
            this.updateGraphAndTable();
          }
        };

        waitForGraph();
        break;
      case GraphType.GIS:
        const waitForGis = () => {
          if ((<HTMLElement>document.getElementsByTagName('app-gis')[0]).offsetParent == null) {
            setTimeout(waitForGis, 50);
          } else {
            this.updateGraphAndTable();
          }
        };

        waitForGis();
        break;
    }
  }

  private updateGraphAndTable() {
    this.getCurrentGraph().setNodeSize(this.data.graphSettings.nodeSize);
    this.getCurrentGraph().setFontSize(this.data.graphSettings.fontSize);
    this.getCurrentGraph().setMergeDeliveries(this.data.graphSettings.mergeDeliveries);
    this.getCurrentGraph().setShowLegend(this.data.graphSettings.showLegend);
    this.getCurrentGraph().onChange(() => this.table.update());

    switch (this.data.graphSettings.type) {
      case GraphType.GRAPH:
        this.graph.init(this.data.elements, this.data.layout);
        break;
      case GraphType.GIS:
        this.gis.init(this.data.elements, this.data.gisLayout);
        break;
    }

    this.table.setMode(this.data.tableSettings.mode);
    this.table.setStationColumns(this.data.tableSettings.stationColumns);
    this.table.setDeliveryColumns(this.data.tableSettings.deliveryColumns);
    this.table.setShowType(this.data.tableSettings.showType);
    this.table.onSelectionChange(() => this.getCurrentGraph().updateSelection());
    this.table.init(this.data.elements);
  }

  private getCurrentGraph(): GraphComponent | GisComponent {
    switch (this.data.graphSettings.type) {
      case GraphType.GRAPH:
        return this.graph;
      case GraphType.GIS:
        return this.gis;
    }
  }
}
