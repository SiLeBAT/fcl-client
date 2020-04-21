import { Component, ElementRef, TemplateRef, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { timer, Subscription } from 'rxjs';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { ResizeSensor } from 'css-element-queries';
import * as fromTracing from '../state/tracing.reducers';
import * as tracingSelectors from '../state/tracing.selectors';

import { Utils } from '../util/non-ui-utils';
import { Constants } from '../util/constants';
import {
    BasicGraphState, DataServiceData, DeliveryData, StationData,
    TableSettings, ObservedType, ShowType, TableMode
} from '../data.model';
import * as tracingActions from '../state/tracing.actions';
import { DataService } from '../services/data.service';
import { AlertService } from '@app/shared/services/alert.service';
import { TableSettingsComponent } from './table-settings.component';
import { MatDialog } from '@angular/material/dialog';

interface FilterableRow {
    content: any;
    stringContent: string;
}

interface State {
    graphState: BasicGraphState;
    tableSettings: TableSettings;
}

class ColorMapper {
    private counter = 0;
    private colorIndex: {[key: string]: number } = {};
    private colorsList: { key: string, colors: number[][] }[] = [];

    getColorCode(colors: number[][]): string {
        const code = 'c' + colors.map(c => this.getSingleColorCode(c)).sort().join(',');
        const index = this.colorIndex[code];
        let key: string;
        if (index === undefined) {
            this.colorIndex[code] = this.counter;
            key = 'C' + this.counter++;
            this.colorsList.push({ colors: colors, key: key });
        } else {
            key = this.colorsList[index].key;
        }
        return key;
    }

    private getSingleColorCode(color: number[]): string {
        return `${color[0] + 100}_${color[1] + 100}_${color[2] + 100}`;
    }

    getColorsList(): {colors: number[][], key: string}[] {
        return this.colorsList;
    }
}

@Component({
    selector: 'fcl-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnDestroy, AfterViewInit {

    columns: any[];
    rows: any[];
    filter: string;
    unfilteredRows: FilterableRow[];

    private resizeTimerSubscription: Subscription;

    @ViewChild('table', { static: true }) table: DatatableComponent;
    @ViewChild('table', { read: ElementRef, static: true }) tableRef: ElementRef;
    @ViewChild('selectTmpl', { static: true }) selectTmpl: TemplateRef<any>;

    showConfigurationSideBar$ = this.store.select(tracingSelectors.getShowConfigurationSideBar);

    style: { height?: string } = {};
    private stateSubscription: Subscription;
    private showConfigurationSideBarSubscription: Subscription;

    private cachedState: State;
    private cachedData: DataServiceData;

    private styleElement: HTMLStyleElement;

    static filterRows(elements: FilterableRow[], filter: string): any[] {
        const words: string[] = filter == null ? [] : filter.split(/\s+/g).map(w => w.trim().toLowerCase()).filter(w => w.length > 0);

        return elements.filter(e => words.find(w => e.stringContent.indexOf(w) === -1) == null).map(e => e.content);
    }

    constructor(
        private dataService: DataService,
        private dialogService: MatDialog,
        private store: Store<fromTracing.State>,
        private alertService: AlertService
    ) { }

    ngAfterViewInit() {

        window.onresize = () => timer(100).subscribe(
            () => this.updateTable(this.cachedState, this.cachedData),
            err => this.alertService.error(`onresize timer subscription failed: ${err}`)
        );
        const tableContainerRef: HTMLElement = (this.tableRef.nativeElement as HTMLElement).parentElement;
        const resizeSensor = new ResizeSensor(tableContainerRef, () => {
            if (!this.resizeTimerSubscription) {
                this.resizeTimerSubscription = timer(300).subscribe(
                    () => {
                        this.resizeTimerSubscription.unsubscribe();
                        this.resizeTimerSubscription = null;

                        if (this.columns) {
                            this.columns = this.getUpdatedColumns(this.columns);
                            this.table.recalculate();
                        }

                        this.style = { height: tableContainerRef.offsetHeight + 'px' };
                    },
                    err => this.alertService.error(`container resize timer subscription failed: ${err}`)
                );
            }
        });

        this.table.onColumnReorder = () => void(0);
        this.showConfigurationSideBarSubscription = this.showConfigurationSideBar$.subscribe(
            showConfigurationSideBar => {
                if (!showConfigurationSideBar) {
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

    private updateStyle(colorsList: {colors: number[][], key: string }[]) {
        if (this.styleElement) {
            document.head.removeChild(this.styleElement);
        }
        const styleElement = document.createElement('style');

        styleElement.innerHTML = '';

        colorsList.forEach(colorsEntry => {
            const colors = colorsEntry.colors;
            const key = colorsEntry.key;
            if (colors.length === 0) {
                styleElement.innerHTML += 'datatable-body-row { background-color: rgb(255, 255, 255) !important; }';
            } else if (colors.length === 1) {
                styleElement.innerHTML += `datatable-body-row.${key} { background-color: ${this.colorToCss(colors[0])} !important; }`;
            } else {
                styleElement.innerHTML += `datatable-body-row.${key} { background: repeating-linear-gradient(90deg`;

                for (let i = 0; i < colors.length; i++) {
                    const color = this.colorToCss(colors[i]);
                    const from = i === 0 ? i / colors.length * 100 + '%' : (i + 0.2) / colors.length * 100 + '%';
                    const to = i === colors.length - 1 ? (i + 1) / colors.length * 100 + '%' : (i + 0.8) / colors.length * 100 + '%';

                    styleElement.innerHTML += ', ' + color + ' ' + from + ', ' + color + ' ' + to;
                }

                styleElement.innerHTML += ') !important; }';
            }
        });

        document.head.appendChild(styleElement);
        this.styleElement = styleElement;
    }

    private colorToCss(color: number[]): string {
        return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    }

    private updateTable(state: State, data: DataServiceData) {

        if (state) {
            const tableSettings = state.tableSettings;
            const properties = Utils.getTableProperties(tableSettings.mode, tableSettings.stationColumns, tableSettings.deliveryColumns);
            const selectColumn: any = {
                name: ' ',
                prop: 'selected',
                resizeable: false,
                draggable: false,
                width: 40,
                cellTemplate: this.selectTmpl
            };

            this.columns = this.getUpdatedColumns([selectColumn].concat(properties.map(prop => {
                return {
                    name: Constants.PROPERTIES.has(prop) ? Constants.PROPERTIES.get(prop).name : '"' + prop + '"',
                    prop: prop,
                    resizeable: true,
                    draggable: true
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

                const colorMapper = new ColorMapper();

                this.unfilteredRows = elements.map(e => {
                    const copy = JSON.parse(JSON.stringify(e));
                    let stringContent = '';

                    copy._code = colorMapper.getColorCode(e.highlightingInfo.color);

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

                this.updateStyle(colorMapper.getColorsList());
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

    getRowClass(row: any) {
        return {
            [row._code]: true
        };
    }

    private getUpdatedSelection(oldSelection: string[], ids: string[], isSelected: boolean): string[] {
        if (isSelected) {
            return oldSelection.concat(ids);
        } else {
            const isUnSel = Utils.createSimpleStringSet(ids);
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
        return columns;
    }

    private applySelection(state: State) {
        const isSel = Utils.createSimpleStringSet(
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
        if (this.showConfigurationSideBarSubscription) {
            this.showConfigurationSideBarSubscription.unsubscribe();
            this.showConfigurationSideBarSubscription = null;
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
