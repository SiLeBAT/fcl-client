import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { TableRow, DataTable, DataServiceData, StationId } from '@app/tracing/data.model';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, DoCheck } from '@angular/core';
import { Store } from '@ngrx/store';
import { TableService } from '@app/tracing/services/table.service';
import { AlertService } from '@app/shared/services/alert.service';
import { DataService } from '@app/tracing/services/data.service';
import { InputData as FilterElementsViewInputData } from '../filter-elements-view/filter-elements-view.component';
import { ActivityState, FilterTableSettings, FilterTableState } from '../configuration.model';
import { TableType } from '../model';
import { SelectFilterTableColumnsMSA } from '../configuration.actions';
import { FocusStationSSA } from '@app/tracing/tracing.actions';

interface CachedData {
    dataTable: DataTable;
    dataServiceData: DataServiceData;
}

@Component({
    selector: 'fcl-filter-station',
    templateUrl: './filter-station.component.html',
    styleUrls: ['./filter-station.component.scss']
})
export class FilterStationComponent implements OnInit, OnDestroy, DoCheck {

    private stateSubscription: Subscription | null = null;

    private cachedData: CachedData | null = null;
    private cachedState: FilterTableState | null = null;

    private activityState_ = ActivityState.INACTIVE;
    private activityStateSubject_ = new BehaviorSubject(this.activityState_);
    activityState$ = this.activityStateSubject_.asObservable();
    private cycleStartSubject_ = new Subject<void>();
    cycleStart$ = this.cycleStartSubject_.asObservable();

    private filterElementsViewInputData_: FilterElementsViewInputData | null = null;
    private currentGhostStationId: StationId | null = null;

    get filterElementsViewInputData(): FilterElementsViewInputData | null {
        return this.filterElementsViewInputData_;
    }

    constructor(
        private tableService: TableService,
        private dataService: DataService,
        private store: Store<fromTracing.State>,
        private alertService: AlertService
    ) { }

    private setActivityState(state: ActivityState): void {
        if (state !== this.activityState_) {
            this.activityState_ = state;
            this.activityStateSubject_.next(state);
        }
    }

    // lifecycle hooks start

    ngOnInit(): void {
        const stationFilterState$ = this.store.select(tracingSelectors.selectStationFilterState);
        this.stateSubscription = stationFilterState$.subscribe(
            (state) => this.applyState(state),
            err => this.alertService.error(`getStationFilterData store subscription failed: ${err}`)
        );
    }

    ngDoCheck(): void {
        this.cycleStartSubject_.next();
    }

    ngOnDestroy() {
        if (this.stateSubscription !== null) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    // lifecycle hooks end

    // template trigger start
    onSelectTableColumns(): void {

        this.store.dispatch(
            new SelectFilterTableColumnsMSA({
                type: TableType.STATIONS,
                columns: this.tableService.getStationColumns(this.cachedData.dataServiceData),
                columnOrder: this.cachedState.filterTableState.columnOrder,
                favoriteColumnsLength: this.tableService.favoriteStationColumnsLength
            })
        );
    }

    onFilterSettingsChange(settings: FilterTableSettings): void {
        this.store.dispatch(new tracingActions.SetStationFilterSOA({ settings: settings }));
    }

    onRowSelectionChange(stationIds: StationId[]): void {
        this.store.dispatch(new tracingActions.SetSelectedStationsSOA({ stationIds: stationIds }));
    }

    onClearAllFilters(): void {
        this.store.dispatch(new tracingActions.ResetAllStationFiltersSOA());
    }

    onMouseOverTableRow(row: TableRow | null): void {
        let newGhostStationId: string | null = null;
        if (row !== null) {
            const station = this.cachedData.dataServiceData.statMap[row.id];
            if (station.contained) {
                const group = this.cachedData.dataServiceData.statMap[row.parentRowId];
                if (group.invisible) {
                    newGhostStationId = group.id;
                }
            } else if (station.invisible) {
                newGhostStationId = station.id;
            }
        }
        if (newGhostStationId !== this.currentGhostStationId) {
            this.currentGhostStationId = newGhostStationId;
            if (newGhostStationId === null) {
                this.store.dispatch(new tracingActions.DeleteGhostElementSOA());
            } else {
                this.store.dispatch(new tracingActions.SetGhostStationSOA({ stationId: newGhostStationId }));
            }
        }
    }

    onTableRowDblClick(row: TableRow): void {
        let focusStationId: string | null = null;

        const station = this.cachedData.dataServiceData.statMap[row.id];
        if (station.contained) {
            const group = this.cachedData.dataServiceData.statMap[row.parentRowId];
            if (!group.invisible) {
                focusStationId = group.id;
            }
        } else if (!station.invisible) {
            focusStationId = station.id;
        }
        if (focusStationId !== null) {
            this.store.dispatch(new FocusStationSSA({ stationId: focusStationId }));
        }
    }

    // template trigger end

    private applyState(state: FilterTableState) {
        if (state.activityState !== ActivityState.INACTIVE) {
            const cacheIsEmpty = this.cachedState === null;
            let dataTable: DataTable = !cacheIsEmpty ? this.cachedData.dataTable : undefined;
            const cachedDSData = cacheIsEmpty ? null : this.cachedData.dataServiceData;
            const newDSData = this.dataService.getData(state.dataServiceInputState);

            if (
                cacheIsEmpty ||
                this.cachedState.dataServiceInputState.fclElements !== state.dataServiceInputState.fclElements
            ) {
                // new Model
                dataTable = this.tableService.getStationData(state.dataServiceInputState);
                this.currentGhostStationId = null;
            } else if (
                newDSData.stations !== cachedDSData.stations ||
                newDSData.statVis !== cachedDSData.statVis ||
                newDSData.tracingPropsUpdatedFlag !== cachedDSData.tracingPropsUpdatedFlag ||
                newDSData.stationAndDeliveryHighlightingUpdatedFlag !== cachedDSData.stationAndDeliveryHighlightingUpdatedFlag ||
                newDSData.statSel !== cachedDSData.statSel
            ) {
                dataTable = {
                    ...this.tableService.getStationData(state.dataServiceInputState),
                    columns: this.cachedData.dataTable.columns
                };
            }

            this.cachedState = {
                ...state
            };
            this.cachedData = {
                dataTable: dataTable,
                dataServiceData: newDSData
            };
            this.updateFilterElementsViewInputData();
        }
        this.setActivityState(state.activityState);
    }

    private updateFilterElementsViewInputData(): void {
        if (
            this.filterElementsViewInputData_ === null ||
            this.cachedData.dataTable !== this.filterElementsViewInputData_.dataTable ||
            this.cachedState.filterTableState !== this.filterElementsViewInputData_.filterTableSettings
        ) {
            this.filterElementsViewInputData_ = {
                dataTable: this.cachedData.dataTable,
                filterTableSettings: this.cachedState.filterTableState,
                selectedRowIds: this.cachedState.dataServiceInputState.selectedElements.stations,
                favoriteColumnsLength: this.tableService.favoriteStationColumnsLength
            };
        }
    }
}
