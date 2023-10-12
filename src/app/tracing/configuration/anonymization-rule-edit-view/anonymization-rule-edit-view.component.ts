import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';
import { ComposedLabelEditRule } from '../model';
import { AbstractRuleEditViewComponent } from '../abstract-rule-edit-view';
import { getCompleteConditionsCount, getNonEmptyConditionCount } from '../edit-rule-validaton';
import { LabelPart } from '@app/tracing/data.model';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
    selector: 'fcl-anonymization-rule-edit-view',
    templateUrl: './anonymization-rule-edit-view.component.html',
    styleUrls: ['./anonymization-rule-edit-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnonymizationRuleEditViewComponent extends AbstractRuleEditViewComponent<ComposedLabelEditRule> implements OnChanges {

    private static readonly DISABLED_ACTION_TOOLTIP_W_CONDITIONS = 'Please choose at least one label part as well as conditions';
    private static readonly DISABLED_ACTION_TOOLTIP_WO_CONDITIONS = 'Please choose at least one label part';

    private useConditions_ = false;
    private _labelPreview = '';
    private _propId2Name: Record<string, string> = {};

    get labelPreview(): string {
        return this._labelPreview;
    }

    get useConditions(): boolean {
        return this.useConditions_;
    }

    get disabledActionToolTip(): string {
        return this.useConditions_ ?
            AnonymizationRuleEditViewComponent.DISABLED_ACTION_TOOLTIP_W_CONDITIONS :
            AnonymizationRuleEditViewComponent.DISABLED_ACTION_TOOLTIP_WO_CONDITIONS;
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
        if (changes.rule !== undefined && changes.rule.isFirstChange()) {
            this.useConditions_ = this.rule.complexFilterConditions.length > 0;
        }
        if (changes.favouriteProperties || changes.otherProperties) {
            this._propId2Name = {};
            [this.favouriteProperties, this.otherProperties].forEach(
                props => props.forEach(p => this._propId2Name[p.id] = p.name)
            );
        }

        super.ngOnChanges(changes);
    }

    onAddLabelPart() {
        let labelParts = this.rule.labelParts.slice();
        const indexOfLastPropertyPart = _.findLastIndex(labelParts, (p: LabelPart) => p.useIndex === undefined);
        const newPartIndex = indexOfLastPropertyPart + 1;
        const newPart: LabelPart = {
            prefix: newPartIndex === 0 && this.rule.labelPrefix.length === 0 ? '' : ' ',
            property: null
        };
        labelParts = [].concat(
            labelParts.slice(0, newPartIndex),
            [newPart],
            labelParts.slice(newPartIndex)
        );
        this.changeRule({ labelParts: labelParts });
    }

    onRemoveLabelPart(index: number) {
        const labelParts = this.rule.labelParts.slice();
        labelParts.splice(index, 1);
        this.changeRule({ labelParts: labelParts });
    }


    onPropertyChange(propertyName: string, index: number) {
        this.changeLabelPart({ property: propertyName }, index);
    }

    onLabelPrefixChange(prefix: string) {
        this.changeRule({ labelPrefix: prefix });
    }

    onLabelPartPrefixChange(prefix: string, index: number) {
        this.changeLabelPart({ prefix: prefix }, index);
    }

    onUseIndexChange(useIndex: boolean, index: number): void {
        this.changeLabelPart({ useIndex: useIndex }, index);
    }

    onUseConditionsChange(useConditions: boolean): void {
        this.setUseConditions(useConditions);
    }

    onDrop(event: CdkDragDrop<string[]>) {
        if (event.previousIndex !== event.currentIndex) {
            let labelParts = this.rule.labelParts.slice();
            const movedPart = labelParts.splice(event.previousIndex, 1)[0];
            labelParts = [].concat(
                labelParts.slice(0, event.currentIndex),
                [movedPart],
                labelParts.slice(event.currentIndex)
            );
            this.changeRule({ labelParts: labelParts });
        }
    }

    trackByIndex(index: number): number {
        return index;
    }

    getPropertyName(propertyId: string): string {
        return this._propId2Name[propertyId];
    }

    private changeLabelPart(change: Partial<LabelPart>, index: number): void {
        const labelParts = this.rule.labelParts.slice();
        labelParts[index] = {
            ...labelParts[index],
            ...change
        };
        this.changeRule({ labelParts: labelParts });
    }

    private setUseConditions(useConditions: boolean): void {
        this.useConditions_ = useConditions;
        if (!useConditions) {
            this.changeRule({ complexFilterConditions: [] });
        }
    }
}
