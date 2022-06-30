import { OperationType, TableColumn } from './../../data.model';
import { Component, Input, ViewEncapsulation, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ComplexFilterCondition, JunktorType } from '../configuration.model';
import { ComplexFilterUtils } from '../shared/complex-filter-utils';

@Component({
    selector: 'fcl-complex-filter-view',
    templateUrl: './complex-filter-view.component.html',
    styleUrls: ['./complex-filter-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class ComplexFilterViewComponent {

    @Input() disabled = false;
    @Input() set availableProperties(value: TableColumn[]) {
        this.availableProperties_ = value;
    }

    get availableProperties(): TableColumn[] {
        return this.availableProperties_;
    }

    @Input() set favoriteColumnsLength(value: number) {
        this.favoriteColumnsLength_ = value;
    }

    get favoriteColumnsLength(): number {
        return this.favoriteColumnsLength_;
    }

    get favoriteProperties(): TableColumn[] {
        return this.availableProperties.slice(0, this.favoriteColumnsLength);
    }

    get additionalProperties(): TableColumn[] {
        return this.availableProperties.slice(this.favoriteColumnsLength);
    }

    @Input() propToValuesMap: Record<string, string[]> = {};
    @Input() availableOperatorTypes: OperationType[] = [];

    @Input() set conditions(value: ComplexFilterCondition[]) {
        this.conditions_ = (
            value && value.length > 0 ?
                value.slice() :
                ComplexFilterUtils.createDefaultComplexFilterConditions()
        );
    }

    get conditions(): ComplexFilterCondition[] {
        return this.conditions_;
    }

    private availableProperties_: TableColumn[];

    @Output() conditionsChange = new EventEmitter<ComplexFilterCondition[]>();

    private conditions_ = ComplexFilterUtils.createDefaultComplexFilterConditions();
    private favoriteColumnsLength_: number;

    onAddFilterCondition(index: number) {

        const conditions = this.conditions_.map(c => ({ ...c }));
        const propertyName = conditions[index].propertyName;
        const operationType = conditions[index].operationType;

        const junktorType = (
            index > 0 ?
                conditions[index - 1].junktorType :
                ComplexFilterUtils.DEFAULT_JUNKTOR_TYPE
        );

        conditions[index].junktorType = junktorType;
        conditions[index + 1] = {
            propertyName: propertyName,
            operationType: operationType,
            value: '',
            junktorType: ComplexFilterUtils.DEFAULT_JUNKTOR_TYPE
        };

        this.conditions_ = conditions;
        this.conditionsChange.emit(conditions);
    }

    onRemoveFilterCondition(index: number) {
        const conditions = [].concat(
            this.conditions_.slice(0, index),
            this.conditions_.slice(index + 1)
        );
        this.conditions_ = (
            conditions.length === 0 ?
                ComplexFilterUtils.createDefaultComplexFilterConditions() :
                conditions
        );
        this.conditionsChange.emit(conditions);
    }

    onPropertyChange(propertyName: string, index: number) {
        this.changeConditionAndEmit(index, {
            ...this.conditions_[index],
            propertyName: propertyName
        });
    }

    onOperatorChange(operatorType: OperationType, index: number) {
        this.changeConditionAndEmit(index, {
            ...this.conditions_[index],
            operationType: operatorType
        });
    }

    onValueChange(value: string, index: number) {
        this.changeConditionAndEmit(index, {
            ...this.conditions_[index],
            value: value
        });
    }

    onJunktorChange(junktorType: JunktorType, index: number) {
        this.changeConditionAndEmit(index, {
            ...this.conditions_[index],
            junktorType: junktorType
        });
    }

    private changeConditionAndEmit(index: number, newCondition: ComplexFilterCondition): void {
        const conditions = this.conditions_.map(c => ({ ...c }));
        conditions[index] = newCondition;
        this.conditions_ = conditions;
        this.conditionsChange.emit(conditions);
    }

    trackByIndex(index: number): number {
        return index;
    }
}
