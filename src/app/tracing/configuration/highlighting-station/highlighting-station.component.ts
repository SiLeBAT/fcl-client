import { BasicGraphState, DataServiceData, DataTable, StationHighlightingData } from './../../data.model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import * as tracingReducers from '../../state/tracing.reducers';
import * as tracingActions from '../../state/tracing.actions';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as configurationActions from '../configuration.actions';
import { takeWhile } from 'rxjs/operators';
import { AlertService } from '@app/shared/services/alert.service';
import { HighlightingRuleDeleteRequestData } from '../configuration.model';
import { HighlightingInputData } from '../highlighting-station-view/highlighting-station-view.component';
import { TableService } from '@app/tracing/services/table.service';
import { DataService } from '@app/tracing/services/data.service';

interface HighlightingState {
    graphState: BasicGraphState;
    highlightingState: StationHighlightingData[];
    editIndex: number;
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

    get highlightingStationViewInputData(): HighlightingInputData {
        return this.highlightingStationViewInputData_;
    }

    private isHighlightingStationTabActive$: Observable<boolean> = this.store.pipe(
        select(tracingSelectors.getIsHighlightingStationTabActive),
        takeWhile(() => this.componentIsActive)
    );

    private componentIsActive = true;
    private stateSubscription: Subscription | null = null;
    private cachedData: CachedData | null = null;
    private cachedState: HighlightingState | null = null;
    private highlightingStationViewInputData_: HighlightingInputData | null = null;

    constructor(
        private tableService: TableService,
        private dataService: DataService,
        private store: Store<tracingReducers.State>,
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
                            (state: HighlightingState) => this.applyState(state),
                            err => this.alertService.error(`getStationHighlightingData store subscription failed: ${err}`)
                        );
                    }
                }
            },
            err => this.alertService.error(`showConfigurationSideBar store subscription failed: ${err}`)
        );
    }

    onHighlightingRulesChange(newHighlightingRules: StationHighlightingData[]) {
        this.emitHighlightingRules(newHighlightingRules);
    }

    onChangeEditIndex(editIndex: number | null) {
        this.emitEditIndex(editIndex);
    }

    onHighlightingRulesDelete(ruleToDelete: HighlightingRuleDeleteRequestData) {
        this.store.dispatch(new configurationActions.DeleteStationHighlightingRulesSSA(
            { stationHighlightingRule: ruleToDelete }
        ));

    }

    ngOnDestroy() {
        this.componentIsActive = false;
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    private emitHighlightingRules(stationHighlightingData: StationHighlightingData[]) {
        this.store.dispatch(new tracingActions.SetStationHighlightingRulesSOA(
            { stationHighlightingData: stationHighlightingData }
        ));
    }

    private emitEditIndex(editIndex: number | null) {
        this.store.dispatch(new tracingActions.SetColorsAndShapesEditIndexSOA(
            { editIndex: editIndex }
        ));
    }

    private applyState(state: HighlightingState): void {
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
            this.cachedState.highlightingState !== this.highlightingStationViewInputData_.stationHighlightingData ||
            this.cachedState.editIndex !== this.highlightingStationViewInputData_.editIndex
        ) {
            this.highlightingStationViewInputData_ = {
                dataTable: this.cachedData.dataTable,
                stationHighlightingData: this.cachedState.highlightingState,
                complexFilterSettings: tracingReducers.complexFilterSettings,
                editIndex: this.cachedState.editIndex
            };
        }
    }

}
