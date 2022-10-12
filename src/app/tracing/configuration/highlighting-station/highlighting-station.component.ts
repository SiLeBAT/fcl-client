import { StationHighlightingRule, TableColumn } from '../../data.model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import * as tracingReducers from '../../state/tracing.reducers';
import * as tracingActions from '../../state/tracing.actions';
import * as tracingSelectors from '../../state/tracing.selectors';
import * as configurationActions from '../configuration.actions';
import { AlertService } from '@app/shared/services/alert.service';
import { HighlightingRuleDeleteRequestData, PropToValuesMap } from '../configuration.model';
import { EditHighlightingService } from '../edit-highlighting.service';
import {
    EditHighlightingServiceData,
    EditHighlightingState,
    RuleId, RuleListItem, StationEditRule, StationRuleType
} from '../model';
import { optInGate } from '@app/tracing/shared/rxjs-operators';

type CachedState = EditHighlightingState<StationEditRule>;
type CachedData = EditHighlightingServiceData;

@Component({
    selector: 'fcl-highlighting-station',
    templateUrl: './highlighting-station.component.html'
})
export class HighlightingStationComponent implements OnInit, OnDestroy {

    private emptyArray_ = [];
    private emptyObject_ = {};

    get ruleListItems(): RuleListItem[] {
        return this.cachedData === null ? this.emptyArray_ : this.cachedData.ruleListItems;
    }

    get editRules(): StationEditRule[] {
        return this.cachedState === null ? this.emptyArray_ : this.cachedState.editRules;
    }

    get favouriteProperties(): TableColumn[] {
        return this.cachedData === null ? this.emptyArray_ : this.cachedData.favouriteProperties;
    }

    get otherProperties(): TableColumn[] {
        return this.cachedData === null ? this.emptyArray_ : this.cachedData.otherProperties;
    }

    get propToValuesMap(): PropToValuesMap {
        return this.cachedData === null ? this.emptyObject_ : this.cachedData.propToValuesMap;
    }

    private stateSubscription: Subscription | null = null;
    private cachedData: CachedData | null = null;
    private cachedState: CachedState | null = null;

    constructor(
        private editHighlightingService: EditHighlightingService,
        private store: Store<tracingReducers.State>,
        private alertService: AlertService
    ) { }

    ngOnInit() {

        const isHighlightingStationTabActive$ = this.store.select(tracingSelectors.selectIsHighlightingStationTabActive);
        const stationHighlightingState$ = this.store.select(tracingSelectors.selectStationHighlightingState);
        this.stateSubscription = stationHighlightingState$.pipe(optInGate(isHighlightingStationTabActive$, true)).subscribe(
            (state) => this.applyState(state),
            err => this.alertService.error(`getStationHighlightingData store subscription failed: ${err}`)
        );
    }

    ngOnDestroy() {
        if (this.stateSubscription !== null) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    onRuleOrderChange(ruleIds: RuleId[]): void {
        const newRules = this.editHighlightingService.applyRuleOrderChange(
            ruleIds, this.cachedState.dataServiceInputState.highlightingSettings.stations
        );
        this.emitNewRules(newRules);
    }

    onToggleRuleIsDisabled(ruleId: RuleId): void {
        const newRules = this.editHighlightingService.toggleRuleIsDisabled(
            ruleId, this.cachedState.dataServiceInputState.highlightingSettings.stations
        );
        this.emitNewRules(newRules);
    }

    onToggleShowRuleInLegend(ruleId: RuleId): void {
        const newRules = this.editHighlightingService.toggleShowRuleInLegend(
            ruleId, this.cachedState.dataServiceInputState.highlightingSettings.stations
        );
        this.emitNewRules(newRules);
    }

    onStartEdit(ruleId: RuleId): void {
        const newEditRule = this.editHighlightingService.createEditRuleFromStationRule(
            ruleId, this.cachedState.dataServiceInputState.highlightingSettings.stations
        );
        this.writeEditRuleToStore(newEditRule);
    }

    onNewRule(ruleType: StationRuleType): void {
        const newEditRule = this.editHighlightingService.createEditRuleFromRuleType(ruleType);
        this.writeEditRuleToStore(newEditRule);
    }

    onApplyEdit(editRule: StationEditRule): void {
        this.saveRule(editRule);
    }

    onOkEdit(editRule: StationEditRule): void {
        this.saveRule(editRule);
        this.cancelEdit(editRule.id);
    }

    onCancelEdit(ruleId: RuleId): void {
        this.cancelEdit(ruleId);
    }

    onDeleteRule(deleteRuleRequestData: HighlightingRuleDeleteRequestData): void {
        this.store.dispatch(new configurationActions.DeleteHighlightingRuleSSA(
            { deleteRequestData: deleteRuleRequestData }
        ));
    }

    onAddSelectionToRuleConditions(editRule: StationEditRule): void {
        const updatedEditRule = this.editHighlightingService.addSelectionToStationRuleConditions(
            editRule, this.cachedState.dataServiceInputState
        );
        if (updatedEditRule !== editRule) {
            this.writeEditRuleToStore(updatedEditRule);
        }
    }

    onRemoveSelectionFromRuleConditions(editRule: StationEditRule): void {
        const updatedEditRule = this.editHighlightingService.removeSelectionFromStationRuleConditions(
            editRule, this.cachedState.dataServiceInputState
        );
        if (updatedEditRule !== editRule) {
            this.writeEditRuleToStore(updatedEditRule);
        }
    }

    private emitNewEditRules(editRules: StationEditRule[]): void {
        this.store.dispatch(new tracingActions.SetStationHighlightingEditRulesSOA({ editRules: editRules }));
    }

    private emitNewRules(rules: StationHighlightingRule[]) {
        this.store.dispatch(new tracingActions.SetStationHighlightingRulesSOA({ rules: rules }));
    }

    private saveRule(editRule: StationEditRule): void {
        const newRules = this.editHighlightingService.applyStationRule(
            editRule, this.cachedState.dataServiceInputState.highlightingSettings.stations
        );
        this.emitNewRules(newRules);
        this.writeEditRuleToStore(editRule);
    }

    private writeEditRuleToStore(editRule: StationEditRule): void {
        const newEditRules = this.editHighlightingService.applyRule(editRule, this.cachedState.editRules);
        this.emitNewEditRules(newEditRules);
    }

    private cancelEdit(ruleId: RuleId): void {
        const newEditRules = this.editHighlightingService.removeRule(this.cachedState.editRules, ruleId);
        this.emitNewEditRules(newEditRules);
    }

    private applyState(state: EditHighlightingState<StationEditRule>): void {
        this.cachedData = this.editHighlightingService.getDataForEditStationHighlightingRules(state.dataServiceInputState);
        this.cachedState = { ...state };
    }

}
