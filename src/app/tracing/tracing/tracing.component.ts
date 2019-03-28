import { Component, ElementRef, OnInit, ViewChild, OnDestroy, Input } from '@angular/core';
import { MatDialog, MatSidenav } from '@angular/material';
import { Router } from '@angular/router';
import * as Hammer from 'hammerjs';
import * as _ from 'lodash';

import { GraphComponent } from '../graph/graph.component';
import { TableComponent } from '../table/table.component';
import { DataService } from '../util/data.service';
import { DialogSelectComponent, DialogSelectData } from '../dialog/dialog-select/dialog-select.component';
import { generateVisioReport } from '../visio/visio.service';
import { Utils } from '../util/utils';
import { FclData, GraphType, TableMode, StationData } from '../util/datatypes';
import { Constants } from '../util/constants';
import { GisComponent } from '../gis/gis.component';
import { environment } from '../../../environments/environment';
import { MainPageService } from '../../main-page/services/main-page.service';
import { NodeLayoutInfo } from '../visio/layout-engine/datatypes';
import { Store, select } from '@ngrx/store';
import * as fromTracing from '../state/tracing.reducers';
import * as tracingActions from '../state/tracing.actions';
import { takeWhile } from 'rxjs/operators';

@Component({
    selector: 'fcl-tracing',
    templateUrl: './tracing.component.html',
    styleUrls: ['./tracing.component.scss']
})
export class TracingComponent implements OnInit, OnDestroy {
    @ViewChild('mainContainer', { read: ElementRef }) mainContainer: ElementRef;
    @ViewChild('graph') graph: GraphComponent;
    @ViewChild('gis') gis: GisComponent;
    @ViewChild('table') table: TableComponent;
    @ViewChild('leftSidenav') leftSidenav: MatSidenav;
    @ViewChild('rightSidenav') rightSidenav: MatSidenav;
    @ViewChild('rightSidenav', { read: ElementRef })
    rightSidenavElement: ElementRef;
    @ViewChild('sidenavSlider') sidenavSlider: ElementRef;
    @ViewChild('fileInput') fileInput: ElementRef;

    appName: string = environment.appName;
    subscriptions = [];

    graphTypes = Constants.GRAPH_TYPES;
    graphType = GraphType.GRAPH;
    gisType = GraphType.GIS;
    tableModes = Constants.TABLE_MODES;
    showTypes = Constants.SHOW_TYPES;
    sizes = Constants.SIZES;

    leftOpened: boolean = false;
    rightOpened: boolean = false;
    private componentActive = true;

    data: FclData = {
        elements: null,
        layout: null,
        gisLayout: null,
        graphSettings: DataService.getDefaultGraphSettings(),
        tableSettings: DataService.getDefaultTableSettings()
    };

    constructor(
        private dataService: DataService,
        private dialogService: MatDialog,
        private router: Router,
        private mainPageService: MainPageService,
        private store: Store<fromTracing.State>
    ) {
        document.body.oncontextmenu = e => e.preventDefault();
        this.mainPageService.setTracingActive(true);
    }

    ngOnInit() {
        this.subscriptions.push(this.mainPageService.doToggleLeftSidebar.subscribe(notification => this.toggleLeftSidebar()));
        this.subscriptions.push(this.mainPageService.doToggleRightSidebar.subscribe(notification => this.toggleRightSidebar()));
        this.subscriptions.push(this.mainPageService.doSaveImage.subscribe(notification => this.onSaveImage()));
        this.subscriptions.push(this.mainPageService.doVisioLayout.subscribe(notification => this.onVisioLayout()));
        this.subscriptions.push(this.mainPageService.doOnLoad.subscribe(event => this.onLoad(event)));
        this.subscriptions.push(this.mainPageService.doOnSave.subscribe(event => this.onSave()));

        this.dataService.setDataSource('../../assets/data/bbk.json');
        this.dataService
            .getData()
            .then(data => {
                this.data = data;
                this.updateComponents();
            })
            .catch(error => {
                Utils.showErrorMessage(this.dialogService, error);
            });

        this.rightSidenav.openedStart.subscribe(() => this.onTableChange('width'));
        new Hammer.Manager(this.sidenavSlider.nativeElement, {
            recognizers: [[Hammer.Pan]]
        }).on('pan', event => {
            const newWidth = 1 - event.center.x / (this.mainContainer.nativeElement as HTMLElement).offsetWidth;

            if (newWidth > 0 && newWidth < 1) {
                this.data.tableSettings.width = newWidth;
                this.onTableChange('width');
            }
        });

        this.store.pipe(
            select(fromTracing.getSideBarStates),
            takeWhile(() => this.componentActive)
          ).subscribe(
              (sideBarStates: fromTracing.SideBarState) => {
                  this.leftOpened = sideBarStates.leftSideBarOpen;
                  this.rightOpened = sideBarStates.rightSideBarOpen;
              }
          );

    }

    onHome() {
        this.router.navigate(['/']).catch(err => {
            throw new Error(`Unable to navigate: ${err}`);
        });
    }

    toggleLeftSidebar() {
        this.leftSidenav.toggle().catch(err => {
            throw new Error(`Unable to toggle: ${err}`);
        });
    }

    toggleRightSidebar() {
        this.rightSidenav.toggle().catch(err => {
            throw new Error(`Unable to toggle: ${err}`);
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
                (this.rightSidenavElement.nativeElement as HTMLElement).style.width = this.data.tableSettings.width * 100 + '%';
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
            this.dataService
                .getData()
                .then(data => {
                    this.data = data;
                    this.updateComponents();
                })
                .catch(error => {
                    Utils.showErrorMessage(this.dialogService, error);
                });
        } else {
            Utils.showErrorMessage(this.dialogService, 'Please select one .json file!');
        }

        this.mainPageService.setInputEmpty();
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

        const data: any = this.dataService.getExportData();
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        // const blob = new Blob([JSON.stringify(this.data)], {type: 'application/json'});
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
        this.getCurrentGraph()
            .getCanvas()
            .then(canvas => {
                const fileName = 'graph.png';

                if (window.navigator.msSaveOrOpenBlob != null && canvas.msToBlob != null) {
                    window.navigator.msSaveOrOpenBlob(canvas.msToBlob(), fileName);
                } else {
                    Utils.openSaveDialog(canvas.toDataURL('image/png'), fileName);
                }
            })
            .catch(err => {
                throw new Error(`Unable to save image: ${err}`);
            });
    }

    getNodeLayoutInfo(): Map<string, NodeLayoutInfo> {
        // refactor
        const view = this.graphType === GraphType.GRAPH ? this.graph : this.gis;

        if (view !== null && view.hasOwnProperty('cy') && (view as any).cy !== null) {
            const result: Map<string, { size: number; position: { x: number; y: number } }> = new Map();

            for (const node of (view as any).cy.nodes()) {
                const position = node.data().position;
                result.set(node.id(), {
                    size: node.height(),
                    position: {
                        x: position.x,
                        y: position.y
                    }
                });
            }
            return result;
        } else {
            return null;
        }
    }

    onVisioLayout() {
        const nodeLayoutInfo = this.getNodeLayoutInfo();

        if (nodeLayoutInfo !== null) {
            generateVisioReport(this.data.elements, nodeLayoutInfo, this.dialogService)
                .then(visioReport => {
                    if (visioReport !== null) {
                        this.router.navigate(['/graph-editor']).catch(err => {
                            throw new Error(`Unable to navigate to graph editor: ${err}`);
                        });
                        this.store.dispatch(new tracingActions.GenerateVisioLayoutSuccess(visioReport));
                    }
                })
                .catch(err => {
                    if (err !== undefined) {
                        throw new Error(`Visio layout creation failed: ${err}`);
                    }
                });
        }
    }

    changeColumns() {
        const options: {
            value: string;
            viewValue: string;
            selected: boolean;
        }[] = [];

        for (const column of Utils.getAllTableProperties(this.data.tableSettings.mode, this.data.elements)) {
            options.push({
                value: column,
                viewValue: Constants.PROPERTIES.has(column) ? Constants.PROPERTIES.get(column).name : '"' + column + '"',
                selected: Utils.getTableProperties(
                    this.data.tableSettings.mode,
                    this.data.tableSettings.stationColumns,
                    this.data.tableSettings.deliveryColumns
                ).includes(column)
            });
        }

        const dialogData: DialogSelectData = {
            title: 'Input',
            options: options
        };

        this.dialogService
            .open(DialogSelectComponent, { data: dialogData })
            .afterClosed()
            .subscribe(selections => {
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

    ngOnDestroy() {
        this.mainPageService.setTracingActive(false);
        _.forEach(this.subscriptions, subscription => {
            subscription.unsubscribe();
        });

        this.componentActive = false;
    }

    private updateComponents() {
        this.onTableChange('width');

        const waitForGraph = () => {
            if (this.getCurrentGraph().elementRef.nativeElement.offsetParent == null) {
                setTimeout(waitForGraph, 50);
            } else {
                this.getCurrentGraph().setNodeSize(this.data.graphSettings.nodeSize);
                this.getCurrentGraph().setFontSize(this.data.graphSettings.fontSize);
                this.getCurrentGraph().setMergeDeliveries(this.data.graphSettings.mergeDeliveries);
                this.getCurrentGraph().setShowLegend(this.data.graphSettings.showLegend);
                this.getCurrentGraph().setShowZoom(this.data.graphSettings.showZoom);
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
        };

        waitForGraph();
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
