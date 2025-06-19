import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
} from "@angular/core";
import { OperationType } from "../../data.model";

interface OperatorInfo {
    type: OperationType;
    label: string;
    tooltip: string;
}

const OPERATOR_INFO: Record<OperationType, Omit<OperatorInfo, "type">> = {
    [OperationType.EQUAL]: { label: "=", tooltip: "equals" },
    [OperationType.NOT_EQUAL]: { label: "≠", tooltip: "is not equal to" },
    [OperationType.CONTAINS]: { label: "contains", tooltip: "contains" },
    [OperationType.GREATER]: { label: ">", tooltip: "is greater than" },
    [OperationType.LESS]: { label: "<", tooltip: "is smaller than" },
    [OperationType.REGEX_EQUAL]: {
        label: "=(R)",
        tooltip: "matches regular expression",
    },
    [OperationType.REGEX_EQUAL_IGNORE_CASE]: {
        label: "=(Ri)",
        tooltip: "matches regular expression (case insensitive)",
    },
    [OperationType.REGEX_NOT_EQUAL]: {
        label: "≠(R)",
        tooltip: "does not match regular expression",
    },
    [OperationType.REGEX_NOT_EQUAL_IGNORE_CASE]: {
        label: "≠(Ri)",
        tooltip: "does not match regular expression (case insensitive)",
    },
} as const;

@Component({
    selector: "fcl-operator-selector-view",
    templateUrl: "./operator-selector-view.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperatorSelectorViewComponent {
    @Input() disabled = false;
    @Input() value: OperationType;
    @Input() set availableOperatorTypes(value: OperationType[]) {
        this.availableOperators_ = value.map((type) => ({
            type: type,
            ...OPERATOR_INFO[type],
        }));
    }

    @Output() valueChange = new EventEmitter<OperationType>();

    get availableOperators(): OperatorInfo[] {
        return this.availableOperators_;
    }

    private availableOperators_: OperatorInfo[] = [];

    onValueChange(value: OperationType): void {
        this.value = value;
        this.valueChange.emit(value);
    }
}
