import { takeWhile, take } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { AlertService } from '../../../shared/services/alert.service';
import { StationTableViewComponent } from '../station-table-view/station-table-view.component';
import { TableService, StationTable, StationTableRow, ColumnOption, TableColumn } from '../../services/table.service';
import {
    BasicGraphState,
    TableSettings,
    DataServiceData,
    ObservedType,
    ShowType,
    TableMode
} from '../../data.model';
import { DialogSelectData, DialogSelectComponent } from '../../dialog/dialog-select/dialog-select.component';
import { MatDialog } from '@angular/material/dialog';
import { FilterService } from './../services/filter.service';

interface StoreDataState {
    graphState: BasicGraphState;
    tableSettings: TableSettings;
}

interface Column {
    id: string;
    prop: string;
    name: string;

    comparator?: <T>(a: T, b: T) => number;
}

interface Filter {
    filterText: string;
    filterProps: string[];
}

interface FilterColumn extends Column, Filter { }

@Component({
    selector: 'fcl-station-table',
    templateUrl: './station-table.component.html',
    styleUrls: ['./station-table.component.scss']
})
export class StationTableComponent implements OnInit, OnDestroy {

    @ViewChild(StationTableViewComponent, { static: false })
    private tableViewComponent: StationTableViewComponent;

    @ViewChild('buttonColTpl', { static: true }) buttonColTpl: TemplateRef<any>;
    @ViewChild('filterColTpl', { static: true }) filterColTpl: TemplateRef<any>;

    stationRows: any[];
    stationColumns: any[];
    deliveryRows: any[];
    deliveryColumns: any[];

    currentFilterColumns: FilterColumn[] = [];
    propToColumnMap: { [key: string]: FilterColumn } = {};
    rootFilter: Filter = { filterText: null, filterProps: [] };

    componentActive: boolean = true;

    showConfigurationSideBar$: Observable<boolean> = this.store.pipe(
        select(tracingSelectors.getShowConfigurationSideBar),
        takeWhile(() => this.componentActive)
    );

    private currentStationColumnHeaders: string[];
    private filteredRows: any[] = [];
    private unfilteredRows: any[] = [];
    private stateSubscription: Subscription;

    private cachedState: StoreDataState;
    private cachedData: DataServiceData;

    constructor(
        private tableService: TableService,
        private dialogService: MatDialog,
        private filterService: FilterService,
        private store: Store<fromTracing.State>,
        private alertService: AlertService
    ) { }

    ngOnInit() {

        this.showConfigurationSideBar$.subscribe(
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
            err => this.alertService.error(`showConfigurationSideBar store subscription failed: ${err}`)
        );

        this.filterService.standardFilterTerm$
            .pipe(
                takeWhile(() => this.componentActive)
            )
            .subscribe((filterTerm: string) => {
                this.rootFilter.filterText = filterTerm;
                this.onFilterChange();
            },
                (error => {
                    throw new Error(`error receiving standard filter term: ${error}`);
                })
            );
    }

    selectMoreStationColumns() {
        const columnOptions: ColumnOption[] = this.tableService.getStationColumnOptions(
            this.cachedState.graphState,
            this.cachedState.tableSettings
        );

        const dialogData: DialogSelectData = {
            title: 'Input',
            options: columnOptions
        };

        this.dialogService.open(DialogSelectComponent, { data: dialogData }).afterClosed()
            .pipe(
                take(1)
            ).subscribe((selections: string[]) => {
                if (selections != null) {
                    this.store.dispatch(new tracingActions.SetTableColumnsSOA([this.cachedState.tableSettings.mode, selections]));
                }
            },
            error => {
                throw new Error(`error loading dialog or selecting columns: ${error}`);
            });
    }

    onFilterChange() {
        this.filteredRows = this.filterRows([].concat(this.currentFilterColumns, this.rootFilter));
        this.stationRows = this.filteredRows;
        if (this.tableViewComponent) {
            this.tableViewComponent.recalculatePages();
        }
    }

    ngOnDestroy() {
        this.componentActive = false;
    }

    private applyState(state: StoreDataState) {
        const newData: StationTable = this.tableService.getStationData(state.graphState);
        const dataServiceData: DataServiceData = newData.dataServiceData;

        if (
            !this.cachedState ||
            this.cachedState.tableSettings !== state.tableSettings ||
            (
                state.tableSettings.showType === ShowType.SELECTED_ONLY && ((
                    state.tableSettings.mode === TableMode.STATIONS &&
                    dataServiceData.statSel !== this.cachedData.statSel
                ) || (
                    state.tableSettings.mode === TableMode.DELIVERIES &&
                    dataServiceData.delSel !== this.cachedData.delSel
                ))
            ) ||
            this.cachedData.stations !== dataServiceData.stations ||
            this.cachedData.deliveries !== dataServiceData.deliveries ||
            this.cachedData.statVis !== dataServiceData.statVis ||
            this.cachedData.tracingResult !== dataServiceData.tracingResult
        ) {
            this.updateTable(newData, state.tableSettings);
        } else if (
            this.cachedData.statSel !== dataServiceData.statSel ||
            this.cachedData.delSel !== dataServiceData.delSel
        ) {
            this.applySelection(state);
        }
        this.cachedState = {
            ...state
        };
        this.cachedData = {
            ...dataServiceData
        };
    }

    private updateTable(newData: StationTable, tableSettings: TableSettings) {
        if (newData) {
            this.currentStationColumnHeaders = tableSettings.stationColumns;
            const stationColumns: TableColumn[] = newData.columns;
            const stationRows: StationTableRow[] = newData.rows;

            const buttonColumn: any = {
                name: ' ',
                prop: 'moreCol',
                resizeable: false,
                draggable: false,
                width: 20,
                headerTemplate: this.buttonColTpl,
                headerClass: 'fcl-more-columns-header-cell',
                cellClass: 'fcl-more-column-row-cell',
                frozenLeft: true
            };

            const dataColumns = stationColumns
                .filter(stationColumn => this.currentStationColumnHeaders.indexOf(stationColumn.id) >= 0)
                .map(stationColumn => {
                    return {
                        name: stationColumn.name,
                        prop: stationColumn.id,
                        resizable: false,
                        draggable: true,
                        headerTemplate: this.filterColTpl
                    };
                });

            this.stationColumns = [buttonColumn].concat(dataColumns);

            const currentFilterColumns = newData.columns
                .filter(column => {
                    const columnProp = column.id;
                    return this.currentStationColumnHeaders.includes(columnProp);

                })
                .map((column, index) => ({
                    id: 'c' + index,
                    prop: column.id,
                    name: column.name,
                    filterText: null as string,
                    filterProps: [column.id]
                }));

            const propToColumnMap: { [key: string]: FilterColumn } = currentFilterColumns.reduce((prevValue, currValue) => {
                prevValue[currValue.prop] = currValue;
                return prevValue;
            }, {} as { [key: string]: FilterColumn });

            this.rootFilter.filterProps = currentFilterColumns.map(filterColumn => filterColumn.prop);
            const filters: Filter[] = [].concat(currentFilterColumns, this.rootFilter);

            if (stationRows) {
                let stationElements: StationTableRow[] = [];
                stationElements = stationRows.filter(stationRow => !stationRow.invisible && !stationRow.contained);

                if (tableSettings.showType === ShowType.SELECTED_ONLY) {
                    stationElements = stationElements
                        .filter(stationRow => stationRow.selected);
                } else if (tableSettings.showType === ShowType.TRACE_ONLY) {
                    stationElements = stationElements
                        .filter(stationRow => stationRow.forward || stationRow.backward || stationRow.observed !== ObservedType.NONE);
                }

                this.propToColumnMap = propToColumnMap;
                this.currentFilterColumns = currentFilterColumns;
                this.unfilteredRows = stationElements;
                this.filteredRows = this.filterRows(filters);
                this.stationRows = this.filteredRows;
            } else {
                this.unfilteredRows = [];
                this.filteredRows = [];
                this.stationRows = [];
            }

            this.tableViewComponent.recalculateTable();
        }
    }

    private filterRows(filters: Filter[]): any[] {

        const filteredRows = this.unfilteredRows.filter(
            row => filters.every((filterElem: Filter) => {
                if (filterElem.filterText === null || filterElem.filterText === '') {
                    return true;
                } else {
                    const filterText: string = filterElem.filterText.toLowerCase();

                    return filterElem.filterProps.some(p => {
                        const propValue = row[p];
                        if (propValue === undefined || propValue === null) {
                            return false;
                        } else {
                            const strValue: string = typeof propValue === 'string' ?
                                propValue.toLowerCase() :
                                propValue.toString();

                            return strValue.includes(filterText);
                        }
                    });
                }
            })
        );

        return filteredRows;
    }

    private applySelection(state) {

    }
}
