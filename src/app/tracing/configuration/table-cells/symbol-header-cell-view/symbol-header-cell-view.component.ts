import { Component, ChangeDetectionStrategy } from "@angular/core";
import { SortableHeaderCellViewComponent } from "../../sortable-header-cell-view.component";

@Component({
    selector: "fcl-symbol-header-cell-view",
    templateUrl: "./symbol-header-cell-view.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbolHeaderCellViewComponent extends SortableHeaderCellViewComponent {}
