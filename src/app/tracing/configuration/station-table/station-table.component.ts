import { Constants } from './../../util/constants';
import { takeWhile } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import { AlertService } from '../../../shared/services/alert.service';
import { StationTableViewComponent } from '../station-table-view/station-table-view.component';
import { TableService, StationTable, StationTableRow } from '../../services/table.service';
import {
    BasicGraphState,
    TableSettings,
    DataServiceData,
    ObservedType,
    ShowType,
    TableMode
} from '../../data.model';

interface State {
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

    private cachedState: State;
    private cachedData: DataServiceData;

    constructor(
        private tableService: TableService,
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

    private applyState(state: State) {
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

            this.stationColumns = stationColumns
                .filter(stationColumn => initialStationColumns.indexOf(stationColumn.id) >= 0)
                .map(stationColumn => {
                    return {
                        name: stationColumn.name,
                        prop: stationColumn.id,
                        resizable: true,
                        draggable: true
                    };
                });

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

    private applySelection(state) {

    }

    ngOnDestroy() {
        this.componentActive = false;
    }

}
