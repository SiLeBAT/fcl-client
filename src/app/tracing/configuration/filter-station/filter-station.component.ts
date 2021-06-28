import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { TableRow, BasicGraphState, DataTable, DataServiceData, StationId } from '@app/tracing/data.model';
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
    graphState: BasicGraphState;
    filterTableState: FilterTableSettings;
}

interface CachedData {
    dataTable: DataTable;
    data: DataServiceData;
}

@Component({
    selector: 'fcl-filter-station',
    templateUrl: './filter-station.component.html',
    styleUrls: ['./filter-station.component.scss']
})
export class FilterStationComponent implements OnInit, OnDestroy {

    private stateSubscription: Subscription;

    private cachedData: CachedData;
    private cachedState: FilterTableState;

    private filterElementsViewInputData_: FilterElementsViewInputData;
    private currentGhostStationId: StationId | null = null;

    get filterElementsViewInputData(): FilterElementsViewInputData {
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
        const stationFilterState$ = this.store.select(tracingSelectors.getStationFilterData);
        this.stateSubscription = stationFilterState$.pipe(optInGate(isFilterStationTabActive$)).subscribe(
            (state) => this.applyState(state),
            err => this.alertService.error(`getStationFilterData store subscription failed: ${err}`)
        );
    }

    onSelectTableColumns(): void {
        this.store.dispatch(
            new SelectFilterTableColumnsMSA({
                type: TableType.STATIONS,
                columns: this.tableService.getStationColumns(this.cachedData.data),
                columnOrder: this.cachedState.filterTableState.columnOrder
            })
        );
    }

    onFilterSettingsChange(settings: FilterTableSettings): void {
        this.store.dispatch(new tracingActions.SetStationFilterSOA({ settings: settings }));
    }

    onClearAllFilters(): void {
        this.store.dispatch(new tracingActions.ResetAllStationFiltersSOA());
    }

    onMouseOverTableRow(row: TableRow | null): void {
        let newGhostStationId: string | null = null;
        if (row !== null) {
            const station = this.cachedData.data.statMap[row.id];
            if (station.contained) {
                const group = this.cachedData.data.statMap[row.parentRowId];
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
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    private applyState(state: FilterTableState) {
        let dataTable: DataTable = this.cachedData ? this.cachedData.dataTable : undefined;
        const data = this.dataService.getData(state.graphState);
        if (!this.cachedState || this.cachedState.graphState.fclElements !== state.graphState.fclElements) {
            dataTable = this.tableService.getStationData(state.graphState);
            this.currentGhostStationId = null;
        } else if (
            data.stations !== this.cachedData.data.stations ||
            data.deliveries !== this.cachedData.data.deliveries ||
            data.tracingResult !== this.cachedData.data.tracingResult ||
            data.statSel !== this.cachedData.data.statSel ||
            data.delSel !== this.cachedData.data.delSel
            ) {
            dataTable = {
                ...this.tableService.getStationData(state.graphState),
                columns: this.cachedData.dataTable.columns
            };
        }

        this.cachedState = {
            ...state
        };
        this.cachedData = {
            dataTable: dataTable,
            data: data
        };
        this.updateFilterElementsViewInputData();

    }

    private updateFilterElementsViewInputData(): void {
        if (
            !this.filterElementsViewInputData_ ||
            this.cachedData.dataTable !== this.filterElementsViewInputData_.dataTable ||
            this.cachedState.filterTableState !== this.filterElementsViewInputData_.filterTableSettings
        ) {
            this.filterElementsViewInputData_ = {
                dataTable: this.cachedData.dataTable,
                filterTableSettings: this.cachedState.filterTableState
            };
        }
    }
}
