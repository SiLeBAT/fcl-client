import { DeliveryHighlightingRule, Property } from "./../../data.model";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Store } from "@ngrx/store";
import { Subscription } from "rxjs";
import * as tracingReducers from "../../state/tracing.reducers";
import * as tracingActions from "../../state/tracing.actions";
import * as tracingSelectors from "../../state/tracing.selectors";
import * as configurationActions from "../configuration.actions";
import { AlertService } from "@app/shared/services/alert.service";
import {
    HighlightingRuleDeleteRequestData,
    PropToValuesMap,
} from "../configuration.model";
import { EditHighlightingService } from "../edit-highlighting.service";
import {
    DeliveryEditRule,
    DeliveryRuleType,
    EditHighlightingServiceData,
    EditHighlightingState,
    RuleId,
    RuleListItem,
} from "../model";
import { optInGate } from "@app/tracing/shared/rxjs-operators";

type CachedState = EditHighlightingState<DeliveryEditRule>;
type CachedData = EditHighlightingServiceData;

@Component({
    selector: "fcl-highlighting-delivery",
    templateUrl: "./highlighting-delivery.component.html",
})
export class HighlightingDeliveryComponent implements OnInit, OnDestroy {
    private emptyArray_ = [];
    private emptyObject_ = {};

    get ruleListItems(): RuleListItem[] {
        return this.cachedData === null
            ? this.emptyArray_
            : this.cachedData.ruleListItems;
    }

    get editRules(): DeliveryEditRule[] {
        return this.cachedState === null
            ? this.emptyArray_
            : this.cachedState.editRules;
    }

    get favouriteProperties(): Property[] {
        return this.cachedData === null
            ? this.emptyArray_
            : this.cachedData.favouriteProperties;
    }

    get otherProperties(): Property[] {
        return this.cachedData === null
            ? this.emptyArray_
            : this.cachedData.otherProperties;
    }

    get propToValuesMap(): PropToValuesMap {
        return this.cachedData === null
            ? this.emptyObject_
            : this.cachedData.propToValuesMap;
    }

    private stateSubscription: Subscription | null = null;
    private cachedData: CachedData | null = null;
    private cachedState: CachedState | null = null;

    constructor(
        private editHighlightingService: EditHighlightingService,
        private store: Store<tracingReducers.State>,
        private alertService: AlertService,
    ) {}

    ngOnInit() {
        const isHighlightingDeliveryTabActive$ = this.store.select(
            tracingSelectors.selectIsHighlightingDeliveryTabActive,
        );
        const deliveryHighlightingState$ = this.store.select(
            tracingSelectors.selectDeliveryHighlightingState,
        );
        this.stateSubscription = deliveryHighlightingState$
            .pipe(optInGate(isHighlightingDeliveryTabActive$, true))
            .subscribe(
                (state) => this.applyState(state),
                (err) =>
                    this.alertService.error(
                        `getDeliveryHighlightingData store subscription failed: ${err}`,
                    ),
            );
    }

    ngOnDestroy() {
        if (this.stateSubscription !== null) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    onRuleOrderChange(ruleIds: RuleId[]): void {
        if (this.cachedState) {
            const newRules = this.editHighlightingService.applyRuleOrderChange(
                ruleIds,
                this.cachedState.dataServiceInputState.highlightingSettings
                    .deliveries,
            );
            this.emitNewRules(newRules);
        }
    }

    onToggleRuleIsDisabled(ruleId: RuleId): void {
        if (this.cachedState) {
            const newRules = this.editHighlightingService.toggleRuleIsDisabled(
                ruleId,
                this.cachedState.dataServiceInputState.highlightingSettings
                    .deliveries,
            );
            this.emitNewRules(newRules);
        }
    }

    onToggleShowRuleInLegend(ruleId: RuleId): void {
        if (this.cachedState) {
            const newRules =
                this.editHighlightingService.toggleShowRuleInLegend(
                    ruleId,
                    this.cachedState.dataServiceInputState.highlightingSettings
                        .deliveries,
                );
            this.emitNewRules(newRules);
        }
    }

    onStartEdit(ruleId: RuleId): void {
        if (this.cachedState) {
            const newEditRule =
                this.editHighlightingService.createEditRuleFromDeliveryRule(
                    ruleId,
                    this.cachedState.dataServiceInputState.highlightingSettings
                        .deliveries,
                );
            if (newEditRule) {
                this.writeEditRuleToStore(newEditRule);
            }
        }
    }

    onNewRule(ruleType: DeliveryRuleType): void {
        const newEditRule =
            this.editHighlightingService.createEditRuleFromRuleType(ruleType);
        this.writeEditRuleToStore(newEditRule);
    }

    onApplyEdit(editRule: DeliveryEditRule): void {
        this.saveRule(editRule);
    }

    onOkEdit(editRule: DeliveryEditRule): void {
        this.saveRule(editRule);
        this.cancelEdit(editRule.id);
    }

    onCancelEdit(ruleId: RuleId): void {
        this.cancelEdit(ruleId);
    }

    onDeleteRule(
        deleteRuleRequestData: HighlightingRuleDeleteRequestData,
    ): void {
        this.store.dispatch(
            new configurationActions.DeleteHighlightingRuleSSA({
                deleteRequestData: deleteRuleRequestData,
            }),
        );
    }

    onAddSelectionToRuleConditions(editRule: DeliveryEditRule): void {
        if (this.cachedState) {
            const updatedEditRule =
                this.editHighlightingService.addSelectionToDeliveryRuleConditions(
                    editRule,
                    this.cachedState.dataServiceInputState,
                );
            if (updatedEditRule !== editRule) {
                this.writeEditRuleToStore(updatedEditRule);
            }
        }
    }

    onRemoveSelectionFromRuleConditions(editRule: DeliveryEditRule): void {
        if (this.cachedState) {
            const updatedEditRule =
                this.editHighlightingService.removeSelectionFromDeliveryRuleConditions(
                    editRule,
                    this.cachedState.dataServiceInputState,
                );
            if (updatedEditRule !== editRule) {
                this.writeEditRuleToStore(updatedEditRule);
            }
        }
    }

    private emitNewEditRules(editRules: DeliveryEditRule[]): void {
        this.store.dispatch(
            new tracingActions.SetDeliveryHighlightingEditRulesSOA({
                editRules: editRules,
            }),
        );
    }

    private emitNewRules(rules: DeliveryHighlightingRule[]) {
        this.store.dispatch(
            new tracingActions.SetDeliveryHighlightingRulesSOA({
                rules: rules,
            }),
        );
    }

    private saveRule(editRule: DeliveryEditRule): void {
        const newRules = this.editHighlightingService.applyDeliveryRule(
            editRule,
            this.cachedState!.dataServiceInputState.highlightingSettings
                .deliveries,
        );
        this.emitNewRules(newRules);
        this.writeEditRuleToStore(editRule);
    }

    private writeEditRuleToStore(editRule: DeliveryEditRule): void {
        const newEditRules = this.editHighlightingService.applyRule(
            editRule,
            this.cachedState!.editRules,
        );
        this.emitNewEditRules(newEditRules);
    }

    private cancelEdit(ruleId: RuleId): void {
        const newEditRules = this.editHighlightingService.removeRule(
            this.cachedState!.editRules,
            ruleId,
        );
        this.emitNewEditRules(newEditRules);
    }

    private applyState(state: EditHighlightingState<DeliveryEditRule>): void {
        this.cachedData =
            this.editHighlightingService.getDataForEditDeliveryHighlightingRules(
                state.dataServiceInputState,
            );
        this.cachedState = { ...state };
    }
}
