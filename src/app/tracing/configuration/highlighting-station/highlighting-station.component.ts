import { BasicGraphState, DataServiceData, DataTable, StationHighlightingRule, StationHighlightingStats, TableColumn } from './../../data.model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import * as tracingReducers from '../../state/tracing.reducers';
import * as tracingActions from '../../state/tracing.actions';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as configurationActions from '../configuration.actions';
import { takeWhile } from 'rxjs/operators';
import { AlertService } from '@app/shared/services/alert.service';
import { HighlightingRuleDeleteRequestData, PropToValuesMap } from '../configuration.model';
import { TableService } from '@app/tracing/services/table.service';
import { DataService } from '@app/tracing/services/data.service';
import { ComplexFilterUtils } from '../shared/complex-filter-utils';

interface HighlightingState {
    graphState: BasicGraphState;
    highlightingState: StationHighlightingRule[];
    editIndex: number | null;
}

interface CachedData {
    dataTable: DataTable;
    propToValuesMap: PropToValuesMap;
    data: DataServiceData;
}

@Component({
    selector: 'fcl-highlighting-station',
    templateUrl: './highlighting-station.component.html',
    styleUrls: ['./highlighting-station.component.scss']
})
export class HighlightingStationComponent implements OnInit, OnDestroy {

    get colorOrShapeRuleEditIndex(): number | null {
        return this.cachedState === null ?
            null :
            this.cachedState.editIndex;
    }

    get rules(): StationHighlightingRule[] {
        return this.cachedState === null ?
            [] :
            this.cachedState.highlightingState;
    }

    get availableProperties(): TableColumn[] {
        return this.cachedData ?
            this.cachedData.dataTable.columns :
            [];
    }

    get propToValuesMap(): PropToValuesMap {
        return this.cachedData ?
            this.cachedData.propToValuesMap :
            {};
    }

    get highlightingStats(): StationHighlightingStats | null {
        return this.cachedData ?
            this.cachedData.data.highlightingStats.stationRuleStats :
            null;
    }

    private isHighlightingStationTabActive$: Observable<boolean> = this.store.pipe(
        select(tracingSelectors.getIsHighlightingStationTabActive),
        takeWhile(() => this.componentIsActive)
    );

    private componentIsActive = true;
    private stateSubscription: Subscription | null = null;
    private cachedData: CachedData | null = null;
    private cachedState: HighlightingState | null = null;

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

    onRulesChange(newRules: StationHighlightingRule[]) {
        this.emitNewRules(newRules);
    }

    onColorOrShapeRuleEditIndexChange(editIndex: number | null) {
        this.emitColorOrShapeRuleEditIndexChange(editIndex);
    }

    onRuleDelete(deleteRuleRequestData: HighlightingRuleDeleteRequestData) {
        this.store.dispatch(new configurationActions.DeleteStationHighlightingRulesSSA(
            { stationHighlightingRule: deleteRuleRequestData }
        ));
    }

    ngOnDestroy() {
        this.componentIsActive = false;
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    private emitNewRules(rules: StationHighlightingRule[]) {
        this.store.dispatch(new tracingActions.SetStationHighlightingRulesSOA(
            { rules: rules }
        ));
    }

    private emitColorOrShapeRuleEditIndexChange(editIndex: number | null) {
        this.store.dispatch(new tracingActions.SetColorsAndShapesEditIndexSOA(
            { editIndex: editIndex }
        ));
    }

    private applyState(state: HighlightingState): void {
        let dataTable: DataTable | null = this.cachedData ? this.cachedData.dataTable : null;
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

        const propToValuesMap: PropToValuesMap =
            this.cachedData === null || this.cachedData.dataTable !== dataTable ?
            ComplexFilterUtils.extractPropToValuesMap(dataTable, dataTable.columns) :
            this.cachedData.propToValuesMap;

        this.cachedData = {
            dataTable: dataTable,
            propToValuesMap: propToValuesMap,
            data: data
        };
    }

}
