import {
    Component,
    Input,
    ViewEncapsulation,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
} from "@angular/core";
import { JunktorType } from "../configuration.model";

@Component({
    selector: "fcl-junktor-selector-view",
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: "./junktor-selector-view.component.html",
    encapsulation: ViewEncapsulation.None,
})
export class JunctorSelectorViewComponent {
    @Input() value: JunktorType;
    @Input() disabled = false;

    @Output() valueChange = new EventEmitter<JunktorType>();

    readonly availableJunktors = [JunktorType.AND, JunktorType.OR];

    readonly junktorLabel: { [key in JunktorType]: string } = {
        And: "And",
        Or: "Or",
    };

    onValueChange(value: JunktorType): void {
        this.value = value;
        this.valueChange.emit(value);
    }
}
