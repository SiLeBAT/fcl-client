import { Component, Input, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { ExtendedOperationType } from '../configuration.model';

@Component({
    selector: 'fcl-operator-selector-view',
    templateUrl: './operator-selector-view.component.html',
    encapsulation: ViewEncapsulation.None
})
export class OperatorSelectorViewComponent {

    @Input() value: ExtendedOperationType;
    @Input() set availableOperatorTypes(value: ExtendedOperationType[]) {
        this.availableOperatorTypes_ = value;
    }

    get availableOperatorTypes(): ExtendedOperationType[] {
        return this.availableOperatorTypes_;
    }
    private availableOperatorTypes_: ExtendedOperationType[];

    @Output() valueChange = new EventEmitter<ExtendedOperationType>();

    private operatorLabel: { [key in ExtendedOperationType]: string } = {
        [ExtendedOperationType.EQUAL]: '==',
        [ExtendedOperationType.NOT_EQUAL]: '!=',
        [ExtendedOperationType.CONTAINS]: 'contains',
        [ExtendedOperationType.GREATER]: '>',
        [ExtendedOperationType.LESS]: '<',
        [ExtendedOperationType.REGEX_EQUAL]: '== (Regex)',
        [ExtendedOperationType.REGEX_EQUAL_IGNORE_CASE]: '== (Regex Ignore Case)',
        [ExtendedOperationType.REGEX_NOT_EQUAL]: '!= (Regex)',
        [ExtendedOperationType.REGEX_NOT_EQUAL_IGNORE_CASE]: '!= (Regex Ignore Case)'
    };

    constructor() { }

    getOperatorLabel(type: ExtendedOperationType): string {
        return this.operatorLabel[type];
    }

    onValueChange(value: ExtendedOperationType): void {
        this.value = value;
        this.valueChange.emit(value);
    }
}
