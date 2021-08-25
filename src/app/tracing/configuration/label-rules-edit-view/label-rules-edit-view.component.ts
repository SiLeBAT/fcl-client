import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';
import { LabelEditRule } from '../model';
import { AbstractRuleEditViewComponent } from '../abstract-rule-edit-view';
import { getCompleteConditionsCount, getNonEmptyConditionCount } from '../edit-rule-validaton';

@Component({
    selector: 'fcl-label-rules-edit-view',
    templateUrl: './label-rules-edit-view.component.html',
    styleUrls: ['./label-rules-edit-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabelRulesEditViewComponent extends AbstractRuleEditViewComponent<LabelEditRule> implements OnChanges {

    private static readonly DISABLED_ACTION_TOOLTIP_W_CONDITIONS = 'Please enter name and select a property as well as conditions';
    private static readonly DISABLED_ACTION_TOOLTIP_WO_CONDITIONS = 'Please enter name and select a property';

    private useConditions_ = false;

    get useConditions(): boolean {
        return this.useConditions_;
    }

    get disabledActionToolTip(): string {
        return this.useConditions_ ?
            LabelRulesEditViewComponent.DISABLED_ACTION_TOOLTIP_W_CONDITIONS :
            LabelRulesEditViewComponent.DISABLED_ACTION_TOOLTIP_WO_CONDITIONS;
    }

    get labelProperty(): string | null {
        return this.rule === null ? null : this.rule.labelProperty;
    }

    get isEditViewComplete(): boolean {
        if (this.useConditions_) {
            const completeConditionsCount = getCompleteConditionsCount(this.rule.complexFilterConditions);
            return (
                completeConditionsCount >= 1 &&
                completeConditionsCount === getNonEmptyConditionCount(this.rule.complexFilterConditions) &&
                super.isEditViewComplete
            );
        } else {
            return super.isEditViewComplete;
        }
    }

    constructor() {
        super();
    }

    ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes);
        if (changes.rule !== undefined) {
            this.useConditions_ = this.rule.complexFilterConditions.length > 0;
        }
    }

    onUseConditionsChange(useConditions: boolean): void {
        this.setUseConditions(useConditions);
    }

    onLabelPropertyChange(labelProperty: string): void {
        this.setLabelProperty(labelProperty);
    }

    private setLabelProperty(labelProperty: string): void {
        this.changeRule({ labelProperty: labelProperty });
    }

    private setUseConditions(useConditions: boolean): void {
        this.useConditions_ = useConditions;
        if (!useConditions) {
            this.changeRule({ complexFilterConditions: [] });
        }
    }
}
