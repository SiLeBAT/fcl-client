import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
} from "@angular/core";
import { SortableHeaderCellViewComponent } from "../../sortable-header-cell-view.component";
import { VisibilityFilterState } from "../../configuration.model";

@Component({
    selector: "fcl-visibilityfilter-header-cell-view",
    templateUrl: "./visibilityfilter-header-cell-view.component.html",
    styleUrls: ["./visibilityfilter-header-cell-view.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class VisibilityFilterHeaderCellViewComponent extends SortableHeaderCellViewComponent {
    @Input() filterState: VisibilityFilterState | undefined;

    readonly visibilityFilterStates = VisibilityFilterState;

    @Output() toggleFilterState = new EventEmitter<void>();

    onToggleFilterState(): void {
        this.toggleFilterState.emit();
    }
}
