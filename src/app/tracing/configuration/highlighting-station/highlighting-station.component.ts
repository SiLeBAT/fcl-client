import { DataServiceData, DataServiceInputState, DataTable, StationHighlightingRule, StationHighlightingStats, TableColumn } from './../../data.model';
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
import { DataService } from '@app/tracing/services/data.service';
import { ComplexFilterUtils } from '../shared/complex-filter-utils';
import { EditHighlightingService } from '../edit-highlighting.service';
import { StationEditRule } from '../model';

interface HighlightingState {
    dataServiceInputState: DataServiceInputState;
    highlightingState: StationHighlightingRule[];
    editRules: StationEditRule[];
}

interface CachedData {
    dataTable: DataTable;
    propToValuesMap: PropToValuesMap;
    dataServiceData: DataServiceData;
}

@Component({
    selector: 'fcl-highlighting-station',
    templateUrl: './highlighting-station.component.html',
    styleUrls: ['./highlighting-station.component.scss']
})
export class HighlightingStationComponent implements OnInit, OnDestroy {

    get editRules(): StationEditRule[] {
        return this.cachedState === null ?
            [] :
            this.cachedState.editRules;
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
            this.cachedData.dataServiceData.highlightingStats.stationRuleStats :
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
        private editHighlightingService: EditHighlightingService,
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
                        this.stateSubscription = this.store.select(tracingSelectors.selectStationHighlightingState).subscribe(
                            (state: HighlightingState) => this.applyState(state),
                            err => this.alertService.error(`getStationHighlightingData store subscription failed: ${err}`)
                        );
                    }
                }
            },
            err => this.alertService.error(`showConfigurationSideBar store subscription failed: ${err}`)
        );
    }

    ngOnDestroy() {
        this.componentIsActive = false;
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    onRulesChange(newRules: StationHighlightingRule[]): void {
        this.emitNewRules(newRules);
    }

    onEditRulesChange(newEditRules: StationEditRule[]): void {
        this.emitNewEditRules(newEditRules);
    }

    onRuleDelete(deleteRuleRequestData: HighlightingRuleDeleteRequestData): void {
        this.store.dispatch(new configurationActions.DeleteStationHighlightingRuleSSA(
            { deleteRequestData: deleteRuleRequestData }
        ));
    }

    onAddSelectionToRuleConditions(editRule: StationEditRule): void {
        const updatedEditRule = this.editHighlightingService.addSelectionToStatRuleConditions(
            editRule, this.cachedData.dataServiceData.stations
        );
        if (updatedEditRule !== editRule) {
            this.emitEditRuleChange(updatedEditRule);
        }
    }

    onRemoveSelectionFromRuleConditions(editRule: StationEditRule): void {
        const updatedEditRule = this.editHighlightingService.removeSelectionFromStatRuleConditions(
            editRule, this.cachedData.dataServiceData.stations
        );
        if (updatedEditRule !== editRule) {
            this.emitEditRuleChange(updatedEditRule);
        }
    }

    private emitEditRuleChange(editRule: StationEditRule): void {
        const index = this.cachedState.editRules.findIndex(r => r.id === editRule.id);
        if (index >= 0) {
            const newEditRules = this.editRules.slice();
            newEditRules[index] = editRule;
            this.emitNewEditRules(newEditRules);
        }
    }

    private emitNewEditRules(editRules: StationEditRule[]): void {
        this.store.dispatch(new tracingActions.SetStationHighlightingEditRulesSOA({ editRules: editRules }));
    }

    private emitNewRules(rules: StationHighlightingRule[]) {
        this.store.dispatch(new tracingActions.SetStationHighlightingRulesSOA(
            { rules: rules }
        ));
    }

    private applyState(state: HighlightingState): void {
        const cacheIsEmpty = this.cachedData === null;
        let dataTable: DataTable | null = cacheIsEmpty ? null : this.cachedData.dataTable;
        const cachedDSData = cacheIsEmpty ? null : this.cachedData.dataServiceData;
        const newDSData = this.dataService.getData(state.dataServiceInputState);
        if (
            cacheIsEmpty ||
            this.cachedState.dataServiceInputState.fclElements !== state.dataServiceInputState.fclElements
        ) {
            dataTable = this.editHighlightingService.getStationData(state.dataServiceInputState);
        } else if (
            newDSData.stations !== cachedDSData.stations ||
            newDSData.statVis !== cachedDSData.statVis ||
            newDSData.tracingPropsUpdatedFlag !== cachedDSData.tracingPropsUpdatedFlag
            ) {
            dataTable = {
                ...this.editHighlightingService.getStationData(state.dataServiceInputState),
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
            dataServiceData: newDSData
        };
    }

}
