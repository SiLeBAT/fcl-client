import { Component, ElementRef, OnInit, TemplateRef, ViewChild, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, timer, Subscription } from 'rxjs';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { ScrollbarHelper } from '@swimlane/ngx-datatable/release/services/scrollbar-helper.service';
import { ResizeSensor } from 'css-element-queries';
import * as fromTracing from '../state/tracing.reducers';
import * as tracingSelectors from '../state/tracing.selectors';

import { Utils } from '../util/utils';
import { Constants } from '../util/constants';
import {
    BasicGraphState, DataServiceData, DeliveryData, StationData,
    TableSettings, ObservedType, ShowType, TableMode
} from '../data.model';
import * as tracingActions from '../state/tracing.actions';
import { DataService } from '../services/data.service';
import { AlertService } from '@app/shared/services/alert.service';
import { TableSettingsComponent } from './table-settings.component';
import { MatDialog } from '@angular/material';

interface FilterableRow {
    content: any;
    stringContent: string;
}

interface State {
    graphState: BasicGraphState;
    tableSettings: TableSettings;
}

@Component({
    selector: 'fcl-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit, OnDestroy {

    columns: any[];
    rows: any[];
    filter: string;
    unfilteredRows: FilterableRow[];

    private resizeTimerSubscription: Subscription;

    @ViewChild('container') container: ElementRef;
    @ViewChild('table') table: DatatableComponent;
    @ViewChild('selectTmpl') selectTmpl: TemplateRef<any>;

    showDataTable$ = this.store.select(tracingSelectors.getShowDataTable);

    private stateSubscription: Subscription;
    private showDataTableSubscription: Subscription;

    private cachedState: State;
    private cachedData: DataServiceData;

    static filterRows(elements: FilterableRow[], filter: string): any[] {
        const words: string[] = filter == null ? [] : filter.split(/\s+/g).map(w => w.trim().toLowerCase()).filter(w => w.length > 0);

        return elements.filter(e => words.find(w => e.stringContent.indexOf(w) === -1) == null).map(e => e.content);
    }

    constructor(
        private dataService: DataService,
        private dialogService: MatDialog,
        private store: Store<fromTracing.State>,
        private alertService: AlertService,
        private scrollbarHelper: ScrollbarHelper
    ) {
        const style = document.createElement('style');

        // tslint:disable-next-line: deprecation
        style.type = 'text/css';
        style.innerHTML = '';
        style.innerHTML += 'datatable-body-row { background-color: rgb(255, 255, 255) !important; }';

        for (const props of Utils.getAllCombinations(Constants.PROPERTIES_WITH_COLORS.toArray())) {
            style.innerHTML += 'datatable-body-row';

            if (props.length === 1) {
                const color = Utils.colorToCss(Constants.PROPERTIES.get(props[0]).color);

                style.innerHTML += '.' + props[0] + ' { background-color: ' + color + ' !important; }';
            } else {
                for (const prop of props) {
                    style.innerHTML += '.' + prop;
                }

                style.innerHTML += ' { background: repeating-linear-gradient(90deg';

                for (let i = 0; i < props.length; i++) {
                    const color = Utils.colorToCss(Constants.PROPERTIES.get(props[i]).color);
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
        window.onresize = () => timer(100).subscribe(
            () => this.updateTable(this.cachedState, this.cachedData),
            err => this.alertService.error(`onresize timer subscription failed: ${err}`)
        );

        const resizeSensor = new ResizeSensor(this.container.nativeElement, () => {
            if (!this.resizeTimerSubscription) {
                this.resizeTimerSubscription = timer(300).subscribe(
                    () => {
                        this.resizeTimerSubscription.unsubscribe();
                        this.resizeTimerSubscription = null;

                        if (this.columns) {
                            this.columns = this.getUpdatedColumns(this.columns);
                            this.table.recalculate();
                        }
                    },
                    err => this.alertService.error(`container resize timer subscription failed: ${err}`)
                );
            }
        });

        this.table.onColumnReorder = () => void(0);
        this.showDataTableSubscription = this.showDataTable$.subscribe(
            showDataTable => {
                if (!showDataTable) {
                    if (this.stateSubscription) {
                        this.stateSubscription.unsubscribe();
                        this.stateSubscription = null;
                    }
                } else {
                    if (!this.stateSubscription) {
                        this.stateSubscription = this.store.select(tracingSelectors.getTableData).subscribe(
                            (state) => this.applyState(state),
                            err => this.alertService.error(`getTableData store subscription failed: ${err}`)
                        );
                    }
                }
            },
            err => this.alertService.error(`getGraphType store subscription failed: ${err}`)
        );
    }

    private updateTable(state: State, data: DataServiceData) {
        if (state) {
            const tableSettings = state.tableSettings;
            const properties = Utils.getTableProperties(tableSettings.mode, tableSettings.stationColumns, tableSettings.deliveryColumns);
            const selectColumn: any = {
                name: ' ',
                prop: 'selected',
                resizable: false,
                draggable: false,
                cellTemplate: this.selectTmpl
            };

            this.columns = this.getUpdatedColumns([selectColumn].concat(properties.map(prop => {
                return {
                    name: Constants.PROPERTIES.has(prop) ? Constants.PROPERTIES.get(prop).name : '"' + prop + '"',
                    prop: prop,
                    resizeable: false,
                    draggable: false
                };
            })));

            if (data) {
                let elements: (StationData | DeliveryData)[] = [];

                if (tableSettings.mode === TableMode.STATIONS) {
                    elements = data.stations.filter(s => !s.invisible && !s.contained);
                } else if (tableSettings.mode === TableMode.DELIVERIES) {
                    elements = data.deliveries.filter(d => !d.invisible);
                }

                if (tableSettings.showType === ShowType.SELECTED_ONLY) {
                    elements = elements.filter(e => e.selected);
                } else if (tableSettings.showType === ShowType.TRACE_ONLY) {
                    elements = elements.filter(e => e.forward || e.backward || e.observed !== ObservedType.NONE);
                }

                const propertySet = new Set(properties);

                this.unfilteredRows = elements.map(e => {
                    const copy = JSON.parse(JSON.stringify(e));
                    let stringContent = '';

                    for (const key of Object.keys(e)) {
                        if (propertySet.has(key)) {
                            stringContent += String(e[key]).trim().toLowerCase() + ' ';
                        }
                    }

                    for (const prop of e.properties) {
                        if (propertySet.has(prop.name)) {
                            copy[prop.name] = prop.value;
                            stringContent += prop.value.trim().toLowerCase() + ' ';
                        }
                    }

                    return {
                        content: copy,
                        stringContent: stringContent.trim()
                    };
                });

                this.rows = TableComponent.filterRows(this.unfilteredRows, this.filter);
            } else {
                this.unfilteredRows = [];
                this.rows = [];
            }

            this.table.recalculate();
        }
    }

    onFilterChange() {
        this.rows = TableComponent.filterRows(this.unfilteredRows, this.filter);
        this.table.recalculatePages();
    }

  //noinspection JSMethodCanBeStatic
    getRowClass(row) {
        return {
            'selected': row.selected,
            'forward': row.forward,
            'backward': row.backward,
            'observed': row.observed !== ObservedType.NONE,
            'outbreak': row.outbreak,
            'crossContamination': row.crossContamination,
            'commonLink': row.commonLink
        };
    }

    private getUpdatedSelection(oldSelection: string[], ids: string[], isSelected: boolean): string[] {
        if (isSelected) {
            return oldSelection.concat(ids);
        } else {
            const isUnSel = Utils.createStringSet(ids);
            return oldSelection.filter(id => !isUnSel[id]);
        }
    }

    onSelect(row) {

        if (this.cachedState.tableSettings.mode === TableMode.STATIONS) {
            this.store.dispatch(new tracingActions.SetSelectedElementsSOA({
                selectedElements: {
                    ...this.cachedState.graphState.selectedElements,
                    stations: this.getUpdatedSelection(this.cachedState.graphState.selectedElements.stations, [row.id], row.selected)
                }
            }));
        } else if (this.cachedState.tableSettings.mode === TableMode.DELIVERIES) {
            this.store.dispatch(new tracingActions.SetSelectedElementsSOA({
                selectedElements: {
                    ...this.cachedState.graphState.selectedElements,
                    deliveries: this.getUpdatedSelection(this.cachedState.graphState.selectedElements.deliveries, [row.id], row.selected)
                }
            }));
        }

        if (this.cachedState.tableSettings.showType === ShowType.SELECTED_ONLY && !row.selected) {
            this.rows.splice(this.rows.findIndex(r => r.id === row.id), 1);
        }
    }

    onSelectAll() {
        const ids = this.rows.filter(r => !r.selected).map(r => r.id);
        this.rows.forEach(r => r.selected = true);
        if (ids.length > 0) {
            this.store.dispatch(new tracingActions.SetSelectedElementsSOA({
                selectedElements: {
                    ...this.cachedState.graphState.selectedElements,
                    stations:
                        this.cachedState.tableSettings.mode === TableMode.STATIONS ?
                        this.getUpdatedSelection(this.cachedState.graphState.selectedElements.stations, ids, true) :
                        this.cachedState.graphState.selectedElements.stations,
                    deliveries:
                        this.cachedState.tableSettings.mode === TableMode.DELIVERIES ?
                        this.getUpdatedSelection(this.cachedState.graphState.selectedElements.deliveries, ids, true) :
                        this.cachedState.graphState.selectedElements.deliveries
                }
            }));
        }
    }

    private getUpdatedColumns(columns: any[]): any[] {
        const selectColumnWidth = 40;
        const width = (this.container.nativeElement as HTMLElement).offsetWidth - this.scrollbarHelper.width;
        const columnWidth = (width - selectColumnWidth) / (columns.length - 1);
        let first = true;

        for (const column of columns) {
            const w = first ? selectColumnWidth : columnWidth;

            column.width = w;
            column.minWidth = w;
            column.maxWidth = w;
            first = false;
        }

        return columns;
    }

    private applySelection(state: State) {
        const isSel = Utils.createStringSet(
            state.tableSettings.mode === TableMode.STATIONS ?
            state.graphState.selectedElements.stations :
            (
                state.tableSettings.mode === TableMode.DELIVERIES ?
                state.graphState.selectedElements.deliveries :
                []
            )
        );
        this.rows.forEach(r => {
            if (!isSel[r.id] === r.selected) {
                r.selected = !!isSel[r.id];
            }
        });
    }

    private applyState(state: State) {
        const newData = this.dataService.getData(state.graphState);
        if (
            !this.cachedState ||
            this.cachedState.tableSettings !== state.tableSettings ||
            (
                state.tableSettings.showType === ShowType.SELECTED_ONLY && ((
                    state.tableSettings.mode === TableMode.STATIONS &&
                    newData.statSel !== this.cachedData.statSel
                ) || (
                    state.tableSettings.mode === TableMode.DELIVERIES &&
                    newData.delSel !== this.cachedData.delSel
                ))
            ) ||
            this.cachedData.stations !== newData.stations ||
            this.cachedData.deliveries !== newData.deliveries ||
            this.cachedData.statVis !== newData.statVis ||
            this.cachedData.tracingResult !== newData.tracingResult
        ) {
            this.updateTable(state, newData);
        } else if (
            this.cachedData.statSel !== newData.statSel ||
            this.cachedData.delSel !== newData.delSel
        ) {
            this.applySelection(state);
        }
        this.cachedState = {
            ...state
        };
        this.cachedData = {
            ...newData
        };
    }

    ngOnDestroy() {
        if (this.showDataTableSubscription) {
            this.showDataTableSubscription.unsubscribe();
            this.showDataTableSubscription = null;
        }
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
        if (this.resizeTimerSubscription) {
            this.resizeTimerSubscription.unsubscribe();
            this.resizeTimerSubscription = null;
        }
    }

    openTableSettings() {
        this.dialogService.open(TableSettingsComponent);
    }
}
