import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as tracingActions from '../../state/tracing.actions';
import { TableRow, DataTable, DataServiceData, DeliveryId } from '@app/tracing/data.model';
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
import { FocusDeliverySSA } from '@app/tracing/tracing.actions';

interface CachedData {
    dataTable: DataTable;
    dataServiceData: DataServiceData;
}

@Component({
    selector: 'fcl-filter-delivery',
    templateUrl: './filter-delivery.component.html',
    styleUrls: ['./filter-delivery.component.scss']
})
export class FilterDeliveryComponent implements OnInit, OnDestroy, DoCheck {

    private stateSubscription: Subscription | null = null;

    private cachedData: CachedData | null = null;
    private cachedState: FilterTableState | null = null;

    private activityState_ = ActivityState.INACTIVE;
    private activityStateSubject_ = new BehaviorSubject(this.activityState_);
    activityState$ = this.activityStateSubject_.asObservable();
    private cycleStartSubject_ = new Subject<void>();
    cycleStart$ = this.cycleStartSubject_.asObservable();

    private filterElementsViewInputData_: FilterElementsViewInputData | null = null;
    private currentGhostDeliveryId: DeliveryId | null = null;

    get filterElementsViewInputData(): FilterElementsViewInputData | null {
        return this.filterElementsViewInputData_;
    }

    constructor(
        private tableService: TableService,
        private dataService: DataService,
        private store: Store<fromTracing.State>,
        private alertService: AlertService
    ) { }

    // lifecycle hooks start
    ngOnInit(): void {
        const deliveryFilterState$ = this.store.select(tracingSelectors.selectDeliveryFilterState);
        this.stateSubscription = deliveryFilterState$.subscribe(
            (state) => this.applyState(state),
            err => this.alertService.error(`getDeliveryFilterData store subscription failed: ${err}`)
        );
    }

    ngDoCheck(): void {
        this.cycleStartSubject_.next();
    }

    ngOnDestroy() {
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    // lifecycle hooks end

    // template trigger start

    onSelectTableColumns(): void {
        if (this.cachedData && this.cachedState) {
            this.store.dispatch(
                new SelectFilterTableColumnsMSA({
                    type: TableType.DELIVERIES,
                    columnOrder: this.cachedState.filterTableState.columnOrder,
                    favouriteColumns: this.cachedData.dataTable.favouriteColumns,
                    otherColumns: this.cachedData.dataTable.otherColumns
                })
            );
        }
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
        if (this.cachedData) {
            let newGhostDeliveryId: string | null = null;
            if (row !== null) {
                const delivery = this.cachedData.dataServiceData.delMap[row.id];
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
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onMouseLeaveTableRow(row: TableRow): void {
    }

    onTableRowDblClick(row: TableRow): void {
        if (this.cachedData) {
            const delivery = this.cachedData.dataServiceData.delMap[row.id];
            if (!delivery.invisible) {
                this.store.dispatch(new FocusDeliverySSA({ deliveryId: delivery.id }));
            }
        }
    }

    // template trigger end

    private setActivityState(state: ActivityState): void {
        if (state !== this.activityState_) {
            this.activityState_ = state;
            this.activityStateSubject_.next(state);
        }
    }

    private applyState(state: FilterTableState) {
        if (state.activityState !== ActivityState.INACTIVE) {
            const cacheIsEmpty = this.cachedData === null;

            let dataTable = !cacheIsEmpty ? this.cachedData!.dataTable : undefined;
            const cachedDSData = cacheIsEmpty ? null : this.cachedData!.dataServiceData;
            const newDSData = this.dataService.getData(state.dataServiceInputState);
            if (
                cacheIsEmpty ||
                this.cachedState!.dataServiceInputState.fclElements !== state.dataServiceInputState.fclElements
            ) {
                dataTable = this.tableService.getDeliveryTable(state.dataServiceInputState, false);
                this.currentGhostDeliveryId = null;
            } else if (
                newDSData.stations !== cachedDSData!.stations ||
                newDSData.deliveries !== cachedDSData!.deliveries ||
                newDSData.delVis !== cachedDSData!.delVis ||
                newDSData.tracingPropsUpdatedFlag !== cachedDSData!.tracingPropsUpdatedFlag ||
                newDSData.stationAndDeliveryHighlightingUpdatedFlag !== cachedDSData!.stationAndDeliveryHighlightingUpdatedFlag ||
                newDSData.delSel !== cachedDSData!.delSel
            ) {
                dataTable = this.tableService.getDeliveryTable(state.dataServiceInputState, false);
            }

            this.cachedState = {
                ...state
            };
            this.cachedData = {
                dataTable: dataTable!,
                dataServiceData: newDSData
            };
            this.updateFilterElementsViewInputData();
        }
        this.setActivityState(state.activityState);
    }

    private updateFilterElementsViewInputData(): void {
        if (
            this.filterElementsViewInputData_ === null ||
            this.cachedData!.dataTable !== this.filterElementsViewInputData_.dataTable ||
            this.cachedState!.filterTableState !== this.filterElementsViewInputData_.filterTableSettings
        ) {
            this.filterElementsViewInputData_ = {
                dataTable: this.cachedData!.dataTable,
                filterTableSettings: this.cachedState!.filterTableState,
                selectedRowIds: this.cachedState!.dataServiceInputState.selectedElements.deliveries
            };
        }
    }
}
