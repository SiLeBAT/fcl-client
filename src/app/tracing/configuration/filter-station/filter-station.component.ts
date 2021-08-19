import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { TableRow, DataTable, DataServiceData, StationId, DataServiceInputState } from '@app/tracing/data.model';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TableService } from '@app/tracing/services/table.service';
import { AlertService } from '@app/shared/services/alert.service';
import { DataService } from '@app/tracing/services/data.service';
import { InputData as FilterElementsViewInputData } from '../filter-elements-view/filter-elements-view.component';
import { FilterTableSettings } from '../configuration.model';
import { TableType } from '../model';
import { SelectFilterTableColumnsMSA } from '../configuration.actions';
import { optInGate } from '@app/tracing/shared/rxjs-operators';

interface FilterTableState {
    dataServiceInputState: DataServiceInputState;
    filterTableState: FilterTableSettings;
}

interface CachedData {
    dataTable: DataTable;
    dataServiceData: DataServiceData;
}

@Component({
    selector: 'fcl-filter-station',
    templateUrl: './filter-station.component.html',
    styleUrls: ['./filter-station.component.scss']
})
export class FilterStationComponent implements OnInit, OnDestroy {

    private stateSubscription: Subscription | null = null;

    private cachedData: CachedData | null = null;
    private cachedState: FilterTableState | null = null;

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

    ngOnInit(): void {
        const isFilterStationTabActive$ = this.store.select(tracingSelectors.getIsFilterStationTabActive);
        const stationFilterState$ = this.store.select(tracingSelectors.selectStationFilterState);
        this.stateSubscription = stationFilterState$.pipe(optInGate(isFilterStationTabActive$)).subscribe(
            (state) => this.applyState(state),
            err => this.alertService.error(`getStationFilterData store subscription failed: ${err}`)
        );
    }

    onSelectTableColumns(): void {
        this.store.dispatch(
            new SelectFilterTableColumnsMSA({
                type: TableType.STATIONS,
                columns: this.tableService.getStationColumns(this.cachedData.dataServiceData),
                columnOrder: this.cachedState.filterTableState.columnOrder
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

    ngOnDestroy() {
        if (this.stateSubscription !== null) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    private applyState(state: FilterTableState) {
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

    private updateFilterElementsViewInputData(): void {
        if (
            this.filterElementsViewInputData_ === null ||
            this.cachedData.dataTable !== this.filterElementsViewInputData_.dataTable ||
            this.cachedState.filterTableState !== this.filterElementsViewInputData_.filterTableSettings
        ) {
            this.filterElementsViewInputData_ = {
                dataTable: this.cachedData.dataTable,
                filterTableSettings: this.cachedState.filterTableState,
                selectedRowIds: this.cachedState.dataServiceInputState.selectedElements.stations
            };
        }
    }
}
