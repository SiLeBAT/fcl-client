import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { TableRow, DataTable, DataServiceData, DeliveryId, DataServiceInputState } from '@app/tracing/data.model';
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
    data: DataServiceData;
}

@Component({
    selector: 'fcl-filter-delivery',
    templateUrl: './filter-delivery.component.html',
    styleUrls: ['./filter-delivery.component.scss']
})
export class FilterDeliveryComponent implements OnInit, OnDestroy {

    private stateSubscription: Subscription;

    private cachedData: CachedData;
    private cachedState: FilterTableState;

    private filterElementsViewInputData_: FilterElementsViewInputData;
    private currentGhostDeliveryId: DeliveryId | null = null;

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
        const isFilterDeliveryTabActive$ = this.store.select(tracingSelectors.getIsFilterDeliveryTabActive);
        const deliveryFilterState$ = this.store.select(tracingSelectors.selectDeliveryFilterState);
        this.stateSubscription = deliveryFilterState$.pipe(optInGate(isFilterDeliveryTabActive$)).subscribe(
            (state) => this.applyState(state),
            err => this.alertService.error(`getDeliveryFilterData store subscription failed: ${err}`)
        );
    }

    onSelectTableColumns(): void {
        this.store.dispatch(
            new SelectFilterTableColumnsMSA({
                type: TableType.DELIVERIES,
                columns: this.tableService.getDeliveryColumns(this.cachedData.data),
                columnOrder: this.cachedState.filterTableState.columnOrder
            })
        );
    }

    onFilterSettingsChange(settings: FilterTableSettings): void {
        this.store.dispatch(new tracingActions.SetDeliveryFilterSOA({ settings: settings }));
    }

    onRowSelectionChange(deliveryIds: DeliveryId[]): void {
        this.store.dispatch(new tracingActions.SetSelectedDeliveriesSOA({ deliveryIds: deliveryIds }));
    }

    onClearAllFilters(): void {
        this.store.dispatch(new tracingActions.ResetAllDeliveryFiltersSOA());
    }

    onMouseOverTableRow(row: TableRow | null): void {
        let newGhostDeliveryId: string | null = null;
        if (row !== null) {
            const delivery = this.cachedData.data.delMap[row.id];
            if (delivery.invisible) {
                newGhostDeliveryId = delivery.id;
            }
        }
        if (newGhostDeliveryId !== this.currentGhostDeliveryId) {
            this.currentGhostDeliveryId = newGhostDeliveryId;
            if (newGhostDeliveryId === null) {
                this.store.dispatch(new tracingActions.DeleteGhostElementSOA());
            } else {
                this.store.dispatch(new tracingActions.SetGhostDeliverySOA({ deliveryId: newGhostDeliveryId }));
            }
        }
    }

    onMouseLeaveTableRow(row: TableRow): void {
    }

    ngOnDestroy() {
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    private applyState(state: FilterTableState) {
        let dataTable: DataTable = this.cachedData ? this.cachedData.dataTable : undefined;
        const data = this.dataService.getData(state.dataServiceInputState);
        if (
            !this.cachedState ||
            this.cachedState.dataServiceInputState.fclElements !== state.dataServiceInputState.fclElements
        ) {
            dataTable = this.tableService.getDeliveryData(state.dataServiceInputState);
        } else if (
            data.stations !== this.cachedData.data.stations ||
            data.deliveries !== this.cachedData.data.deliveries ||
            data.tracingResult !== this.cachedData.data.tracingResult ||
            data.statSel !== this.cachedData.data.statSel ||
            data.delSel !== this.cachedData.data.delSel
            ) {
            dataTable = {
                ...this.tableService.getDeliveryData(state.dataServiceInputState),
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
                filterTableSettings: this.cachedState.filterTableState,
                selectedRowIds: this.cachedState.dataServiceInputState.selectedElements.deliveries
            };
        }
    }
}
