import { takeWhile, take } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { AlertService } from '../../../shared/services/alert.service';
import { StationTableViewComponent } from '../station-table-view/station-table-view.component';
import { TableService, StationTable, StationTableRow, ColumnOption } from '../../services/table.service';
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


interface StoreDataState {
    graphState: BasicGraphState;
    tableSettings: TableSettings;
}

@Component({
    selector: 'fcl-station-table',
    templateUrl: './station-table.component.html',
    styleUrls: ['./station-table.component.scss']
})
export class StationTableComponent implements OnInit, OnDestroy {

    @ViewChild(StationTableViewComponent, { static: false })
    private tableViewComponent: StationTableViewComponent;

    @ViewChild('customCol', { static: true }) customCol: TemplateRef<any>;

    stationRows: any[];
    stationColumns: any[];
    deliveryRows: any[];
    deliveryColumns: any[];

    componentActive: boolean = true;

    showConfigurationSideBar$: Observable<boolean> = this.store.pipe(
        select(tracingSelectors.getShowConfigurationSideBar),
        takeWhile(() => this.componentActive)
    );
    private stateSubscription: Subscription;

    private cachedState: StoreDataState;
    private cachedData: DataServiceData;

    constructor(
        private tableService: TableService,
        private dialogService: MatDialog,
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
            const initialStationColumns = tableSettings.stationColumns;
            const stationColumns = newData.columns;
            const stationRows = newData.rows;


            const buttonColumn: any = {
                name: ' ',
                prop: 'moreCol',
                resizeable: false,
                draggable: false,
                width: 20,
                headerTemplate: this.customCol,
                headerClass: 'fcl-more-columns-header-cell',
                cellClass: 'fcl-more-column-row-cell',
                frozenLeft: true
            };

            const dataColumns = stationColumns
                .filter(stationColumn => initialStationColumns.indexOf(stationColumn.id) >= 0)
                .map(stationColumn => {
                    return {
                        name: stationColumn.name,
                        prop: stationColumn.id,
                        resizable: false,
                        draggable: true

                    };
                });

            this.stationColumns = [buttonColumn].concat(dataColumns);

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
                this.stationRows = stationElements;

            } else {
                this.stationRows = [];
            }

            this.tableViewComponent.recalculateTable();
        }
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


    private applySelection(state) {

    }

    ngOnDestroy() {
        this.componentActive = false;
    }

}
