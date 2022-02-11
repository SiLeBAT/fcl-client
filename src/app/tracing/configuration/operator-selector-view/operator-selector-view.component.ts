import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { OperationType } from '@app/tracing/data.model';

@Component({
    selector: 'fcl-operator-selector-view',
    templateUrl: './operator-selector-view.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperatorSelectorViewComponent {

    @Input() disabled = false;
    @Input() value: OperationType;
    @Input() set availableOperatorTypes(value: OperationType[]) {
        this.availableOperatorTypes_ = value;
    }

    get availableOperatorTypes(): OperationType[] {
        return this.availableOperatorTypes_;
    }

    private availableOperatorTypes_: OperationType[];

    @Output() valueChange = new EventEmitter<OperationType>();

    private operatorLabel: { [key in OperationType]: string } = {
        [OperationType.EQUAL]: '==',
        [OperationType.NOT_EQUAL]: '!=',
        [OperationType.CONTAINS]: 'contains',
        [OperationType.GREATER]: '>',
        [OperationType.LESS]: '<',
        [OperationType.REGEX_EQUAL]: '== (Regex)',
        [OperationType.REGEX_EQUAL_IGNORE_CASE]: '== (Regex Ignore Case)',
        [OperationType.REGEX_NOT_EQUAL]: '!= (Regex)',
        [OperationType.REGEX_NOT_EQUAL_IGNORE_CASE]: '!= (Regex Ignore Case)'
    };

    constructor() { }

    getOperatorLabel(type: OperationType): string {
        return this.operatorLabel[type];
    }

    onValueChange(value: OperationType): void {
        this.value = value;
        this.valueChange.emit(value);
    }
}
