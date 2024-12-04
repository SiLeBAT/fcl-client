import {
    ChangeDetectionStrategy,
    Component,
    OnChanges,
    SimpleChanges,
} from "@angular/core";
import { AbstractRuleEditViewComponent } from "../abstract-rule-edit-view";
import { EdgeWidthEditRule, Scale } from "../model";

@Component({
    selector: "fcl-edge-width-edit-view",
    templateUrl: "./edge-width-edit-view.component.html",
    styleUrls: ["./edge-width-edit-view.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EdgeWidthEditViewComponent
    extends AbstractRuleEditViewComponent<EdgeWidthEditRule>
    implements OnChanges
{
    private static readonly DISABLED_ACTION_TOOLTIP =
        "Please enter name, select a property as well as a value type";
    private static readonly EDGEWIDTHS = [0, 1, 2, 3, 4, 5];

    get disabledActionToolTip(): string {
        return EdgeWidthEditViewComponent.DISABLED_ACTION_TOOLTIP;
    }

    get edgeWidths(): number[] {
        return EdgeWidthEditViewComponent.EDGEWIDTHS;
    }
    get propertyName(): string | undefined {
        return this.rule?.propertyName;
    }
    get scale(): Scale | undefined {
        return this.rule?.scale;
    }
    get minimumZero(): boolean | undefined {
        return this.rule?.minimumZero;
    }
    get maximum(): number | undefined {
        return this.rule?.maximum;
    }

    constructor() {
        super();
    }

    ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes);
    }

    onPropertyChange(property: string): void {
        this.changeRule({ propertyName: property });
    }
    onScaleChange(scale: Scale): void {
        this.changeRule({ scale: scale });
    }
    onMinimumZeroChange(minimumZero: boolean): void {
        this.changeRule({ minimumZero: minimumZero });
    }
    onMaximumChange(maximum: number): void {
        this.changeRule({ maximum: maximum });
    }
}
