import { BasicGraphState, DataServiceData, DataTable, StationHighlightingData } from './../../data.model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingActions from '../../state/tracing.actions';
import * as tracingSelectors from '../../state/tracing.selectors';
import { takeWhile } from 'rxjs/operators';
import { AlertService } from '@app/shared/services/alert.service';
import { ComplexRowFilterSettings } from '../configuration.model';
import { HighlightingInputData } from '../highlighting-station-view/highlighting-station-view.component';
import { TableService } from '@app/tracing/services/table.service';
import { DataService } from '@app/tracing/services/data.service';

interface HighlightingTableState {
    graphState: BasicGraphState;
    highlightingTableState: StationHighlightingData[];
    complexFilterSettings: ComplexRowFilterSettings;
}

interface CachedData {
    dataTable: DataTable;
    data: DataServiceData;
}

@Component({
    selector: 'fcl-highlighting-station',
    templateUrl: './highlighting-station.component.html',
    styleUrls: ['./highlighting-station.component.scss']
})
export class HighlightingStationComponent implements OnInit, OnDestroy {

    private isHighlightingStationTabActive$: Observable<boolean> = this.store.pipe(
        select(tracingSelectors.getIsHighlightingStationTabActive),
        takeWhile(() => this.componentIsActive)
    );

    private componentIsActive = true;
    private stateSubscription: Subscription | null = null;
    private cachedData: CachedData | null = null;;
    private cachedState: HighlightingTableState | null = null;
    private highlightingStationViewInputData_: HighlightingInputData | null = null;

    get highlightingStationViewInputData(): HighlightingInputData {
        return this.highlightingStationViewInputData_;
    }

    constructor(
        private tableService: TableService,
        private dataService: DataService,
        private store: Store<fromTracing.State>,
        private alertService: AlertService
    ) { }

    ngOnInit() {

        this.isHighlightingStationTabActive$.subscribe(
            isActive => {
                if (!isActive) {
                    if (this.stateSubscription) {
                        this.stateSubscription.unsubscribe();
                        this.stateSubscription = null;
                    }
                } else {
                    if (!this.stateSubscription) {
                        this.stateSubscription = this.store.select(tracingSelectors.getStationHighlightingData).subscribe(
                            (state: HighlightingTableState) => this.applyState(state),
                            err => this.alertService.error(`getStationHighlightingData store subscription failed: ${err}`)
                        );
                    }
                }
            },
            err => this.alertService.error(`showConfigurationSideBar store subscription failed: ${err}`)
        );
    }

    onHighlightingConditionChange(newHighlightingRules: StationHighlightingData[]) {
        this.store.dispatch(new tracingActions.SetStationHighlightingRulesSOA(
            { stationHighlightingData: newHighlightingRules }
        ));
    }

    ngOnDestroy() {
        this.componentIsActive = false;
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    private applyState(state: HighlightingTableState): void {
        let dataTable: DataTable = this.cachedData ? this.cachedData.dataTable : undefined;
        const data = this.dataService.getData(state.graphState);
        if (!this.cachedState || this.cachedState.graphState.fclElements !== state.graphState.fclElements) {
            dataTable = this.tableService.getStationData(state.graphState);
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
        this.updateHighlightingStationViewInputData();

    }

    private updateHighlightingStationViewInputData(): void {
        if (
            !this.highlightingStationViewInputData_ ||
            this.cachedData.dataTable !== this.highlightingStationViewInputData_.dataTable ||
            this.cachedState.highlightingTableState !== this.highlightingStationViewInputData_.stationHighlightingData ||
            this.cachedState.complexFilterSettings !== this.highlightingStationViewInputData_.complexFilterSettings
        ) {
            this.highlightingStationViewInputData_ = {
                dataTable: this.cachedData.dataTable,
                stationHighlightingData: this.cachedState.highlightingTableState,
                complexFilterSettings: this.cachedState.complexFilterSettings
            };
        }
    }

}
