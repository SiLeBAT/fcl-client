import { Component, Input, ChangeDetectionStrategy } from "@angular/core";
import { TableRow } from "@app/tracing/data.model";

@Component({
    selector: "fcl-visibility-cell-view",
    templateUrl: "./visibility-cell-view.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisibilityCellViewComponent {
    @Input() row: TableRow | null = null;
}
