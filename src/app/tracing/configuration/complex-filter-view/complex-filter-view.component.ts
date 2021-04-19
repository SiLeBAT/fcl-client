import { TableColumn } from './../../data.model';
import { Component, Input, ViewEncapsulation, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ExtendedOperationType, ComplexFilterCondition, JunktorType } from '../configuration.model';
import { ComplexFilterUtils } from '../shared/complex-filter-utils';

@Component({
    selector: 'fcl-complex-filter-view',
    templateUrl: './complex-filter-view.component.html',
    styleUrls: ['./complex-filter-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class ComplexFilterViewComponent {

    @Input() set availableProperties(value: TableColumn[]) {
        this.availableProperties_ = value;
    }

    get availableProperties(): TableColumn[] {
        return this.availableProperties_;
    }

    @Input() propToValuesMap: { [key: string]: string[] };
    @Input() availableOperatorTypes: ExtendedOperationType[];

    @Input() set conditions(value: ComplexFilterCondition[]) {
        this.conditions_ = (
            value && value.length > 0 ?
            value.slice() :
            ComplexFilterUtils.createDefaultFilterConditions()
        );
    }

    get conditions(): ComplexFilterCondition[] {
        return this.conditions_;
    }

    private availableProperties_: TableColumn[];

    @Output() conditionsChange = new EventEmitter<ComplexFilterCondition[]>();

    private conditions_ = ComplexFilterUtils.createDefaultFilterConditions();

    constructor() { }

    onAddFilterCondition(index: number) {

        const conditions = this.conditions_.map(c => ({ ...c }));
        const property = conditions[index].property;
        const operation = conditions[index].operation;

        const junktor = (
            index > 0 ?
            conditions[index - 1].junktor :
            ComplexFilterUtils.DEFAULT_JUNKTOR
        );

        conditions[index].junktor = junktor;
        conditions[index+1] = {
            property: property,
            operation: operation,
            value: '',
            junktor: ComplexFilterUtils.DEFAULT_JUNKTOR
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
            ComplexFilterUtils.createDefaultFilterConditions() :
            conditions
        );
        this.conditionsChange.emit(conditions);
    }

    onPropertyChange(property: string, index: number) {
        this.changeConditionAndEmit(index, {
            ...this.conditions_[index],
            property: property
        });
    }

    onOperatorChange(operatorType: ExtendedOperationType, index: number) {
        this.changeConditionAndEmit(index, {
            ...this.conditions_[index],
            operation: operatorType
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
            junktor: junktorType
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
